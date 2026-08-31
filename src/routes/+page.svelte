<script lang="ts">
	import { resolve } from '$app/paths';
	import { STOCKBIT_BUY_FEE_RATE, calculateStockPurchase, calculateTargetAverage } from '$lib/rata';

	const rupiahFormatter = new Intl.NumberFormat('id-ID', {
		style: 'currency',
		currency: 'IDR',
		maximumFractionDigits: 0
	});
	const priceFormatter = new Intl.NumberFormat('id-ID', {
		minimumFractionDigits: 0,
		maximumFractionDigits: 2
	});
	const percentageFormatter = new Intl.NumberFormat('id-ID', {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
		signDisplay: 'exceptZero'
	});

	let currentLots = $state(297);
	let currentAveragePrice = $state(397);
	let currentMarketPrice = $state(342);
	let additionalLots = $state(39);
	let purchasePrice = $state(342);
	let targetAveragePrice = $state(380);

	let result = $derived(
		calculateStockPurchase({
			currentLots,
			currentAveragePrice,
			currentMarketPrice,
			additionalLots,
			purchasePrice,
			buyFeeRate: STOCKBIT_BUY_FEE_RATE
		})
	);
	let targetResult = $derived(
		calculateTargetAverage({
			currentLots,
			currentAveragePrice,
			purchasePrice,
			buyFeeRate: STOCKBIT_BUY_FEE_RATE,
			targetAveragePrice
		})
	);

	function formatRupiah(value: number): string {
		return rupiahFormatter.format(Math.round(value));
	}

	function formatPrice(value: number): string {
		return `Rp${priceFormatter.format(value)}`;
	}

	function resetExample(): void {
		currentLots = 297;
		currentAveragePrice = 397;
		currentMarketPrice = 342;
		additionalLots = 39;
		purchasePrice = 342;
		targetAveragePrice = 380;
	}
</script>

<svelte:head>
	<title>Rata - Kalkulator Rata-rata Saham</title>
	<meta
		name="description"
		content="Hitung perubahan harga rata-rata, total lot, nilai investasi, dan fee beli Stockbit sebelum membeli saham."
	/>
