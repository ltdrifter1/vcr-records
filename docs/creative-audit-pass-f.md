# Club Copy — Creative Audit, Pass F

**Role:** Senior Creative Director, Brand Designer, UX/UI Designer (music / editorial / culture)  
**Scope:** Repository `main` at `d61b7e3` and production `https://www.clubcopy.ca/` as fetched 28 September 2026. They are the same site. **No product UI was redesigned for this audit.**  
**Date:** 28 September 2026  
**Previous:** [Pass A](creative-audit.md) 67 · [Pass B](creative-audit-pass-b.md) 75 · [Pass C](creative-audit-pass-c.md) deploy RCA · [Pass D](creative-audit-pass-d.md) 80 · [Pass E](creative-audit-pass-e.md) dock brief  
**Constraint:** Preserve distinctive work. Smallest high-impact set. Reinterpret 1999–2005 digital culture; do not recreate it. Preserve existing functionality. No new dependencies. No full rebuild.

---

## 1. Executive Summary

Club Copy now reads as a **label OS**, not an Apple product page. The homepage is a brushed-steel listening plate for Riscape’s *You Are (Love)*: catalogue kicker, jewel sleeve, LCD strip, Play, digital, cassette backorder. Night Shift still has a voice. The dock is an aluminum spec bar with invert-select “On air.” Library is a numbered index. The floor (Instagram contact sheet) and Mixes (SoundCloud tapes) are mounted. Live clubcopy.ca matches git.

The remaining problem is **two listening grammars, two operating systems, and a mobile chrome that still thinks it is iOS Music.**

1. **The homepage object is the brief.** The release object is not. `/you-are-love` opens as a steel sleeve, then drops into a **mini hi-fi cassette deck** (`ra-stereo`, speakers, `CC-GX00`, VFD “TAPE,” Side A, analog VOL dial). That is a second costume — Walkman / boombox replica — after the site finally stopped wearing a Click Wheel.
2. **Play state still argues with itself.** The dock plays in graphite and pearl (Pass E). The sleeve, plate LCD pip, and ticker still light **lime `#C6F000`**. One leftover LED is a camera. Five limes is a brand the brief did not ask for.
3. **Mobile wayfinding is an app shell.** `js/site.js` injects a four-tab iOS Music bar (Library / Mixes / Zine / Shop), hides the hamburger, and does not put Artists on that bar. Home has no current tab. The roster is a footer hunt.
4. **The crate is thin, then the paper is thick.** In rotation is 3 sleeves on small screens (6 on desktop), without catalogue numbers. Night Shift then occupies the scroll with Drake mall gossip and *Tonight’s Record: Dummy — Portishead*. Editorial voice is a strength. Sequence currently says *culture magazine that also sells files*, not *small library with a paper*.
5. **Cover Flow remains an iTunes surface.** List is the default (correct). The opt-in is still a 3D replica, which the brief already rejected as costume.

What to protect: the plate, steel tokens, Lucida/Oswald/Archivo/Plex stack, Night Shift masthead and writing, `catalog.json` + Bandcamp bridge, aluminum dock typology, cassette economics, Record Club desk, floor as contact sheet (not Instagram UI).

What not to bring back: Bondi, Click Wheel-as-logo, cyan fills, lime as identity, Cover Flow as default, `/api` scrapers.

**Verdict:** Identity is real and live. Score is held by replica hardware on the record page, lime vs invert, iOS tab bar, and a homepage that hands the middle of the night to other people’s records. Incremental HTML/CSS/JS — no new libraries — closes the gap.

---

## 2. Overall Score: **81 / 100**

A distinctive steel library with a paper. **+1** versus Pass D (80), from shipping the floor, Artists in desktop nav, catalogue IDs on library rows, Mixes, and the invert dock. Held down by the stereo deck, mobile app-shell, and leftover lime / Cover Flow.

Live production and HEAD are aligned (plate, CC004, Play, In rotation, Night Shift). Score is for that shared site.

