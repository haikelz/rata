<script lang="ts">
	import { resolve } from '$app/paths';
	import { formatFeeRate, formatNumber, formatRupiah } from '$lib/format';
	import Seo from '$lib/Seo.svelte';
	import { BROKERAGE_FIRMS, calculateStockPurchase, calculateStockSale, LOT_SIZE } from '$lib/rata';

	const title = 'Cara Menghitung Harga Rata-rata Saham | Rata';
	const description =
		'Rumus harga rata-rata tertimbang saat average down, contoh hitungan lot BEI dengan fee Stockbit, dan rumus dana bersih saat menjual saham sebagian.';

	// The worked example is the calculator's default order, run through the same functions.
	const broker = BROKERAGE_FIRMS.stockbit;
	const held = { lots: 297, average: 397 };
	const order = { lots: 39, price: 342 };
	const purchase = calculateStockPurchase({
		currentLots: held.lots,
		currentAveragePrice: held.average,
		currentMarketPrice: order.price,
		additionalLots: order.lots,
		purchasePrice: order.price,
		brokerage: broker
	});
	const sale = calculateStockSale({
		currentLots: held.lots,
		currentAveragePrice: held.average,
		saleLots: order.lots,
		salePrice: order.price,
		brokerage: broker
	});
</script>

<Seo {title} {description} breadcrumb="Panduan" />

