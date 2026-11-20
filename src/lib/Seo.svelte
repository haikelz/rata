<script lang="ts">
	import { assets } from '$app/paths';
	import { page } from '$app/state';

	type Props = {
		title: string;
		description: string;
		// Inner pages name themselves here; the home page leaves it out.
		breadcrumb?: string;
		schema?: ReadonlyArray<Record<string, unknown>>;
	};
	let { title, description, breadcrumb, schema = [] }: Props = $props();

	const imageAlt = 'Rata, kalkulator harga rata-rata saham dan fee beli';
	let canonicalUrl = $derived(new URL(page.url.pathname, page.url).href);
	let imageUrl = $derived(new URL(`${assets}/og-rata.webp`, page.url).href);
	let graph = $derived([
		...schema,
		...(breadcrumb
			? [
					{
						'@type': 'BreadcrumbList',
						itemListElement: [
							{ '@type': 'ListItem', position: 1, name: 'Rata', item: page.url.origin + '/' },
							{ '@type': 'ListItem', position: 2, name: breadcrumb, item: canonicalUrl }
						]
					}
				]
			: [])
	]);
	let graphJson = $derived(
		JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replaceAll('<', '\\u003c')
	);
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<meta name="robots" content="index, follow, max-image-preview:large" />
	<link rel="canonical" href={canonicalUrl} />

	<meta property="og:type" content="website" />
	<meta property="og:locale" content="id_ID" />
	<meta property="og:site_name" content="Rata" />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={canonicalUrl} />
	<meta property="og:image" content={imageUrl} />
	<meta property="og:image:type" content="image/webp" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:alt" content={imageAlt} />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={imageUrl} />
	<meta name="twitter:image:alt" content={imageAlt} />

	{#if graph.length > 0}
		<svelte:element this={"script"} type="application/ld+json">{graphJson}</svelte:element>
	{/if}
</svelte:head>
