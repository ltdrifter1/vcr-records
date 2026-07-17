# VCR Recordings

Clean static site for [vcrrecords.com](https://www.vcrrecords.com).

## Deploy on Vercel

1. Import this repo at [vercel.com/new](https://vercel.com/new)
2. Framework: **Other** — leave Build Command empty
3. Output: `.` (root)
4. Deploy

No serverless functions. Checkout uses Stripe Payment Links on each product/release.

## Local preview

```bash
python3 -m http.server 8080
```

## Media

Set `data/media.json` → `baseUrl` to your public media host (sync from iCloud). Preview + downloads share the same folder per release.

## Structure

- `index.html` — home
- `data/` — artists, products, releases, media config
- `img/` — optimized WebP artwork
- `release.js` / `media.js` — release pages + remote audio
