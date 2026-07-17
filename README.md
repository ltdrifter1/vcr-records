# VCR Recordings

Independent electronic music label site — light, modern frontend for [vcrrecords.com](https://www.vcrrecords.com).

## Stack

Static HTML/CSS/JS (`vcr.css`, `vcr.js`) + JSON data in `/data`, with a small Stripe Checkout API.

## Deploy on Vercel

1. Import the GitHub repo in [Vercel](https://vercel.com/new)
2. Framework preset: **Other** (static)
3. Add environment variables:
   - `STRIPE_SECRET_KEY` — Stripe secret key (`sk_live_…` or `sk_test_…`)
   - `SITE_URL` — `https://www.vcrrecords.com` (or your Vercel domain)
4. Deploy

Checkout uses the serverless route `POST /api/create-checkout-session`. Large audio files are excluded via `.vercelignore` — set `data/media.json` → `baseUrl` to stream/download from your public media host (R2/S3/etc.).

Optional CLI:

```bash
npm i -g vercel
vercel
vercel env add STRIPE_SECRET_KEY
vercel env add SITE_URL
vercel --prod
```

Point the custom domain `www.vcrrecords.com` at the Vercel project when ready.

## Local preview

Static only:

```bash
python3 -m http.server 8080
```

With Stripe Checkout API:

```bash
npm install
cp .env.example .env   # then edit keys
export STRIPE_SECRET_KEY=sk_test_...
export SITE_URL=http://localhost:3000
npm run dev
```

Cart posts to `POST /api/create-checkout-session`. Without the API, checkout falls back to existing Stripe payment links.

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
- `cart.html` — multi-item cart → Stripe Checkout
- `thank-you.html` — post-purchase downloads
