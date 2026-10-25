# Club Copy — Creative Audit (fresh pass, 25 October 2026)

**Scope:** repository `main` at `88b752a`, rendered locally in Chromium at 1440×900 and 390×844 (13 pages, desktop and phone), plus a full read of the HTML, CSS, JS and `data/catalog.json`. Streams, SoundCloud, Instagram and Stripe were not reachable from the sandbox, so player behaviour under a *failing* stream was observed and is flagged where it matters. No code was changed. Earlier audit documents in `docs/` were deliberately not consulted.

**Brief:** a future-facing independent label that reinterprets 1999–2005 digital music culture (iPod-era interfaces, MP3 players, CD-ROM software, digital cameras, club graphics) without nostalgia or gimmick. Minimal, tactile, music-first, metadata-rich, collectible, unmistakably digital.

**Implemented 25 October 2026 (same day, same branch):** closing recommendations 1, 3, 4 and 5 shipped. Recommendation 2 (catalogue metadata) is left for the label, since BPM, key and credits are not in the repository. Results: homepage stylesheets 17 → 13, with `graphic-pass`, `identity-pass` and `club-copy-os` folded into their owner sheets, four dead files removed and `fx.css` dropped from home (bytes moved more than they shrank: 420 KB → 413 KB on home; the ordering hazard is what went away); one `?v=st41` tag; the EP Play key is the graphite invert key; the plate no longer cues another release when a stream fails; headlines are mixed-case Oswald 500 sitewide except the NIGHT / SHIFT lockup; home is 5,790 px desktop and 6,763 px phone (from 7,837 / 8,285). Correction to the original text: the Play-key defect affected the EP page only, not all 27 release pages; the singles have no hero Play key.

---

## 1. Executive Summary

Club Copy already has an identity most independent labels never reach. The first screen is a record you can play: a steel sleeve, an LCD spec window reading `CC013 · Album · 3 tracks · 11:19`, a graphite Play key and a numbered track index. That grammar (catalogue number, kind, count, runtime, set in IBM Plex Mono) repeats on every card, library row, artist shelf and in the dock. One transport plays the catalogue and the mixtapes, survives page changes, draws real waveform peaks and talks to the OS media controls. Night Shift is a real publication with volumes, a file-info block and sourced features. The member card renders your number as you type. This is a label OS, and it is original.

Three things hold it back.

1. **The metadata is a costume.** The site looks data-rich, but 0 of 49 tracks carry a BPM, genres collapse to three values, and 1 of 27 releases has credits. The LCD has nothing to report beyond what the title already says.
2. **The CSS is fighting itself.** The homepage loads 19 stylesheets (420 KB), two of them "pass" layers that override the others with `html body` selectors; 149 `!important`s; three dead sheets. It has already produced a shipped defect: on the EP page (`/you-are-love`, the only release page with a hero Play key) the key renders near-white text on a pale aluminium key (a specificity collision between `graphic-pass.css` and `release-archive.css`).
3. **Two display voices.** Home and Library speak in mixed-case Oswald; Artists, Night Shift and the 404 shout in all-caps Oswald. The label and its own zine look like two brands.

Secondary: the home page is seven full-height sections (7,800 px desktop, 8,300 px phone); the era reference shows mostly as texture (brushed gradients, scanlines) rather than as behaviour; and the dock, under a failed stream, replaced the track the listener chose with a different release.

**Verdict: 79 / 100.** Strong, distinctive, under-maintained. Everything recommended below is HTML, CSS or JSON. No new dependencies, no rebuild.

---

## 2. Overall Score: **79 / 100**

| Category | /10 | Weight | Weighted |
|---|---:|---:|---:|
| Brand Identity & Originality | 8.0 | 20 | 16.0 |
| Music-First UX & Information Architecture | 7.5 | 15 | 11.25 |
| Visual Language | 7.5 | 15 | 11.25 |
| Interface & Interaction Design | 7.5 | 15 | 11.25 |
| Catalogue & Music Player Experience | 7.5 | 10 | 7.5 |
| Zine & Editorial Integration | 8.0 | 10 | 8.0 |
| Motion & Micro-interactions | 7.0 | 5 | 3.5 |
| Mobile & Responsive Experience | 7.5 | 5 | 3.75 |
| Consistency & Design System | 5.0 | 5 | 2.5 |
| Technical Feasibility / Incremental Implementation | 8.0 | 5 | 4.0 |
| **Total** | | **100** | **79.0** |

---

