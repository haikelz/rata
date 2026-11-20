<script lang="ts">
	import { resolve } from '$app/paths';
	import { formatFeeRate, formatNumber, formatRupiah } from '$lib/format';
	import Seo from '$lib/Seo.svelte';
	import {
		BROKERAGE_FIRMS,
		type BrokerageFirmId,
		calculateStockPurchase,
		LOT_SIZE
	} from '$lib/rata';

	const firms = (['stockbit', 'ajaib'] as const satisfies ReadonlyArray<BrokerageFirmId>).map(
		(id) => BROKERAGE_FIRMS[id]
	);
	const [stockbit, ajaib] = firms;
	const title = 'Fee Beli dan Jual Saham Stockbit dan Ajaib | Rata';
	const description = `Fee beli dan jual saham Stockbit (${formatFeeRate(stockbit.buyFeeRate)} dan ${formatFeeRate(stockbit.sellFeeRate)}) dan Ajaib (${formatFeeRate(ajaib.buyFeeRate)} dan ${formatFeeRate(ajaib.sellFeeRate)}), cara pembulatannya, serta biaya yang tidak dihitung kalkulator Rata.`;

	// Same order as the calculator's default example, so the numbers match what users see there.
	const order = { lots: 39, price: 342 };
	const examples = firms.map((firm) => ({
		firm,
		result: calculateStockPurchase({
			currentLots: 0,
			currentAveragePrice: 0,
			currentMarketPrice: order.price,
			additionalLots: order.lots,
			purchasePrice: order.price,
			brokerage: firm
		})
	}));
</script>

<Seo {title} {description} breadcrumb="Biaya" />

<nav
	aria-label="Breadcrumb"
	class="flex h-12 items-center border-b border-base-300 px-4 text-sm sm:px-6 xl:px-8"
>
	<ol class="flex items-center gap-2">
		<li>
			<a class="text-base-content/65 underline-offset-4 hover:underline" href={resolve('/')}>Rata</a
			>
		</li>
		<li class="text-base-content/40" aria-hidden="true">/</li>
		<li class="text-base-content" aria-current="page">Biaya</li>
	</ol>
</nav>

<header class="border-b border-base-300 px-4 py-10 sm:px-6 sm:py-14 xl:px-8">
	<h1 class="max-w-3xl text-3xl font-medium tracking-[-0.035em] text-base-content sm:text-4xl">
		Fee beli dan jual Stockbit dan Ajaib
	</h1>
	<p class="mt-5 max-w-2xl text-lg leading-8 text-base-content/70">
		Rata memakai tarif reguler yang dipublikasikan masing-masing sekuritas. Fee beli ditambahkan ke
		dana yang dibutuhkan, sedangkan fee jual dikurangi dari hasil penjualan.
	</p>
</header>

<section
	aria-labelledby="rates-heading"
	class="grid gap-6 border-b border-base-300 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_2.3fr] lg:gap-0 lg:p-0"