</svelte:head>

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
				Rata-rata, sebelum beli.
			</h1>
			<p class="mt-5 max-w-xl text-lg leading-7 text-base-content/65">
				Simulasikan lot, harga rata-rata, dan dana yang dibutuhkan sebelum mengirim order beli di
				broker.
			</p>
		</div>
	</section>

	<section aria-labelledby="calculator-heading" class="grid lg:grid-cols-[5fr_7fr]">
		<form
			class="border-b border-base-300 p-4 sm:p-8 lg:border-r lg:p-10"
			onsubmit={(event) => event.preventDefault()}
		>
			<div class="mb-8 flex items-start justify-between gap-4">
				<div>
					<h2 id="calculator-heading" class="text-2xl font-medium tracking-tight text-base-content">
						Rencana pembelian
					</h2>
					<p class="mt-2 text-sm leading-6 text-base-content/60">
						Gunakan angka dari portofolio saat ini.
					</p>
				</div>
				<button class="btn shrink-0 btn-ghost btn-sm" type="button" onclick={resetExample}>
					Reset contoh
				</button>
			</div>

			<fieldset class="grid gap-5">
				<legend class="mb-5 text-sm font-medium text-base-content/65">Posisi saat ini</legend>

				<label class="form-control grid gap-2" for="current-lots">
					<span class="label-text font-medium text-base-content">Jumlah lot</span>
					<input
						id="current-lots"
						class="input-bordered numeric input w-full"
						type="number"
						min="0"
						step="1"
						inputmode="numeric"
						aria-describedby="current-lots-help"
						bind:value={currentLots}
					/>
					<span id="current-lots-help" class="text-xs text-base-content/65"
						>1 lot = 100 lembar saham</span
					>
				</label>

				<div class="grid gap-5 sm:grid-cols-2">
					<label class="form-control grid gap-2" for="current-average">
						<span class="label-text font-medium text-base-content">Harga rata-rata</span>
						<span class="input-bordered input flex items-center gap-2">
							<span class="text-base-content/65" aria-hidden="true">Rp</span>
							<input
								id="current-average"
								class="numeric min-w-0 grow border-0 bg-transparent outline-none"
								type="number"
								min="0"
								step="0.01"
								inputmode="decimal"
								bind:value={currentAveragePrice}
							/>
						</span>
					</label>

					<label class="form-control grid gap-2" for="market-price">
						<span class="label-text font-medium text-base-content">Harga pasar</span>
						<span class="input-bordered input flex items-center gap-2">
							<span class="text-base-content/65" aria-hidden="true">Rp</span>
							<input
								id="market-price"
								class="numeric min-w-0 grow border-0 bg-transparent outline-none"
								type="number"
								min="0.01"
								step="0.01"
								inputmode="decimal"
								bind:value={currentMarketPrice}
							/>
						</span>
					</label>
				</div>
			</fieldset>

			<div class="my-8 border-t border-base-300"></div>

			<fieldset class="grid gap-5">
				<legend class="mb-5 text-sm font-medium text-base-content/65"
					>Order yang direncanakan</legend
				>

				<div class="grid gap-5 sm:grid-cols-2">
					<label class="form-control grid gap-2" for="additional-lots">
						<span class="label-text font-medium text-base-content">Lot tambahan</span>
						<input
							id="additional-lots"
							class="input-bordered numeric input w-full"
							type="number"
							min="0"
							step="1"
							inputmode="numeric"
							bind:value={additionalLots}
						/>
					</label>

					<label class="form-control grid gap-2" for="purchase-price">
						<span class="label-text font-medium text-base-content">Harga beli</span>
						<span class="input-bordered input flex items-center gap-2">
							<span class="text-base-content/65" aria-hidden="true">Rp</span>
							<input
								id="purchase-price"
								class="numeric min-w-0 grow border-0 bg-transparent outline-none"
								type="number"
								min="0.01"
								step="0.01"
								inputmode="decimal"
								bind:value={purchasePrice}
							/>
						</span>
					</label>
				</div>

				<div class="flex items-center justify-between border border-base-300 bg-base-200 px-4 py-3">
					<div>
						<p class="text-sm font-medium text-base-content">Stockbit Sekuritas</p>
						<p class="mt-0.5 text-xs text-base-content/65">Fee beli</p>
					</div>
					<p class="numeric font-medium text-base-content">0,15%</p>
				</div>
			</fieldset>
		</form>

		<div class="border-b border-base-300 bg-base-200/35 p-4 sm:p-8 lg:p-10">
			<div class="lg:sticky lg:top-26">
				<div class="mb-8">
					<p class="text-sm font-medium text-base-content/65">Estimasi setelah beli</p>
					{#if result}
						<p
							class="numeric mt-3 text-4xl font-medium tracking-[-0.04em] text-base-content sm:text-5xl"
						>
							{formatPrice(result.finalAveragePrice)}
						</p>
						<p class="mt-2 text-sm text-base-content/60">
							Rata-rata baru per lembar,
							<span class="numeric">
								{formatPrice(Math.abs(result.finalAveragePrice - currentAveragePrice))}
							</span>
							{result.finalAveragePrice <= currentAveragePrice ? ' lebih rendah' : ' lebih tinggi'}.
						</p>
					{:else}
						<p class="mt-3 text-base font-medium text-error" role="alert">
							Periksa kembali input. Lot harus berupa bilangan bulat dan harga harus lebih dari nol.
						</p>
					{/if}
				</div>

				{#if result}
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
								<dt class="text-base-content/60">Fee beli Stockbit 0,15%</dt>
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
						</dl>
					</div>

					<p class="mt-7 text-xs leading-5 text-base-content/65">
						Nilai investasi dan P/L menggunakan harga transaksi tanpa fee. Fee order baru
						ditampilkan terpisah karena fee historis tidak tersedia dari input.
					</p>
				{/if}
			</div>
		</div>
	</section>

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
					<label class="form-control grid max-w-sm gap-2" for="target-average">
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
								aria-describedby="target-average-help"
								bind:value={targetAveragePrice}
							/>
						</span>
						<span id="target-average-help" class="text-xs leading-5 text-base-content/65">
							Harus berada di antara harga beli rencana dan rata-rata saat ini.
						</span>
					</label>
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
					{:else}
						<p class="font-medium text-error">Lengkapi posisi saat ini terlebih dahulu.</p>
					{/if}
				</div>
			</div>
		</details>
	</section>

	<section aria-labelledby="fee-notes-heading" class="px-4 py-10 sm:px-8 lg:px-12">
		<div class="max-w-3xl">
			<h2 id="fee-notes-heading" class="text-lg font-medium text-base-content">
				Tentang biaya Stockbit
			</h2>
			<p class="mt-3 text-sm leading-6 text-base-content/60">
				Kalkulator menerapkan fee beli saham 0,15%. Fee jual 0,25% tidak dihitung karena simulasi
				ini hanya untuk pembelian. Bea materai Rp10.000 dapat berlaku jika total nilai transaksi
				harian di atas Rp10 juta, sehingga tidak ditambahkan otomatis.
			</p>
			<a
				class="mt-4 inline-flex min-h-11 link items-center text-sm font-medium text-base-content underline-offset-4"
				href="https://help.stockbit.com/id/article/transaksi-saham-berapa-biaya-trading-di-stockbit-sekuritas-1lbkyq9/"
				target="_blank"
				rel="noreferrer"
			>
				Lihat sumber biaya Stockbit
			</a>
			<p class="mt-1 text-xs text-base-content/60">Sumber diperbarui 5 Agustus 2026.</p>
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
