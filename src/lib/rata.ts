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
};

export const BROKERAGE_FIRMS: Record<BrokerageFirmId, BrokerageFirm> = {
	stockbit: {
		name: 'Stockbit',
		buyFeeRate: STOCKBIT_BUY_FEE_RATE,
		sellFeeRate: STOCKBIT_SELL_FEE_RATE
	},
	ajaib: {
		name: 'Ajaib',
		buyFeeRate: AJAIB_BUY_FEE_RATE,
		sellFeeRate: AJAIB_SELL_FEE_RATE
	}
};

export type StockPurchaseInput = {
	currentLots: number;
	currentAveragePrice: number;
	currentMarketPrice: number;
	additionalLots: number;
	purchasePrice: number;
	buyFeeRate: number;
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
	sellFeeRate: number;
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
	'currentLots' | 'currentAveragePrice' | 'purchasePrice' | 'buyFeeRate'
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

function isFiniteNonNegative(value: number): boolean {
	return Number.isFinite(value) && value >= 0;
}

function isValidLotAmount(value: number): boolean {
	return isFiniteNonNegative(value) && Number.isInteger(value);
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
		isFiniteNonNegative(input.buyFeeRate) &&
		(input.currentLots === 0 || input.currentAveragePrice > 0);

	if (!isValidInput) {
		return undefined;
	}

	const currentShares = input.currentLots * LOT_SIZE;
	const currentInvestmentValue = currentShares * input.currentAveragePrice;
	const additionalShares = input.additionalLots * LOT_SIZE;
	const purchaseValue = additionalShares * input.purchasePrice;
	const buyFee = purchaseValue * input.buyFeeRate;
	const cashRequired = purchaseValue + buyFee;
	const finalLots = input.currentLots + input.additionalLots;
	const finalShares = finalLots * LOT_SIZE;
	const finalInvestmentValue = currentInvestmentValue + purchaseValue;
	const finalAveragePrice = finalShares === 0 ? 0 : finalInvestmentValue / finalShares;
	const marketValue = finalShares * input.currentMarketPrice;
	const unrealizedProfitLoss = marketValue - finalInvestmentValue;
	const unrealizedProfitLossPercentage =
		finalInvestmentValue === 0 ? 0 : (unrealizedProfitLoss / finalInvestmentValue) * 100;

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
		isFiniteNonNegative(input.sellFeeRate);

	if (!isValidInput) {
		return undefined;
	}

	const soldShares = input.saleLots * LOT_SIZE;
	const soldCostBasis = soldShares * input.currentAveragePrice;
	const saleValue = soldShares * input.salePrice;
	const sellFee = saleValue * input.sellFeeRate;
	const netProceeds = saleValue - sellFee;
	const realizedProfitLoss = netProceeds - soldCostBasis;
	const realizedProfitLossPercentage =
		soldCostBasis === 0 ? 0 : (realizedProfitLoss / soldCostBasis) * 100;
	const remainingLots = input.currentLots - input.saleLots;
	const remainingShares = remainingLots * LOT_SIZE;
	const remainingAveragePrice = remainingShares === 0 ? 0 : input.currentAveragePrice;
	const remainingInvestmentValue = remainingShares * remainingAveragePrice;

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
		isFiniteNonNegative(input.buyFeeRate);

	if (!isValidInput) {
		return { status: 'unreachable', reason: 'invalid-input' };
	}

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
	const buyFee = purchaseValue * input.buyFeeRate;
	const cashRequired = purchaseValue + buyFee;
	const resultingAveragePrice =
		(currentShares * input.currentAveragePrice + purchaseValue) /
		(currentShares + additionalShares);

	return {
		status: 'achievable',
		additionalLots,
		purchaseValue,
		buyFee,
		cashRequired,
		resultingAveragePrice
	};
}