---

## 3. Detailed Scorecard

Scores are **/10**. Weighted score = (score/10) × category weight.

### 3.1 Brand Identity & Originality — 8.3/10 · **16.6 / 20**

**Evidence**

- Homepage hero is a **record object**, not a 4th-gen iPod: mixed-case Oswald title, Archivo artist, Plex `CC004 · EP · 2026`, aluminum Play. This is iPod *grammar* (list, LCD, invert keys) without iPod *chassis*. Distinctive and on-brief.
- Steel field `#E8E8E6`, LCD ink `#1A1A1A`, Lucida chrome, IBM Plex Mono specs. Rare among independent-label sites. Not a Bandcamp embed in a sans-serif theme.
- Night Shift (“the floor / the fit / the afters”) is original culture, not a News page.
- Record Club (Free / Club 30% / Premium credit) and cassette-at-$20 is a collectible economy, not streaming cosplay.
- **Against:** `/you-are-love` and other PDPs still stage a **named miniature stereo** (`CC-GX00`). Cover Flow is still labeled “iTunes Cover Flow” in CSS/JS. Lime LED on the sleeve is rave fill. Artists pages go `surface-night` (white type, inverted logo) — a second brand. Catalogue prefixes mix `CC004` with `VCR026D3` (EP1, Classic Jazz, Summer Madness), which reads as a leftover imprint, not a library.
- Dead language in comments (`home-zine.css`: “Click Wheel iPod on brushed steel”; `js/ipod.js` still in the tree, unlinked). The site has outgrown the replica; the archaeology has not.

**Recommendations**

1. Keep the plate as the master object. On release pages, replace the mini hi-fi with a **track index** (01–04, durations, invert current row) that talks to the existing dock — CD-ROM / iTunes 4 list, not a plastic deck.
2. One play-state: graphite invert + pearl pip. Lime only if it is retired entirely.
3. Keep `CC` as the public series; treat `VCR026*` as legacy SKUs in the spec line or migrate labels in `catalog.json` without changing commerce IDs.
4. Do not revive Click Wheel, Bondi, or Cover Flow as identity.

### 3.2 Music-First UX & Information Architecture — 7.6/10 · **11.4 / 15**

**Evidence**

- First screen is the sounding record. Play is a hardware key on the sleeve and a steel button. Featured EP has Bandcamp cues in `catalog.json`. This is the music-first promise kept on home.
- Desktop nav: Library · Artists · Zine · Shop · Join. Correct label IA. Mixes are injected by `js/site.js` (not in static `index.html` nav) — works, but HTML and JS disagree.
- After three sleeves, the homepage is a magazine: masthead, gossip ticker, Drake, then mixtapes, then the floor, then Record Club. Mixes and the rest of the crate sit below other people’s stories.
- *Tonight’s Record* is Portishead *Dummy* (Go! Beat, 1994). Editorial listening is allowed. On a label homepage it competes with CC004 as “the record.”
- Library is the catalogue (filters, list, member prices). Shop is merch. Good split. JSON-LD on `/library` still lists **14** items while the page says **19 releases**.
- Mobile tab bar: Library / Mixes / Zine / Shop. **Artists omitted. Home omitted.** Hamburger `display: none`. Join is a header chip. Roster and About are not first-class.

**Recommendations**

1. After the plate: **crate (6–8 numbered sleeves) → Mixes (3) → Night Shift**. Paper after you can hear the house.
2. Put Mixes in the static nav HTML; stop relying on inject for the information architecture.
3. Mobile: show the hamburger (or a steel text strip: Library · Mixes · Zine · Shop · more). Do not hide Artists. Do not copy iOS Music icons.
4. Keep *Tonight’s Record* inside the zine issue, not as a second hero. Prefer a Club Copy cue when the signed record is on the plate.
5. Fix library ItemList count to match `catalog.json`.

### 3.3 Visual Language (Colour, Typography, Layout) — 8.0/10 · **12.0 / 15**

