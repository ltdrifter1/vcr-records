# Club Copy — Audit, Pass C (deploy + live)

**Role:** UI / identity for a music, editorial, and culture site  
**Scope:** Repository `main` at `1d2431e` and production `https://www.clubcopy.ca/` on 18 September 2026, **after** the Vercel outage window. No product UI was redesigned for this pass.  
**Previous:** [Pass A](creative-audit.md) 67 · [Pass B](creative-audit-pass-b.md) 75 (HEAD), ~62 (live Bondi replica)

---

## 1. What the failure email was

Team Luke, project `vcr-records`, branch `main`, commit `3b7f11b`  
**Message:** Unblock Vercel deploys: drop function memory and a duplicate redirect. (#615)  
**Failed at:** 18 September 2026, 3:49 PM UTC

That email is **stale relative to HEAD**. `#615` did fail. `#616` (`1d2431e`, *Stop shipping Instagram scrapers as Vercel functions*) is **green** on Vercel and Cloudflare Pages. Live HTML matches HEAD (`content-length` 47554, `last-modified` 16:08 UTC, generator `club-copy-os-st21`).

| Commit | Intent | Vercel |
|---|---|---|
| `ea4bb00` (16 Sep) | Last good production before the outage | Success |
| `a739122` (#598) onward | Instagram `/api` scrapers added | Fail (until #616) |
| `3b7f11b` (#615) | Drop `memory` + duplicate `/still` redirect | **Fail** (the email) |
| `1d2431e` (#616) | Move scrapers out of `/api`; `catalog.js` into a module | **Success** |

Cloudflare Pages was deploying the steel site the whole time. DNS for clubcopy.ca still answers `server: Vercel`, so only a green Vercel production build updates the public brand.

---

## 2. Root cause (not Fluid `memory`)

Hobby is capped at **12 serverless functions**. On this project **every `.js` file under `/api` is a function**, including helpers that never export a handler.

Count at `#615` (still red):

| Path | Count |
|---|---|
| Real handlers (`create-checkout-session`, membership, webhook, club-credit, club-member, bandcamp-stream, preview) | 7 |
| Instagram scrapers (`instagram-feed`, `instagram-media`) | 2 |
| `api/catalog.js` (module, treated as a handler) | 1 |
| `api/lib/{bandcamp,credit-ledger,mailer}.js` | 3 |
| **Total** | **13 > 12** |

`#615` removed `memory: 256` (invalid under Fluid) but left 13 functions. `#616` moved the scrapers to `scripts/` and `catalog.js` into `api/lib/` → **11 functions** → deploy green.

Confirmed on live after `#616`:

- `GET /` steel plate, You Are (Love), no Bondi home
- `GET /you-are-love` **200** (was 404 on the frozen production build)
- `GET /api/preview?release=you-are-love` Bandcamp mp3-128 for the title track
- `GET /api/instagram-feed` and `/api/instagram-media` **404** (intentional)
- `GET /api/lib/catalog` **500** `FUNCTION_INVOCATION_FAILED` — leftover modules still deployed as functions

Eleven functions is one new `/api/*.js` file away from another production outage.

---

## 3. Live vs repository (this pass)

Pass B’s split reality is **closed**. Public clubcopy.ca is the steel listening plate, not the Bondi Click Wheel. `/you-are-love` exists. The feature record has cues in `catalog.json` and the preview API returns a live stream.

**Keep:** plate-as-object, five-link-or-fewer nav, aluminum dock, Night Shift voice, Bandcamp bridge, Record Club desk, acid as LED only.

**Still not the brief (do not mix into this deploy fix):**

- Library still offers Cover Flow (`?view=covers`); default is already `list`.
- `aqua-world.css` + `club-copy-os.css` + homepage inline lock still fight caches.
- Home still has mixtapes / Instagram wells between paper and club.
- Click Wheel CSS / `js/ipod.js` still in the repo.
- Digital **$9** on the Riscape plate vs documented format tier **$8** (catalog is the live source).
- Artists roster correctly off home; Artists also hidden from home nav via `!important` (README still says “Artists stays in nav”).

**Score for current live + HEAD (same site):** **78 / 100**. +3 vs Pass B HEAD because production finally matches and the featured EP is wired. Held down by Cover Flow as a product surface, leftover replica CSS, and empty/secondary wells on home.

---

## 4. Fix shipped with this pass

Move `api/lib/*` → `/lib` and point handlers at `../lib/…`.

After that, Vercel should deploy **7 functions** (the `vercel.json` list). Shared catalog, Bandcamp, credit, and mailer code is no longer addressable as `/api/lib/…` and no longer burns the Hobby cap.

No homepage, plate, or component redesign in this change.

---

## 5. What not to do next

- Do not put scrapers, scripts, or shared modules back under `/api`.
- Do not treat another `memory` / redirect tweak as the deploy incident.
- Do not reopen Bondi or the Click Wheel to “match what production used to be.”
- Do not flatten Night Shift while cleaning CSS.
