# Club Copy — Creative Audit, Pass D

**Role:** Senior Creative Director, Brand Designer, UX/UI Designer (music / editorial / culture)  
**Scope:** Repository `main` at `a3b61fb` **and** production `https://www.clubcopy.ca/` captured 18 September 2026. They are the same site. **No product UI was redesigned for this audit.**  
**Date:** 18 September 2026  
**Previous:** [Pass A](creative-audit.md) 67 · [Pass B](creative-audit-pass-b.md) 75 · [Pass C](creative-audit-pass-c.md) deploy RCA (live = HEAD, Vercel Hobby cap)  
**Constraint:** Preserve distinctive work. Recommend the smallest set of high-impact moves. Reinterpret 1999–2005 digital culture; do not recreate it. Do not put scrapers back under `/api`.

---

## 1. Executive Summary

Club Copy now looks like a label, not like an Apple product.

The homepage is a steel listening plate for Riscape’s *You Are (Love)*: catalogue kicker, sleeve, LCD strip, Play, digital, cassette backorder. Night Shift still has a voice. The dock is an aluminum spec bar. Public clubcopy.ca matches git. The featured EP has Bandcamp cues. The replica Click Wheel is gone from the stage. That is the identity the brief asked for, and it is live.

The remaining problem is not costume versus language. It is **incomplete grammar**.

1. **The floor is missing.** The brief wants digital cameras, underground club graphics, and a culture site that feels collectible. `js/ig-feed.js`, `css/home-folio.css`, and `data/instagram-feed.json` already mix `@ltdrifta` and `@clubcopyrecords`. The homepage does not mount them. Pass A/B treated Instagram as empty product. That was wrong for this label: the floor is the camera roll, not a social widget. It must sit **under Night Shift**, as a 12-up contact sheet, served from a static snapshot — never as a Vercel scraper.
2. **Metadata was stripped.** `#612` dropped catalogue numbers from the public surface. The brief wants a site that is metadata-rich and collectible. Sleeves now say `EP · 15:02` instead of `CC004 · EP · cassette`. The library became a shop list.
3. **Artists are a secret.** Home CSS hides `/artists` with `!important` while the README still says the roster stays in nav. Library · Zine · Shop · Join is a storefront, not a label.
4. **The OS still fights itself.** Home is steel. Inner pages still load `aqua-world.css`. Record Club is a gold-foil night desk. Cover Flow remains an opt-in iTunes surface. Cache tags run `st18`–`st21`.

The site currently communicates: *we are a small steel library with a paper, and we sell the record on the plate.*  
It should also communicate: *we shoot the night, we number the objects, and you can hear them.*

**Verdict:** The replica problem is solved. Score is held by missing floor, missing catalogue language, and a storefront nav. Incremental HTML/CSS/JS — no new libraries, no `/api` scrapers — closes the gap.

---

## 2. Overall Score: **80 / 100**

A distinctive label OS, live. **+5** versus Pass B HEAD (75), almost entirely from shipping steel, wiring the feature, and defaulting Library to list. Pass C’s deploy work is why the public site can be scored at all.

---

## 2a. Live production vs repository

Captured 18 September 2026. Split reality from Pass A/B is **closed**.

| | **Production + HEAD (`a3b61fb`)** |
|---|---|
| Feature | You Are (Love) — Riscape, digital $9, cassette backorder, **playable** (`bandcampTrackId` on all four tracks) |
| Hero | Steel **listening plate**, LCD grammar, no chassis |
| Field | Steel `#E8E8E6` |
| Nav | **Library · Zine · Shop · Join** (Artists hidden on home) |
| `/you-are-love` | 200, steel object page |
| Library | List default; Cover Flow behind `?view=covers` |
| Floor | Feed code exists; **homepage section absent** |
| Functions | 7 handlers under `/api`. Instagram scrapers correctly in `scripts/` |

**Keep:** plate-as-object, aluminum dock, Night Shift masthead, sleeve index, Record Club desk, acid as LED, Bandcamp bridge, Hobby-safe function count.

**Do not take back:** Bondi, Click Wheel-as-logo, eight-item nav, cyan Join, Cover Flow as default, Instagram as a serverless scrape.

---

## 3. Detailed Scorecard

Scores are **/10**. Weighted score = (score/10) × category weight. Pass B in parentheses.

