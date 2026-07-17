# VCR Recordings

Static site for [vcrrecords.com](https://www.vcrrecords.com).

## Local preview

```bash
python3 -m http.server 8080
```

## Structure

- `index.html` — home
- `data/` — artists, products, releases, media config
- `img/` — optimized artwork
- `release.js` / `media.js` — release pages + remote audio

Checkout uses Stripe Payment Links on each product/release.

Set `data/media.json` → `baseUrl` for streaming/downloads from your public media host.