## 3. Detailed Scorecard

### 3.1 Brand Identity & Originality — 8.0 / 10 · **16.0 / 20**

**Evidence**
- The listening plate (`css/listen-plate.css`, `css/listen-object.css`) is a genuinely original object: sleeve in a steel bezel, LCD window with scanline overlay, invert Play key, mono index 01–03. iPod grammar without an iPod drawing.
- Palette is disciplined: steel `#E8E8E6`, ink `#1A1A1A`, stamp `#B8B8B4`, one live LED `#C6F000` reserved for "on air". Type stack Oswald / Archivo / IBM Plex Mono is consistent across 189 pages.
- Collectible signals are real, not decorative: CC numbering, `DL / CS` format glyphs, sold-out cassette stated as a fact, member card with a hashed number, Record Club tiers.
- Night Shift masthead (inverted NIGHT / SHIFT lockup, "The floor · The fit · The afters") is its own thing.
- Mixtapes and The Floor render as a greyscale camera roll (`IMG_0001 · 09.19.26 · @ltdrifta`), a clear digital-camera reference done with a filter and a caption, not a skeuomorph.
- **Against:** the era shows through surface (gradients, scanlines, bezels) more than through behaviour. The ticker is a marquee. The LCD never reports anything the heading didn't already say. Twenty-one white-label sleeves in a row make the crate read as one record. Under the hero sleeve, three chips (`HOUSE · ALBUM · 11:19`) repeat the LCD line a few pixels away.

**Recommendations**
1. Make the LCD a live instrument: BPM, key, bitrate, elapsed / remaining, buffer state. That is the single cheapest way to be "unmistakably digital" without adding a skeuomorph.
2. Replace the three duplicate chips under the sleeve with information the LCD does not carry (genre · BPM · key), or remove them.
3. Keep the greyscale discipline. Do not add a second accent.

### 3.2 Music-First UX & Information Architecture — 7.5 / 10 · **11.25 / 15**

**Evidence**
- First screen is playable from three affordances (sleeve hit, Play key, track rows). Nav is six words: Library · Artists · Mixtapes · Zine · Shop · Join. Library is the catalogue; Shop is goods only. Correct split.
- Library: genre and artist filters, list default, member price beside retail, "27 releases" count. Artist pages carry a numbered shelf with CC numbers.
- Home order: plate → New Releases (6) → Mixtapes (10) → Night Shift → The Floor (12) → Join → Artists. The music comes first, but the page is 7,837 px tall on desktop and 8,285 px on a phone.
- `Join` links to `/#join` from every inner page, so joining means leaving the page you were on. `Account` and `Mixtapes` are injected into the nav by `js/site.js`; the information architecture depends on JavaScript.
- Observed under a failing stream: clicking hero track 02 ("Primo", `pb-02`) ended with the dock showing `CC037 · Lenzman, Redeyes – High & Low` in a NO SIGNAL state. The listener's choice was replaced by a different release. This needs confirming in production, where the Bandcamp stream normally succeeds, but the fallback path should never change the selected record.
- Library JSON-LD declares `numberOfItems: 12`; the page says 27.

**Recommendations**
1. Hold the chosen track on failure: NO SIGNAL on that row, Retry, Bandcamp link. Never advance or restore a different release over an explicit click.
2. Cap home at five beats and shorter heights: plate → crate → mixtapes (one row) → Night Shift (masthead + cover + four rows) → join + roster. Target ≤ 5,500 px desktop.
3. Make `/account` (already exists) the Join destination from inner pages; keep the anchor only on home.
4. Generate the library ItemList from `catalog.json` so the count cannot drift.

### 3.3 Visual Language (Colour, Typography, Layout) — 7.5 / 10 · **11.25 / 15**

**Evidence**
- The spec line is the identity carrier and it is typeset identically everywhere at 11–12 px Plex Mono. The "type floor" rule in `steel.css` (nothing under 10 px) is a good discipline.
- Home / Library / release pages: mixed-case Oswald 500 at tight tracking. Artists index, Night Shift headlines, 404: all-caps Oswald 700. Two voices.
- **Shipped defect:** on the EP page, the only release page that carries a hero Play key, the key is unreadable. `graphic-pass.css:56` sets `#heroListen` to the light aluminium gradient with `color:#1a1a1a`, but `release-archive.css:2575` still applies `-webkit-text-fill-color:#f4f4f2`, so Chromium and WebKit paint near-white text on pale steel. Visible in the desktop and phone renders. The 26 single pages carry only a Buy key and the sleeve hit, so they were not affected.
- Release page desktop: the waveform canvas (`.ra-wave`, drawn by `js/tape-player.js`) sits orphaned ~200 px below the sleeve, detached from both the sleeve and the track index.
- Buttons come in four finishes: graphite invert, aluminium, flat ink (home plate via `home-zine.css:1621`), and grey blocks (404). Two is enough.
- Phone hero track titles render in mono while desktop uses Archivo.

