<script lang="ts">
	import { dev } from '$app/environment';
	import { onMount } from 'svelte';
	import './layout.css';

	let { children } = $props();
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
</svelte:head>
{@render children()}

<p class="sr-only" role="status">
	{updateAvailable ? 'Versi baru Rata tersedia. Pilih Perbarui untuk memuat ulang.' : ''}
</p>
{#if updateAvailable}
	<aside
		aria-labelledby="pwa-update-heading"
		class="fixed right-4 bottom-4 left-4 z-50 border border-base-300 bg-base-100 p-5 shadow-lg sm:left-auto sm:max-w-sm"
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
