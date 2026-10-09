<script lang="ts">
	import { dev } from '$app/environment';
	import './layout.css';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href="/favicon.svg" />
	<link rel="manifest" href="/manifest.webmanifest" />
	<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
	<meta name="apple-mobile-web-app-title" content="Rata" />
	{#if !dev}
		<script src="/registerSW.js" defer></script>
	{/if}
</svelte:head>
{@render children()}