**Recommendations**
1. One display voice: mixed-case Oswald 500 sitewide. Retire all-caps on Artists, Night Shift headlines and the 404.
2. Fix the Play key cascade (set `-webkit-text-fill-color` in the same rule, or make `#heroListen` the invert key like home and the library shelf). One rule.
3. Two button finishes only: invert (primary) and aluminium (secondary). Remove the flat-ink and grey-block variants.
4. Dock the waveform inside the track index as the active row's underline, or inside the LCD facts window. Not under the sleeve.

### 3.4 Interface & Interaction Design — 7.5 / 10 · **11.25 / 15**

**Evidence**
- Pressed steel on `:active`, invert row on current track, `focus-visible` ring, skip link, `aria-live` status, track rows keyboard-operable (`role=button`, `tabindex=0`), arrow-key seeking in the dock, Media Session integration.
- Play keys on sleeves, mixes and floor tiles are 32 × 32 px; dock transport keys 36 px on phones. Below the 44 px touch guideline for the most important control on the site.
- Error state copy ("Stream unavailable · Retry · Bandcamp ↗") is honest and on-brand, but as above it attached to the wrong track.
- The hero carries three play affordances in the first viewport. The sleeve hit button is the tactile one; the others are redundancy.
- Hover reveals and the marquee ticker are generic web behaviours; nothing in the interaction layer is specifically "index navigation" or "list-first" in the iPod sense (type a number, jump to a row).

**Recommendations**
1. Raise play keys to 40 px (44 px on `pointer: coarse`).
2. Number-key navigation on the index: pressing `1–9` on a release page or the plate cues that track. Cheap, memorable, era-correct behaviour rather than era-correct texture.
3. Pause the ticker on focus as well as hover; slow it; or convert it into a static LCD strip that shows the last three catalogue entries.

### 3.5 Catalogue & Music Player Experience — 7.5 / 10 · **7.5 / 10**

**Evidence**
- `data/catalog.json`: 27 releases, 49 tracks, 100 % Bandcamp track IDs, 42 peak files. One dock for catalogue and SoundCloud mixtapes, session-restored across pages, with up-next, buy key, and a Now Playing stage.
- Metadata: `bpm` is `null` on every track. Genre values: House 17, Electronic 9, Jazz 1 (jungle, drum & bass and hip-hop are filed under "Electronic"). `credits` on 1 release. No key, no mastering, no release note on 21 of 27 singles (the release pages carry a one-paragraph note where it exists).
- Library rows show price and member price but no way to play a whole release or add it to the queue; the "Sleeves" view toggle still routes through code named for Cover Flow (`js/library.js`).
- Dock bug line (`CC037 · 01 / 01 · NO SIGNAL`) is 10 px, under the site's own 11 px floor.

**Recommendations**
1. Fill the data: BPM and key for 49 tracks, a five-value genre taxonomy (House · Jungle & D&B · Garage · Hip-hop · Downtempo), credits and mastering per release, a one-line note per single. Surface BPM · KEY on track rows, on the LCD and in the dock. This is the highest-leverage identity change on the list because the rendering already exists.
2. "Play release" and "Queue" from library rows; show up-next in the dock LCD permanently (the hook `data-upnext` is already there).
3. Raise the dock bug to 11 px.

### 3.6 Zine & Editorial Integration — 8.0 / 10 · **8.0 / 10**

**Evidence**
- 144 story pages, monthly volumes, a file-info block per story (format · volume · date · author · places · artists · words · photo), sources lists, previous/next navigation, and `listen` cues in `news.json` that point back at catalogue releases and mixtapes. This is a publication, and it is tied to the label's music.
- On `/news`, the horoscope module ("Stars for the Floor") is pinned above the cover story. On home, the Night Shift block is 1,700 px tall: a 150 px masthead, a full-width cover, four TOC rows.
- Night Shift's display voice (all-caps) is the one place the zine departs from the label's steel chrome, so the two read as different brands.
- `css/news.css` is 126 KB and is loaded on the homepage although only two of its selectors target home.

