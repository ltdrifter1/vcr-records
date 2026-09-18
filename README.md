# Club Copy

Static site for Club Copy, an independent record label from the Pacific Northwest.

## Design

One world: brushed iPod steel, not Bondi ice. Night Shift is the magazine *inside* that world — same aluminum, same type.
Homepage hero is a listening plate (sleeve + LCD + Play), not a Click Wheel replica: `css/listen-plate.css`.
`css/club-copy-os.css` loads last (after `aqua-world.css`) and is the lock: grey tokens, no cyan fills, no Artists roster block on home (Artists stays in nav).
Listening sleeve object: `css/listen-object.css`. Audio dock: `css/player.css` (aluminum / LCD, not an iOS pill).

- Steel `#E8E8E6` · LCD ink `#1A1A1A` · Stamp `#B8B8B4` · Select `#2A2A28` · LED `#E4E4E0`
- Type: Oswald display · Archivo body · Lucida Grande UI/LCD · IBM Plex Mono specs

## Commerce

- **Format prices (CAD):** Digital **$8** · Cassette **$20** · Vinyl **$45**
- **Membership (Record Club):** **Free** (alerts + catalog) · **Club** **$5/yr** (**30% off all music** — digital, cassette, vinyl) · **Premium** **from $10/yr** (**50% off all music**, plus pay-what-you-want → **2.5×–5.0× Club Credit** toward physical editions; $10→$25, $100+→5×)
- **Club Credit ledger:** email-keyed balance. Premium webhook grants **$25**; cart can apply credit at Checkout via one-time Stripe coupon; webhook debits on success. Storage: Upstash/Vercel KV if configured, else Stripe Customer metadata + balance transactions.
- **Physical** (vinyl, cassette, merch): bag → Stripe Checkout. Ships **Canada & US** only ($8 / $14 CAD).
- **Digital**: sold on-site (email delivery after Checkout).
- On-site listening plays Bandcamp `mp3-128` streams through the Club Copy player (`/api/bandcamp-stream` 302s to the live file; `/api/preview` returns the same URL as JSON). Local `previews/` files are a fallback only. Unwired or dead cues surface an error in the player. The player does not attach Web Audio to those streams (Bandcamp has no CORS headers, and `MediaElementSource` would mute playback).

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
Shared Node helpers live in `/lib`, not `/api` — Hobby is capped at **12 serverless functions**, and every `.js` file under `/api` counts (that is why Instagram scrapers in `/api` failed production, and why `api/lib` still counted after they were moved).
Legacy / redirected URLs land on `/library` or `/merch`.
