export const LOT_SIZE = 100;
export const STOCKBIT_BUY_FEE_RATE = 0.0015;
export const STOCKBIT_SELL_FEE_RATE = 0.0025;
export const AJAIB_BUY_FEE_RATE = 0.001513;
export const AJAIB_SELL_FEE_RATE = 0.002513;

export type BrokerageFirmId = 'stockbit' | 'ajaib';

export type BrokerageFirm = {
	name: string;
	buyFeeRate: number;
	sellFeeRate: number;
	roundsFeesDown: boolean;
};

export const BROKERAGE_FIRMS: Record<BrokerageFirmId, BrokerageFirm> = {
	stockbit: {
		name: 'Stockbit',
		buyFeeRate: STOCKBIT_BUY_FEE_RATE,
		sellFeeRate: STOCKBIT_SELL_FEE_RATE,
		roundsFeesDown: true
	},
	ajaib: {
		name: 'Ajaib',
		buyFeeRate: AJAIB_BUY_FEE_RATE,
		sellFeeRate: AJAIB_SELL_FEE_RATE,
		roundsFeesDown: false
	}
};

export type StockPurchaseInput = {
	currentLots: number;
	currentAveragePrice: number;
	currentMarketPrice: number;
	additionalLots: number;
	purchasePrice: number;
	brokerage: BrokerageFirm;
};

export type StockPurchaseResult = {
	currentShares: number;
	currentInvestmentValue: number;
	additionalShares: number;
	purchaseValue: number;
	buyFee: number;
	cashRequired: number;
	finalLots: number;
	finalShares: number;
	finalAveragePrice: number;
	finalInvestmentValue: number;
	marketValue: number;
	unrealizedProfitLoss: number;
	unrealizedProfitLossPercentage: number;
};

export type StockSaleInput = {
	currentLots: number;
	currentAveragePrice: number;
	saleLots: number;
	salePrice: number;
	brokerage: BrokerageFirm;
};

export type TargetSaleInput = Pick<StockSaleInput, 'currentLots' | 'salePrice' | 'brokerage'> & {
	targetProceeds: number;
};

export type StockSaleResult = {
	soldShares: number;
	soldCostBasis: number;
	saleValue: number;
	sellFee: number;
	netProceeds: number;
	realizedProfitLoss: number;
	realizedProfitLossPercentage: number;
	remainingLots: number;
	remainingShares: number;
	remainingAveragePrice: number;
	remainingInvestmentValue: number;
};

export type TargetAverageInput = Pick<
	StockPurchaseInput,
	'currentLots' | 'currentAveragePrice' | 'purchasePrice' | 'brokerage'
> & {
	targetAveragePrice: number;
};

export type TargetAverageResult =
	| {
			status: 'achievable';
			additionalLots: number;
			purchaseValue: number;
			buyFee: number;
			cashRequired: number;
			resultingAveragePrice: number;
	  }
	| {
			status: 'already-reached';
	  }
	| {
			status: 'unreachable';
			reason: 'invalid-input' | 'target-at-or-below-purchase-price';
	  };

// Reads amounts the way Indonesian users type them: "." groups thousands and "," marks
// decimals (1.250 = 1250, 390,37 = 390.37). A lone "." not followed by exactly three digits
// is read as a decimal point (390.37). Anything else is NaN so validation can reject it.
export function parseAmount(text: string): number {
	const compact = text
		.trim()
		.replace(/^rp\.?/i, '')
		.replace(/\s/g, '');
	const negative = compact.startsWith('-');
	const digits = negative ? compact.slice(1) : compact;
	let normalized: string | undefined;
	if (/^\d{1,3}(\.\d{3})*(,\d+)?$/.test(digits) || /^\d+(,\d+)?$/.test(digits)) {
		normalized = digits.replaceAll('.', '').replace(',', '.');
	} else if (/^\d+\.\d+$/.test(digits)) {
		normalized = digits;
	}
	if (normalized === undefined) return Number.NaN;
	return negative ? -Number(normalized) : Number(normalized);
}

function isFiniteNonNegative(value: number): boolean {
	return Number.isFinite(value) && value >= 0 && value <= Number.MAX_SAFE_INTEGER;
}

function isValidLotAmount(value: number): boolean {
	return (
		isFiniteNonNegative(value) && Number.isInteger(value) && Number.isSafeInteger(value * LOT_SIZE)
	);
}

function isSafeCalculation(...values: number[]): boolean {
	return values.every(
		(value) => Number.isFinite(value) && Math.abs(value) <= Number.MAX_SAFE_INTEGER
	);
}

function calculateBuyFee(purchaseValue: number, brokerage: BrokerageFirm): number {
	const fee = purchaseValue * brokerage.buyFeeRate;
	return brokerage.roundsFeesDown ? Math.floor(fee) : fee;
}