**Recommendations**
1. Cover story first on `/news`; Stars after the contents.
2. Home block: masthead at half height, cover at 60 % width, four rows. Cap at ~900 px.
3. Same mixed-case Oswald as the rest of the site for headlines; keep the inverted masthead lockup as the one exception.
4. Load `news.css` only on `/news` pages; move the few home rules into `home-zine.css`.

### 3.7 Motion & Micro-interactions — 7.0 / 10 · **3.5 / 5**

**Evidence**
- Reduced-motion guards in 21 sheets (36 blocks). Dock slides in, EQ bars pulse only while playing, pressed keys depress by 1 px, reveal-on-scroll via `.rv`.
- 37 `@keyframes` across the sheets, several for objects no longer on the page (`ra-vinyl-spin`, `ra-reel-spin`, `ra-speaker-thump`, `raJewelSweep`, `releaseDiscSpin`). Legacy motion ships to every visitor.
- The only ambient motion is the marquee ticker, a 2000s web cliché rather than an iPod/CD-ROM behaviour.
- No transition when a track row becomes active; the invert snaps.

**Recommendations**
1. Delete unused keyframes with the dead sheets.
2. 120 ms invert transition on track rows; LCD text updates with a one-frame blank (the way segment displays redraw) rather than a fade.
3. Retire or slow the marquee.

### 3.8 Mobile & Responsive Experience — 7.5 / 10 · **3.75 / 5**

**Evidence**
- No horizontal overflow on any of 13 pages at 390 px. Safe-area insets handled. Hamburger and drawer are HTML (`.nav-drawer`), not injected. Hero stacks sleeve → spec → keys → index cleanly.
- Phone home is 8,285 px; phone library 6,711 px; a story page 10,215 px.
- Library featured shelf stacks three full-width keys (Play / Add to cart / Open) at 56 px each: 170 px of buttons for one record.
- Play keys 32 px; hero track titles switch to mono on phone.

**Recommendations**
1. Same home-length cap as 3.2.
2. Shelf keys on phone: Play (invert) + one aluminium key; "Open" is the title link.
3. 44 px play keys under `pointer: coarse`.

### 3.9 Consistency & Design System — 5.0 / 10 · **2.5 / 5**

**Evidence**
- Tokens are declared in `site.css`, re-declared in `club-copy-os.css` as a "cache shield", and the `--zine-*` set is declared again in `news.css`, `home-zine.css` and `zine-pages.css`.
- Homepage: 19 stylesheets, 419,939 bytes of CSS. `identity-pass.css` and `graphic-pass.css` are override layers on top of the page sheets, using `html body` prefixes to win specificity. 149 `!important` (47 in `news.css`, 28 in `library.css`, 21 in `player.css`).
- Dead: `css/desk.css`, `css/release.css`, `css/surface-night.css`, `js/desk.js` (unreferenced). `hero-banner.css` (19 KB) is loaded on home and matches one element.
- Legacy vocabulary (`ipod`, `coverflow`, `bondi`, `itunes`) in 17 files; cache-busting tags range from `st33` to `st40`, plus `gp3`, `hb3`, `cr2`, `sl3`, `mix20`.
- The release-page Play key defect is a direct product of this layering.

**Recommendations**
1. Collapse to: `site.css` (tokens + chrome) · `steel.css` (instrument parts) · `player.css` · `sleeve.css` · one sheet per page type. Merge the two pass layers into their owners and delete them.
2. Delete the dead sheets and script; drop `hero-banner.css` from home.
3. One `?v=` tag, bumped once per deploy.
4. Budget: ≤ 150 KB CSS on home, ≤ 30 `!important`.

### 3.10 Technical Feasibility / Incremental Implementation — 8.0 / 10 · **4.0 / 5**

**Evidence**
- Static HTML/CSS/JS on Vercel, no build step, data in JSON, generation scripts already exist for the zine (`scripts/build-night-shift.py`, `scripts/build-volumes.js`). Every recommendation above is an edit to CSS, HTML or `catalog.json`.
- Release pages are 27 hand-maintained HTML files. A change to the release hero is 27 edits, which is how the Play key defect survived.
- Serverless function cap (12) is respected; `/api` is lean.

**Recommendations**
1. Generate release pages from `catalog.json` with a small script in the pattern of `build-volumes.js`. Commit the output; nothing changes for hosting.
2. Keep the no-framework stance.

---

## 4. Top 5 Strengths

