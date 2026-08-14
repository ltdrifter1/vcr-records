# Club Copy

Static site for Club Copy, an independent record label from the Pacific Northwest.

## Design

Warm, editorial, precise. Shared design tokens and site chrome live in `css/site.css`;
the audio dock styles live in `css/player.css`. Shared nav/drawer lives in `js/site.js`.
Pages keep only page-specific rules inline.

- Background `#FAF8F5` · Ink `#111111` · Cards `#FFFFFF` · Soft ground `#F2F0EC` · Borders `#E5E3DF`
- Type: Space Grotesk

## Commerce

- **Format prices (CAD):** Digital **$8** · Cassette **$20** · Vinyl **$45**
- **Membership (Record Club):** **Free** (alerts + catalog) · **Club** **$0.99/mo** (digital record club — member pricing, exclusives, card) · **Premium** **$10/yr** (**$25 Club Credit** toward physical editions)
- **Club Credit ledger:** email-keyed balance. Premium webhook grants **$25**; cart can apply credit at Checkout via one-time Stripe coupon; webhook debits on success. Storage: Upstash/Vercel KV if configured, else Stripe Customer metadata + balance transactions.
- **Physical** (vinyl, cassette, merch): bag → Stripe Checkout. Ships **Canada & US** only ($8 / $14 CAD).
- **Digital**: sold on-site (email delivery after Checkout).
- On-site listening uses **90s preview** clips in `previews/` only — full masters are not in the deploy.

### Stripe setup

1. Set `STRIPE_SECRET_KEY` on Vercel (prefer a restricted key `rk_…`).
2. Sync Products/Prices: `STRIPE_SECRET_KEY=… node scripts/sync-stripe-catalog.js --music-only`
3. Paste printed `STRIPE_PRICE_*` env vars into Vercel (optional; Checkout works with `price_data` until set).
4. Add webhook endpoint `/api/stripe-webhook` for `checkout.session.completed` and set `STRIPE_WEBHOOK_SECRET`.

See `docs/stripe-integration-plan.md` for the full plan.

## Develop

```bash
npx serve .
```

## Deploy

Vercel static hosting (`framework: null`, `outputDirectory: "."`). Root `index.html` is the homepage.
Merch checkout runs through `api/create-checkout-session.js` (Stripe, requires `STRIPE_SECRET_KEY`).
Legacy / redirected URLs land on `/library` or `/merch`.
