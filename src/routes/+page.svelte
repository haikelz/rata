<script lang="ts">
	import { assets, resolve } from '$app/paths';
	import { page } from '$app/state';
	import CalculatorTabs, { type CalculatorMode } from '$lib/CalculatorTabs.svelte';
	import {
		BROKERAGE_FIRMS,
		type BrokerageFirmId,
		calculateAffordableLots,
		calculateStockPurchase,
		calculateStockSale,
		calculateTargetAverage,
		calculateTargetSaleLots
	} from '$lib/rata';

	const seoTitle = 'Kalkulator Harga Rata-rata, Beli & Jual Saham | Rata';
	const seoDescription =
		'Hitung harga rata-rata, hasil penjualan, total lot, estimasi untung rugi, serta fee beli dan jual Stockbit atau Ajaib langsung di browser secara gratis.';
	const brokerageFirmIds: ReadonlyArray<BrokerageFirmId> = ['stockbit', 'ajaib'];
	let canonicalUrl = $derived(new URL(resolve('/'), page.url).href);
	let socialImageUrl = $derived(new URL(`${assets}/og-rata.webp`, page.url).href);
	let structuredData = $derived({
		'@context': 'https://schema.org',
		'@type': 'WebApplication',
		name: 'Rata',
		alternateName: 'Kalkulator Rata-rata Saham',
		url: canonicalUrl,
		image: socialImageUrl,
		description: seoDescription,
		applicationCategory: 'FinanceApplication',
		operatingSystem: 'Any',
		browserRequirements: 'Requires JavaScript',
		inLanguage: 'id-ID',
		isAccessibleForFree: true,
		offers: {
			'@type': 'Offer',
			price: '0',
			priceCurrency: 'IDR'
		},
		featureList: [
			'Kalkulator harga rata-rata saham',
			'Estimasi fee beli dan jual Stockbit',
			'Estimasi fee beli dan jual Ajaib',
			'Kalkulator target harga rata-rata',
			'Estimasi untung rugi berjalan'
		]
	});
	let structuredDataJson = $derived(JSON.stringify(structuredData).replaceAll('<', '\\u003c'));

	const rupiahFormatter = new Intl.NumberFormat('id-ID', {
		style: 'currency',
		currency: 'IDR',
		minimumFractionDigits: 0,
		maximumFractionDigits: 4
	});
	const priceFormatter = new Intl.NumberFormat('id-ID', {
		minimumFractionDigits: 0,
		maximumFractionDigits: 4
	});
	const percentageFormatter = new Intl.NumberFormat('id-ID', {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
		signDisplay: 'exceptZero'
	});
	const feeRateFormatter = new Intl.NumberFormat('id-ID', {
		minimumFractionDigits: 2,
		maximumFractionDigits: 4
	});

	let calculatorMode = $state<CalculatorMode>('buy');
	let brokerageFirmId = $state<BrokerageFirmId>('stockbit');
	let brokerageFirm = $derived(BROKERAGE_FIRMS[brokerageFirmId]);
	let currentLots = $state(297);
	let currentAveragePrice = $state(397);
	let currentMarketPrice = $state(342);
	let additionalLots = $state(39);
	let purchaseInputMode = $state<'lots' | 'budget'>('lots');
	let purchaseBudget = $state(2_000_000);
	let purchasePrice = $state(342);
	let saleLots = $state(39);
	let saleInputMode = $state<'lots' | 'target'>('lots');
	let targetProceeds = $state(2_000_000);
	let salePrice = $state(342);
	let targetAveragePrice = $state(380);
	let affordableLots = $derived(
		calculateAffordableLots(purchaseBudget, purchasePrice, brokerageFirm.buyFeeRate)
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
					buyFeeRate: brokerageFirm.buyFeeRate
				})
	);
	let targetSaleLots = $derived(
		calculateTargetSaleLots({
			currentLots,
			targetProceeds,
			salePrice,
			sellFeeRate: brokerageFirm.sellFeeRate
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
					sellFeeRate: brokerageFirm.sellFeeRate
				})
	);
	let targetResult = $derived(
		calculateTargetAverage({
			currentLots,
			currentAveragePrice,
			purchasePrice,
			buyFeeRate: brokerageFirm.buyFeeRate,
			targetAveragePrice
		})
	);

	function inputError(value: number, minimum = 0, lots = false): string {
		if (value === undefined || !Number.isFinite(value))
			return 'Masukkan angka yang valid; kolom ini wajib diisi.';
		if (value < minimum || (minimum > 0 && value === 0))
			return minimum > 0 ? 'Masukkan harga lebih dari nol.' : 'Nilai tidak boleh negatif.';
		if (lots && !Number.isInteger(value)) return 'Lot harus berupa bilangan bulat.';
		if (value > Number.MAX_SAFE_INTEGER || (lots && !Number.isSafeInteger(value * 100)))
			return 'Nilai terlalu besar untuk dihitung dengan aman. Kurangi nilainya.';
		return '';
	}
	const unsafeMessage =
		'Hasil perhitungan terlalu besar untuk dihitung dengan aman. Kurangi lot atau harga.';
	let errors = $derived({
		'current-lots':
			inputError(currentLots) ||
			inputError(currentLots, 0, true) ||
			(calculatorMode === 'sell' && currentLots === 0
				? 'Masukkan jumlah lot saat ini lebih dari nol.'
				: ''),
		'current-average':
			inputError(currentAveragePrice, currentLots > 0 ? Number.MIN_VALUE : 0) ||
			(currentLots * 100 * currentAveragePrice > Number.MAX_SAFE_INTEGER ? unsafeMessage : ''),
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
			((saleInputMode === 'target' ? currentLots : saleLots) * 100 * salePrice >
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

	function formatRupiah(value: number): string {
		return rupiahFormatter.format(value);
	}

	function formatPrice(value: number): string {
		return formatRupiah(value);
	}

	function formatFeeRate(rate: number): string {
		return `${feeRateFormatter.format(rate * 100)}%`;
	}

	function resetExample(): void {
		currentLots = 297;
		currentAveragePrice = 397;
		currentMarketPrice = 342;
		additionalLots = 39;
		purchaseInputMode = 'lots';
		purchaseBudget = 2_000_000;
		purchasePrice = 342;
		saleLots = 39;
		saleInputMode = 'lots';
		targetProceeds = 2_000_000;
		salePrice = 342;
		targetAveragePrice = 380;
	}
</script>

<svelte:head>
	<title>{seoTitle}</title>
	<meta name="description" content={seoDescription} />
	<meta name="robots" content="index, follow, max-image-preview:large" />
	<meta name="theme-color" media="(prefers-color-scheme: light)" content="#f5f5f5" />
	<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#101010" />
	<link rel="canonical" href={canonicalUrl} />

	<meta property="og:type" content="website" />
	<meta property="og:locale" content="id_ID" />
	<meta property="og:site_name" content="Rata" />
	<meta property="og:title" content={seoTitle} />
	<meta property="og:description" content={seoDescription} />
	<meta property="og:url" content={canonicalUrl} />
	<meta property="og:image" content={socialImageUrl} />
	<meta property="og:image:type" content="image/webp" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:alt" content="Rata, kalkulator harga rata-rata saham dan fee beli" />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={seoTitle} />
	<meta name="twitter:description" content={seoDescription} />
	<meta name="twitter:image" content={socialImageUrl} />
	<meta name="twitter:image:alt" content="Rata, kalkulator harga rata-rata saham dan fee beli" />

	<svelte:element this={"script"} type="application/ld+json">{structuredDataJson}</svelte:element>
</svelte:head>

{#snippet fieldError(id: keyof typeof errors)}
	<span id={`${id}-validation`} class="text-xs text-error" aria-live="polite">{errors[id]}</span>
{/snippet}

<a class="skip-link" href="#main-content">Lewati ke kalkulator</a>

<header class="sticky top-0 z-10 border-b border-base-300 bg-base-100/95 backdrop-blur">
	<div
		class="mx-auto flex h-16 max-w-6xl items-center justify-between border-x border-base-300 px-4 sm:px-6"
	>
		<a
			class="flex min-h-11 items-center gap-3 no-underline"
			href={resolve('/')}
			aria-label="Rata, beranda"
		>
			<span class="brand-mark" aria-hidden="true"><span></span><span></span><span></span></span>
			<span class="text-lg font-medium tracking-tight text-base-content">Rata</span>
		</a>
	</div>
</header>

<main id="main-content" class="mx-auto max-w-6xl border-x border-base-300">
	<section class="border-b border-base-300 px-4 py-12 sm:px-8 sm:py-16 lg:px-12">
		<div class="max-w-2xl">
			<h1
				class="text-4xl leading-[1.05] font-medium tracking-[-0.045em] text-base-content sm:text-5xl"
			>
				Kalkulator rata-rata saham
			</h1>
			<p class="mt-5 max-w-xl text-lg leading-7 text-base-content/65">
				Simulasikan lot, harga rata-rata, kebutuhan dana, atau hasil penjualan sebelum mengirim
				order ke broker.
			</p>
		</div>
	</section>

	<CalculatorTabs bind:value={calculatorMode} />

	<div
		id="calculator-panel"
		role="tabpanel"
		aria-labelledby={`calculator-tab-${calculatorMode}`}
		class="grid lg:grid-cols-[5fr_7fr]"
	>
		<form
			class="border-b border-base-300 p-4 sm:p-8 lg:border-r lg:p-10"
			onsubmit={(event) => event.preventDefault()}
		>
			<div class="mb-8 flex items-start justify-between gap-4">
				<div>
					<h2 id="calculator-heading" class="text-2xl font-medium tracking-tight text-base-content">
						Rencana {calculatorMode === 'buy' ? 'pembelian' : 'penjualan'}
					</h2>
					<p class="mt-2 text-sm leading-6 text-base-content/60">
						Gunakan angka dari portofolio saat ini.
					</p>
				</div>
				<button class="btn min-h-11 shrink-0 btn-ghost btn-sm" type="button" onclick={resetExample}>
					Reset contoh
				</button>
			</div>

			<fieldset class="grid gap-5">
				<legend class="mb-5 text-sm font-medium text-base-content/65">Posisi saat ini</legend>

				<div class="grid gap-2">
					<label class="form-control grid gap-2" for="current-lots">
						<span class="label-text font-medium text-base-content">Jumlah lot</span>
						<input
							id="current-lots"
							aria-invalid={!!errors['current-lots']}
							class="input-bordered numeric input w-full"
							type="number"
							min="0"
							step="1"
							inputmode="numeric"
							aria-describedby="current-lots-help current-lots-validation"
							bind:value={currentLots}
						/>
					</label>
					{@render fieldError('current-lots')}
					<span id="current-lots-help" class="text-xs text-base-content/65"
						>1 lot = 100 lembar saham</span
					>
				</div>

				<div class={`grid gap-5 ${calculatorMode === 'buy' ? 'sm:grid-cols-2' : ''}`}>
					<div class="grid gap-2">
						<label class="form-control grid gap-2" for="current-average">
							<span class="label-text font-medium text-base-content">Harga rata-rata</span>
							<span class="input-bordered input flex items-center gap-2">
								<span class="text-base-content/65" aria-hidden="true">Rp</span>
								<input
									id="current-average"
									aria-invalid={!!errors['current-average']}
									aria-describedby="current-average-validation"
									class="numeric min-w-0 grow border-0 bg-transparent outline-none"
									type="number"
									min="0"
									step="0.01"
									inputmode="decimal"
									bind:value={currentAveragePrice}
								/>
							</span>
						</label>
						{@render fieldError('current-average')}
					</div>

					{#if calculatorMode === 'buy'}
						<div class="grid gap-2">
							<label class="form-control grid gap-2" for="market-price">
								<span class="label-text font-medium text-base-content">Harga pasar</span>
								<span class="input-bordered input flex items-center gap-2">
									<span class="text-base-content/65" aria-hidden="true">Rp</span>
									<input
										id="market-price"
										aria-invalid={!!errors['market-price']}
										aria-describedby="market-price-validation"
										class="numeric min-w-0 grow border-0 bg-transparent outline-none"
										type="number"
										min="1"
										step="1"
										inputmode="numeric"
										bind:value={currentMarketPrice}
									/>
								</span>
							</label>
							{@render fieldError('market-price')}
						</div>
					{/if}
				</div>
			</fieldset>

			<div class="my-8 border-t border-base-300"></div>

			<fieldset class="grid gap-5">
				<legend class="mb-5 text-sm font-medium text-base-content/65"
					>Order yang direncanakan</legend
				>

				<div class="grid gap-5 sm:grid-cols-2">
					{#if calculatorMode === 'buy'}
						<div class="sm:col-span-2">
							<label class="form-control grid gap-2" for="purchase-input-mode">
								<span class="label-text font-medium text-base-content"
									>Hitung pembelian berdasarkan</span
								>
								<select
									id="purchase-input-mode"
									class="select-bordered select min-h-11 w-full"
									bind:value={purchaseInputMode}
								>
									<option value="lots">Jumlah lot</option>
									<option value="budget">Dana tersedia</option>
								</select>
							</label>
						</div>
						{#if purchaseInputMode === 'lots'}
							<div class="grid gap-2">
								<label class="form-control grid gap-2" for="additional-lots">
									<span class="label-text font-medium text-base-content">Lot tambahan</span>
									<input
										id="additional-lots"
										aria-invalid={!!errors['additional-lots']}
										aria-describedby="additional-lots-validation"
										class="input-bordered numeric input w-full"
										type="number"
										min="0"
										step="1"
										inputmode="numeric"
										bind:value={additionalLots}
									/>
								</label>
								{@render fieldError('additional-lots')}
							</div>
						{:else}
							<div class="grid gap-2">
								<label class="form-control grid gap-2" for="purchase-budget">
									<span class="label-text font-medium text-base-content">Dana tersedia</span>
									<span class="input-bordered input flex items-center gap-2">
										<span class="text-base-content/65" aria-hidden="true">Rp</span>
										<input
											id="purchase-budget"
											class="numeric min-w-0 grow border-0 bg-transparent outline-none"
											type="number"
											min="0"
											step="1"
											inputmode="numeric"
											aria-invalid={!!errors['purchase-budget']}
											aria-describedby="purchase-budget-help purchase-budget-validation"
											bind:value={purchaseBudget}
										/>
									</span>
								</label>
								{@render fieldError('purchase-budget')}
								<span id="purchase-budget-help" class="text-xs text-base-content/65"
									>Maksimum lot utuh, termasuk fee beli.</span
								>
							</div>
						{/if}

						<div class="grid gap-2">
							<label class="form-control grid gap-2" for="purchase-price">
								<span class="label-text font-medium text-base-content">Harga beli</span>
								<span class="input-bordered input flex items-center gap-2">
									<span class="text-base-content/65" aria-hidden="true">Rp</span>
									<input
										id="purchase-price"
										aria-invalid={!!errors['purchase-price']}
										aria-describedby="purchase-price-validation"
										class="numeric min-w-0 grow border-0 bg-transparent outline-none"
										type="number"
										min="1"
										step="1"
										inputmode="numeric"
										bind:value={purchasePrice}
									/>
								</span>
							</label>
							{@render fieldError('purchase-price')}
						</div>
					{:else}
						<div class="sm:col-span-2">
							<label class="form-control grid gap-2" for="sale-input-mode">
								<span class="label-text font-medium text-base-content"
									>Hitung penjualan berdasarkan</span
								>
								<select
									id="sale-input-mode"
									class="select-bordered select min-h-11 w-full"
									bind:value={saleInputMode}
								>
									<option value="lots">Jumlah lot</option>
									<option value="target">Target minimum dana bersih</option>
								</select>
							</label>
						</div>
						{#if saleInputMode === 'lots'}
							<div class="grid gap-2">
								<label class="form-control grid gap-2" for="sale-lots">
									<span class="label-text font-medium text-base-content">Lot dijual</span>
									<input
										id="sale-lots"
										class="input-bordered numeric input w-full"
										type="number"
										min="0"
										max={currentLots}
										step="1"
										inputmode="numeric"
										aria-invalid={!!errors['sale-lots']}
										aria-describedby="sale-lots-help sale-lots-validation"
										bind:value={saleLots}
									/>
								</label>
								{@render fieldError('sale-lots')}
								<span id="sale-lots-help" class="text-xs text-base-content/65">
									Lot utuh, tidak melebihi posisi saat ini. Nol berarti tidak menjual.
								</span>
							</div>
						{:else}
							<div class="grid gap-2">
								<label class="form-control grid gap-2" for="target-proceeds">
									<span class="label-text font-medium text-base-content"
										>Target minimum dana bersih</span
									>
									<span class="input-bordered input flex items-center gap-2">
										<span class="text-base-content/65" aria-hidden="true">Rp</span>
										<input
											id="target-proceeds"
											class="numeric min-w-0 grow border-0 bg-transparent outline-none"
											type="number"
											min="0"
											step="1"
											inputmode="numeric"
											aria-invalid={!!errors['target-proceeds']}
											aria-describedby="target-proceeds-help target-proceeds-validation"
											bind:value={targetProceeds}
										/>
									</span>
								</label>
								{@render fieldError('target-proceeds')}
								<span id="target-proceeds-help" class="text-xs text-base-content/65"
									>Minimum dana setelah fee jual. Lot utuh dapat menghasilkan dana lebih dari
									target.</span
								>
							</div>
						{/if}

						<div class="grid content-start gap-2">
							<label class="form-control grid gap-2" for="sale-price">
								<span class="label-text font-medium text-base-content">Harga jual</span>
								<span class="input-bordered input flex items-center gap-2">
									<span class="text-base-content/65" aria-hidden="true">Rp</span>
									<input
										id="sale-price"
										class="numeric min-w-0 grow border-0 bg-transparent outline-none"
										type="number"
										min="1"
										step="1"
										inputmode="numeric"
										aria-invalid={!!errors['sale-price']}
										aria-describedby="sale-price-validation"
										bind:value={salePrice}
									/>
								</span>
							</label>
							{@render fieldError('sale-price')}
						</div>
					{/if}
				</div>

				<label class="form-control grid gap-2" for="brokerage-firm">
					<span class="label-text font-medium text-base-content">Perusahaan sekuritas</span>
					<select
						id="brokerage-firm"
						class="select-bordered select min-h-11 w-full"
						bind:value={brokerageFirmId}
					>
						{#each brokerageFirmIds as firmId (firmId)}
							<option value={firmId}>{BROKERAGE_FIRMS[firmId].name}</option>
						{/each}
					</select>
				</label>

				<div class="flex items-center justify-between border border-base-300 bg-base-200 px-4 py-3">
					<div>
						<p class="text-sm font-medium text-base-content">{brokerageFirm.name}</p>
						<p class="mt-0.5 text-xs text-base-content/65">
							Fee {calculatorMode === 'buy' ? 'beli' : 'jual'}
						</p>
					</div>
					<p class="numeric font-medium text-base-content">
						{formatFeeRate(
							calculatorMode === 'buy' ? brokerageFirm.buyFeeRate : brokerageFirm.sellFeeRate
						)}
					</p>
				</div>
				{#if brokerageFirmId === 'ajaib'}
					<p class="text-xs leading-5 text-base-content/65">
						Tarif reguler. Tambahan fee Market Order 0,1% dan forced sell 0,25% tidak dihitung.
					</p>
				{/if}
			</fieldset>
		</form>

		<div class="border-b border-base-300 bg-base-200/35 p-4 sm:p-8 lg:p-10">
			<div class="lg:sticky lg:top-26">
				<p class="mb-4 text-xs leading-5 text-base-content/65">
					Fee Stockbit dibulatkan ke bawah ke rupiah penuh. Fee pecahan Ajaib dipertahankan. Nilai
					lain ditampilkan hingga 4 desimal.
				</p>
				{#if calculatorMode === 'buy'}
					<div class="mb-8">
						<p class="text-sm font-medium text-base-content/65">Estimasi setelah beli</p>
						{#if result}
							<p
								class="numeric mt-3 text-4xl font-medium tracking-[-0.04em] text-base-content sm:text-5xl"
							>
								{formatPrice(result.finalAveragePrice)}
							</p>
							{#if currentLots > 0}
								<p class="mt-2 text-sm text-base-content/60">
									Rata-rata baru per lembar,
									<span class="numeric">
										{formatPrice(Math.abs(result.finalAveragePrice - currentAveragePrice))}
									</span>
									{result.finalAveragePrice <= currentAveragePrice
										? ' lebih rendah'
										: ' lebih tinggi'}.
								</p>
							{:else}
								<p class="mt-2 text-sm text-base-content/60">Rata-rata posisi baru per lembar.</p>
							{/if}
						{:else}
							<p class="mt-3 text-base font-medium text-error" role="alert">
								Periksa pesan di bawah kolom input. Gunakan nilai valid dalam batas perhitungan
								aman.
							</p>
						{/if}
					</div>

					{#if result}
						{#if purchaseInputMode === 'budget'}
							<p class="mb-5 text-sm text-base-content/70">
								Dana {formatRupiah(purchaseBudget)} cukup untuk
								<strong class="numeric font-medium text-base-content"
									>{result.additionalShares / 100} lot tambahan</strong
								>
								termasuk fee beli.{#if result.additionalShares === 0}
									Dana belum cukup untuk membeli 1 lot.{/if}
							</p>
						{/if}
						<div
							class="grid border border-base-300 sm:grid-cols-2"
							aria-live="polite"
							aria-atomic="true"
						>
							<div class="border-b border-base-300 p-5 sm:border-r">
								<p class="text-sm text-base-content/65">Total lot</p>
								<p class="numeric mt-2 text-2xl font-medium text-base-content">
									{result.finalLots} lot
								</p>
							</div>
							<div class="border-b border-base-300 p-5">
								<p class="text-sm text-base-content/65">Total lembar</p>
								<p class="numeric mt-2 text-2xl font-medium text-base-content">
									{priceFormatter.format(result.finalShares)}
								</p>
							</div>
							<div class="border-b border-base-300 p-5 sm:border-r sm:border-b-0">
								<p class="text-sm text-base-content/65">Nilai investasi</p>
								<p class="numeric mt-2 text-lg font-medium text-base-content">
									{formatRupiah(result.finalInvestmentValue)}
								</p>
							</div>
							<div class="p-5">
								<p class="text-sm text-base-content/65">Estimasi P/L berjalan</p>
								<p
									class:text-success={result.unrealizedProfitLoss >= 0}
									class:text-error={result.unrealizedProfitLoss < 0}
									class="numeric mt-2 text-lg font-medium"
								>
									{formatRupiah(result.unrealizedProfitLoss)}
									<span class="text-sm">
										({percentageFormatter.format(result.unrealizedProfitLossPercentage)}%)
									</span>
								</p>
							</div>
						</div>

						<div class="mt-8">
							<h3 class="text-lg font-medium text-base-content">Rincian dana beli</h3>
							<dl class="mt-4 grid gap-3 text-sm">
								<div class="flex items-center justify-between gap-4">
									<dt class="text-base-content/60">Nilai pembelian</dt>
									<dd class="numeric text-base-content">{formatRupiah(result.purchaseValue)}</dd>
								</div>
								<div class="flex items-center justify-between gap-4">
									<dt class="text-base-content/60">
										Fee beli {brokerageFirm.name}
										{formatFeeRate(brokerageFirm.buyFeeRate)}
									</dt>
									<dd class="numeric text-base-content">{formatRupiah(result.buyFee)}</dd>
								</div>
								<div
									class="mt-1 flex items-center justify-between gap-4 border-t border-base-300 pt-4"
								>
									<dt class="font-medium text-base-content">Dana yang dibutuhkan</dt>
									<dd class="numeric text-lg font-medium text-primary">
										{formatRupiah(result.cashRequired)}
									</dd>
								</div>
								{#if purchaseInputMode === 'budget'}
									<div class="flex items-center justify-between gap-4">
										<dt class="text-base-content/60">Sisa dana</dt>
										<dd class="numeric text-base-content">
											{formatRupiah(purchaseBudget - result.cashRequired)}
										</dd>
									</div>
								{/if}
							</dl>
						</div>

						<p class="mt-7 text-xs leading-5 text-base-content/65">
							Nilai investasi dan P/L menggunakan harga transaksi tanpa fee. Fee order baru
							ditampilkan terpisah karena fee historis tidak tersedia dari input.
						</p>
					{/if}
				{:else}
					<div class="mb-8">
						<p class="text-sm font-medium text-base-content/65">
							{saleInputMode === 'target' && saleResult && saleResult.netProceeds < targetProceeds
								? 'Estimasi dana bersih maksimum — target belum tercapai'
								: 'Estimasi setelah jual'}
						</p>
						{#if saleResult}
							<p
								class="numeric mt-3 text-2xl font-medium tracking-[-0.04em] break-all text-base-content sm:text-4xl"
							>
								{formatRupiah(saleResult.netProceeds)}
							</p>
							<p class="mt-2 text-sm text-base-content/60">
								Dana bersih setelah fee jual
								<span class="numeric">{formatRupiah(saleResult.sellFee)}</span>.
							</p>
							{#if saleResult.remainingLots === 0}
								<p class="mt-1 text-sm text-base-content/60">Seluruh posisi akan terjual.</p>
							{:else}
								<p class="mt-1 text-sm text-base-content/60">
									Harga rata-rata posisi tersisa tetap
									<span class="numeric">{formatPrice(saleResult.remainingAveragePrice)}</span>.
								</p>
							{/if}
						{:else}
							<p class="mt-3 text-base font-medium text-error" role="alert">
								Periksa pesan di bawah kolom input. Gunakan nilai valid dalam batas perhitungan
								aman.
							</p>
						{/if}
					</div>

					{#if saleResult}
						{#if saleInputMode === 'target'}
							<p class="mb-5 text-sm leading-6 text-base-content/70" role="status">
								{#if saleResult.netProceeds < targetProceeds}
									Target minimum belum tercapai. Menjual seluruh {currentLots} lot menghasilkan dana bersih
									maksimum {formatRupiah(saleResult.netProceeds)}, masih kurang {formatRupiah(
										targetProceeds - saleResult.netProceeds
									)}.
								{:else}
									Jual <strong class="numeric font-medium text-base-content"
										>{plannedSaleLots} lot</strong
									>
									untuk mencapai target minimum dana bersih {formatRupiah(targetProceeds)}.
									{#if saleResult.netProceeds > targetProceeds}
										Selisih lebih {formatRupiah(saleResult.netProceeds - targetProceeds)} karena penjualan
										harus dalam lot utuh.{:else}
										Hasilnya tepat sesuai target.{/if}
								{/if}
							</p>
						{/if}
						<div
							class="grid border border-base-300 sm:grid-cols-2"
							aria-live="polite"
							aria-atomic="true"
						>
							<div class="border-b border-base-300 p-5 sm:border-r">
								<p class="text-sm text-base-content/65">Sisa lot</p>
								<p class="numeric mt-2 text-2xl font-medium text-base-content">
									{saleResult.remainingLots} lot
								</p>
							</div>
							<div class="border-b border-base-300 p-5">
								<p class="text-sm text-base-content/65">Sisa lembar</p>
								<p class="numeric mt-2 text-2xl font-medium text-base-content">
									{priceFormatter.format(saleResult.remainingShares)}
								</p>
							</div>
							<div class="border-b border-base-300 p-5 sm:border-r sm:border-b-0">
								<p class="text-sm text-base-content/65">Nilai investasi tersisa</p>
								<p class="numeric mt-2 text-lg font-medium text-base-content">
									{formatRupiah(saleResult.remainingInvestmentValue)}
								</p>
							</div>
							<div class="p-5">
								<p class="text-sm text-base-content/65">Estimasi P/L terealisasi</p>
								<p
									class:text-success={saleResult.realizedProfitLoss >= 0}
									class:text-error={saleResult.realizedProfitLoss < 0}
									class="numeric mt-2 text-lg font-medium"
								>
									{formatRupiah(saleResult.realizedProfitLoss)}
									<span class="text-sm">
										({percentageFormatter.format(saleResult.realizedProfitLossPercentage)}%)
									</span>
								</p>
							</div>
						</div>

						<div class="mt-8">
							<h3 class="text-lg font-medium text-base-content">Rincian hasil jual</h3>
							<dl class="mt-4 grid gap-3 text-sm">
								<div class="flex items-center justify-between gap-4">
									<dt class="text-base-content/60">Nilai penjualan</dt>
									<dd class="numeric text-base-content">
										{formatRupiah(saleResult.saleValue)}
									</dd>
								</div>
								<div class="flex items-center justify-between gap-4">
									<dt class="text-base-content/60">
										Fee jual {brokerageFirm.name}
										{formatFeeRate(brokerageFirm.sellFeeRate)}
									</dt>
									<dd class="numeric text-base-content">
										−{formatRupiah(saleResult.sellFee)}
									</dd>
								</div>
								<div
									class="mt-1 flex items-center justify-between gap-4 border-t border-base-300 pt-4"
								>
									<dt class="font-medium text-base-content">Dana bersih diterima</dt>
									<dd class="numeric text-lg font-medium text-primary">
										{formatRupiah(saleResult.netProceeds)}
									</dd>
								</div>
							</dl>
						</div>

						<p class="mt-7 text-xs leading-5 text-base-content/65">
							Estimasi P/L terealisasi sudah mengurangi fee jual terpilih, tetapi tidak menyertakan
							fee beli historis, materai, atau biaya lain di luar tarif tersebut.
						</p>
					{/if}
				{/if}
			</div>
		</div>
	</div>

	{#if calculatorMode === 'buy'}
		<section class="border-b border-base-300">
			<details class="group">
				<summary
					class="flex min-h-20 cursor-pointer list-none items-center justify-between gap-6 px-4 py-5 transition-colors hover:bg-base-200/60 sm:px-8 lg:px-12"
				>
					<span>
						<span class="text-xl font-medium tracking-tight text-base-content"
							>Kejar rata-rata target</span
						>
						<span class="mt-1 block text-sm text-base-content/65">
							Cari jumlah lot minimum yang perlu dibeli.
						</span>
					</span>
					<span class="details-toggle numeric text-base-content/60" aria-hidden="true">+</span>
				</summary>

				<div class="grid border-t border-base-300 lg:grid-cols-2">
					<div class="border-base-300 p-4 sm:p-8 lg:border-r lg:p-10">
						<div class="grid max-w-sm gap-2">
							<label class="form-control grid gap-2" for="target-average">
								<span class="label-text font-medium text-base-content">Rata-rata target</span>
								<span class="input-bordered input flex items-center gap-2">
									<span class="text-base-content/65" aria-hidden="true">Rp</span>
									<input
										id="target-average"
										class="numeric min-w-0 grow border-0 bg-transparent outline-none"
										type="number"
										min="0.01"
										step="0.01"
										inputmode="decimal"
										aria-invalid={!!errors['target-average']}
										aria-describedby="target-average-help target-average-validation"
										bind:value={targetAveragePrice}
									/>
								</span>
							</label>
							{@render fieldError('target-average')}
							<span id="target-average-help" class="text-xs leading-5 text-base-content/65">
								Harus berada di antara harga beli rencana dan rata-rata saat ini.
							</span>
						</div>
					</div>

					<div class="bg-base-200/35 p-4 sm:p-8 lg:p-10" aria-live="polite">
						{#if targetResult.status === 'achievable'}
							<p class="text-sm text-base-content/65">Lot minimum</p>
							<p class="numeric mt-2 text-3xl font-medium text-base-content">
								{targetResult.additionalLots} lot
							</p>
							<p class="mt-3 text-sm leading-6 text-base-content/60">
								Siapkan <strong class="numeric font-medium text-base-content">
									{formatRupiah(targetResult.cashRequired)}</strong
								>
								termasuk estimasi fee beli
								<strong class="numeric font-medium text-base-content">
									{formatRupiah(targetResult.buyFee)}</strong
								>. Rata-rata hasil pembulatan lot menjadi
								<strong class="numeric font-medium text-base-content">
									{formatPrice(targetResult.resultingAveragePrice)}</strong
								>.
							</p>
						{:else if targetResult.status === 'already-reached'}
							<p class="font-medium text-base-content">Target sudah tercapai.</p>
							<p class="mt-2 text-sm leading-6 text-base-content/60">
								Rata-rata saat ini sudah sama dengan atau lebih rendah dari targetmu.
							</p>
						{:else if targetResult.reason === 'target-at-or-below-purchase-price'}
							<p class="font-medium text-warning">Target belum dapat dicapai.</p>
							<p class="mt-2 text-sm leading-6 text-base-content/60">
								Rata-rata target harus lebih tinggi dari harga beli rencana
								<span class="numeric">{formatPrice(purchasePrice)}</span>.
							</p>
						{:else if currentLots === 0}
							<p class="text-sm leading-6 text-base-content/60">
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
		</section>
	{/if}

	<section
		id="cara-hitung"
		aria-labelledby="calculation-guide-heading"
		class="border-b border-base-300 px-4 py-10 sm:px-8 lg:px-12"
	>
		<article class="max-w-3xl">
			<p class="text-xs font-medium tracking-wider text-primary uppercase">Panduan singkat</p>
			<h2
				id="calculation-guide-heading"
				class="mt-3 text-2xl font-medium tracking-tight text-base-content"
			>
				Cara menghitung pembelian dan penjualan saham
			</h2>
			<p class="mt-4 text-sm leading-6 text-base-content/65">
				Harga rata-rata baru adalah rata-rata tertimbang, bukan rata-rata sederhana dari dua harga.
				Setiap harga diberi bobot sesuai jumlah saham yang dimiliki atau dibeli. Di Bursa Efek
				Indonesia, 1 lot setara dengan 100 lembar saham.
			</p>

			<div class="mt-6 border border-base-300 bg-base-200/35 p-5">
				<p class="text-sm font-medium text-base-content">Rumus harga rata-rata baru</p>
				<p class="numeric mt-3 overflow-x-auto text-sm leading-6 text-base-content/70">
					((lot lama × 100 × harga rata-rata lama) + (lot beli × 100 × harga beli)) ÷ ((lot lama +
					lot beli) × 100)
				</p>
			</div>

			<div class="mt-4 border border-base-300 bg-base-200/35 p-5">
				<p class="text-sm font-medium text-base-content">Rumus dana bersih penjualan</p>
				<p class="numeric mt-3 overflow-x-auto text-sm leading-6 text-base-content/70">
					(lot jual × 100 × harga jual) − (nilai penjualan × fee jual sekuritas)
				</p>
			</div>

			<p class="mt-6 text-sm leading-6 text-base-content/65">
				Rata menggunakan kedua rumus tersebut untuk menghitung posisi akhir, kebutuhan dana, hasil
				jual bersih, serta estimasi untung atau rugi. Penjualan sebagian tidak mengubah harga
				rata-rata saham yang tersisa. Fee beli dari sekuritas pilihan ditambahkan ke kebutuhan dana,
				sedangkan fee jualnya dikurangi dari hasil penjualan. Semua perhitungan berlangsung di
				browser; data portofolio tidak dikirim atau disimpan.
			</p>
			<p class="mt-4 text-xs leading-5 text-base-content/60">
				Hasil merupakan estimasi untuk perencanaan, bukan rekomendasi investasi. Cocokkan kembali
				nilai order dan biaya yang berlaku dengan broker sebelum bertransaksi. Fee Stockbit
				dibulatkan ke bawah ke rupiah penuh, sedangkan estimasi Ajaib mempertahankan fee pecahan.
				Nilai uang lain ditampilkan hingga 4 angka desimal.
			</p>
		</article>
	</section>

	<section aria-labelledby="fee-notes-heading" class="px-4 py-10 sm:px-8 lg:px-12">
		<div class="max-w-3xl">
			<h2 id="fee-notes-heading" class="text-lg font-medium text-base-content">
				Tentang biaya sekuritas
			</h2>
			<p class="mt-3 text-sm leading-6 text-base-content/60">
				Rata menggunakan tarif reguler yang dipublikasikan masing-masing sekuritas. Tarif Ajaib
				sudah mencakup biaya broker, levy, PPN biaya broker, dan PPh final transaksi jual. Tambahan
				fee Ajaib untuk Market Order 0,1% dan forced sell 0,25% tidak diterapkan.
			</p>

			<div class="mt-6 overflow-x-auto border border-base-300">
				<table class="w-full text-left text-sm">
					<thead class="border-b border-base-300 bg-base-200 text-base-content/65">
						<tr>
							<th class="px-4 py-3 font-medium" scope="col">Sekuritas</th>
							<th class="numeric px-4 py-3 font-medium" scope="col">Fee beli</th>
							<th class="numeric px-4 py-3 font-medium" scope="col">Fee jual</th>
						</tr>
					</thead>
					<tbody>
						<tr class="border-b border-base-300">
							<th class="px-4 py-3 font-medium text-base-content" scope="row">Stockbit</th>
							<td class="numeric px-4 py-3 text-base-content/70">0,15%</td>
							<td class="numeric px-4 py-3 text-base-content/70">0,25%</td>
						</tr>
						<tr>
							<th class="px-4 py-3 font-medium text-base-content" scope="row">Ajaib</th>
							<td class="numeric px-4 py-3 text-base-content/70">0,1513%</td>
							<td class="numeric px-4 py-3 text-base-content/70">0,2513%</td>
						</tr>
					</tbody>
				</table>
			</div>

			<p class="mt-5 text-sm leading-6 text-base-content/60">
				Bea materai Rp10.000 dapat berlaku jika total nilai transaksi harian di atas Rp10 juta,
				sehingga tidak ditambahkan otomatis pada satu simulasi order.
			</p>
			<div class="mt-4 flex flex-wrap gap-x-6">
				<a
					class="inline-flex min-h-11 link items-center text-sm font-medium text-base-content underline-offset-4"
					href="https://help.stockbit.com/id/article/transaksi-saham-berapa-biaya-trading-di-stockbit-sekuritas-1lbkyq9/"
					target="_blank"
					rel="noreferrer"
				>
					Lihat sumber biaya Stockbit
				</a>
				<a
					class="inline-flex min-h-11 link items-center text-sm font-medium text-base-content underline-offset-4"
					href="https://ajaib.co.id/biaya"
					target="_blank"
					rel="noreferrer"
				>
					Lihat sumber biaya Ajaib
				</a>
			</div>
			<p class="mt-1 text-xs text-base-content/60">Tarif diperiksa 31 Agustus 2026.</p>
		</div>
	</section>
</main>

<footer class="border-t border-base-300">
	<div
		class="mx-auto flex max-w-6xl flex-col gap-2 border-x border-base-300 px-4 py-6 text-xs text-base-content/65 sm:flex-row sm:items-center sm:justify-between sm:px-8"
	>
		<p>Rata tidak menyimpan data portofoliomu.</p>
	</div>
</footer>