1. **The listening plate.** Sleeve, LCD, invert Play, numbered index, all on the first screen. The best single idea on the site.
2. **The spec grammar.** `CC013 · Album · 3 tracks · 11:19` in Plex Mono, identical on card, LCD, dock, library row and artist shelf. It is the brand, and it is consistent.
3. **One transport.** A single dock plays catalogue and mixtapes, restores across pages, draws peaks, exposes Media Session and keyboard seeking.
4. **Night Shift as a publication.** Volumes, file-info blocks, sources, listen cues back to the catalogue. Not a blog.
5. **The collectible layer.** CC numbers, format glyphs, sold-out stated plainly, Record Club tiers, a member card that fills in as you type.

## 5. Top 5 Creative Gaps

1. **Metadata-poor under a metadata-rich skin.** 0 / 49 BPM, three genres, one credit. The LCD has nothing to say.
2. **A cascade that fights itself.** 19 sheets, two override layers, 149 `!important`, dead files, and a shipped illegible Play key on every release page.
3. **Two display voices.** Mixed-case on home and library; all-caps on Artists, Night Shift and the 404.
4. **Era as texture, not behaviour.** Gradients and scanlines carry the reference; the interactions (marquee, hover) are generic. Number-key index navigation, a reporting LCD, and a snap-redraw display would do more than another bezel.
5. **A long home.** Seven full-height sections. The record is first, then the page becomes a magazine, a camera roll, a form and a roster.

## 6. P0 (Essential)

1. **Fix the release-page Play key.** Make `#heroListen` the invert key (graphite, `#f4f4f2` text) in one rule, and remove the conflicting `-webkit-text-fill-color`. One page today, and the template every future EP will use.
2. **Hold the chosen track on stream failure.** NO SIGNAL on the selected row, Retry, Bandcamp link. No advance, no restore of another release over an explicit click. Confirm against production first.
3. **Fill the catalogue metadata** (BPM, key, five-value genre taxonomy, credits, one-line note) and surface BPM · KEY on track rows, in the LCD and in the dock.
4. **One display voice.** Mixed-case Oswald 500 for every heading; keep the inverted NIGHT / SHIFT lockup as the single exception.
5. **Collapse the CSS stack.** Merge the two pass layers into their owner sheets, delete the three dead sheets and `desk.js`, drop `hero-banner.css` and `news.css` from home, one `?v=` tag.

## 7. P1 (Important)

1. Home length cap: Night Shift block to masthead + cover + four rows (~900 px); Floor to 8 tiles; one mixtape row. Target ≤ 5,500 px desktop.
2. Play keys to 40 px, 44 px on coarse pointers.
3. Waveform into the track index (active row underline) or LCD window; not orphaned under the sleeve.
4. Two button finishes only (invert, aluminium); remove flat-ink and grey-block variants, including on the 404.
5. Library ItemList generated from `catalog.json` (12 → 27).
6. "Play release" and "Queue" on library rows; up-next always visible in the dock LCD.
7. `/account` as the Join target from inner pages.
8. Cover story above Stars on `/news`.
9. Generate release pages from `catalog.json`.

## 8. P2 (Polish)

1. Number-key cueing (`1–9`) on the plate and release pages.
2. 120 ms invert transition on rows; snap-redraw LCD text.
3. Retire or slow the marquee; pause on focus.
4. Dock bug text 10 → 11 px.
5. Phone hero track titles in Archivo to match desktop.
6. UI font fallback: Archivo instead of Verdana where Lucida Grande is absent (Windows, Android), so the dock reads the same on every OS.
7. Delete unused keyframes; rename legacy class and comment vocabulary.
8. Replace the three duplicate chips under the hero sleeve with genre · BPM · key.

---

**If I could only implement five changes, they would be:**

1. Fix the release-page Play key and make the dock hold the chosen track on failure. The primary action on the EP page is currently unreadable, and the failure path can swap the listener's record.
2. Fill the catalogue with BPM, key, a real genre taxonomy, credits and a note per release, and show BPM · KEY on rows, LCD and dock. The rendering exists; the data does not.
3. One display voice: mixed-case Oswald 500 sitewide, with the NIGHT / SHIFT lockup as the only exception.
4. Collapse the stylesheet stack to core + one page sheet, delete the dead and pass layers, and set a CSS budget, so the next change does not create the next Play-key bug.
5. Shorten home to five beats under 5,500 px, so the page stays a record with a paper behind it rather than a magazine with a record on top.
