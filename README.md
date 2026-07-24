# VCR Records

`vcrrecords.com` homepage is the immersive **360° store** (Next.js).  
The previous static marketing/shop site lives unchanged at **`/shop`** (legacy deep links / SEO).

## Routes

| Path | What |
|---|---|
| `/` | 360° illustrated record store (enter → look around → hotspots) |
| `/#music` `#videos` `#artists` `#shop` `#archive` `#contact` `#lore` | Deep-link a section after enter |
| `/shop/` | Legacy VCR HTML catalog (kept; primary Shop UX is in-room) |

Top-nav **Shop** and the cash-register hotspot open the **in-room counter panel**. Checkout still goes to Stripe / Bandcamp in a new tab. Browser Back closes the panel / restores the prior section.

## Develop

```bash
npm install
npm run dev
```

- 360 app: http://localhost:3000  
- Legacy site: http://localhost:3000/shop/

## Deploy

Vercel project for this repo (Next.js). Domain `vcrrecords.com` should point at this deployment.