function calculateSellFee(saleValue: number, brokerage: BrokerageFirm): number {
	const fee = saleValue * brokerage.sellFeeRate;
	return brokerage.roundsFeesDown ? Math.floor(fee) : fee;
}

export function calculateTargetSaleLots(input: TargetSaleInput): number | undefined {
	if (
		!isValidLotAmount(input.currentLots) ||
		!isFiniteNonNegative(input.targetProceeds) ||
		!Number.isFinite(input.salePrice) ||
		input.salePrice <= 0 ||
		!isFiniteNonNegative(input.brokerage.sellFeeRate) ||
		input.brokerage.sellFeeRate >= 1
	) {
		return undefined;
	}

	const proceeds = (lots: number) => {
		const saleValue = lots * LOT_SIZE * input.salePrice;
		return saleValue - calculateSellFee(saleValue, input.brokerage);
	};
	if (
		!isSafeCalculation(
			input.salePrice,
			input.currentLots * LOT_SIZE * input.salePrice,
			proceeds(input.currentLots)
		)
	)
		return undefined;
	let lower = 0;
	let upper = input.currentLots;
	while (lower < upper) {
		const middle = lower + Math.floor((upper - lower) / 2);
		if (proceeds(middle) >= input.targetProceeds) upper = middle;
		else lower = middle + 1;
	}
	return lower;
}

export function calculateAffordableLots(
	budget: number,
	purchasePrice: number,
	brokerage: BrokerageFirm
): number | undefined {
	if (
		!isFiniteNonNegative(budget) ||
		!Number.isFinite(purchasePrice) ||
		purchasePrice <= 0 ||
		!isFiniteNonNegative(brokerage.buyFeeRate)
	) {
		return undefined;
	}

	const costPerLot = LOT_SIZE * purchasePrice * (1 + brokerage.buyFeeRate);
	if (!isSafeCalculation(costPerLot) || costPerLot <= 0) return undefined;
	const lots = Math.floor(budget / costPerLot);
	if (!isValidLotAmount(lots)) return undefined;
	const cashRequired = (count: number) => {
		const purchaseValue = count * LOT_SIZE * purchasePrice;
		return purchaseValue + calculateBuyFee(purchaseValue, brokerage);
	};
	if (cashRequired(lots) > budget) return lots - 1;
	return isValidLotAmount(lots + 1) && cashRequired(lots + 1) <= budget ? lots + 1 : lots;
}

export function calculateStockPurchase(input: StockPurchaseInput): StockPurchaseResult | undefined {
	const isValidInput =
		isValidLotAmount(input.currentLots) &&
		isValidLotAmount(input.additionalLots) &&
		isFiniteNonNegative(input.currentAveragePrice) &&
		input.currentMarketPrice > 0 &&
		Number.isFinite(input.currentMarketPrice) &&
		input.purchasePrice > 0 &&
		Number.isFinite(input.purchasePrice) &&
		isFiniteNonNegative(input.brokerage.buyFeeRate) &&
		(input.currentLots === 0 || input.currentAveragePrice > 0);

	if (!isValidInput) {
		return undefined;
	}

	const currentShares = input.currentLots * LOT_SIZE;
	const currentInvestmentValue = currentShares * input.currentAveragePrice;
	const additionalShares = input.additionalLots * LOT_SIZE;
	const purchaseValue = additionalShares * input.purchasePrice;
	const buyFee = calculateBuyFee(purchaseValue, input.brokerage);
	const cashRequired = purchaseValue + buyFee;
	const finalLots = input.currentLots + input.additionalLots;
	const finalShares = finalLots * LOT_SIZE;
	const finalInvestmentValue = currentInvestmentValue + purchaseValue;
	const finalAveragePrice = finalShares === 0 ? 0 : finalInvestmentValue / finalShares;
	const marketValue = finalShares * input.currentMarketPrice;
	const unrealizedProfitLoss = marketValue - finalInvestmentValue;
	const unrealizedProfitLossPercentage =
		finalInvestmentValue === 0 ? 0 : (unrealizedProfitLoss / finalInvestmentValue) * 100;
	if (
		!isSafeCalculation(
			input.currentMarketPrice,
			input.purchasePrice,
			currentShares,
			currentInvestmentValue,
			additionalShares,
			purchaseValue,
			buyFee,
			cashRequired,
			finalShares,
			finalInvestmentValue,
			marketValue,
			unrealizedProfitLoss,
			unrealizedProfitLossPercentage
		)
	)
		return undefined;

	return {
		currentShares,
		currentInvestmentValue,
		additionalShares,
		purchaseValue,
		buyFee,
		cashRequired,
		finalLots,
		finalShares,
		finalAveragePrice,
		finalInvestmentValue,
		marketValue,
		unrealizedProfitLoss,
		unrealizedProfitLossPercentage
	};
}

