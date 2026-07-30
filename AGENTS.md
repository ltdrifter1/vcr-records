# VCR Recordings — legacy static site

Static HTML/CSS/JS catalog for VCR Recordings (independent electronic music). Pages, artwork, and audio all live at the repo root (`index.html`, per-release HTML like `champ.html`, `style.css`, `app.js`, plus media assets). Deployed as a static site on Vercel (`vercel.json`).

## Cursor Cloud specific instructions

### Running the site (primary product)
- Dev server: `npx -y serve . -l 3000` (from repo root). This is the documented workflow (see `README.md`). `serve` is not installed globally; it runs via `npx` from cache.
- `serve` applies Vercel-style `cleanUrls`, so `/champ.html` 301-redirects to `/champ`. Internal links already use `.html`, so both forms work.
- There is no build step, no test suite, and no linter configured. "Building" just means serving the static files.
- The `stream.html` and `player.html` pages reference a `static/` folder (e.g. `static/mixes`, `static/viz`, `http://localhost:8000` icecast stream) that does not exist in the repo — they are legacy/standalone pages and are expected to be non-functional locally.

### Optional Stripe checkout backend (`server.js`)
- `server.js` is an Express + Stripe endpoint (`POST /create-checkout-session`) used by `checkout.html`. It is optional and NOT required for browsing the catalog or the client-side cart (cart state lives in `localStorage`).
- There is no `package.json`; running it requires installing deps ad hoc: `npm i express stripe` then `node server.js` (listens on port 3000 — use a different port than the static server if running both).
- It contains a hardcoded Stripe test key. Real end-to-end checkout requires a valid `STRIPE` secret key and outbound network to Stripe; leave it optional unless a checkout task is requested.