**Evidence**

- Token lock is coherent on home: steel, pearl, stamp, LCD, ink. `club-copy-os.css` loaded last. No Bondi ice, no cyan CTAs.
- Type roles are right when they stick: Oswald display, Archivo body, Lucida UI/LCD, Plex specs. Plate lockup is mixed-case (liner notes, not a rave flyer).
- Jewel sleeve (10px radius, 8px bezel, inset highlight) is tactile and digital — MiniDisc / iPod photo well, not skeuomorphic vinyl.
- **Against:** `news.css` still `@import`s **Anton** and **Barlow Condensed**. Library/Artists/Shop/Tapes still request **Space Grotesk**. `release-archive.css` still names Space Grotesk and Share Tech Mono as the dialect. Zine gothic uppercase fights the plate until the OS lock `!important`s it down. Artists night surface is charcoal, not aluminum. Lime on live sleeve is the loudest colour on an otherwise graphite site.
- Homepage crate specs say `EP · 15:02` / `Single` — duration without **CC004**. Collectible language is on the plate and library rows, missing on the wall.

**Recommendations**

1. Four families only: Oswald, Archivo, Lucida stack, IBM Plex Mono. Drop Anton, Barlow, Space Grotesk, Share Tech from page heads and CSS.
2. Put `CC004 · EP · 15:02` on sleeve cards (`js/home-wall.js` `cardHtml`).
3. Bring `/artists` onto the steel field. Photos can go dark; the chrome should not.
4. Acid/lime: delete as a fill and as a pip, or keep **one** 6px pip on the dock LED only — not on sleeve, plate, ticker, and glyph at once.

### 3.4 Interface & Interaction Design — 7.6/10 · **11.4 / 15**

**Evidence**

- Steel keys (3px radius, inset highlight, invert Play) feel like 2003 player software rebuilt in 2026. Hit areas on the plate are 44px.
- Dock: jewel, LCD, hardware cluster, format buy, close. Playing = 1px `#2A2A28` ring, invert LED chip. Custom scrub bead. This is the right control.
- Sleeve hit is a hardware glyph in the corner, not a center-play glass overlay. Good.
- **Against:** Now Playing **stage** (`.vcr-stage__sheet`) is still iOS Music: 28px blob radius, dark glass, blur. Two player UIs. Cover Flow drag/space-to-play is replica interaction. Mobile tab bar is labeled in CSS “App tab bar — iOS Music.” Focus on home is a hard rectangle (good, Xerox); global `:focus-visible` is still aurora-glass. `club-copy-os.css` is a lock file of `!important` — the interface is enforced, not designed once.

**Recommendations**

1. Stage sheet = same aluminum as the dock (4px radius, no blur glass). Or drop the stage and let the dock + tracklist be enough.
2. Default library stays list. Replace Cover Flow with a **sleeve grid** (already have `.sleeve-card`) or hide the control.
3. Mobile chrome as magazine footer / CD-ROM index (word links), not filled SF Symbols.
4. Collapse token enforcement into `site.css` over time so the OS lock can shrink. Not a rebuild; a deletion pass.

### 3.5 Catalogue & Music Player Experience — 8.0/10 · **8.0 / 10**

**Evidence**

- `data/catalog.json` is the system of record: catalogue numbers, formats, member-relevant prices, Bandcamp IDs, durations. Library hydrates play buttons and filters from it. Homepage wall fetches it.
- Player (`js/player.js`) streams via `/api/bandcamp-stream`, local preview fallback, no Web Audio on CORS-less files. LCD meta prefers catalogue. Errors surface in the dock. This is production listening, not a mock.
- Featured LCD: `CC004 · four tracks · 15:02` / `Digital $9 · cassette backorder`. Honest object.
- **Against:** Release “Listen” section is a **toy stereo** plus waveform canvas — costume, and a second transport next to the dock (dock-away on hero does not save the deck below the fold). Cover Flow inspector duplicates the object page. Lime live pip on `.listen-sleeve.is-live`. EQ bars still bounce in the dock LCD (graphite, but visualizer energy). In rotation omits catalogue IDs and most of the shelf. Digital prices are a scatter ($9 / $8 / $1.50) that is commercially fine but reads as unset on the crate if specs are incomplete.
- README still says Digital **$8**; the feature is **$9**. Spec vs shelf.

