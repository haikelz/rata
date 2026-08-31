import { describe, expect, it } from 'vitest';

import {
	STOCKBIT_BUY_FEE_RATE,
	STOCKBIT_SELL_FEE_RATE,
	calculateStockPurchase,
	calculateStockSale,
	calculateTargetAverage
} from './rata';

describe('calculateStockPurchase', () => {
	it('calculates the example portfolio and Stockbit buy fee', () => {
		const result = calculateStockPurchase({
			currentLots: 297,
			currentAveragePrice: 397,
			currentMarketPrice: 342,
			additionalLots: 39,
			purchasePrice: 342,
			buyFeeRate: STOCKBIT_BUY_FEE_RATE
		});

		expect(result).toEqual(
			expect.objectContaining({
				currentInvestmentValue: 11_790_900,
				purchaseValue: 1_333_800,
				buyFee: 2_000.7,
				cashRequired: 1_335_800.7,
				finalLots: 336,
				finalInvestmentValue: 13_124_700,
				marketValue: 11_491_200,
				unrealizedProfitLoss: -1_633_500
			})
		);
		expect(result?.finalAveragePrice).toBeCloseTo(390.616071, 6);
	});

	it('rejects fractional lots', () => {
		const result = calculateStockPurchase({
			currentLots: 10.5,
			currentAveragePrice: 500,
			currentMarketPrice: 450,
			additionalLots: 1,
			purchasePrice: 450,
			buyFeeRate: STOCKBIT_BUY_FEE_RATE
		});

		expect(result).toBeUndefined();
	});
});

describe('calculateStockSale', () => {
	it('calculates a partial sale, Stockbit sell fee, and realized profit or loss', () => {
		const result = calculateStockSale({
			currentLots: 297,
			currentAveragePrice: 397,
			saleLots: 39,
			salePrice: 342,
			sellFeeRate: STOCKBIT_SELL_FEE_RATE
		});

		expect(result).toEqual(
			expect.objectContaining({
				soldShares: 3_900,
				soldCostBasis: 1_548_300,
				saleValue: 1_333_800,
				sellFee: 3_334.5,
				netProceeds: 1_330_465.5,
				realizedProfitLoss: -217_834.5,
				remainingLots: 258,
				remainingShares: 25_800,
				remainingAveragePrice: 397,
				remainingInvestmentValue: 10_242_600
			})
		);
		expect(result?.realizedProfitLossPercentage).toBeCloseTo(-14.06927, 5);
	});

	it('closes the position when all lots are sold', () => {
		const result = calculateStockSale({
			currentLots: 10,
			currentAveragePrice: 500,
			saleLots: 10,
			salePrice: 550,
			sellFeeRate: STOCKBIT_SELL_FEE_RATE
		});

		expect(result).toEqual(
			expect.objectContaining({
				netProceeds: 548_625,
				realizedProfitLoss: 48_625,
				remainingLots: 0,
				remainingShares: 0,
				remainingAveragePrice: 0,
				remainingInvestmentValue: 0
			})
		);
		expect(result?.realizedProfitLossPercentage).toBeCloseTo(9.725, 3);
	});

	it('rejects a sale larger than the current position', () => {
		const result = calculateStockSale({
			currentLots: 10,
			currentAveragePrice: 500,
			saleLots: 11,
			salePrice: 550,
			sellFeeRate: STOCKBIT_SELL_FEE_RATE
		});

		expect(result).toBeUndefined();
	});
});

describe('calculateTargetAverage', () => {
	it('rounds the required shares up to a whole lot', () => {
		const result = calculateTargetAverage({
			currentLots: 297,
			currentAveragePrice: 397,
			purchasePrice: 342,
			buyFeeRate: STOCKBIT_BUY_FEE_RATE,
			targetAveragePrice: 380
		});

		if (result.status !== 'achievable') {
			throw new Error(`Expected an achievable target, received ${result.status}`);
		}

		expect(result).toEqual(
			expect.objectContaining({
				status: 'achievable',
				additionalLots: 133,
				purchaseValue: 4_548_600
			})
		);
		expect(result.buyFee).toBeCloseTo(6_822.9, 6);
		expect(result.cashRequired).toBeCloseTo(4_555_422.9, 6);
		expect(result.resultingAveragePrice).toBeCloseTo(379.988372, 6);
	});

	it('reports a target below the purchase price as unreachable', () => {
		const result = calculateTargetAverage({
			currentLots: 297,
			currentAveragePrice: 397,
			purchasePrice: 342,
			buyFeeRate: STOCKBIT_BUY_FEE_RATE,
			targetAveragePrice: 340
		});

		expect(result).toEqual({
			status: 'unreachable',
			reason: 'target-at-or-below-purchase-price'
		});
	});
});
