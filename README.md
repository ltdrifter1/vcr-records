# VCR Recordings (legacy site)

Static HTML catalog for **VCR Recordings** — independent electronic music.

This replaces the previous Stereo-Mart / Next.js 360° storefront. Pages and media live at the repo root (`index.html`, product HTML, artwork, audio).

## Develop

Open `index.html` locally, or serve the folder:

```bash
npx serve .
```

## Deploy

Vercel static hosting (`vercel.json`). Root `index.html` is the homepage; `cleanUrls` maps `/about` → `about.html`, etc.