**Recommendations**

1. One transport: sleeve Play + dock + text tracklist. Remove `ra-stereo` / VFD / VOL dial / speaker cones from PDPs. Keep timestamps and 01 / 04.
2. Crate: catalogue number + kind + duration; 6 desktop / 4 mobile minimum, link to full library.
3. Align README and plate on the sounding SKU price.
4. EQ: static LCD pixels or none (`prefers-reduced-motion` already kills animation — default should be quiet too).

### 3.6 Zine & Editorial Integration — 7.8/10 · **7.8 / 10**

**Evidence**

- Night Shift is a real zine: nameplate, slug (vancouver / cat 022 / pnw / date / live / free), desks, barcode as ornament, polaroid + tape, pull quote. Voice is specific (bathroom line, flyer on the fridge, no-fun-city). Not a Shopify blog.
- Cover story on home is **Riscape: Heads Down** — correct pairing with the plate. The three “in the paper” cards are then Drake / sticker-on-the-lens / Jhené. Culture desk is the point of Night Shift; on *this* homepage they outvote the signed artist in visual weight after the cover.
- Paper sits on the same steel as the OS (`--zine-paper: #E8E8E6`). Not a Bondi insert. Grain/fiber at 8% is tactile, not Instagram filter.
- 78-item paper on `/news` is a library of writing. Integration gap is **sequence and subject**, not lack of content.
- Masthead stamp says “zine” (after evening). Good.

**Recommendations**

1. Home issue: cover (signed artist) + one floor piece + one catalogue piece, then “full paper.” Gossip can lead `/news`, not the first fold after CC004.
2. Keep *Tonight’s Record* as a Night Shift column. If it stays on home, treat it as a column inch, not a second album hero.
3. Anton on `.zine-title` is costume tabloid. Oswald already is the nameplate. Use it.
4. Do not flatten Night Shift into a “blog.” Protect desks, ticker, polaroid, writing.

### 3.7 Motion & Micro-interactions — 7.2/10 · **3.6 / 5**

**Evidence**

- Useful motion: ticker, dock slide, invert chip, sleeve press, `prefers-reduced-motion` on ticker/EQ/bumper. Hardware press on steel keys.
- Costume motion: Cover Flow 3D, VFD EQ on the stereo, bouncing dock EQ, lime glow `0 0 8px` on live pips, chapter-cut 7px+5px bars that feel like broadcast bumpers on every section.
- Stage open still uses glass and large radii.

**Recommendations**

1. Motion = state only: invert, pip, progress, press, dock in.
2. Kill bounce EQ and lime bloom.
3. Soften or delete repeating “chapter cut” bars if the type already titles the section.

### 3.8 Mobile & Responsive Experience — 6.0/10 · **3.0 / 5**

**Evidence**

- Plate stacks lockup → sleeve → LCD → actions → ticker in document flow (`listen-plate.css`). Desktop becomes sleeve | copy. This is considered, not a cropped iPod.
- Wall is 3 cards on `max-width: 720px`, 6 above. Play on the sleeve is tappable.
- **Against:** `@media (max-width: 720px)` in `site.css` sets `--tabbar-h: 56px`, hides `.nav-links` and `.nav-ham`, shows `.nav-join`. Tab bar is JS-injected. Artists, Contact, About, and Home-as-a-tab are missing. Body always reserved 56px for a bar that is also `display: none` when `has-vcr-player`. Dock + phantom tab padding is a layout tax.
- No `.tabbar` in HTML — if JS fails, mobile has logo, Join chip, cart, and no menu.
- Coarse-pointer 44px rules exist. Plate actions wrap. Library Cover Flow is forced to list under 720px (good).

