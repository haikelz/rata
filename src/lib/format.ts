const rupiahFormatter = new Intl.NumberFormat('id-ID', {
	style: 'currency',
	currency: 'IDR',
	minimumFractionDigits: 0,
	maximumFractionDigits: 4
});
const numberFormatter = new Intl.NumberFormat('id-ID', {
	minimumFractionDigits: 0,
	maximumFractionDigits: 4
});
const feeRateFormatter = new Intl.NumberFormat('id-ID', {
	minimumFractionDigits: 2,
	maximumFractionDigits: 4
});

// Indonesian style writes Rp13.124.700 with no space; Intl puts a no-break space after "Rp".
export function formatRupiah(value: number): string {
	return rupiahFormatter.format(value).replace(/\s/u, '');
}

export function formatNumber(value: number): string {
	return numberFormatter.format(value);
}

export function formatFeeRate(rate: number): string {
	return `${feeRateFormatter.format(rate * 100)}%`;
}