### 3.1 Brand Identity & Originality — 8.0/10 · **16.0 / 20** *(was 7.5 / 15.0)*

**Evidence**

- The plate names a Club Copy object, not an iPod. Oswald lockup, sleeve, LCD, cassette price. This is reinterpretation: iPod *grammar* without iPod *chassis*.
- Steel + LCD + acid-as-LED remains a rare position. Live finally wears it.
- Night Shift voice, cassette economics, Record Club — still original culture.
- Catalogue numbers removed from public chrome (`#612`). Internally `catalog.json` still has `CC004`. The collectible ID is hidden from the listener.
- Artists off home was a deliberate lock (`#614`). It protects the plate; it also makes the label feel like a shop with a zine.
- Gold foil (`--folio-foil: #d7c4a3`) on the Record Club desk is a third material (champagne) the steel world does not need.

**Recommendations**

1. Restore catalogue language on sleeves, plate LCD, and library rows (`CC004 · EP · cassette`). Keep it off marketing headlines if the number feels cold — it belongs on the spec line.
2. Put Artists back in chrome. Keep the photo roster off home.
3. Floor as contact sheet (graphite, square stills, handle as LCD), not Instagram UI and not gold.

### 3.2 Music-First UX & Information Architecture — 7.5/10 · **11.3 / 15** *(was 6.5 / 9.8)*

**Evidence**

- Featured H1 links to `/you-are-love`. Cues exist. `js/plate.js` will set `featured.playable` from catalog and Play will sound the sleeve.
- Nav is four items. Artists and About are absent on home; Contact lives in the drawer. Shop and Join outrank the roster.
- In rotation hydrates **the entire catalogue** (`js/home-wall.js`), not 8–12 objects. The wall becomes a second library.
- Mixtapes are empty (`data/mixtapes.json` `"tapes": []`) and correctly off home. Instagram is built and incorrectly off home.
- Footer now leads with Club Copy, then Copy House. Correct.

**Recommendations**

1. Mount the mixed 12-up floor under Night Shift, before Record Club. Snapshot JSON only.
2. Cap home wall at 8–12 newest (feature first). Link the rest to Library.
3. Nav: **Library · Artists · Zine · Shop · Join**. Tab bar can keep Join on home; Artists belongs in the mast.

### 3.3 Visual Language (Colour, Typography, Layout) — 7.5/10 · **11.3 / 15** *(was 7.0 / 10.5)*

**Evidence**

- Home Google Fonts: Oswald / Archivo / IBM Plex Mono. Lucida via system stack. The Pass A purge held on `index.html`.
- Steel field on home, library, zine is coherent.
- Inner templates still load `aqua-world.css?v=st18` plus `club-copy-os.css`. The lock works; the archaeology remains.
- Record Club is a navy well with gold kickers. One paper colour breaks after the zine.
- Night Shift masthead (inverted SHIFT, XXII, barcode) is still the strongest graphic on the site.

**Recommendations**

1. Floor and Record Club: graphite `#1A1A1A`, stamp `#B8B8B4`, pearl type. No foil, no Bondi.
2. Object pages already ink titles via OS lock (`-webkit-text-fill-color: #1a1a1a`). Keep that; stop loading archive title recipes that require the lock.
3. One Google Fonts URL sitewide.

### 3.4 Interface & Interaction Design — 7.5/10 · **11.3 / 15** *(was 7.0 / 10.5)*

**Evidence**

- Plate actions are real buttons: Play / Digital / Cassette / Details. No MENU/Select geometry.
- Aluminum dock appears on play. Right typology.
- Four plate buttons plus ticker still crowd mobile.
- Cover Flow is opt-in. Good. The control still teaches iTunes.
- Invert-select, LCD “Added” on cassette add — keep.

**Recommendations**

1. Mobile plate: Play + Digital as chrome; Cassette and Details as text.
2. Floor cards: square hit, handle, video glyph. Open Instagram in a new tab. No embed player.
3. Keep Cover Flow buried.

### 3.5 Catalogue & Music Player Experience — 8.0/10 · **8.0 / 10** *(was 7.0 / 7.0)*

**Evidence**

