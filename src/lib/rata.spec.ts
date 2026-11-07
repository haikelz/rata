import { describe, expect, it } from 'vitest';

import {
	AJAIB_BUY_FEE_RATE,
	AJAIB_SELL_FEE_RATE,
	BROKERAGE_FIRMS,
	calculateAffordableLots,
	calculateStockPurchase,
	calculateStockSale,
	calculateTargetAverage,
	calculateTargetSaleLots
} from './rata';

const { stockbit, ajaib } = BROKERAGE_FIRMS;

describe('calculation safety and zero transactions', () => {
	const purchase = {
		currentLots: 10,
		currentAveragePrice: 500,
		currentMarketPrice: 450,
		additionalLots: 1,
		purchasePrice: 450,
		brokerage: stockbit
	};
	const sale = {
		currentLots: 10,
		currentAveragePrice: 500,
		saleLots: 1,
		salePrice: 450,
		brokerage: stockbit
	};
	const target = {
		currentLots: 10,
		currentAveragePrice: 500,
		purchasePrice: 450,
		targetAveragePrice: 480,
		brokerage: stockbit
	};

	it.each([NaN, Infinity, -1, 0.01, 1.5, Number.MAX_SAFE_INTEGER])(
		'rejects invalid or unsafe lot amount %s',
		(lots) => {
			expect(calculateStockPurchase({ ...purchase, currentLots: lots })).toBeUndefined();
			expect(calculateStockPurchase({ ...purchase, additionalLots: lots })).toBeUndefined();
			expect(calculateStockSale({ ...sale, currentLots: lots })).toBeUndefined();
			expect(calculateStockSale({ ...sale, saleLots: lots })).toBeUndefined();
			expect(
				calculateTargetSaleLots({ ...sale, currentLots: lots, targetProceeds: 1 })
			).toBeUndefined();
			expect(calculateTargetAverage({ ...target, currentLots: lots })).toEqual({
				status: 'unreachable',
				reason: 'invalid-input'
			});
		}
	);

	it.each([NaN, Infinity, -1, Number.MAX_SAFE_INTEGER * 2])(
		'rejects invalid monetary input %s',
		(value) => {
			for (const field of ['currentAveragePrice', 'currentMarketPrice', 'purchasePrice'] as const)
				expect(calculateStockPurchase({ ...purchase, [field]: value })).toBeUndefined();
			for (const field of ['currentAveragePrice', 'salePrice'] as const)
				expect(calculateStockSale({ ...sale, [field]: value })).toBeUndefined();
			for (const field of ['currentAveragePrice', 'purchasePrice', 'targetAveragePrice'] as const)
				expect(calculateTargetAverage({ ...target, [field]: value })).toEqual({
					status: 'unreachable',
					reason: 'invalid-input'
				});
			expect(calculateAffordableLots(value, 450, stockbit)).toBeUndefined();
			expect(calculateTargetSaleLots({ ...sale, targetProceeds: value })).toBeUndefined();
		}
	);

	it('rejects unsafe products and near-asymptotic target calculations', () => {
		expect(
			calculateStockPurchase({ ...purchase, additionalLots: 1e10, purchasePrice: 1e10 })
		).toBeUndefined();
		expect(
			calculateStockSale({ ...sale, currentLots: 1e10, saleLots: 1e10, salePrice: 1e10 })
		).toBeUndefined();
		expect(
			calculateTargetSaleLots({ ...sale, currentLots: 1e10, salePrice: 1e10, targetProceeds: 1 })
		).toBeUndefined();
		expect(calculateAffordableLots(1e10, 1e-10, stockbit)).toBeUndefined();
		expect(
			calculateTargetAverage({ ...target, currentLots: 1e8, targetAveragePrice: 450.000000000001 })
		).toEqual({ status: 'unreachable', reason: 'invalid-input' });
	});

	it('preserves valid zero purchases, budgets, sales and targets', () => {
		expect(calculateStockPurchase({ ...purchase, additionalLots: 0 })?.cashRequired).toBe(0);
		expect(
			calculateStockPurchase({
				...purchase,
				currentLots: 0,
				currentAveragePrice: 0,
				additionalLots: 0
			})?.finalAveragePrice
		).toBe(0);
		expect(calculateAffordableLots(0, 450, ajaib)).toBe(0);
		expect(calculateStockSale({ ...sale, saleLots: 0 })).toEqual(
			expect.objectContaining({
				netProceeds: 0,
				sellFee: 0,
				realizedProfitLoss: 0,
				remainingLots: 10
			})
		);
		expect(calculateTargetSaleLots({ ...sale, targetProceeds: 0 })).toBe(0);
	});
});

