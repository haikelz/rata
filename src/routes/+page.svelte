<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import CalculatorTabs, { type CalculatorMode } from '$lib/CalculatorTabs.svelte';
	import { formatFeeRate, formatNumber, formatRupiah } from '$lib/format';
	import Seo from '$lib/Seo.svelte';
	import {
		BROKERAGE_FIRMS,
		type BrokerageFirmId,
		calculateAffordableLots,
		calculateStockPurchase,
		calculateStockSale,
		calculateTargetAverage,
		calculateTargetSaleLots,
		idxTickSize,
		isOnIdxTick,
		LOT_SIZE,
		parseAmount
	} from '$lib/rata';

	const seoTitle = 'Kalkulator Rata-rata Saham & Average Down | Rata';
	const seoDescription =
		'Hitung harga rata-rata baru saat average down, dana yang dibutuhkan, hasil jual bersih, dan untung rugi dengan fee Stockbit atau Ajaib, langsung di browser.';
	const brokerageFirmIds: ReadonlyArray<BrokerageFirmId> = ['stockbit', 'ajaib'];
	let homeUrl = $derived(new URL(resolve('/'), page.url).href);
	let schema = $derived([
		{ '@type': 'WebSite', name: 'Rata', url: homeUrl, inLanguage: 'id-ID' },
		{
			'@type': 'WebApplication',
			name: 'Rata',
			alternateName: 'Kalkulator Rata-rata Saham',
			url: homeUrl,
			description: seoDescription,
			applicationCategory: 'FinanceApplication',
			operatingSystem: 'Any',
			browserRequirements: 'Requires JavaScript',
			inLanguage: 'id-ID',
			isAccessibleForFree: true,
			offers: { '@type': 'Offer', price: '0', priceCurrency: 'IDR' },
			featureList: [
				'Kalkulator harga rata-rata saham',
				'Estimasi fee beli dan jual Stockbit',
				'Estimasi fee beli dan jual Ajaib',
				'Kalkulator target harga rata-rata',
				'Estimasi untung rugi berjalan'
			]
		}
	]);

	const percentageFormatter = new Intl.NumberFormat('id-ID', {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
		signDisplay: 'exceptZero'
	});
	let calculatorMode = $state<CalculatorMode>('buy');
	let brokerageFirmId = $state<BrokerageFirmId>('stockbit');
	let brokerageFirm = $derived(BROKERAGE_FIRMS[brokerageFirmId]);
	const example = {
		'current-lots': '297',
		'current-average': '397',
		'market-price': '342',
		'additional-lots': '39',
		'purchase-budget': '2.000.000',
		'purchase-price': '342',
		'sale-lots': '39',
		'target-proceeds': '2.000.000',
		'sale-price': '342',
		'target-average': '380'
	};
	type AmountField = keyof typeof example;
	let amounts = $state({ ...example });
	let currentLots = $derived(parseAmount(amounts['current-lots']));
	let currentAveragePrice = $derived(parseAmount(amounts['current-average']));
	let currentMarketPrice = $derived(parseAmount(amounts['market-price']));
	let additionalLots = $derived(parseAmount(amounts['additional-lots']));
	let purchaseInputMode = $state<'lots' | 'budget'>('lots');
	let purchaseBudget = $derived(parseAmount(amounts['purchase-budget']));
	let purchasePrice = $derived(parseAmount(amounts['purchase-price']));
	let saleLots = $derived(parseAmount(amounts['sale-lots']));
	let saleInputMode = $state<'lots' | 'target'>('lots');
	let targetProceeds = $derived(parseAmount(amounts['target-proceeds']));
	let salePrice = $derived(parseAmount(amounts['sale-price']));
	let targetAveragePrice = $derived(parseAmount(amounts['target-average']));
	let affordableLots = $derived(
		calculateAffordableLots(purchaseBudget, purchasePrice, brokerageFirm)
	);
	let plannedLots = $derived(purchaseInputMode === 'budget' ? affordableLots : additionalLots);

	let result = $derived(
		plannedLots === undefined
			? undefined
			: calculateStockPurchase({
					currentLots,
					currentAveragePrice,
					currentMarketPrice,
					additionalLots: plannedLots,
					purchasePrice,
					brokerage: brokerageFirm
				})
	);
	let targetSaleLots = $derived(
		calculateTargetSaleLots({
			currentLots,
			targetProceeds,
			salePrice,
			brokerage: brokerageFirm
		})
	);
	let plannedSaleLots = $derived(saleInputMode === 'target' ? targetSaleLots : saleLots);
	let saleResult = $derived(
		plannedSaleLots === undefined
			? undefined
			: calculateStockSale({
					currentLots,
					currentAveragePrice,
					saleLots: plannedSaleLots,
					salePrice,
					brokerage: brokerageFirm
				})
	);
	let targetResult = $derived(
		calculateTargetAverage({
			currentLots,
			currentAveragePrice,
			purchasePrice,
			brokerage: brokerageFirm,
			targetAveragePrice
		})
	);

	function inputError(value: number, minimum = 0, lots = false): string {
		if (!Number.isFinite(value)) return 'Masukkan angka yang valid; kolom ini wajib diisi.';
		if (value < minimum || (minimum > 0 && value === 0))
			return minimum > 0 ? 'Masukkan harga lebih dari nol.' : 'Nilai tidak boleh negatif.';
		if (lots && !Number.isInteger(value)) return 'Lot harus berupa bilangan bulat.';
		if (value > Number.MAX_SAFE_INTEGER || (lots && !Number.isSafeInteger(value * LOT_SIZE)))
			return 'Nilai terlalu besar untuk dihitung dengan aman. Kurangi nilainya.';
		return '';
	}
	const unsafeMessage =
		'Hasil perhitungan terlalu besar untuk dihitung dengan aman. Kurangi lot atau harga.';
	let errors = $derived({
		'current-lots':
			inputError(currentLots, 0, true) ||
			(calculatorMode === 'sell' && currentLots === 0
				? 'Masukkan jumlah lot saat ini lebih dari nol.'
				: ''),
		'current-average':
			inputError(currentAveragePrice, currentLots > 0 ? Number.MIN_VALUE : 0) ||
			(currentLots * LOT_SIZE * currentAveragePrice > Number.MAX_SAFE_INTEGER ? unsafeMessage : ''),
		'market-price':
			inputError(currentMarketPrice, Number.MIN_VALUE) ||
			(result === undefined &&
			!inputError(currentLots, 0, true) &&
			!inputError(currentAveragePrice, currentLots > 0 ? Number.MIN_VALUE : 0) &&
			plannedLots !== undefined &&
			!inputError(plannedLots, 0, true) &&
			!inputError(purchasePrice, Number.MIN_VALUE)
				? unsafeMessage
				: ''),
		'additional-lots': inputError(additionalLots, 0, true),
		'purchase-budget':
			inputError(purchaseBudget) ||
			(affordableLots === undefined && !inputError(purchasePrice, Number.MIN_VALUE)
				? unsafeMessage
				: ''),
		'purchase-price': inputError(purchasePrice, Number.MIN_VALUE),
		'sale-lots':
			inputError(saleLots, 0, true) ||
			(saleLots > currentLots ? 'Lot dijual tidak boleh melebihi posisi saat ini.' : ''),
		'target-proceeds': inputError(targetProceeds),
		'sale-price':
			inputError(salePrice, Number.MIN_VALUE) ||
			((saleInputMode === 'target' ? currentLots : saleLots) * LOT_SIZE * salePrice >
				Number.MAX_SAFE_INTEGER ||
			(saleResult === undefined &&
				currentLots > 0 &&
				!inputError(currentLots, 0, true) &&
				!inputError(currentAveragePrice, Number.MIN_VALUE) &&
				plannedSaleLots !== undefined &&
				!inputError(plannedSaleLots, 0, true) &&
				plannedSaleLots <= currentLots)
				? unsafeMessage
				: ''),
		'target-average':
			inputError(targetAveragePrice, Number.MIN_VALUE) ||
			(targetResult.status === 'unreachable' &&
			targetResult.reason === 'invalid-input' &&
			currentLots !== 0
				? 'Periksa posisi dan harga beli; hasil target harus berada dalam batas perhitungan aman.'
				: '')
	});

	function tickWarning(price: number): string {
		if (!Number.isFinite(price) || price <= 0 || isOnIdxTick(price)) return '';
		const tick = idxTickSize(price);
		const lower = Math.floor(price / tick) * tick;
		const options = [lower, lower + tick].filter((option) => option > 0).map(formatRupiah);
		return `Tidak sesuai fraksi harga BEI (kelipatan ${formatRupiah(tick)}). Coba ${options.join(' atau ')}.`;
	}
	// One short sentence for screen readers instead of re-reading every result row per keystroke.
	let resultSummary = $derived.by(() => {
		if (calculatorMode === 'buy') {
			if (!result) return '';
			const lots =
				purchaseInputMode === 'budget'
					? `Dana cukup untuk ${formatNumber(result.additionalShares / LOT_SIZE)} lot. `
					: '';
			return `${lots}Rata-rata baru ${formatRupiah(result.finalAveragePrice)}. Dana dibutuhkan ${formatRupiah(result.cashRequired)}.`;
		}
		if (!saleResult) return '';
		const lots =
			saleInputMode === 'target'
				? `Jual ${formatNumber(saleResult.soldShares / LOT_SIZE)} lot. `
				: '';
		return `${lots}Dana bersih ${formatRupiah(saleResult.netProceeds)}. P/L terealisasi ${formatRupiah(saleResult.realizedProfitLoss)}.`;
	});
	// Phones stack the columns, so a one-line answer under the tabs stays in view while typing.
	let resultEcho = $derived(
		calculatorMode === 'buy'
			? result && { label: 'Rata-rata baru', value: formatRupiah(result.finalAveragePrice) }
			: saleResult && { label: 'Dana bersih', value: formatRupiah(saleResult.netProceeds) }
	);
	let warnings: Partial<Record<keyof typeof errors, string>> = $derived({
		'market-price': tickWarning(currentMarketPrice),
		'purchase-price': tickWarning(purchasePrice),
		'sale-price': tickWarning(salePrice)
	});

	function formatProfitLoss(value: number, percentage: number): string {
		return `${formatRupiah(value)} (${percentageFormatter.format(percentage)}%)`;
	}

	function resetExample(): void {
		amounts = { ...example };
		purchaseInputMode = 'lots';
		saleInputMode = 'lots';
	}

	// Show what was understood: 2000000 becomes 2.000.000, 390.37 becomes 390,37.
	function tidy(field: AmountField): void {
		const value = parseAmount(amounts[field]);
		if (Number.isFinite(value)) amounts[field] = formatNumber(value);
	}

	function rulerPercent(value: number, low: number, high: number): number {
		return ((value - low) / (high - low)) * 100;
	}