- `catalog.json` is the spine: 19 releases, SKUs, member prices, Bandcamp IDs. You Are (Love) is cued.
- Library defaults to list. Regular / Club tiles remain the collectible UI.
- Player: Bandcamp `mp3-128` via `/api/bandcamp-stream`; local `previews/` fallback. README is honest about CORS.
- Home wall play bezels now follow cues (`hasCue` in `home-wall.js`).
- Digital **$9** on the plate vs README format tier **$8**. Catalog is live source; docs drifted.
- Internals still named `vcr-player`.

**Recommendations**

1. Spec line includes catalogue ID + format.
2. Align README price with catalog, or catalog with the published tier — do not leave both.
3. Rename `vcr-*` only when those files are already open.

### 3.6 Zine & Editorial Integration — 8.0/10 · **8.0 / 10** *(unchanged)*

**Evidence**

- `/news` is excellent: desks, LIVE slug, Riscape cover, Stars, Tonight’s Record.
- Home `.zine--home` keeps nameplate, ticker, polaroid lead, three posts, tonight’s record. The lead is still a magazine spread.
- Tonight’s Record can be Portishead. Correct for a paper; noisy only if it outranks the plate. It no longer does.

**Recommendations**

1. Home: masthead + one image + three headlines is enough. The current lead is still “the issue.”
2. The floor under the paper is the editorial *afters* — camera stills, not a blog grid.
3. Do not flatten voice.

### 3.7 Motion & Micro-interactions — 7.0/10 · **3.5 / 5** *(was 6.5 / 3.3)*

**Evidence**

- Acid LED, dock rise, ticker, `prefers-reduced-motion` exist.
- Sleeve `is-live` now keys off the sounding release. The Pass B lie (Riscape spinning while Gorilla plays) is gone **when the feature is cued**.
- Cover Flow drag remains replica motion, opt-in.
- Floor hover scale already exists in folio CSS; keep it slow and slight.

**Recommendations**

1. Motion = state: LED, invert, progress, cart LCD flash, floor stills easing in.
2. No looping pulse. No scanlines on daylight.

### 3.8 Mobile & Responsive Experience — 7.5/10 · **3.8 / 5** *(unchanged)*

**Evidence**

- First screen: lockup + sleeve + LCD + actions + ticker + tab bar. No wheel.
- Tab bar: Library / Join / Zine / Shop. Artists hidden on home.
- Plate actions wrap; cassette label is long.
- Floor should be 2-up on a phone, 3-up tablet, 4-up desktop — a camera roll, not a masonry Instagram embed.

**Recommendations**

1. Two chrome buttons on the plate at small widths.
2. Floor: 12 equal squares. Do not span-2 the first cards (that layout was for 14).

### 3.9 Consistency & Design System — 5.5/10 · **2.8 / 5** *(was 5.0 / 2.5)*

**Evidence**

- Homepage stack: `site.css` → listen-object → listen-plate → fx → player → news → zine-pages → home-zine → home-folio → club-copy-os + inline lock. Dead Click Wheel CSS is gone from `index.html`.
- `aqua-world.css` still on most inner templates. `--bondi` alias remains.
- Cache tags `st18` / `st19` / `st20` / `st21`.
- Naming: VCRPlayer, Night Shift, Record Club, Planet MP3, Copy House.

**Recommendations**

1. One override file. Delete unused `js/ipod.js` from the home path if still unreferenced.
2. Stamp cache to one version after the floor ships.
3. One nav partial.

### 3.10 Technical Feasibility / Incremental Implementation — 8.0/10 · **4.0 / 5** *(was 8.5 / 4.3)*

**Evidence**

- Static HTML/CSS/JS + seven Vercel handlers. Hobby cap is 12; helpers live in `/lib`. Pass C is the law: **no scrapers in `/api`.**
- Floor can ship from `data/instagram-feed.json` + local stills. `scripts/sync-instagram-feed.js` refreshes offline.
- Risk: expired Instagram CDN thumbs if stills are not snapshotted. Local `media/ig/` is the fix.

**Recommendations**

1. Sequence: **floor snapshot on home → catalogue spec lines → Artists in nav → cap the wall → CSS consolidation.**
2. Do not add an eighth `/api` file for Instagram.

---

### Score table

