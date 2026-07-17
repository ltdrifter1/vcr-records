# VCR Recordings

Independent electronic music label site — light, modern, analog-textured frontend for [vcrrecords.com](https://www.vcrrecords.com).

## Stack

Static HTML/CSS/JS with shared design system (`vcr.css`, `vcr.js`) and data files in `/data`.

## Key pages

- `index.html` — homepage
- `artists.html` / `artist-*.html` — roster
- `champ.html` / `summer.html` / … — releases (via `data/releases.json` + `release.js`)
- `shop.html` / `product-*.html` — merch
- `cart.html` — multi-item cart → Stripe Checkout
- `about.html` / `contact.html`

## Data

- `data/artists.json`
- `data/products.json`
- `data/releases.json`

## Local preview

```bash
python3 -m http.server 8080
```

## Stripe Checkout

```bash
npm install
export STRIPE_SECRET_KEY=sk_test_...
export SITE_URL=http://localhost:3000
npm start
```

Cart posts to `POST /create-checkout-session`. Without the API, checkout falls back to existing Stripe payment links.
