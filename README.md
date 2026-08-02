# Club Copy

Static site for Club Copy, an independent record label from the Pacific Northwest.

## Design

Warm, editorial, precise. Shared design tokens and site chrome live in `css/site.css`;
the audio dock styles live in `css/player.css`. Shared nav/drawer lives in `js/site.js`.
Pages keep only page-specific rules inline.

- Background `#FAF8F5` · Ink `#111111` · Cards `#FFFFFF` · Soft ground `#F2F0EC` · Borders `#E5E3DF`
- Type: Space Grotesk

## Develop

```bash
npx serve .
```

## Deploy

Vercel static hosting (`framework: null`, `outputDirectory: "."`). Root `index.html` is the homepage.
Merch checkout runs through `api/create-checkout-session.js` (Stripe, requires `STRIPE_SECRET_KEY`).
Legacy mix/archive URLs redirect to `/catalogue`.