**Recommendations**

1. **P0:** Never hide the hamburger without a complete, HTML tab strip. Prefer hamburger + word nav; if a footer strip stays, typeset it like the mast (Library Mixes Zine Shop), include Home or logo-as-home, and add Artists under “more.”
2. Do not reserve `--tabbar-h` when the bar is absent or the dock owns the bottom.
3. Keep plate flow; verify ticker does not sit under the dock.

### 3.9 Consistency & Design System — 6.4/10 · **3.2 / 5**

**Evidence**

- Stated system in README is clear. Implementation is a **stack of locks**: `site.css`, `home-zine.css` (still titled Click Wheel), `home-folio.css`, `club-copy-os.css`, inline `#club-copy-home-lock` on `index.html`. Cache query strings run `st18`–`st28` on one page.
- Surfaces: home steel, artists night, shop mixed, release-archive stereo, player invert, zine xerox, Cover Flow ice comments. `aqua-world.css` is retired-in-place (good) but proves how many skins this URL has worn.
- Components that *are* the system: `.listen-sleeve`, `.btn-steel`, `.vcr-player`, `.cat-row`, `.zine-masthead`. They should be the only dialects.

**Recommendations**

1. One button, one sleeve, one dock, one list row. PDPs use those.
2. Unify `?v=` on a release, or drop cache busts that disagree.
3. Do not load Cover Flow CSS/JS until a grid view needs nothing of iTunes.

### 3.10 Technical Feasibility / Incremental Implementation — 8.8/10 · **4.4 / 5**

**Evidence**

- Static site, Vercel, Hobby function cap respected (scrapers in `scripts/`). Catalog, player, cart, membership already ship. No framework migration required.
- Highest-impact identity work is **deletion and restyle**: stereo deck HTML, lime rules, tabbar/ham CSS, Cover Flow as default path, extra font requests, sleeve spec string. All local CSS/HTML/JS.
- Risk: `club-copy-os.css` `!important` wars; mobile nav currently depends on `injectTabBar`. Change ham visibility without leaving a dead-end.
- Do not add libraries, Web Audio, or replica wheels.

**Recommendations**

1. Implement P0 as CSS/HTML on existing classes. No new player.
2. Keep Bandcamp pipeline and Stripe as-is.
3. Treat `js/ipod.js` / Cover Flow as freeze-then-remove, not as a playground.

---

## 4. Top 5 Strengths

1. **The listening plate** — A future-facing record object (sleeve + LCD + Play) that reinterprets iPod-era grammar without rebuilding the hardware.
2. **Steel + spec type** — Aluminum field, Lucida chrome, Oswald lockups, Plex catalogue lines. Unmistakably digital, not nostalgic Bondi.
3. **Night Shift as a paper** — Masthead, desks, polaroid, a voice that could only be this label’s Vancouver/PNW floor.
4. **A real catalogue player** — `catalog.json`, Bandcamp streams, aluminum dock, numbered library rows, member prices. Files you keep, not an embed.
5. **Collectible economy** — Cassette backorder, Record Club tiers, SKUs, CC numbers. The site sells objects, not a lifestyle theme.

## 5. Top 5 Creative Gaps

1. **Mini hi-fi on the record page** — Speakers, VFD “TAPE,” `CC-GX00`. Replica after the homepage grew up.
2. **Mobile iOS tab bar + hidden hamburger** — App-shell costume; Artists unreachable in primary chrome; nav dies if JS does not inject.
3. **Lime live state vs invert dock** — Two brands for “playing.”
4. **Cover Flow as an official view** — iTunes 7 in a steel library.
5. **Homepage sequence** — Thin crate, then a zine fold that features Drake and Portishead before more Club Copy music.

---

## 6. P0 (Essential) Improvements