describe('calculateTargetSaleLots', () => {
	it('finds the minimum whole lots that meet net proceeds after Stockbit fees', () => {
		const input = { currentLots: 297, salePrice: 342, brokerage: stockbit };
		expect(calculateTargetSaleLots({ ...input, targetProceeds: 2_000_000 })).toBe(59);
		expect(calculateTargetSaleLots({ ...input, targetProceeds: 34_115 })).toBe(1);
		expect(calculateTargetSaleLots({ ...input, targetProceeds: 34_116 })).toBe(2);
		expect(calculateTargetSaleLots({ ...input, targetProceeds: 0 })).toBe(0);
	});

	it('uses Ajaib fees, caps to holdings, and rejects invalid inputs', () => {
		const input = { currentLots: 2, salePrice: 342, brokerage: ajaib };
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
		expect(calculateAffordableLots(2_000_000, 342, stockbit)).toBe(58);
		expect(calculateAffordableLots(34_251, 342, stockbit)).toBe(1);
		expect(calculateAffordableLots(34_250, 342, stockbit)).toBe(0);
		expect(calculateAffordableLots(2_019_424, 284, stockbit)).toBe(71);
		expect(calculateAffordableLots(2_019_423, 284, stockbit)).toBe(70);
	});

	it('adjusts for brokerage fees and handles insufficient or invalid funds', () => {
		expect(calculateAffordableLots(34_251.5, 342, ajaib)).toBe(0);
		expect(calculateAffordableLots(0, 342, stockbit)).toBe(0);
		expect(calculateAffordableLots(-1, 342, stockbit)).toBeUndefined();
		expect(calculateAffordableLots(Infinity, 342, stockbit)).toBeUndefined();
		expect(calculateAffordableLots(100_000, 0, stockbit)).toBeUndefined();
	});
});

describe('brokerage firm rates', () => {
	it('defines the published Ajaib regular-stock buy and sell fees', () => {
		expect(BROKERAGE_FIRMS.ajaib).toEqual({
			name: 'Ajaib',
			buyFeeRate: AJAIB_BUY_FEE_RATE,
			sellFeeRate: AJAIB_SELL_FEE_RATE,
			roundsFeesDown: false
		});
		expect(AJAIB_BUY_FEE_RATE).toBe(0.001513);
		expect(AJAIB_SELL_FEE_RATE).toBe(0.002513);
	});

	it('rounds fees by the broker rule, not by the rate value', () => {
		const sameRateExact = { ...stockbit, name: 'Tarif sama', roundsFeesDown: false };
		const input = {
			currentLots: 297,
			currentAveragePrice: 397,
			currentMarketPrice: 342,
			additionalLots: 39,
			purchasePrice: 342
		};

		expect(calculateStockPurchase({ ...input, brokerage: stockbit })?.buyFee).toBe(2_000);
		expect(calculateStockPurchase({ ...input, brokerage: sameRateExact })?.buyFee).toBeCloseTo(
			2_000.7,
			6
		);
	});

	it('applies the Ajaib rates to purchase and sale estimates', () => {
		const purchase = calculateStockPurchase({
			currentLots: 297,
			currentAveragePrice: 397,
			currentMarketPrice: 342,
			additionalLots: 39,
			purchasePrice: 342,
			brokerage: ajaib
		});
		const sale = calculateStockSale({
			currentLots: 297,
			currentAveragePrice: 397,
			saleLots: 39,
			salePrice: 342,
			brokerage: ajaib
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
			brokerage: stockbit
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
			additionalLots: calculateAffordableLots(2_023_716, 284, stockbit) ?? -1,
			purchasePrice: 284,
			brokerage: stockbit
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
			brokerage: stockbit
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
			brokerage: stockbit
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
			brokerage: stockbit
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
			brokerage: stockbit
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
			brokerage: stockbit,
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
			brokerage: stockbit,
			targetAveragePrice: 340
		});

		expect(result).toEqual({
			status: 'unreachable',
			reason: 'target-at-or-below-purchase-price'
		});
	});
});
