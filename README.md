# Rata

Kalkulator saham client-side untuk menyimulasikan pembelian sebelum mengirim order ke broker.
Rata menghitung harga rata-rata baru, total lot, nilai investasi, dana beli, fee Stockbit, dan
jumlah lot minimum untuk mencapai rata-rata target.

## Perhitungan

- 1 lot = 100 lembar saham.
- Harga rata-rata baru menggunakan weighted average dari harga transaksi, tanpa fee.
- Dana beli memasukkan fee beli Stockbit 0,15%.
- Fee jual 0,25% tidak diterapkan karena aplikasi hanya menyimulasikan pembelian.
- Bea materai tidak ditambahkan otomatis karena ditentukan oleh total transaksi harian.
- Semua input dan kalkulasi tetap di browser. Tidak ada server atau penyimpanan data.

Referensi fee: [Stockbit Sekuritas](https://help.stockbit.com/id/article/transaksi-saham-berapa-biaya-trading-di-stockbit-sekuritas-1lbkyq9/).

## Prasyarat

- Bun 1.3.11+

## Menjalankan aplikasi

```sh
bun install --frozen-lockfile
bun run dev
```

Buka URL lokal yang ditampilkan Vite. Contoh awal seharusnya menghasilkan 336 lot dengan
rata-rata Rp390,62 dan kebutuhan dana beli sekitar Rp1.335.801.

## Verifikasi

```sh
bun run lint
bun run check
bun run test
bun run build
```

## Struktur utama

- `src/routes/+page.svelte`: UI dan state input kalkulator.
- `src/lib/rata.ts`: perhitungan domain murni tanpa dependency browser.
- `src/lib/rata.spec.ts`: unit test untuk kalkulasi dan batas input.
- `src/routes/layout.css`: Tailwind CSS, tema daisyUI, dan token visual.

## Catatan

Hasil aplikasi adalah estimasi dan bukan rekomendasi investasi. Periksa kembali biaya broker
sebelum bertransaksi karena ketentuan dapat berubah.