| Category | /10 | Weight | Weighted | Pass B |
|---|---:|---:|---:|---:|
| Brand Identity & Originality | 8.0 | 20 | 16.0 | 15.0 |
| Music-First UX & IA | 7.5 | 15 | 11.3 | 9.8 |
| Visual Language | 7.5 | 15 | 11.3 | 10.5 |
| Interface & Interaction | 7.5 | 15 | 11.3 | 10.5 |
| Catalogue & Music Player | 8.0 | 10 | 8.0 | 7.0 |
| Zine & Editorial Integration | 8.0 | 10 | 8.0 | 8.0 |
| Motion & Micro-interactions | 7.0 | 5 | 3.5 | 3.3 |
| Mobile & Responsive | 7.5 | 5 | 3.8 | 3.8 |
| Consistency & Design System | 5.5 | 5 | 2.8 | 2.5 |
| Technical Feasibility | 8.0 | 5 | 4.0 | 4.3 |
| **Total** |  | **100** | **80.0** | **75** |

---

## 4. Top 5 Strengths

1. **The homepage is a record.** Catalogue kicker, sleeve, LCD, Play, formats. iPod grammar without iPod chassis.
2. **Live matches git.** The Bondi replica is no longer the public brand.
3. **Night Shift is the culture engine.** Masthead, desks, Vancouver slug. Do not “clean” it.
4. **Listening is built.** Shared player, Bandcamp bridge, local preview fallback, on-air chips, aluminum dock.
5. **Collectible economics.** SKUs, cassette backorder, Regular/Club tiles, Record Club desk.

**Preserve:** steel tokens, Oswald/Archivo/Lucida/Plex, plate typology, dock-as-spec-bar, Night Shift writing, catalogue schema (including hidden CC numbers), acid LED, sleeve metadata, Record Club copy, seven-function `/api` budget.

---

## 5. Top 5 Creative Gaps

1. **The floor is built and not shown.** Mixed `@ltdrifta` / `@clubcopyrecords` feed exists; home has no camera roll.
2. **Catalogue numbers left the room.** Spec lines lost the collectible ID the brief asks for.
3. **Artists are hidden from home chrome.** A label without a roster in the mast reads as a shop.
4. **Home wall is the whole library.** In rotation should be a crate, not the stacks.
5. **Gold foil + Aqua leftovers.** Record Club champagne and `aqua-world.css` on inner pages keep a second brand alive.

---

## 6. P0 (Essential) Improvements

Do these before any new decoration.

1. **Mount a 12-up mixed floor under Night Shift** (`@ltdrifta` + `@clubcopyrecords`, newest first). Static snapshot + local stills. No `/api` Instagram functions.
2. **Put catalogue IDs back on spec lines** (plate LCD, sleeve cards, library rows). Not in the H1.
3. **Restore Artists in home nav** (link only). Keep the photo roster off the homepage.
4. **Cap In rotation at 8–12** with play only if cued.
5. **Kill gold foil** on Record Club / floor chapter cuts — stamp and graphite only.

---

## 7. P1 (Important) Improvements

1. Home Night Shift: masthead + one image + three headlines — smaller than the current cover spread.
2. Mobile plate: two chrome buttons; cassette as text.
3. Align digital price docs with catalog ($9 live vs $8 README).
4. Type purge on remaining templates still loading extra families / `aqua-world.css`.
5. Library featured static row = current feature (You Are (Love)), not leftover DESIRE in JSON-LD.
6. Tab bar: consider Artists on inner pages only; home Join is fine.
7. Delete unused `js/ipod.js` if nothing mounts it.
8. Floor empty state: two handle links, no skeleton forever.

---

## 8. P2 (Polish) Improvements

1. Merge aqua-world + OS + folio into `site.css` + one surface file.
2. Rename `vcr-player` → `cc-deck` when those files are open.
3. Keep LCD “Added” toast.
4. Planet MP3 as a named app on steel, or keep it clearly separate.
5. Optional desktop Cover Flow only as easter egg.
6. One cache tag (`st22`) after the floor ships.
7. Member card: lean into collectible ID (already sketched).
8. OG always the sleeve (already true on home).

---

## 9. Ideal Homepage Structure

A column of **objects**. The floor is the afters, not the hero.

1. **Steel mast** — wordmark, Library · Artists · Zine · Shop · Join, cart.  
2. **Now** — featured plate that plays the sleeve.  
3. **In rotation** — 8–12 sleeves, play only if cued. Link: Full library.  
4. **Night Shift front** — slug + one image + three headlines. Link: The paper.  
5. **From the floor** — 12 mixed stills, contact sheet, `@ltdrifta` + `@clubcopyrecords`.  
6. **Record Club** — three levels, one email field.  
7. **Footer** — Club Copy, publisher, Planet MP3 as app.

