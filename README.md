# Club Copy

Static site for Club Copy, an independent record label from the Pacific Northwest.

## Design

Night Shift paper across the site. Homepage art direction in `css/home-zine.css`; every interior page loads `css/zine-pages.css` (`body.zine-surface`) so Library, Artists, Shop, releases, About, and utility pages share the same issue: paper, condensed display, hard rules, lime stamps.
The zine (`css/news.css`) is the evening paper — Barlow Condensed display, Archivo body, fluorescent lime. `/news` is the live front.
Listening sleeve object: `css/listen-object.css`. Audio dock: `css/player.css`.

- Paper `#F7F5F1` · Ink `#111111` · Acid lime `#C6FF1A` · Muted kickers `#5F636B`
- Type: Barlow Condensed display · Archivo body · IBM Plex Mono specs · Oswald gothic nav

## Commerce

- **Format prices (CAD):** Digital **$8** · Cassette **$20** · Vinyl **$45**
- **Membership (Record Club):** **Free** (alerts + catalog) · **Club** **$5/yr** (**30% off all music** — digital, cassette, vinyl) · **Premium** **from $10/yr** (**50% off all music**, plus pay-what-you-want → **2.5×–5.0× Club Credit** toward physical editions; $10→$25, $100+→5×)
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
