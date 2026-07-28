# STEREO-MART

`stereo-mart.com` is the immersive **360° store** (Next.js).  
Legacy catalog URLs under `/shop` redirect to a thin brand bridge that
sends visitors into the room.

## Routes

| Path | What |
|---|---|
| `/` | 360° illustrated record store (enter → look around → hotspots) |
| `/#music` `#videos` `#artists` `#shop` `#contact` | Deep-link a section after enter |
| `/shop` | Brand bridge → enter the store (`/#shop`). Old `/shop/*.html` URLs 301 here. |

Top-nav **Shop** and the cash-register hotspot open the **in-room counter panel**. Checkout still goes to Stripe / Bandcamp in a new tab. Browser Back closes the panel / restores the prior section.

## Content

In-room releases, CRT channels, and shop rows live in **`app/data/catalog.ts`** —
edit that file to change what the store plays and sells.

## Develop

```bash
npm install
npm run dev
```

- 360 app: http://localhost:3000  
- Shop bridge: http://localhost:3000/shop

## Deploy

Vercel project for this repo (Next.js). Domain `stereo-mart.com` should point at this deployment.