No empty mixtapes. No Cover Flow. No 100vh gadget. No Instagram in primary nav.

---

## 10. Ideal Music Player Direction

**Not:** iOS pill, Spotify embed, Click Wheel, Cover Flow stage, VHS deck.

**Yes:** aluminum spec bar — plate LCD and bottom dock as **one state**.

- Data: artist, title, `CCxxx`, index, time, format of *this* object.  
- Controls: prev / play-pause / next / scrub / buy-that-format.  
- State: grey idle, acid LED playing; `is-live` only on the sounding sleeve.  
- Sound: keep Bandcamp/preview pipeline; no visualizer gimmicks.

---

## 11. Design System (target — incremental)

Same stack as Pass A/B. New rule from Pass D:

**The floor is a labeled graphite well: square stills, Lucida/Plex handles, stamp chips. Not gold, not Instagram UI, not a serverless scrape.**

### Typography

| Role | Face | Use |
|---|---|---|
| Display | Oswald 600/700 | Titles, lockups, nav |
| Body | Archivo 400/600 | Zine, notes |
| UI / LCD | Lucida Grande stack | Menus, player, alerts |
| Spec | IBM Plex Mono | Catalogue, times, prices, IG handles |

### Colour

Steel `#E8E8E6` · Pearl `#F4F4F2` · Ink `#1A1A1A` · Stamp `#B8B8B4` · Select `#2A2A28` · Acid `#C6F000` on `#141414` for playing only. Graphite wells for floor + desk. No Bondi fill. No champagne foil.

### Spacing

Wrap `1200px`. Floor gap 8 / 10 / 12. Radius 8–12, not iOS pills. Duration `--dur: 280ms`.

### Components

Keep: nav, sleeve, LCD list, aluminum deck, price tiles, zine masthead, join radios, chrome buttons.  
Add: **contact-sheet card** (square, handle, video pip).  
Deprecate: Click Wheel body, Cover Flow as default, cassette hi-fi as page identity, phosphor on daylight, gold foil chips.

### Motion

Invert, LED, dock rise, ticker (pause on hover), floor stills ease. Reduced motion: kill tickers and hover scale.

---

## 12. What not to do

- Do not put Instagram scrapers back under `/api` (Hobby 12-function cap; Pass C).  
- Do not reopen Bondi or the Click Wheel.  
- Do not flatten Night Shift into a blog grid.  
- Do not luxury-black the whole site because the floor is dark.  
- Do not make Cover Flow “better.” Leave it buried.  
- Do not add replica objects (nano, iTunes window, digital-camera chrome frames) as heroes. Grammar only.

---

## Pass review

| # | Earlier recommendation | HEAD status |
|---|---|---|
| A1 | Listening plate; Play | **Done** — feature is cued |
| A2 | Canonical `/you-are-love` + cue | **Done** (live 200) |
| A3 | Nav: Library · Artists · Zine · Shop · Join | **Partial** — Artists hidden on home |
| A4 | Home Night Shift as front page | **Partial** — mixtapes gone; lead still a spread; floor missing |
| A5 | Aluminum dock + steel tokens | **Dock yes; Desire-class pages still load Aqua** |
| B1 | Deploy `main` | **Done** |
| B2 | Plate plays the sleeve | **Done** when catalog hydrates |
| B3 | Library list default | **Done** |
| B4 | Steel object page ink | **Done** via OS lock |
| B5 | Cut empty modules / dead iPod CSS | **Partial** — mixtapes gone; floor gone with them; iPod CSS off home |

---

If I could only implement five changes, they would be:

1. **Put the mixed 12-up floor under Night Shift** — `@ltdrifta` + `@clubcopyrecords`, newest first, local stills, no `/api` scrape.  
2. **Restore catalogue IDs on spec lines** so objects read as a library (`CC004 · EP · cassette`), not as untitled shop cards.  
3. **Put Artists back in the home mast** without bringing the photo roster back.  
4. **Cap In rotation at a crate of 8–12** and send the rest to Library.  
5. **Retire gold foil and leftover Aqua** so floor, desk, and inner pages share steel, stamp, and graphite.