>
	<h2
		id="rates-heading"
		class="text-xl font-medium tracking-tight text-base-content lg:border-r lg:border-base-300 lg:px-6 lg:py-10 xl:px-8"
	>
		Tarif per transaksi
	</h2>
	<div class="min-w-0 lg:px-6 lg:py-10 xl:px-8">
		<div class="overflow-x-auto border border-base-300">
			<table class="w-full text-left text-sm">
				<thead class="border-b border-base-300 bg-base-200 text-base-content/70">
					<tr>
						<th class="px-4 py-3 font-medium" scope="col">Sekuritas</th>
						<th class="px-4 py-3 text-right font-medium" scope="col">Fee beli</th>
						<th class="px-4 py-3 text-right font-medium" scope="col">Fee jual</th>
					</tr>
				</thead>
				<tbody>
					{#each firms as firm (firm.name)}
						<tr class="border-b border-base-300 last:border-b-0">
							<th class="px-4 py-3 font-normal" scope="row">
								<span class="block font-medium text-base-content">{firm.name}</span>
								<span class="block text-xs text-base-content/65"
									>{firm.roundsFeesDown ? 'Dibulatkan ke bawah' : 'Pecahan dipertahankan'}</span
								>
							</th>
							<td class="numeric px-4 py-3 text-right text-base-content"
								>{formatFeeRate(firm.buyFeeRate)}</td
							>
							<td class="numeric px-4 py-3 text-right text-base-content"
								>{formatFeeRate(firm.sellFeeRate)}</td
							>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		<p class="mt-5 max-w-[68ch] leading-7 text-base-content/75">
			Tarif Ajaib sudah mencakup biaya broker, levy, PPN biaya broker, dan PPh final transaksi jual.
		</p>
		<ul class="mt-4 flex flex-wrap gap-x-6">
			<li>
				<a
					class="inline-flex min-h-11 link items-center text-sm text-base-content underline-offset-4"
					href="https://help.stockbit.com/id/article/transaksi-saham-berapa-biaya-trading-di-stockbit-sekuritas-1lbkyq9/"
					target="_blank"
					rel="noreferrer">Sumber biaya Stockbit</a
				>
			</li>
			<li>
				<a
					class="inline-flex min-h-11 link items-center text-sm text-base-content underline-offset-4"
					href="https://ajaib.co.id/biaya"
					target="_blank"
					rel="noreferrer">Sumber biaya Ajaib</a
				>
			</li>
		</ul>
		<p class="text-xs text-base-content/60">Tarif diperiksa 31 Agustus 2026.</p>
	</div>
</section>

<section
	aria-labelledby="rounding-heading"
	class="grid gap-6 border-b border-base-300 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_2.3fr] lg:gap-0 lg:p-0"
>
	<h2
		id="rounding-heading"
		class="text-xl font-medium tracking-tight text-base-content lg:border-r lg:border-base-300 lg:px-6 lg:py-10 xl:px-8"
	>
		Contoh pembulatan
	</h2>
	<div class="max-w-[68ch] min-w-0 lg:px-6 lg:py-10 xl:px-8">
		<p class="leading-7 text-base-content/75">
			Order beli <span class="numeric">{formatNumber(order.lots)}</span> lot di
			<span class="numeric">{formatRupiah(order.price)}</span>
			bernilai
			<span class="numeric">{formatRupiah(order.lots * LOT_SIZE * order.price)}</span>. Fee {stockbit.name}
			dibulatkan ke bawah ke rupiah penuh, sesuai order {stockbit.name} yang teramati. Fee {ajaib.name}
			mempertahankan pecahan.
		</p>
		<dl class="mt-6 border-t border-base-300 text-sm">
			{#each examples as { firm, result } (firm.name)}
				{#if result}
					<div class="grid gap-x-6 gap-y-1 border-b border-base-300 py-3 sm:grid-cols-[1fr_auto]">
						<dt class="text-base-content/70">
							Fee beli {firm.name}
							{formatFeeRate(firm.buyFeeRate)}
						</dt>
						<dd class="numeric sm:row-span-2 sm:self-center sm:text-right">
							{formatRupiah(result.buyFee)}
						</dd>
						<dd class="numeric text-xs text-base-content/60">
							{formatNumber(result.purchaseValue)} × {formatFeeRate(firm.buyFeeRate)} = {formatNumber(
								result.purchaseValue * firm.buyFeeRate
							)}
						</dd>
					</div>
				{/if}
			{/each}
		</dl>
	</div>
</section>

<section
	aria-labelledby="excluded-heading"
	class="grid gap-6 border-b border-base-300 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_2.3fr] lg:gap-0 lg:p-0"
>
	<h2
		id="excluded-heading"
		class="text-xl font-medium tracking-tight text-base-content lg:border-r lg:border-base-300 lg:px-6 lg:py-10 xl:px-8"
	>
		Yang tidak dihitung
	</h2>
	<div class="max-w-[68ch] lg:px-6 lg:py-10 xl:px-8">
		<ul class="grid gap-3 leading-7 text-base-content/75">
			<li>
				Tambahan fee {ajaib.name} untuk Market Order <span class="numeric">0,1%</span> dan forced
				sell
				<span class="numeric">0,25%</span>. Rata menghitung order reguler.
			</li>
			<li>
				Bea materai <span class="numeric">Rp10.000</span>, yang dapat berlaku jika total nilai
				transaksi harian di atas <span class="numeric">Rp10</span>
				juta. Satu simulasi order tidak mengetahui transaksi harianmu yang lain.
			</li>
			<li>Fee beli historis pada untung rugi terealisasi, karena input tidak memuatnya.</li>
		</ul>
		<a class="btn mt-8 min-h-11 btn-primary" href={resolve('/')}>Hitung dengan fee ini</a>
	</div>
</section>
