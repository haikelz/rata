import { describe, expect, it } from 'vitest';

import {
	AJAIB_BUY_FEE_RATE,
	AJAIB_SELL_FEE_RATE,
	BROKERAGE_FIRMS,
	STOCKBIT_BUY_FEE_RATE,
	STOCKBIT_SELL_FEE_RATE,
	calculateAffordableLots,
	calculateStockPurchase,
	calculateStockSale,
	calculateTargetAverage,
	calculateTargetSaleLots
} from './rata';

describe('calculateTargetSaleLots', () => {
	it('finds the minimum whole lots that meet net proceeds after Stockbit fees', () => {
		const input = { currentLots: 297, salePrice: 342, sellFeeRate: STOCKBIT_SELL_FEE_RATE };
		expect(calculateTargetSaleLots({ ...input, targetProceeds: 2_000_000 })).toBe(59);
		expect(calculateTargetSaleLots({ ...input, targetProceeds: 34_115 })).toBe(1);
		expect(calculateTargetSaleLots({ ...input, targetProceeds: 34_116 })).toBe(2);
		expect(calculateTargetSaleLots({ ...input, targetProceeds: 0 })).toBe(0);
	});

	it('uses Ajaib fees, caps to holdings, and rejects invalid inputs', () => {
		const input = { currentLots: 2, salePrice: 342, sellFeeRate: AJAIB_SELL_FEE_RATE };
		expect(calculateTargetSaleLots({ ...input, targetProceeds: 34_115 })).toBe(2);
		expect(calculateTargetSaleLots({ ...input, targetProceeds: 1_000_000 })).toBe(2);
		expect(calculateTargetSaleLots({ ...input, targetProceeds: -1 })).toBeUndefined();
		expect(calculateTargetSaleLots({ ...input, salePrice: 0, targetProceeds: 1 })).toBeUndefined();
		expect(
			calculateTargetSaleLots({ ...input, currentLots: 1.5, targetProceeds: 1 })
		).toBeUndefined();
	});
});

describe('calculateAffordableLots', () => {
	it('buys the maximum whole lots within a budget including Stockbit fees', () => {
		expect(calculateAffordableLots(2_000_000, 342, STOCKBIT_BUY_FEE_RATE)).toBe(58);
		expect(calculateAffordableLots(34_251, 342, STOCKBIT_BUY_FEE_RATE)).toBe(1);
		expect(calculateAffordableLots(34_250, 342, STOCKBIT_BUY_FEE_RATE)).toBe(0);
		expect(calculateAffordableLots(2_019_424, 284, STOCKBIT_BUY_FEE_RATE)).toBe(71);
		expect(calculateAffordableLots(2_019_423, 284, STOCKBIT_BUY_FEE_RATE)).toBe(70);
	});

	it('adjusts for brokerage fees and handles insufficient or invalid funds', () => {
		expect(calculateAffordableLots(34_251.5, 342, AJAIB_BUY_FEE_RATE)).toBe(0);
		expect(calculateAffordableLots(0, 342, STOCKBIT_BUY_FEE_RATE)).toBe(0);
		expect(calculateAffordableLots(-1, 342, STOCKBIT_BUY_FEE_RATE)).toBeUndefined();
		expect(calculateAffordableLots(Infinity, 342, STOCKBIT_BUY_FEE_RATE)).toBeUndefined();
		expect(calculateAffordableLots(100_000, 0, STOCKBIT_BUY_FEE_RATE)).toBeUndefined();
	});
});

describe('brokerage firm rates', () => {
	it('defines the published Ajaib regular-stock buy and sell fees', () => {
		expect(BROKERAGE_FIRMS.ajaib).toEqual({
			name: 'Ajaib',
			buyFeeRate: AJAIB_BUY_FEE_RATE,
			sellFeeRate: AJAIB_SELL_FEE_RATE
		});
		expect(AJAIB_BUY_FEE_RATE).toBe(0.001513);
		expect(AJAIB_SELL_FEE_RATE).toBe(0.002513);
	});

	it('applies the Ajaib rates to purchase and sale estimates', () => {
		const purchase = calculateStockPurchase({
			currentLots: 297,
			currentAveragePrice: 397,
			currentMarketPrice: 342,
			additionalLots: 39,
			purchasePrice: 342,
			buyFeeRate: BROKERAGE_FIRMS.ajaib.buyFeeRate
		});
		const sale = calculateStockSale({
			currentLots: 297,
			currentAveragePrice: 397,
			saleLots: 39,
			salePrice: 342,
			sellFeeRate: BROKERAGE_FIRMS.ajaib.sellFeeRate
		});

		expect(purchase?.buyFee).toBeCloseTo(2_018.0394, 4);
		expect(purchase?.cashRequired).toBeCloseTo(1_335_818.0394, 4);
		expect(sale?.sellFee).toBeCloseTo(3_351.8394, 4);
		expect(sale?.netProceeds).toBeCloseTo(1_330_448.1606, 4);
		expect(sale?.realizedProfitLoss).toBeCloseTo(-217_851.8394, 4);
	});
});

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
				buyFee: 2_000,
				cashRequired: 1_335_800,
				finalLots: 336,
				finalInvestmentValue: 13_124_700,
				marketValue: 11_491_200,
				unrealizedProfitLoss: -1_633_500
			})
		);
		expect(result?.finalAveragePrice).toBeCloseTo(390.616071, 6);
	});

	it('matches the observed Stockbit fee for 71 lots at Rp284', () => {
		const result = calculateStockPurchase({
			currentLots: 306,
			currentAveragePrice: 390.37,
			currentMarketPrice: 286,
			additionalLots: calculateAffordableLots(2_023_716, 284, STOCKBIT_BUY_FEE_RATE) ?? -1,
			purchasePrice: 284,
			buyFeeRate: STOCKBIT_BUY_FEE_RATE
		});

		expect(result?.buyFee).toBe(3_024);
		expect(result?.cashRequired).toBe(2_019_424);
		expect(result?.finalLots).toBe(377);
		expect(result?.finalAveragePrice).toBeCloseTo(370.33745358, 8);
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
				sellFee: 3_334,
				netProceeds: 1_330_466,
				realizedProfitLoss: -217_834,
				remainingLots: 258,
				remainingShares: 25_800,
				remainingAveragePrice: 397,
				remainingInvestmentValue: 10_242_600
			})
		);
		expect(result?.realizedProfitLossPercentage).toBeCloseTo(-14.06924, 5);
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
		expect(result.buyFee).toBe(6_822);
		expect(result.cashRequired).toBe(4_555_422);
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