{#snippet step(label: string, working: string, value: string, total = false)}
	<div class="grid gap-x-6 gap-y-1 border-b border-base-300 py-3 sm:grid-cols-[1fr_auto]">
		<dt class={total ? 'font-medium text-base-content' : 'text-base-content/70'}>{label}</dt>
		<dd class="numeric sm:row-span-2 sm:self-center sm:text-right">
			<span class={total ? 'text-lg font-medium text-primary' : 'text-base-content'}>{value}</span>
		</dd>
		<dd class="numeric text-xs text-base-content/60">{working}</dd>
	</div>
{/snippet}

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
		<li class="text-base-content" aria-current="page">Panduan</li>
	</ol>
</nav>

<header class="border-b border-base-300 px-4 py-10 sm:px-6 sm:py-14 xl:px-8">
	<h1 class="max-w-3xl text-3xl font-medium tracking-[-0.035em] text-base-content sm:text-4xl">
		Cara menghitung harga rata-rata saham
	</h1>
	<p class="mt-5 max-w-2xl text-lg leading-8 text-base-content/70">
		Harga rata-rata baru adalah rata-rata tertimbang, bukan rata-rata sederhana dari dua harga.
		Setiap harga diberi bobot sesuai jumlah saham yang dimiliki atau dibeli. Di Bursa Efek
		Indonesia, 1 lot setara dengan {LOT_SIZE} lembar saham.
	</p>
</header>

<section
	aria-labelledby="average-formula-heading"
	class="grid gap-6 border-b border-base-300 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_2.3fr] lg:gap-0 lg:p-0"
>
	<h2
		id="average-formula-heading"
		class="text-xl font-medium tracking-tight text-base-content lg:border-r lg:border-base-300 lg:px-6 lg:py-10 xl:px-8"
	>
		Rumus harga rata-rata baru
	</h2>
	<div class="max-w-[68ch] lg:px-6 lg:py-10 xl:px-8">
		<p
			class="numeric border border-base-300 bg-base-200/50 p-5 text-sm leading-7 text-base-content"
		>
			((lot lama × 100 × rata-rata lama) + (lot beli × 100 × harga beli)) ÷ ((lot lama + lot beli) ×
			100)
		</p>
		<p class="mt-5 leading-7 text-base-content/75">
			Pembilang adalah total modal dari posisi lama dan order baru. Penyebutnya adalah total lembar
			setelah order. Karena itu, membeli lebih banyak lot di harga rendah menarik rata-rata lebih
			jauh ke bawah daripada membeli sedikit lot di harga yang sama.
		</p>
	</div>
</section>

{#if purchase}
	<section
		aria-labelledby="example-heading"
		class="grid gap-6 border-b border-base-300 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_2.3fr] lg:gap-0 lg:p-0"
	>
		<h2
			id="example-heading"
			class="text-xl font-medium tracking-tight text-base-content lg:border-r lg:border-base-300 lg:px-6 lg:py-10 xl:px-8"
		>
			Contoh average down
		</h2>
		<div class="max-w-[68ch] lg:px-6 lg:py-10 xl:px-8">
			<p class="leading-7 text-base-content/75">
				Kamu memegang <span class="numeric">{formatNumber(held.lots)}</span> lot dengan rata-rata
				<span class="numeric">{formatRupiah(held.average)}</span>, lalu membeli
				<span class="numeric">{formatNumber(order.lots)}</span>
				lot lagi di <span class="numeric">{formatRupiah(order.price)}</span> lewat {broker.name}.
			</p>
			<dl class="mt-6 border-t border-base-300 text-sm">
				{@render step(
					'Modal posisi lama',
					`${formatNumber(held.lots)} × ${LOT_SIZE} × ${formatNumber(held.average)}`,
					formatRupiah(purchase.currentInvestmentValue)
				)}
				{@render step(
					'Nilai pembelian',
					`${formatNumber(order.lots)} × ${LOT_SIZE} × ${formatNumber(order.price)}`,
					formatRupiah(purchase.purchaseValue)
				)}
				{@render step(
					'Total lembar',
					`(${formatNumber(held.lots)} + ${formatNumber(order.lots)}) × ${LOT_SIZE}`,
					formatNumber(purchase.finalShares)
				)}
				{@render step(
					'Rata-rata baru',
					`(${formatNumber(purchase.currentInvestmentValue)} + ${formatNumber(purchase.purchaseValue)}) ÷ ${formatNumber(purchase.finalShares)}`,
					formatRupiah(purchase.finalAveragePrice),
					true
				)}
			</dl>
			<p class="mt-6 leading-7 text-base-content/75">
				Rata-rata turun <span class="numeric"
					>{formatRupiah(held.average - purchase.finalAveragePrice)}</span
				>
				per lembar. Dana yang perlu disiapkan adalah nilai pembelian ditambah fee beli {broker.name}
				<span class="numeric">{formatFeeRate(broker.buyFeeRate)}</span> sebesar
				<span class="numeric">{formatRupiah(purchase.buyFee)}</span>, yaitu
				<strong class="numeric font-medium text-base-content"
					>{formatRupiah(purchase.cashRequired)}</strong
				>.
			</p>
		</div>
	</section>
{/if}

<section
	aria-labelledby="sale-formula-heading"
	class="grid gap-6 border-b border-base-300 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_2.3fr] lg:gap-0 lg:p-0"
>
	<h2
		id="sale-formula-heading"
		class="text-xl font-medium tracking-tight text-base-content lg:border-r lg:border-base-300 lg:px-6 lg:py-10 xl:px-8"
	>
		Rumus dana bersih penjualan
	</h2>
	<div class="max-w-[68ch] lg:px-6 lg:py-10 xl:px-8">
		<p
			class="numeric border border-base-300 bg-base-200/50 p-5 text-sm leading-7 text-base-content"
		>
			(lot jual × 100 × harga jual) − (nilai penjualan × fee jual sekuritas)
		</p>
		<p class="mt-5 leading-7 text-base-content/75">
			Penjualan sebagian tidak mengubah harga rata-rata saham yang tersisa. Untung atau rugi
			terealisasi adalah dana bersih dikurangi modal dari lot yang dijual.
		</p>
		{#if sale}
			<p class="mt-4 leading-7 text-base-content/75">
				Dari posisi yang sama, menjual <span class="numeric">{formatNumber(order.lots)}</span> lot
				di <span class="numeric">{formatRupiah(order.price)}</span>
				menghasilkan dana bersih
				<strong class="numeric font-medium text-base-content"
					>{formatRupiah(sale.netProceeds)}</strong
				>
				setelah fee jual <span class="numeric">{formatRupiah(sale.sellFee)}</span>, dengan rugi
				terealisasi
				<span class="numeric">{formatRupiah(sale.realizedProfitLoss)}</span>. Rata-rata
				<span class="numeric">{formatNumber(sale.remainingLots)}</span> lot yang tersisa tetap
				<span class="numeric">{formatRupiah(sale.remainingAveragePrice)}</span>.
			</p>
		{/if}
	</div>
</section>

<section
	aria-labelledby="notes-heading"
	class="grid gap-6 border-b border-base-300 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_2.3fr] lg:gap-0 lg:p-0"
>
	<h2
		id="notes-heading"
		class="text-xl font-medium tracking-tight text-base-content lg:border-r lg:border-base-300 lg:px-6 lg:py-10 xl:px-8"
	>
		Batasan hitungan
	</h2>
	<div class="max-w-[68ch] lg:px-6 lg:py-10 xl:px-8">
		<p class="leading-7 text-base-content/75">
			Rata menggunakan kedua rumus di atas untuk posisi akhir, kebutuhan dana, hasil jual bersih,
			dan estimasi untung atau rugi. Fee beli dari sekuritas pilihan ditambahkan ke kebutuhan dana,
			sedangkan fee jualnya dikurangi dari hasil penjualan. Rincian tarif dan pembulatannya ada di
			<a class="link underline-offset-4" href={resolve('/biaya')}>halaman biaya sekuritas</a>.
		</p>
		<p class="mt-4 leading-7 text-base-content/75">
			Semua perhitungan berlangsung di browser; data portofolio tidak dikirim atau disimpan. Hasil
			merupakan estimasi untuk perencanaan, bukan rekomendasi investasi. Cocokkan kembali nilai
			order dan biaya yang berlaku dengan broker sebelum bertransaksi.
		</p>
		<a class="btn mt-8 min-h-11 btn-primary" href={resolve('/')}>Hitung posisimu sendiri</a>
	</div>
</section>