</script>

<Seo title={seoTitle} description={seoDescription} {schema} />

{#snippet fieldError(id: keyof typeof errors)}
	<span
		id={`${id}-validation`}
		class={['text-xs', errors[id] ? 'text-error' : 'text-warning']}
		aria-live="polite">{errors[id] || warnings[id]}</span
	>
{/snippet}

{#snippet stepArrow()}
	<span
		class="absolute top-6 right-0 z-1 hidden size-6 translate-x-1/2 -translate-y-1/2 place-items-center border border-base-300 bg-base-100 text-base-content/60 lg:grid"
		aria-hidden="true"
	>
		<svg class="size-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5">
			<path d="M4.5 2.5 8 6l-3.5 3.5" />
		</svg>
	</span>
{/snippet}

{#snippet ledgerRow(label: string, value: string, tone = 'text-base-content')}
	<div class="flex items-baseline justify-between gap-4 border-b border-base-300 py-2.5">
		<dt class="text-sm text-base-content/65">{label}</dt>
		<dd class={['numeric text-right', tone]}>{value}</dd>
	</div>
{/snippet}

{#snippet totalRow(label: string, value: string)}
	<div class="flex items-baseline justify-between gap-4 pt-4">
		<dt class="font-medium text-base-content">{label}</dt>
		<dd class="numeric text-right text-xl font-medium text-primary">{value}</dd>
	</div>
{/snippet}

<!-- The new average always lands between the buy price and the old average, so those two sit at
     the ends and the distance the average moved is drawn in primary. The figures are already
     printed as text, so screen readers skip the drawing. -->
{#snippet priceRuler(buyPrice: number, oldAverage: number, newAverage: number)}
	{@const low = Math.min(buyPrice, oldAverage)}
	{@const high = Math.max(buyPrice, oldAverage)}
	{@const at = rulerPercent(newAverage, low, high)}
	{@const from = rulerPercent(oldAverage, low, high)}
	{@const ends = [
		{ label: 'Harga beli', value: buyPrice },
		{ label: 'Rata-rata lama', value: oldAverage }
	].sort((a, b) => a.value - b.value)}
	<div class="mt-8 text-xs" aria-hidden="true">
		<div class="relative h-9">
			<span
				class="absolute bottom-1 whitespace-nowrap"
				style:left="{at}%"
				style:translate="-{at}% 0"
			>
				<span class="block text-base-content/65">Rata-rata baru</span>
				<span class="numeric block font-medium text-primary">{formatRupiah(newAverage)}</span>
			</span>
		</div>
		<div class="relative h-4">
			{#each { length: 11 }, index (index)}
				<span
					class={[
						'absolute bottom-1/2 w-px bg-base-content/25',
						index % 10 === 0 ? 'h-4 translate-y-1/2' : 'h-1.5'
					]}
					style:left="{index * 10}%"
				></span>
			{/each}
			<span class="absolute inset-x-0 top-1/2 h-px bg-base-content/25"></span>
			<span
				class="absolute top-1/2 h-1 -translate-y-1/2 bg-primary"
				style:left="{Math.min(at, from)}%"
				style:width="{Math.abs(at - from)}%"
			></span>
			<span class="absolute top-0 h-4 w-0.5 -translate-x-1/2 bg-primary" style:left="{at}%"></span>
		</div>
		<div class="mt-2 flex justify-between gap-4">
			{#each ends as end, index (end.label)}
				<span class={{ 'text-right': index === 1 }}>
					<span class="block text-base-content/65">{end.label}</span>
					<span class="numeric block text-base-content">{formatRupiah(end.value)}</span>
				</span>
			{/each}
		</div>
	</div>
{/snippet}

{#snippet answer(value: number)}
	<p
		class="numeric flex flex-wrap items-baseline gap-x-2 text-[2.75rem] leading-none font-medium tracking-[-0.04em] text-base-content sm:text-5xl"
	>
		<span class="font-sans text-xl font-normal tracking-normal text-base-content/60">Rp</span>
		<span class="break-all">{formatNumber(value)}</span>
	</p>
{/snippet}

<section
	class="grid gap-x-12 gap-y-2 border-b border-base-300 px-4 py-7 sm:px-6 lg:grid-cols-[auto_1fr] lg:items-end xl:px-8"
>
	<h1 class="text-3xl font-medium tracking-[-0.035em] text-base-content sm:text-4xl">
		Kalkulator rata-rata saham
	</h1>
	<p class="max-w-md text-sm leading-6 text-base-content/65">
		Simulasikan lot, harga rata-rata, kebutuhan dana, atau hasil penjualan sebelum mengirim order ke
		broker.
	</p>
</section>

<div class="flex min-h-12 items-stretch justify-between border-b border-base-300">
	<CalculatorTabs bind:value={calculatorMode} />
	<button
		class="btn min-h-11 gap-0 self-center btn-ghost px-3 font-normal btn-sm sm:mr-3"
		type="button"
		onclick={resetExample}
	>
		Reset<span class="max-[359px]:sr-only">&nbsp;contoh</span>
	</button>
</div>

<div
	id="calculator-panel"
	role="tabpanel"
	aria-labelledby={`calculator-tab-${calculatorMode}`}
	class="grid lg:grid-cols-[1fr_1fr_1.3fr]"
>
	{#if resultEcho}
		<a
			class="flex items-center justify-between gap-4 border-b border-base-300 bg-base-200/50 px-4 py-3 text-sm no-underline sm:px-6 lg:hidden"
			href="#hasil"
		>
			<span class="text-base-content/65">{resultEcho.label}</span>
			<span class="flex items-center gap-2">
				<span class="numeric font-medium text-base-content">{resultEcho.value}</span>
				<svg
					class="size-3 text-base-content/60"
					viewBox="0 0 12 12"
					fill="none"
					stroke="currentColor"
					stroke-width="1.5"
					aria-hidden="true"
				>
					<path d="M2.5 4.5 6 8l3.5-3.5" />
				</svg>
				<span class="sr-only">, lihat hasil</span>
			</span>
		</a>
	{/if}

	<form
		class="lg:col-span-2 lg:grid lg:grid-cols-subgrid"
		onsubmit={(event) => event.preventDefault()}
	>
		<fieldset class="relative min-w-0 border-b border-base-300 lg:border-r lg:border-b-0">
			<legend
				class="float-left flex h-12 w-full items-center justify-between gap-4 border-b border-base-300 px-4 sm:px-6 xl:px-8"
			>
				<h2 class="font-medium text-base-content">Posisi saat ini</h2>
				<span class="text-xs text-base-content/60">dari aplikasi broker</span>
			</legend>
			{@render stepArrow()}

			<div class="clear-both grid gap-5 p-4 sm:grid-cols-2 sm:p-6 lg:grid-cols-1 xl:p-8">
				<div class="grid content-start gap-2 sm:col-span-2 lg:col-span-1">
					<label class="text-sm font-medium text-base-content" for="current-lots">Jumlah lot</label>
					<input
						id="current-lots"
						aria-invalid={!!errors['current-lots']}
						class="input-bordered numeric input w-full"
						type="text"
						autocomplete="off"
						inputmode="numeric"
						aria-describedby="current-lots-help current-lots-validation"
						bind:value={amounts['current-lots']}
						onblur={() => tidy('current-lots')}
					/>
					{@render fieldError('current-lots')}
					<span id="current-lots-help" class="text-xs text-base-content/65"
						>1 lot = 100 lembar saham</span
					>
				</div>

				<div
					class={[
						'grid content-start gap-2',
						calculatorMode === 'sell' && 'sm:col-span-2 lg:col-span-1'
					]}
				>
					<label class="text-sm font-medium text-base-content" for="current-average"
						>Harga rata-rata</label
					>
					<span class="input-bordered input flex w-full items-center gap-2">
						<span class="text-base-content/65" aria-hidden="true">Rp</span>
						<input
							id="current-average"
							aria-invalid={!!errors['current-average']}
							aria-describedby="current-average-help current-average-validation"
							class="numeric min-w-0 grow border-0 bg-transparent outline-none"
							type="text"
							autocomplete="off"
							inputmode="decimal"
							bind:value={amounts['current-average']}
							onblur={() => tidy('current-average')}
						/>
					</span>
					{@render fieldError('current-average')}
					<span id="current-average-help" class="text-xs text-base-content/65"
						>Pakai koma untuk desimal, misalnya 390,37.</span
					>
				</div>

				{#if calculatorMode === 'buy'}
					<div class="grid content-start gap-2">
						<label class="text-sm font-medium text-base-content" for="market-price"
							>Harga pasar</label
						>
						<span class="input-bordered input flex w-full items-center gap-2">
							<span class="text-base-content/65" aria-hidden="true">Rp</span>
							<input
								id="market-price"
								aria-invalid={!!errors['market-price']}
								aria-describedby="market-price-validation"
								class="numeric min-w-0 grow border-0 bg-transparent outline-none"
								type="text"
								autocomplete="off"
								inputmode="numeric"
								bind:value={amounts['market-price']}
								onblur={() => tidy('market-price')}
							/>
						</span>
						{@render fieldError('market-price')}
					</div>
				{/if}
			</div>
		</fieldset>

		<fieldset class="relative min-w-0 border-b border-base-300 lg:border-r lg:border-b-0">
			<legend
				class="float-left flex h-12 w-full items-center justify-between gap-4 border-b border-base-300 px-4 sm:px-6 xl:px-8"
			>
				<h2 class="font-medium text-base-content">
					Rencana {calculatorMode === 'buy' ? 'pembelian' : 'penjualan'}
				</h2>
			</legend>
			{@render stepArrow()}

			<div class="clear-both grid gap-5 p-4 sm:grid-cols-2 sm:p-6 lg:grid-cols-1 xl:p-8">
				{#if calculatorMode === 'buy'}
					<div class="grid gap-2 sm:col-span-2 lg:col-span-1">
						<label class="text-sm font-medium text-base-content" for="purchase-input-mode"
							>Hitung pembelian berdasarkan</label
						>
						<select
							id="purchase-input-mode"
							class="select-bordered select min-h-11 w-full"
							bind:value={purchaseInputMode}
						>
							<option value="lots">Jumlah lot</option>
							<option value="budget">Dana tersedia</option>
						</select>
					</div>
					{#if purchaseInputMode === 'lots'}
						<div class="grid content-start gap-2">
							<label class="text-sm font-medium text-base-content" for="additional-lots"
								>Lot tambahan</label
							>
							<input
								id="additional-lots"
								aria-invalid={!!errors['additional-lots']}
								aria-describedby="additional-lots-validation"
								class="input-bordered numeric input w-full"
								type="text"
								autocomplete="off"
								inputmode="numeric"
								bind:value={amounts['additional-lots']}
								onblur={() => tidy('additional-lots')}
							/>
							{@render fieldError('additional-lots')}
						</div>
					{:else}
						<div class="grid content-start gap-2">
							<label class="text-sm font-medium text-base-content" for="purchase-budget"
								>Dana tersedia</label
							>
							<span class="input-bordered input flex w-full items-center gap-2">
								<span class="text-base-content/65" aria-hidden="true">Rp</span>
								<input
									id="purchase-budget"
									class="numeric min-w-0 grow border-0 bg-transparent outline-none"
									type="text"
									autocomplete="off"
									inputmode="numeric"
									aria-invalid={!!errors['purchase-budget']}
									aria-describedby="purchase-budget-help purchase-budget-validation"
									bind:value={amounts['purchase-budget']}
									onblur={() => tidy('purchase-budget')}
								/>
							</span>
							{@render fieldError('purchase-budget')}
							<span id="purchase-budget-help" class="text-xs text-base-content/65"
								>Maksimum lot utuh, termasuk fee beli.</span
							>
						</div>
					{/if}

					<div class="grid content-start gap-2">
						<label class="text-sm font-medium text-base-content" for="purchase-price"
							>Harga beli</label
						>
						<span class="input-bordered input flex w-full items-center gap-2">
							<span class="text-base-content/65" aria-hidden="true">Rp</span>
							<input
								id="purchase-price"
								aria-invalid={!!errors['purchase-price']}
								aria-describedby="purchase-price-validation"
								class="numeric min-w-0 grow border-0 bg-transparent outline-none"
								type="text"
								autocomplete="off"
								inputmode="numeric"
								bind:value={amounts['purchase-price']}
								onblur={() => tidy('purchase-price')}
							/>
						</span>
						{@render fieldError('purchase-price')}
					</div>
				{:else}
					<div class="grid gap-2 sm:col-span-2 lg:col-span-1">
						<label class="text-sm font-medium text-base-content" for="sale-input-mode"
							>Hitung penjualan berdasarkan</label
						>
						<select
							id="sale-input-mode"
							class="select-bordered select min-h-11 w-full"
							bind:value={saleInputMode}
						>
							<option value="lots">Jumlah lot</option>
							<option value="target">Target minimum dana bersih</option>
						</select>
					</div>
					{#if saleInputMode === 'lots'}
						<div class="grid content-start gap-2">
							<label class="text-sm font-medium text-base-content" for="sale-lots">Lot dijual</label
							>
							<input
								id="sale-lots"
								class="input-bordered numeric input w-full"
								type="text"
								autocomplete="off"
								inputmode="numeric"
								aria-invalid={!!errors['sale-lots']}
								aria-describedby="sale-lots-help sale-lots-validation"
								bind:value={amounts['sale-lots']}
								onblur={() => tidy('sale-lots')}
							/>
							{@render fieldError('sale-lots')}
							<span id="sale-lots-help" class="text-xs text-base-content/65">
								Lot utuh, tidak melebihi posisi saat ini. Nol berarti tidak menjual.
							</span>
						</div>
					{:else}
						<div class="grid content-start gap-2">
							<label class="text-sm font-medium text-base-content" for="target-proceeds"
								>Target minimum dana bersih</label
							>
							<span class="input-bordered input flex w-full items-center gap-2">
								<span class="text-base-content/65" aria-hidden="true">Rp</span>
								<input
									id="target-proceeds"
									class="numeric min-w-0 grow border-0 bg-transparent outline-none"
									type="text"
									autocomplete="off"
									inputmode="numeric"
									aria-invalid={!!errors['target-proceeds']}
									aria-describedby="target-proceeds-help target-proceeds-validation"
									bind:value={amounts['target-proceeds']}
									onblur={() => tidy('target-proceeds')}
								/>
							</span>
							{@render fieldError('target-proceeds')}
							<span id="target-proceeds-help" class="text-xs text-base-content/65"
								>Minimum dana setelah fee jual. Lot utuh dapat menghasilkan dana lebih dari target.</span
							>
						</div>
					{/if}

					<div class="grid content-start gap-2">
						<label class="text-sm font-medium text-base-content" for="sale-price">Harga jual</label>
						<span class="input-bordered input flex w-full items-center gap-2">
							<span class="text-base-content/65" aria-hidden="true">Rp</span>
							<input
								id="sale-price"
								class="numeric min-w-0 grow border-0 bg-transparent outline-none"
								type="text"
								autocomplete="off"
								inputmode="numeric"
								aria-invalid={!!errors['sale-price']}
								aria-describedby="sale-price-validation"
								bind:value={amounts['sale-price']}
								onblur={() => tidy('sale-price')}
							/>
						</span>
						{@render fieldError('sale-price')}
					</div>
				{/if}

				<div class="grid gap-2 sm:col-span-2 lg:col-span-1">
					<label class="text-sm font-medium text-base-content" for="brokerage-firm"
						>Perusahaan sekuritas</label
					>
					<select
						id="brokerage-firm"
						class="select-bordered select min-h-11 w-full"
						aria-describedby="brokerage-firm-help"
						bind:value={brokerageFirmId}
					>
						{#each brokerageFirmIds as firmId (firmId)}
							<option value={firmId}>{BROKERAGE_FIRMS[firmId].name}</option>
						{/each}
					</select>
					<p id="brokerage-firm-help" class="text-xs leading-5 text-base-content/65">
						Fee {calculatorMode === 'buy' ? 'beli' : 'jual'}
						<span class="numeric text-base-content"
							>{formatFeeRate(
								calculatorMode === 'buy' ? brokerageFirm.buyFeeRate : brokerageFirm.sellFeeRate
							)}</span
						>.
						{#if brokerageFirmId === 'ajaib'}
							Tambahan fee Market Order 0,1% dan forced sell 0,25% tidak dihitung.
						{/if}
					</p>
					<a
						class="inline-flex min-h-11 w-fit items-center text-xs text-base-content underline underline-offset-4 hover:text-primary"
						href={resolve('/biaya')}>Lihat tarif dan pembulatan fee</a
					>
				</div>
			</div>
		</fieldset>
	</form>

	<section
		id="hasil"
		aria-labelledby="result-heading"
		class="min-w-0 scroll-mt-4 border-b border-base-300 bg-base-200/40 lg:border-b-0"
	>
		<div class="flex h-12 items-center border-b border-base-300 px-4 sm:px-6 xl:px-8">
			<h2 id="result-heading" class="font-medium text-base-content">Hasil</h2>
		</div>

		<div class="p-4 sm:p-6 xl:p-8">
			<p class="sr-only" aria-live="polite">{resultSummary}</p>
			{#if calculatorMode === 'buy'}
				{#if result}
					{@render answer(result.finalAveragePrice)}
					<p class="mt-3 text-sm leading-6 text-base-content/65">
						{#if currentLots > 0}
							Rata-rata baru per lembar,
							<span class="numeric text-base-content"
								>{formatRupiah(Math.abs(result.finalAveragePrice - currentAveragePrice))}</span
							>
							{result.finalAveragePrice <= currentAveragePrice ? 'lebih rendah' : 'lebih tinggi'}
							dari <span class="numeric">{formatRupiah(currentAveragePrice)}</span>.
						{:else}
							Rata-rata posisi baru per lembar.
						{/if}
					</p>
					{#if purchaseInputMode === 'budget'}
						<p class="mt-3 text-sm leading-6 text-base-content/70">
							Dana {formatRupiah(purchaseBudget)} cukup untuk
							<strong class="numeric font-medium text-base-content"
								>{formatNumber(result.additionalShares / LOT_SIZE)} lot tambahan</strong
							>
							termasuk fee beli.{#if result.additionalShares === 0}
								Dana belum cukup untuk membeli 1 lot.{/if}
						</p>
					{/if}

					{#if currentLots > 0 && result.additionalShares > 0 && purchasePrice !== currentAveragePrice}
						{@render priceRuler(purchasePrice, currentAveragePrice, result.finalAveragePrice)}
					{/if}

					<h3 class="mt-10 text-sm font-medium text-base-content">Rincian dana beli</h3>
					<dl class="mt-2 border-t border-base-300 text-sm">
						{@render ledgerRow('Nilai pembelian', formatRupiah(result.purchaseValue))}
						{@render ledgerRow(
							`Fee beli ${brokerageFirm.name} ${formatFeeRate(brokerageFirm.buyFeeRate)}`,
							formatRupiah(result.buyFee)
						)}
						{@render totalRow('Dana yang dibutuhkan', formatRupiah(result.cashRequired))}
						{#if purchaseInputMode === 'budget'}
							<div class="flex items-baseline justify-between gap-4 pt-2">
								<dt class="text-base-content/65">Sisa dana</dt>
								<dd class="numeric text-right text-base-content">
									{formatRupiah(purchaseBudget - result.cashRequired)}
								</dd>
							</div>
						{/if}
					</dl>

					<h3 class="mt-8 text-sm font-medium text-base-content">Posisi setelah beli</h3>
					<dl class="mt-2 border-t border-base-300 text-sm">
						{@render ledgerRow('Total lot', `${formatNumber(result.finalLots)} lot`)}
						{@render ledgerRow('Total lembar', formatNumber(result.finalShares))}
						{@render ledgerRow('Nilai investasi', formatRupiah(result.finalInvestmentValue))}
						{@render ledgerRow(
							'Estimasi P/L berjalan',
							formatProfitLoss(result.unrealizedProfitLoss, result.unrealizedProfitLossPercentage),
							result.unrealizedProfitLoss < 0 ? 'text-error' : 'text-success'
						)}
					</dl>

					<p class="mt-8 max-w-prose text-xs leading-5 text-base-content/65">
						Nilai investasi dan P/L memakai harga transaksi tanpa fee. Fee order baru ditampilkan
						terpisah karena fee historis tidak tersedia dari input.
						{brokerageFirm.roundsFeesDown
							? `Fee ${brokerageFirm.name} dibulatkan ke bawah ke rupiah penuh.`
							: `Fee pecahan ${brokerageFirm.name} dipertahankan.`}
						Nilai lain ditampilkan hingga 4 desimal.
					</p>
				{:else}
					<p class="text-base font-medium text-error" role="alert">
						Periksa pesan di bawah kolom input. Gunakan nilai valid dalam batas perhitungan aman.
					</p>
				{/if}
			{:else if saleResult}
				{#if saleInputMode === 'target' && saleResult.netProceeds < targetProceeds}
					<p class="mb-3 text-sm font-medium text-warning">Target minimum belum tercapai</p>
				{/if}
				{@render answer(saleResult.netProceeds)}
				<p class="mt-3 text-sm leading-6 text-base-content/65">
					Dana bersih setelah fee jual
					<span class="numeric text-base-content">{formatRupiah(saleResult.sellFee)}</span>.
				</p>
				{#if saleInputMode === 'target'}
					<p class="mt-3 text-sm leading-6 text-base-content/70">
						{#if saleResult.netProceeds < targetProceeds}
							Menjual seluruh {formatNumber(currentLots)} lot menghasilkan dana bersih maksimum
							{formatRupiah(saleResult.netProceeds)}, masih kurang {formatRupiah(
								targetProceeds - saleResult.netProceeds
							)}.
						{:else}
							Jual <strong class="numeric font-medium text-base-content"
								>{formatNumber(saleResult.soldShares / LOT_SIZE)} lot</strong
							>
							untuk mencapai target minimum dana bersih {formatRupiah(targetProceeds)}.
							{#if saleResult.netProceeds > targetProceeds}
								Selisih lebih {formatRupiah(saleResult.netProceeds - targetProceeds)} karena penjualan
								harus dalam lot utuh.{:else}
								Hasilnya tepat sesuai target.{/if}
						{/if}
					</p>
				{/if}

				<h3 class="mt-10 text-sm font-medium text-base-content">Rincian hasil jual</h3>
				<dl class="mt-2 border-t border-base-300 text-sm">
					{@render ledgerRow('Nilai penjualan', formatRupiah(saleResult.saleValue))}
					{@render ledgerRow(
						`Fee jual ${brokerageFirm.name} ${formatFeeRate(brokerageFirm.sellFeeRate)}`,
						`−${formatRupiah(saleResult.sellFee)}`
					)}
					{@render totalRow('Dana bersih diterima', formatRupiah(saleResult.netProceeds))}
				</dl>

				<h3 class="mt-8 text-sm font-medium text-base-content">Posisi setelah jual</h3>
				<dl class="mt-2 border-t border-base-300 text-sm">
					{@render ledgerRow('Sisa lot', `${formatNumber(saleResult.remainingLots)} lot`)}
					{@render ledgerRow('Sisa lembar', formatNumber(saleResult.remainingShares))}
					{#if saleResult.remainingLots > 0}
						{@render ledgerRow(
							'Rata-rata tersisa (tetap)',
							formatRupiah(saleResult.remainingAveragePrice)
						)}
					{/if}
					{@render ledgerRow(
						'Nilai investasi tersisa',
						formatRupiah(saleResult.remainingInvestmentValue)
					)}
					{@render ledgerRow(
						'Estimasi P/L terealisasi',
						formatProfitLoss(
							saleResult.realizedProfitLoss,
							saleResult.realizedProfitLossPercentage
						),
						saleResult.realizedProfitLoss < 0 ? 'text-error' : 'text-success'
					)}
				</dl>

				<p class="mt-8 max-w-prose text-xs leading-5 text-base-content/65">
					{saleResult.remainingLots === 0 ? 'Seluruh posisi akan terjual. ' : ''}Estimasi P/L
					terealisasi sudah mengurangi fee jual, tetapi tidak menyertakan fee beli historis,
					materai, atau biaya lain di luar tarif tersebut.
				</p>
			{:else}
				<p class="text-base font-medium text-error" role="alert">
					Periksa pesan di bawah kolom input. Gunakan nilai valid dalam batas perhitungan aman.
				</p>
			{/if}
		</div>
	</section>
</div>

{#if calculatorMode === 'buy'}
	<details class="group border-t border-base-300">
		<summary
			class="flex min-h-16 cursor-pointer list-none items-center justify-between gap-6 px-4 py-4 transition-colors hover:bg-base-200/60 sm:px-6 xl:px-8"
		>
			<span>
				<span class="block font-medium text-base-content">Kejar rata-rata target</span>
				<span class="mt-0.5 block text-sm text-base-content/65">
					Cari jumlah lot minimum yang perlu dibeli.
				</span>
			</span>
			<svg
				class="details-toggle size-4 shrink-0 text-base-content/60"
				viewBox="0 0 16 16"
				fill="none"
				stroke="currentColor"
				stroke-width="1.5"
				aria-hidden="true"
			>
				<path d="M8 2v12M2 8h12" />
			</svg>
		</summary>

		<div class="grid border-t border-base-300 lg:grid-cols-[1fr_2.3fr]">
			<div class="border-b border-base-300 p-4 sm:p-6 lg:border-r lg:border-b-0 xl:p-8">
				<div class="grid gap-2">
					<label class="text-sm font-medium text-base-content" for="target-average"
						>Rata-rata target</label
					>
					<span class="input-bordered input flex w-full items-center gap-2">
						<span class="text-base-content/65" aria-hidden="true">Rp</span>
						<input
							id="target-average"
							class="numeric min-w-0 grow border-0 bg-transparent outline-none"
							type="text"
							autocomplete="off"
							inputmode="decimal"
							aria-invalid={!!errors['target-average']}
							aria-describedby="target-average-help target-average-validation"
							bind:value={amounts['target-average']}
							onblur={() => tidy('target-average')}
						/>
					</span>
					{@render fieldError('target-average')}
					<span id="target-average-help" class="text-xs leading-5 text-base-content/65">
						Harus berada di antara harga beli rencana dan rata-rata saat ini.
					</span>
				</div>
			</div>

			<div class="bg-base-200/40 p-4 sm:p-6 xl:p-8" aria-live="polite">
				{#if targetResult.status === 'achievable'}
					<p class="numeric text-3xl font-medium tracking-[-0.03em] text-base-content">
						{formatNumber(targetResult.additionalLots)} lot
					</p>
					<p class="mt-2 max-w-prose text-sm leading-6 text-base-content/65">
						Lot minimum. Siapkan <strong class="numeric font-medium text-base-content"
							>{formatRupiah(targetResult.cashRequired)}</strong
						>
						termasuk estimasi fee beli
						<strong class="numeric font-medium text-base-content"
							>{formatRupiah(targetResult.buyFee)}</strong
						>. Rata-rata hasil pembulatan lot menjadi
						<strong class="numeric font-medium text-base-content"
							>{formatRupiah(targetResult.resultingAveragePrice)}</strong
						>.
					</p>
				{:else if targetResult.status === 'already-reached'}
					<p class="font-medium text-base-content">Target sudah tercapai.</p>
					<p class="mt-2 text-sm leading-6 text-base-content/65">
						Rata-rata saat ini sudah sama dengan atau lebih rendah dari targetmu.
					</p>
				{:else if targetResult.reason === 'target-at-or-below-purchase-price'}
					<p class="font-medium text-warning">Target belum dapat dicapai.</p>
					<p class="mt-2 text-sm leading-6 text-base-content/65">
						Rata-rata target harus lebih tinggi dari harga beli rencana
						<span class="numeric">{formatRupiah(purchasePrice)}</span>.
					</p>
				{:else if currentLots === 0}
					<p class="text-sm leading-6 text-base-content/65">
						Isi jumlah lot dan harga rata-rata saat ini untuk menghitung target.
					</p>
				{:else}
					<p class="font-medium text-error">
						Periksa posisi, harga beli, dan rata-rata target. Gunakan nilai valid dalam batas
						perhitungan aman.
					</p>
				{/if}
			</div>
		</div>
	</details>
{/if}

<nav
	aria-label="Bacaan terkait"
	class="grid border-t border-base-300 sm:grid-cols-2 [&>a+a]:border-t [&>a+a]:border-base-300 sm:[&>a+a]:border-t-0 sm:[&>a+a]:border-l"
>
	<a
		class="group/link block px-4 py-6 no-underline transition-colors hover:bg-base-200/60 sm:px-6 xl:px-8"
		href={resolve('/panduan')}
	>
		<span class="block font-medium text-base-content group-hover/link:underline"
			>Cara menghitung harga rata-rata saham</span
		>
		<span class="mt-1 block text-sm text-base-content/65"
			>Rumus rata-rata tertimbang dan contoh hitungan average down.</span
		>
	</a>
	<a
		class="group/link block px-4 py-6 no-underline transition-colors hover:bg-base-200/60 sm:px-6 xl:px-8"
		href={resolve('/biaya')}
	>
		<span class="block font-medium text-base-content group-hover/link:underline"
			>Fee beli dan jual Stockbit dan Ajaib</span
		>
		<span class="mt-1 block text-sm text-base-content/65"
			>Tarif yang dipakai Rata, pembulatan, dan biaya yang tidak dihitung.</span
		>
	</a>
</nav>
