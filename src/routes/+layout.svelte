<script lang="ts">
	import { dev } from '$app/environment';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import './layout.css';

	let { children } = $props();
	const links = [
		{ href: resolve('/'), label: 'Kalkulator' },
		{ href: resolve('/panduan'), label: 'Panduan' },
		{ href: resolve('/biaya'), label: 'Biaya' }
	];
	let updateAvailable = $state(false);
	let updating = $state(false);
	let updateFailed = $state(false);
	let applyUpdate: (() => Promise<void>) | undefined;

	onMount(() => {
		if (dev) return;
		let disposed = false;
		let registration: ServiceWorkerRegistration | undefined;
		const check = () => {
			if (document.visibilityState === 'visible' && navigator.onLine) {
				void registration?.update().catch(() => {});
			}
		};
		void import('virtual:pwa-register').then(({ registerSW }) => {
			if (disposed) return;
			const update = registerSW({
				immediate: true,
				onNeedRefresh: () => {
					updateAvailable = true;
				},
				onRegisteredSW: (_url, value) => {
					registration = value;
				}
			});
			applyUpdate = () => update(true);
		});
		document.addEventListener('visibilitychange', check);
		return () => {
			disposed = true;
			document.removeEventListener('visibilitychange', check);
		};
	});

	async function updateApp() {
		updating = true;
		updateFailed = false;
		try {
			await applyUpdate?.();
		} catch {
			updateFailed = true;
		} finally {
			updating = false;
		}
	}
</script>

<svelte:head>
	<link rel="icon" href="/favicon.svg" />
	<link rel="manifest" href="/manifest.webmanifest" />
	<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
	<meta name="apple-mobile-web-app-title" content="Rata" />
	<meta name="theme-color" media="(prefers-color-scheme: light)" content="#f5f5f5" />
	<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#101010" />
</svelte:head>

<a class="skip-link" href="#main-content">Lewati ke konten</a>

<header class="border-b border-base-300">
	<div
		class="mx-auto flex h-14 max-w-6xl items-stretch justify-between border-x border-base-300 pl-4 sm:pl-6 xl:pl-8"
	>
		<a
			class="flex items-center gap-2.5 no-underline"
			href={resolve('/')}
			aria-label="Rata, beranda"
		>
			<svg class="size-5 text-primary" viewBox="16 16 68 68" fill="currentColor" aria-hidden="true">
				<rect x="28" y="18" width="44" height="9" />
				<path d="M31 82V60A24 24 0 0 1 55 36H69V50H55A10 10 0 0 0 45 60V82Z" />
			</svg>
			<span class="text-base font-medium tracking-tight text-base-content">Rata</span>
		</a>
		<nav aria-label="Utama" class="flex">
			{#each links as link (link.href)}
				<a
					class="flex items-center border-b-2 border-l border-b-transparent border-l-base-300 px-2.5 text-sm text-base-content/65 no-underline transition-colors hover:bg-base-200 hover:text-base-content aria-[current=page]:border-b-primary aria-[current=page]:text-base-content sm:px-5"
					href={link.href}
					aria-current={page.url.pathname === link.href ? 'page' : undefined}>{link.label}</a
				>
			{/each}
		</nav>
	</div>
</header>

<main
	id="main-content"
	class="mx-auto max-w-6xl border-x border-base-300 [&>:last-child]:border-b-0"
>
	{@render children()}
</main>

<footer class="border-t border-base-300">
	<div
		class="mx-auto grid max-w-6xl gap-x-8 gap-y-5 border-x border-base-300 px-4 py-8 text-sm sm:grid-cols-[1fr_auto] sm:px-6 xl:px-8"
	>
		<p class="max-w-md leading-6 text-base-content/70">
			Rata tidak menyimpan data portofoliomu. Semua hitungan berjalan di browser dan tetap bisa
			dipakai offline.
		</p>
		<nav aria-label="Tautan kaki">
			<ul class="flex flex-wrap gap-x-5">
				{#each links as link (link.href)}
					<li>
						<a
							class="inline-flex min-h-11 items-center text-base-content/70 underline-offset-4 hover:text-base-content hover:underline"
							href={link.href}>{link.label}</a
						>
					</li>
				{/each}
			</ul>
		</nav>
		<p class="text-xs text-base-content/60 sm:col-span-2">
			Estimasi untuk perencanaan, bukan rekomendasi investasi.
		</p>
	</div>
</footer>

<p class="sr-only" role="status">
	{updateAvailable ? 'Versi baru Rata tersedia. Pilih Perbarui untuk memuat ulang.' : ''}
</p>
{#if updateAvailable}
	<aside
		aria-labelledby="pwa-update-heading"
		class="fixed right-4 bottom-4 left-4 z-50 border border-base-300 bg-base-100 p-5 sm:left-auto sm:max-w-sm"
	>
		<h2 id="pwa-update-heading" class="font-medium text-base-content">Versi baru tersedia</h2>
		<p class="mt-2 text-sm text-base-content">
			Memperbarui akan memuat ulang aplikasi dan menghapus input di semua tab Rata yang terbuka.
		</p>
		{#if updateFailed}<p class="mt-2 text-sm text-error" role="alert">
				Pembaruan gagal. Coba lagi saat terhubung ke internet.
			</p>{/if}
		<div class="mt-4 flex gap-3">
			<button type="button" class="btn btn-primary" disabled={updating} onclick={updateApp}
				>{updating ? 'Memperbarui…' : 'Perbarui'}</button
			>
			<button
				type="button"
				class="btn btn-ghost"
				disabled={updating}
				onclick={() => {
					updateAvailable = false;
				}}>Nanti</button
			>
		</div>
	</aside>
{/if}
