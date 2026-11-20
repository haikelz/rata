---
version: 1
slug: 'src-routes-page-svelte'
primary_target: 'src/routes/+page.svelte'
related_targets: ['src/routes/panduan/+page.svelte', 'src/routes/biaya/+page.svelte']
---

Scope: calculator route `/` (Operate). Inner pages `/panduan` and `/biaya` (Read) inherit this world.
Audience and job: Stockbit/Ajaib retail investor on a phone beside the broker app, checking a planned average-down or sell before placing it.
Constraints: daisyUI `rata`/`rata-dark` tokens, square, flat, 1px rules, Geist + Geist Mono, framed column. Static navbar.

## Direction contract

THESIS: The page reads like the trade itself, left to right: what you hold, what you place, what you get. It refuses the hero-plus-form-plus-stat-tile arrangement.

OWN-WORLD: The frame's 1px rules become the layout grid. Three ruled columns share one header rule, with drawn arrow nodes on the dividers. Neutral greys, green only for the answer, action, focus and the moved distance. Mono for every figure.

STORY: The investor copies lot, average and market from the broker app, types the order, and reads the new average, the cash needed and the fees. Then they place the order.

FIRST VIEWPORT: Static bar with logo and Kalkulator, Panduan, Biaya. A compact H1 row. Beli/Jual tabs with Reset on the right. Columns 1fr 1fr 1.3fr: Posisi, Order, Hasil. Hasil shows the figure at text-5xl with a caption under it, a price ruler, then ledger rows. Below lg the columns stack and a result echo links to Hasil.

FORM: Pipeline, position 5 of 7 in my ordered list, seed key ff5b52bb. Signature move: the price ruler marking harga beli, rata-rata lama and rata-rata baru, with the moved segment in primary.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
