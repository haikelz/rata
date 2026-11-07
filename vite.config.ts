import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import adapter from '@sveltejs/adapter-cloudflare';
import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter(),
			csp: {
				mode: 'hash',
				directives: {
					'default-src': ['self'],
					'script-src': ['self'],
					'style-src': ['self', 'unsafe-inline'],
					'img-src': ['self', 'data:'],
					'object-src': ['none'],
					'base-uri': ['self'],
					'form-action': ['self']
				}
			},
			prerender: { origin: 'https://rata.ekel.dev' },
			serviceWorker: { register: false }
		}),
		SvelteKitPWA({
			strategies: 'generateSW',
			filename: 'service-worker.js',
			registerType: 'prompt',
			injectRegister: false,
			manifestFilename: 'manifest.webmanifest',
			manifest: {
				id: '/',
				name: 'Rata — Kalkulator Saham',
				short_name: 'Rata',
				description:
					'Kalkulator beli, jual, dan harga rata-rata saham Indonesia. Bisa digunakan offline.',
				lang: 'id',
				start_url: '/',
				scope: '/',
				display: 'standalone',
				background_color: '#f5f5f5',
				theme_color: '#f5f5f5',
				icons: [
					{ src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
					{ src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
				],
				screenshots: [
					{
						src: '/screenshots/buy.png',
						sizes: '2560x1720',
						type: 'image/png',
						form_factor: 'wide',
						label: 'Kalkulator beli dengan harga rata-rata baru dan dana yang dibutuhkan'
					},
					{
						src: '/screenshots/sell.png',
						sizes: '2560x1720',
						type: 'image/png',
						form_factor: 'wide',
						label: 'Kalkulator jual dengan dana bersih dan untung rugi terealisasi'
					},
					{
						src: '/screenshots/mobile.png',
						sizes: '780x1688',
						type: 'image/png',
						form_factor: 'narrow',
						label: 'Hasil perhitungan di layar ponsel'
					}
				]
			},
			workbox: {
				importScripts: ['/pwa-cache-cleanup.js'],
				globPatterns: [
					'client/**/*.{js,css,ico,png,svg,webp,webmanifest,woff2}',
					'prerendered/**/*.{html,json}'
				],
				globIgnores: [
					'client/**/*-{cyrillic,cyrillic-ext,vietnamese,symbols2}-wght-normal.*.woff2',
					'client/screenshots/**'
				],
				navigateFallback: '/',
				cleanupOutdatedCaches: true
			}
		})
	],
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
