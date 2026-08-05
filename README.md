# Club Copy

Static site for Club Copy, an independent record label from the Pacific Northwest.

## Design

Warm, editorial, precise. Shared design tokens and site chrome live in `css/site.css`;
the audio dock styles live in `css/player.css`. Shared nav/drawer lives in `js/site.js`.
Pages keep only page-specific rules inline.

- Background `#FAF8F5` · Ink `#111111` · Cards `#FFFFFF` · Soft ground `#F2F0EC` · Borders `#E5E3DF`
- Type: Space Grotesk

## Commerce

- **Physical** (vinyl, cassette, merch): bag → Stripe Checkout. Ships **Canada & US** only ($8 / $14 CAD).
- **Digital**: Bandcamp only.
- On-site listening uses **90s preview** clips in `previews/` only — full masters are not in the deploy.

## Develop

```bash
npx serve .
```

## Deploy

Vercel static hosting (`framework: null`, `outputDirectory: "."`). Root `index.html` is the homepage.
Merch checkout runs through `api/create-checkout-session.js` (Stripe, requires `STRIPE_SECRET_KEY`).
Legacy / redirected URLs land on `/library` or `/merch`.
