# Club Copy

Static site for Club Copy, an independent record label from the Pacific Northwest.

## Design

Warm ground + chrome-glass Y2K. Shared tokens in `css/site.css`.
Night continuum (`css/surface-night.css`) for music path: Home, Library, Artists, About, News index.
Acetate continuum (`css/surface-acetate.css`) for utility/read: Contact, Shipping, Cart, news articles, merch PDPs.
Station bumper (`css/station-bumper.css`) is the shared page entrance — brand lockup first.
Listening sleeve object: `css/listen-object.css`. Audio dock: `css/player.css`.

- Background `#F7F5F1` · Ink `#111111` · Night ground `#0a0a0c`
- Type: Space Grotesk + Oswald callsigns
- Chrome steel accents — not costume neon

## Commerce

- **Format prices (CAD):** Digital **$8** · Cassette **$20** · Vinyl **$45**
- **Membership (Record Club):** **Free** (alerts + catalog) · **Club** **$5/yr** (digital record club — member pricing, exclusives, card) · **Premium** **from $10/yr** (pay what you want → **2.5×–5.0× Club Credit** toward physical editions; $10→$25, $100+→5×)
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
