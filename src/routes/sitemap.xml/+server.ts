import type { RequestHandler } from './$types';

export const prerender = true;

// ponytail: hand-listed routes; add each new public page here. lastmod is left out because the
// build has no reliable per-page change date, and a wrong one is worse than none.
const paths = ['/', '/panduan', '/biaya'];

export const GET: RequestHandler = ({ url }) => {
	const urls = paths.map((path) => `\t<url><loc>${new URL(path, url).href}</loc></url>`).join('\n');
	return new Response(
		`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
		{ headers: { 'Content-Type': 'application/xml' } }
	);
};
