# Club membership & account audit

**Scope:** the "Join the Record Club" flow (`index.html#join`), the member state
carried around the site (`js/member.js`), and everything downstream of signup
(profile access, Club Credit, email).

## What was actually broken

1. **No account/profile page existed.** The only place a member's card was
   ever shown was a hidden panel inside `#join` on the homepage, and it only
   rendered from `localStorage` — clear your cache, switch browsers, or open
   the site on your phone and your membership was invisible. The nav pill
   (`.nav-member`, "Member 0000") linked back to `#join`, not to anything
   that showed your card, credit, or let you manage the account.
2. **Signup only ever wrote to `localStorage`+ fired a client call it
   ignored.** `POST /api/club-member` was called but the response (and any
   error) was discarded (`catch (e) {}`), so the "member number" shown on
   screen was a client-side hash of the email — never reconciled with the
   Stripe-Customer-backed record the backend actually keeps. If the API
   call failed, the UI still declared success.
3. **No transactional email anywhere.** There is a Stripe Checkout +
   webhook + Club Credit ledger already built in `api/`, but nothing ever
   emailed a member their card, a receipt beyond Stripe's own, or a
   confirmation for the Free tier (Free signup only posted to the site's
   general newsletter Formspree form — it never told the person "you're
   member #1234").
4. **Club Credit balance was invisible.** `api/club-credit.js` /
   `api/lib/credit-ledger.js` fully implement a ledger (grants from Premium
   signup, spends at checkout, Stripe balance-transaction mirroring) but no
   page anywhere read from it. Premium members had no way to see their
   balance or history.
5. **Dead CSS hinting at more missing wiring:** `body.is-club-member
   .lib-member-banner` in `css/site.css` targets an element that doesn't
   exist in `library.html` — a banner that was clearly planned but never
   added.

## What was fixed in this change

- **New `/account.html`** — a real profile page:
  - Shows the membership card (level, member number, layer, member-since)
    exactly like the Stripe checkout confirmation card.
  - Fetches `/api/club-member?email=` and `/api/club-credit?email=` so the
    card and balance always reflect the server, not just whatever was
    cached locally.
  - Lets you edit your display name (`POST /api/club-member`) and sign out
    on the device.
  - Falls back to an email-lookup panel when there's no local profile
    (new device, cleared storage), since the site has no password auth —
    documented plainly on the page.
- **Nav pill now links to `/account`** instead of back to `#join`
  (`js/member.js`). The homepage member panel and the Stripe thank-you
  page also link there.
- **Signup now awaits the server write** and reconciles the local profile
  with the server's response; Free signup surfaces an error instead of
  silently declaring success if `/api/club-member` fails.
- **Welcome / confirmation emails** — new `api/lib/mailer.js` (Resend REST
  API, no SDK, same fetch-based pattern as the rest of `api/`):
  - Free/Club signup on `api/club-member.js` sends the welcome email
    immediately for new **Free** members (nothing to wait on — there's no
    payment step).
  - `api/stripe-webhook.js` sends the welcome email for **Club/Premium**
    once `checkout.session.completed` confirms payment, including the
    Club Credit grant amount for Premium.
  - Like the rest of this backend, it's optional-by-default: with no
    `RESEND_API_KEY` set it's a documented no-op, so nothing breaks in an
    unconfigured environment (mirrors how `STRIPE_SECRET_KEY` / Upstash
    Redis are already optional in `api/lib/credit-ledger.js`).

## Still needs a human to flip the switch

None of this required new UI surface area beyond `/account.html` — it's
wiring that plugs into APIs that were already written. To go fully live:

- [ ] Set `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` on Vercel (Club/
      Premium checkout + webhook are currently `503` without it — see
      `docs/stripe-integration-plan.md`).
- [ ] Set `RESEND_API_KEY` (and optionally `MAIL_FROM`) on Vercel to turn
      on welcome emails. Without it, signup still works, it just won't
      send mail — same graceful-degradation pattern as the rest of `api/`.
- [ ] Optional: set `KV_REST_API_URL` / `KV_REST_API_TOKEN` (Upstash/Vercel
      KV) so Club Credit has a real ledger instead of falling back to
      Stripe Customer balance transactions.
- [ ] Consider wiring the `.lib-member-banner` CSS hook into
      `library.html` (dead code today) now that `/account` gives members
      somewhere to land from it.
