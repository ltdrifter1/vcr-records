# VCR Recordings (legacy site)

Static HTML catalog for **VCR Recordings** — independent electronic music.

This replaces the previous Stereo-Mart / Next.js 360° storefront. Pages and media live at the repo root (`index.html`, product HTML, artwork, audio).

## Develop

Open `index.html` locally, or serve the folder:

```bash
npx serve .
```

## Deploy

Vercel must treat this as a **static** site (not Next.js). `vercel.json` sets `framework: null` and `outputDirectory: "."` so HTML at the repo root is served with no serverless functions.

Root `index.html` is the homepage; `cleanUrls` maps `/about` → `about.html`, etc. Cloudflare Pages also deploys from this repo.
