# Club Copy — Stripe integration plan

**Business:** [clubcopy.ca](https://www.clubcopy.ca) · Independent record label (Pacific Northwest)  
**Product focus:** One-time Payments (music + merch)  
**Stack:** Static site on Vercel + `api/create-checkout-session.js` serverless function  
**Currency:** CAD

> Generated from Stripe best-practices guidance (`npx skills add https://docs.stripe.com`) because the Stripe MCP `stripe_implementation_planner` tool is not yet authenticated in this Cloud Agent environment. Re-run via MCP once the Stripe plugin + `https://mcp.stripe.com` OAuth are connected.

---

## Recommended architecture

| Decision | Choice | Why |
| --- | --- | --- |
| Payment API | **Checkout Sessions** (`mode: payment`) | Hosted, PCI-light, shipping + adaptive payment methods built in |
| UI surface | Stripe-hosted Checkout (redirect from bag) | Already wired; best conversion for a small label shop |
| Catalog model | Stripe **Products + Prices** with `lookup_key`s | Stable “codes” for formats and SKUs; Dashboard-visible |
| Payment methods | Omit `payment_method_types` | Dynamic payment methods from Dashboard |
| Tax | Stripe Tax later (after CA registration) | Do **not** enable `automatic_tax` until a registration is active |
| Keys | Restricted key (`rk_`) on Vercel (sensitive env) | Least privilege vs full `sk_` |
| Fulfillment | Webhook `checkout.session.completed` | Digital email delivery + physical packing queue |

Do **not** use Charges, Sources, Tokens, or Card Element.

---

## Format price codes (phase 1)

Three reusable format tiers — your “codes”:

| Lookup key | Format | Amount | Notes |
| --- | --- | --- | --- |
| `fmt-digital` | Digital download | **$8.00 CAD** | Email fulfillment; no shipping |
| `fmt-cassette` | Cassette | **$20.00 CAD** | Physical; CA/US shipping |
| `fmt-vinyl` | Vinyl | **$45.00 CAD** | Physical; CA/US shipping |

Each release SKU (`dg-enter`, `sm-cassette-inlet-knight`, future `sm-vinyl-*`) maps to one of these amounts. Per-SKU Stripe Products still get their own Price so line items show the release name; amounts stay locked to the format tier.

Merch apparel/essentials keep individual SKU prices (phase 2 sync).

---

## Implementation steps

### 1. Secrets & Dashboard

1. Create a Stripe account (or use existing) for Club Copy.
2. Prefer a **restricted API key** with Checkout Sessions write + Products/Prices write + Webhooks read.
3. Set on Vercel (Production + Preview):
   - `STRIPE_SECRET_KEY` (or `STRIPE_RESTRICTED_KEY`)
   - `STRIPE_WEBHOOK_SECRET` (after webhook endpoint exists)
   - Optional: `STRIPE_CURRENCY=cad`
4. Enable desired payment methods in Dashboard (cards, Link, etc.) — no code change needed.

### 2. Provision Products / Prices

Run `node scripts/sync-stripe-catalog.js` with `STRIPE_SECRET_KEY` set. It creates/updates:

- Format products: `fmt-digital`, `fmt-cassette`, `fmt-vinyl`
- Per-SKU products for every item in `api` catalog (music first; merch next)

Prices use `lookup_key` = SKU (or format key) so Checkout can resolve `price` by key.

### 3. Checkout Session (server)

`POST /api/create-checkout-session`:

- Validate SKUs server-side (never trust client prices)
- Build `line_items` from catalog amounts / Stripe Price IDs
- Collect shipping **only** when the bag has a physical item (CA + US)
- `success_url` → `/thank-you.html?session_id={CHECKOUT_SESSION_ID}`
- `cancel_url` → `/cart.html?canceled=1`
- Attach `metadata.sku` / colour / size for fulfillment
- Do not pass `payment_method_types`

### 4. Webhooks

Endpoint `POST /api/stripe-webhook`:

- Verify signature with `STRIPE_WEBHOOK_SECRET`
- Handle `checkout.session.completed`:
  - Digital: queue download email (Bandcamp-style / signed URL / fulfillment inbox)
  - Physical: notify packing (email or Sheet)
- Idempotent on `event.id`

### 5. Go-live checklist

- [ ] Test mode end-to-end: digital-only bag + mixed bag + cassette/vinyl shipping
- [ ] Webhook delivery confirmed in Dashboard
- [ ] Live restricted key rotated onto Vercel
- [ ] Thank-you page clears bag / shows order summary
- [ ] CA tax registration reviewed before enabling Stripe Tax

---

## Phase 2 (merch codes)

After music formats are live, re-run the sync script for apparel / essentials SKUs (`sm-simple-tee`, `sm-hoodie`, …) so every shop item has a Dashboard Product + Price code.