export function calculateStockSale(input: StockSaleInput): StockSaleResult | undefined {
	const isValidInput =
		isValidLotAmount(input.currentLots) &&
		input.currentLots > 0 &&
		isValidLotAmount(input.saleLots) &&
		input.saleLots <= input.currentLots &&
		input.currentAveragePrice > 0 &&
		Number.isFinite(input.currentAveragePrice) &&
		input.salePrice > 0 &&
		Number.isFinite(input.salePrice) &&
		isFiniteNonNegative(input.brokerage.sellFeeRate);

	if (!isValidInput) {
		return undefined;
	}

	const soldShares = input.saleLots * LOT_SIZE;
	const soldCostBasis = soldShares * input.currentAveragePrice;
	const saleValue = soldShares * input.salePrice;
	const sellFee = calculateSellFee(saleValue, input.brokerage);
	const netProceeds = saleValue - sellFee;
	const realizedProfitLoss = netProceeds - soldCostBasis;
	const realizedProfitLossPercentage =
		soldCostBasis === 0 ? 0 : (realizedProfitLoss / soldCostBasis) * 100;
	const remainingLots = input.currentLots - input.saleLots;
	const remainingShares = remainingLots * LOT_SIZE;
	const remainingAveragePrice = remainingShares === 0 ? 0 : input.currentAveragePrice;
	const remainingInvestmentValue = remainingShares * remainingAveragePrice;
	if (
		!isSafeCalculation(
			input.currentAveragePrice,
			input.salePrice,
			input.currentLots * LOT_SIZE,
			input.currentLots * LOT_SIZE * input.currentAveragePrice,
			soldShares,
			soldCostBasis,
			saleValue,
			sellFee,
			netProceeds,
			realizedProfitLoss,
			realizedProfitLossPercentage,
			remainingInvestmentValue
		)
	)
		return undefined;

	return {
		soldShares,
		soldCostBasis,
		saleValue,
		sellFee,
		netProceeds,
		realizedProfitLoss,
		realizedProfitLossPercentage,
		remainingLots,
		remainingShares,
		remainingAveragePrice,
		remainingInvestmentValue
	};
}

export function calculateTargetAverage(input: TargetAverageInput): TargetAverageResult {
	const isValidInput =
		isValidLotAmount(input.currentLots) &&
		input.currentLots > 0 &&
		input.currentAveragePrice > 0 &&
		Number.isFinite(input.currentAveragePrice) &&
		input.purchasePrice > 0 &&
		Number.isFinite(input.purchasePrice) &&
		input.targetAveragePrice > 0 &&
		Number.isFinite(input.targetAveragePrice) &&
		isFiniteNonNegative(input.brokerage.buyFeeRate);

	if (!isValidInput) {
		return { status: 'unreachable', reason: 'invalid-input' };
	}
	if (
		!isSafeCalculation(
			input.currentAveragePrice,
			input.purchasePrice,
			input.targetAveragePrice,
			input.currentLots * LOT_SIZE * input.currentAveragePrice
		)
	)
		return { status: 'unreachable', reason: 'invalid-input' };

	if (input.targetAveragePrice >= input.currentAveragePrice) {
		return { status: 'already-reached' };
	}

	if (input.targetAveragePrice <= input.purchasePrice) {
		return { status: 'unreachable', reason: 'target-at-or-below-purchase-price' };
	}

	const currentShares = input.currentLots * LOT_SIZE;
	const requiredAdditionalShares =
		(currentShares * (input.currentAveragePrice - input.targetAveragePrice)) /
		(input.targetAveragePrice - input.purchasePrice);
	const additionalLots = Math.ceil(requiredAdditionalShares / LOT_SIZE);
	const additionalShares = additionalLots * LOT_SIZE;
	const purchaseValue = additionalShares * input.purchasePrice;
	const buyFee = calculateBuyFee(purchaseValue, input.brokerage);
	const cashRequired = purchaseValue + buyFee;
	const resultingAveragePrice =
		(currentShares * input.currentAveragePrice + purchaseValue) /
		(currentShares + additionalShares);
	if (
		!isValidLotAmount(additionalLots) ||
		!isSafeCalculation(
			currentShares + additionalShares,
			purchaseValue,
			buyFee,
			cashRequired,
			currentShares * input.currentAveragePrice + purchaseValue,
			resultingAveragePrice
		)
	)
		return { status: 'unreachable', reason: 'invalid-input' };

	return {
		status: 'achievable',
		additionalLots,
		purchaseValue,
		buyFee,
		cashRequired,
		resultingAveragePrice
	};
}
