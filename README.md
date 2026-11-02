# Club Copy

Static site for Club Copy, an independent record label from the Pacific Northwest.

## Design

Black ground, one grotesk, hairlines. The catalogue is the site. Direction and research in [`docs/redesign-2026-10.md`](docs/redesign-2026-10.md).

- Type: **Archivo** (variable width; expanded for display, normal for body) and **IBM Plex Mono** for catalogue data. No second display face.
- Ground: the paper colour. Night `#CFC6B8`, day `#F3EFE6`, ink `#1A1C1E`. The tooth is in the colour (`css/paper.webp`, overlaid). Signal `#E23B10` is state (on air, active row, focus).
- Layout: full-width rows separated by one hairline; release rows put the text left and the cover right; the Library is a dense list with genre and artist filters and a sleeves view.
- One stylesheet: `css/cc.css`. The paper is the only texture. No stamp shadows, gel highlights, or a second typeface.

## Build

Every page is generated from the data files:

```bash
node scripts/build-site.js
```

Sources: `data/catalog.json` (releases, artists, notes, specs), `data/news.json` + `data/issues.json` + `data/zine.json` + `content/news/<id>.html` (Night Shift), `data/merch.json` (shop), `data/mixtapes.json` + `data/mix-genres.json` (mixtapes, read at runtime). Templates live in `scripts/site/`. The generated HTML is committed; Vercel serves it as static files, so run the build and commit the output after any data change. `scripts/migrate/` holds the one-time scripts that moved page-bound content into the data files.

Page scripts keep their DOM contracts: `js/player.js` (dock, Now Playing, streams), `js/plate.js` (home lead release), `js/library.js` (filters, rows), `js/tapes.js` (SoundCloud mixes), `js/zine.js` (Night Shift), `js/cart.js` + `js/cart-page.js`, `js/member.js` + `js/join.js` + `js/account-page.js`, `js/shop.js` + `js/product.js`, `js/cc.js` (on-air state and add-to-cart on generated rows).

## Commerce

- **Format prices (CAD):** Digital **$9** on the current EP (*You Are (Love)*); other digital files are priced per release · Cassette **$20** · Vinyl **$45**
- **Membership (Record Club):** **Free** (alerts + catalog) · **Club** **$5/yr** (**30% off all music** — digital, cassette, vinyl) · **Premium** **from $10/yr** (**50% off all music**, plus pay-what-you-want → **2.5×–5.0× Club Credit** toward physical editions; $10→$25, $100+→5×)
- **Club Credit ledger:** email-keyed balance. Premium webhook grants **$25**; cart can apply credit at Checkout via one-time Stripe coupon; webhook debits on success. Storage: Upstash/Vercel KV if configured, else Stripe Customer metadata + balance transactions.
- **Physical** (vinyl, cassette, merch): bag → Stripe Checkout. Ships **Canada & US** only ($8 / $14 CAD).
- **Digital**: sold on-site (email delivery after Checkout).
- On-site listening plays Bandcamp `mp3-128` streams through the Club Copy player (`/api/bandcamp-stream` 302s to the live file; `/api/preview` returns the same URL as JSON). Local `previews/` files are a fallback only. Unwired or dead cues surface an error in the player. The player does not attach Web Audio to those streams (Bandcamp has no CORS headers, and `MediaElementSource` would mute playback).

### Mix genre tags

The genre tags under each mix are SoundCloud's own genre + tags for that mix. The RSS feed doesn't carry them, so they are snapshotted from the track pages: `node scripts/sync-soundcloud-genres.js` writes `data/mix-genres.json` (run it when mixes are added or retagged, then commit the file). The summary line reports how many mixes came back with tags; it exits non-zero if none did. A mix with no SoundCloud tags falls back to genre words in its title (`GENRE_RULES` in `js/tapes.js`), and shows no tags if there are none.

### Video feed

The "Video feed" rows on the home page come from the public RSS feed of the LT Drifta YouTube channel (no API key): `node scripts/sync-youtube-videos.js` writes `data/videos.json`, and `node scripts/build-site.js` renders the latest four as rows. The `Sync video feed` workflow runs both daily and commits when the list changed. The feed carries the latest 15 uploads. When it returns fewer than 15, that is the whole channel and videos missing from it are removed. When it returns 15, older entries already in the file are kept, and a stored video new enough to have been inside that window but missing from it is removed. A click on a row swaps the thumbnail for the embed on `youtube-nocookie.com` and pauses the site player.

### Stripe setup

1. Set `STRIPE_SECRET_KEY` on Vercel (prefer a restricted key `rk_…`).
2. Sync Products/Prices: `STRIPE_SECRET_KEY=… node scripts/sync-stripe-catalog.js --music-only`
3. Paste printed `STRIPE_PRICE_*` env vars into Vercel (optional; Checkout works with `price_data` until set).
4. Add webhook endpoint `/api/stripe-webhook` for `checkout.session.completed` and set `STRIPE_WEBHOOK_SECRET`.

See `docs/stripe-integration-plan.md` for the full plan.

## Develop

```bash
node scripts/build-site.js && npx serve .
```

## Deploy

Vercel static hosting (`framework: null`, `outputDirectory: "."`). Root `index.html` is the homepage.
Merch checkout runs through `api/create-checkout-session.js` (Stripe, requires `STRIPE_SECRET_KEY`).
Shared Node helpers live in `/lib`, not `/api` — Hobby is capped at **12 serverless functions**, and every `.js` file under `/api` counts (that is why Instagram scrapers in `/api` failed production, and why `api/lib` still counted after they were moved).
Legacy / redirected URLs land on `/library` or `/merch`.
