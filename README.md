# VCR Recordings

Independent electronic music label site — light, modern frontend for [vcrrecords.com](https://www.vcrrecords.com).

## Stack

Static HTML/CSS/JS (`vcr.css`, `vcr.js`) + JSON data in `/data`. No server required.

## Deploy on Vercel

1. Import the GitHub repo in [Vercel](https://vercel.com/new)
2. Framework preset: **Other** (static) — no build command
3. Deploy

Large audio files are excluded via `.vercelignore`. Set `data/media.json` → `baseUrl` to stream/download from your public media host (R2/S3/etc.).

Checkout uses **Stripe Payment Links** on each product/release (no serverless functions).

Point the custom domain `www.vcrrecords.com` at the Vercel project when ready.

## Local preview

```bash
python3 -m http.server 8080
```

## Data

- `data/artists.json`
- `data/products.json`
- `data/releases.json`
- `data/media.json` — remote media `baseUrl` for streaming + digital downloads

## Key pages

- `index.html` — homepage
- `artists.html` / `artist-*.html` — roster
- Release shells (`champ.html`, …) via `release.js`
- `shop.html` / `product-*.html` — merch
- `cart.html` — cart → Stripe Payment Links
- `thank-you.html` — post-purchase downloads