1. **One listening grammar on the release page.** Keep the steel sleeve hero. Replace `.ra-stereo` / mini hi-fi with a Plex tracklist (index, title, duration, invert current). Existing `js/player.js` dock stays the transport. No new dependency.
2. **Mobile wayfinding that is HTML.** Show `.nav-ham` under 720px; keep the drawer. If a bottom strip remains, it is typeset words on steel, includes a path to Artists, and does not reserve height when hidden. Logo remains Home.
3. **Single play-state.** Invert + pearl pip on sleeve, plate LCD, ticker, dock. Remove `#C6F000` glows from `listen-object.css` / `listen-plate.css`. Dock already points the way.
4. **Crate as the second beat.** Catalogue IDs on cards; at least 6 releases on desktop; do not let Night Shift start until the library has been seen.

## 7. P1 (Important) Improvements

1. Remove Cover Flow from the Library view toggle; use a 2-up sleeve grid if a visual view is needed (`?view=covers` can map to grid).
2. Steel the Artists index (`surface-night` off). Keep photographs; lose the inverted-OS chrome.
3. Static Mixes link in every nav; stop treating inject as IA.
4. Home Night Shift: cover story + floor + catalogue; move Drake-scale gossip to `/news` lead.
5. Drop extra webfonts (Anton, Barlow Condensed, Space Grotesk) so the four-family system is what loads.
6. Now Playing sheet: aluminum, not iOS glass.
7. Align public digital price copy (README $8 vs plate $9) with the sounding SKU.

## 8. P2 (Polish) Improvements

1. Retire or quarantine `js/ipod.js`; rewrite leftover “Click Wheel / iTunes / Aqua” comments so the next pass does not treat them as spec.
2. Quiet dock EQ; no visualizer energy.
3. Unify stylesheet `?v=` tags; shrink `club-copy-os.css` as rules move into the source sheets.
4. Library schema.org `numberOfItems` = live catalogue length; same for any stale ItemList.
5. Catalogue prefix: present `VCR026*` as historical in the spec line, or relabel display-only to `CC`.
6. Chapter-cut bars: one rule, or type-only section starts.
7. Phantom `--tabbar-h` padding when the dock is up.

---

## What not to do

- Do not put the Click Wheel back. Replica is solved on home; do not “celebrate” it on inner pages.
- Do not rebuild in a JS framework to find identity.
- Do not add neon, Bondi, lime fills, Frutiger cyan, or more broadcast bumpers.
- Do not scrape Instagram at request time.
- Do not flatten Night Shift into cards without a masthead.
- Do not hide Artists again to “protect the plate.”

---

## Score table

| Category | /10 | Weight | Weighted |
|---|---:|---:|---:|
| Brand Identity & Originality | 8.3 | 20 | 16.6 |
| Music-First UX & Information Architecture | 7.6 | 15 | 11.4 |
| Visual Language | 8.0 | 15 | 12.0 |
| Interface & Interaction Design | 7.6 | 15 | 11.4 |
| Catalogue & Music Player Experience | 8.0 | 10 | 8.0 |
| Zine & Editorial Integration | 7.8 | 10 | 7.8 |
| Motion & Micro-interactions | 7.2 | 5 | 3.6 |
| Mobile & Responsive Experience | 6.0 | 5 | 3.0 |
| Consistency & Design System | 6.4 | 5 | 3.2 |
| Technical Feasibility / Incremental Implementation | 8.8 | 5 | 4.4 |
| **Total** | | **100** | **81** |

---

If I could only implement five changes, they would be:

1. Replace the mini hi-fi on release pages with a steel tracklist that drives the existing dock.
2. Restore an HTML mobile menu (hamburger + drawer); retire the iOS Music tab bar as identity.
3. Make playing = invert/pearl everywhere; delete lime as the sound of the label.
4. Treat In rotation as a numbered crate (catalogue IDs, six objects) before the zine.
5. Swap Library Cover Flow for a sleeve grid so the catalogue never returns to iTunes 7.
