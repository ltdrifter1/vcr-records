# Club Copy — Creative Audit, Pass G

**Role:** Senior software engineer, web developer, brand designer, UX/UI designer (music / editorial / culture)  
**Scope:** Repository `main` at `d341058` (About on steel, #648) and production `https://www.clubcopy.ca/` as fetched 28 September 2026. They are the same listening OS. **No product code was changed for this audit.**  
**Date:** 28 September 2026  
**Previous:** [Pass A](creative-audit.md) 67 · [Pass B](creative-audit-pass-b.md) 75 · [Pass C](creative-audit-pass-c.md) deploy RCA · [Pass D](creative-audit-pass-d.md) 80 · [Pass E](creative-audit-pass-e.md) dock brief · [Pass F](creative-audit-pass-f.md) 81  
**Constraint:** Preserve distinctive work. Smallest high-impact set. Reinterpret 1999–2005 digital culture; do not recreate it. Preserve existing functionality. No new dependencies. No full rebuild.

Pass F scored **81 / 100** at `d61b7e3`. Since then the repo shipped the five identity fixes (#645), one steel OS (#646–#647), and About on steel (#648). This pass scores that **post-fix** site, not the replica problems already closed.

---

## 1. Executive Summary

Club Copy now has a **real, live identity**. The homepage is a brushed-steel listening plate for Riscape’s *You Are (Love)*: mixed-case Oswald title, Archivo artist, Plex `CC004 · EP · 15:02`, aluminum Play, digital $9, cassette backorder. In rotation is a numbered crate. Mixes sit before Night Shift. The dock is graphite invert, not lime, not an iOS pill. Library is a list with a sleeve-grid option. The Click Wheel, Bondi ice, Cover Flow-as-default, iOS Music tab bar, and mini hi-fi on `/you-are-love` are gone. That is the brief, and it is on clubcopy.ca.

The remaining problem is **the catalogue does not yet live in the object the homepage invented.**

1. **One record is Club Copy. Fifteen are still a previous OS.** `/you-are-love` is a jewel sleeve, steel Play, invert tracklist. `/gorilla`, `/mixtape`, `/still-riding`, `/ep1`, and the rest still use `ra-cover` + `btn-light` “Buy Digital — $1.50 CAD” as the primary key, with Play as a ghost. `/inlet-knight` still stages a **named cassette chassis** (window, rollers, mouth, Side A film). `js/tape-player.js` then adds **iTunes jewel tilt and a wet-floor reflection** to every release stage. Replica left the homepage and moved into the crate.
2. **Night chrome still owns people, merch, and the planet.** The Artists index paints full-bleed `#0c0e12` slabs and `btn-chrome-on-dark` “Enter.” Artist worlds stay charcoal. Shop’s sticky filter bar is Stones Throw night glass (`rgba(22,25,30,.94)`). `/planet` is a third OS: `#0a0a0c`, blur nav, white type. Photos can go dark. The **chrome** cannot — or Club Copy is a steel label with a nightclub annex.
3. **Music-first breaks one click after the plate.** The homepage’s first hardware key is Play. Gorilla’s first hardware key is Buy. Inlet Knight’s hero CTAs are Buy Cassette / Buy Digital; listen is a 3D tape. Catalogue numbers that make the library feel collectible (`CC023`, `CC011`) are missing from most PDP fact lines.
4. **The OS is still enforced, not authored once.** `release-archive.css` still opens as a “dark continuum” (`#050505`, cyan VFD invert on `.track-row`) and is later patched to steel for `.release-object`. Cover Flow CSS remains in `library.js` / `library.css` even though Sleeves is a 2–4-up grid. `js/player.js` still branches on `data-ipod`. Mixes is in the HTML nav, then `injectMixesNav()` draws it **again** on `/tapes`.

What to protect: the plate, steel tokens, Oswald / Archivo / Plex / Lucida-stack, Night Shift masthead and writing, `catalog.json` + Bandcamp dock, cassette economics, Record Club desk, Library list + sleeve grid, hamburger + drawer, invert play-state.

What not to bring back: Bondi, Click Wheel-as-logo, lime LED, Cover Flow as a view, iOS tab bar, `/api` scrapers.

**Verdict:** Identity is live and distinctive. Score is held by a two-template catalogue, leftover night chrome, and replica motion on the record pages. Incremental HTML/CSS/JS — copy the You Are (Love) object onto the other 15 PDPs, steel the remaining chrome, delete dead replica CSS — closes the gap without a rebuild.

---

## 2. Overall Score: **86 / 100**

A distinctive steel library with a paper, **+5** versus Pass F (81). The lift is the work already shipped: tracklist instead of hi-fi, hamburger instead of iOS tab bar, invert instead of lime, numbered crate, sleeve grid, Mixes in the IA, About on steel. Held down by a catalogue that has not yet become the homepage object, and by Artists / Shop / Planet still speaking night.

Live production and HEAD share the plate, CC004, Play, In rotation, Mixes, Night Shift. Score is for that shared site. Static EP1 spec on live HTML may still read `CC008` until `home-wall.js` hydrates; HEAD fallback already says `Legacy`.

---

## 3. Detailed Scorecard

Scores are **/10**. Weighted score = (score/10) × category weight.

### 3.1 Brand Identity & Originality — 8.6/10 · **17.2 / 20**

**Evidence**

- Homepage hero is a **record object**, not a 4th-gen iPod: mixed-case Oswald title, Archivo artist, Plex `CC004 · EP · 15:02`, aluminum Play. iPod *grammar* (list, LCD ink, invert keys, hardware press) without iPod *chassis*. Distinctive and on-brief.
- Steel field `#E8E8E6`, LCD ink `#1A1A1A`, stamp `#B8B8B4`, invert `#2A2A28`, pearl pip. Rare among independent-label sites. Not a Bandcamp embed in a sans-serif theme.
- Night Shift (“the floor / the fit / the afters”) is original culture, not a News page. Record Club (Free / Club 30% / Premium credit) and cassette-at-$20 is a collectible economy.
- Slogan in schema: “Music we want to keep.” That is the brand in six words.
- **Against:** Fifteen of sixteen PDPs still stage `ra-cover` and pill “Buy Digital — $X CAD.” `/inlet-knight` is a cassette replica. Artists and Planet are a second (night) brand. Shop filter bar is a third (dark glass). `VCR026*` still exist as commerce IDs; display now says `Legacy` on the crate — honest, but the crate then looks like two imprints. `join-wheel` is leftover Click Wheel language on the membership desk.

**Recommendations**

1. Treat `/you-are-love` as the **only** release template. Port `.listen-sleeve` + `.btn-steel` + CC fact line + invert `.track-row` to every `archive-release` page. Do not invent a new object.
2. Replace the Inlet Knight cassette chassis with the same sleeve. Side A / Side B can stay as **Plex labels** on the tracklist (`A1`–`B5`), which already exist.
3. Keep `CC` as the public series. `VCR026*` stays in the spec line as historical SKU copy (Library already does this). Do not mint fake `CC008` for EP1.
4. Do not revive Click Wheel, Bondi, lime, or Cover Flow as identity.

### 3.2 Music-First UX & Information Architecture — 8.0/10 · **12.0 / 15**

**Evidence**

- First screen is the sounding record. Featured EP has Bandcamp cues in `catalog.json`. `js/plate.js` plays CC004. This is the music-first promise kept on home.
- Homepage sequence is now correct: **plate → numbered crate (6) → Mixes (3) → Night Shift → Record Club.** Pass F’s “thin crate then Drake” is closed on home.
- Desktop nav: Library · Artists · Mixes · Zine · Shop · Join. Correct label IA. Mixes is in static HTML.
- Library / Shop split is right. Library ItemList `numberOfItems` is **16**, matching `catalog.json`.
- **Against:** `/gorilla` primary CTA is Buy; Play is `btn-ghost`. `/inlet-knight` hero has no Play in the CTA row. Most PDPs omit the catalogue number. `/tapes` prints Mixes twice (static link + `injectMixesNav()`). Night Shift on `/news` still JSON-LDs Drake as item 1; the visible cover is Riscape, then the card grid leads with Drake. *Tonight’s Record* in the mast folio is still `/news/dummy` (Portishead). `plate.js` still has a Gorilla `onAir` fallback if the feature has no cue — dead path, wrong metaphor.

**Recommendations**

1. On every PDP: **Play · Digital · Cassette** in that order, steel keys, same as the plate. Buy is always available; it is never the first hardware key on a sounding record.
2. Facts line = `CC023 · Single · 2:44` (or `Legacy · VCR026D3 · EP · 5:06`). Same grammar as the crate.
3. Delete `injectMixesNav()` or skip when Mixes already exists. `/tapes` must not show Mixes Mixes.
4. Keep Drake on `/news` as gossip. Do not put it in schema position 1 ahead of the signed cover. Prefer a Club Copy cue for *Tonight’s Record* while CC004 is the plate.

### 3.3 Visual Language (Colour, Typography, Layout) — 8.2/10 · **12.3 / 15**

**Evidence**

- Token lock is coherent on home, library, About, and `/you-are-love`: steel, pearl, stamp, LCD, ink. `club-copy-os.css` is now a short token file, not a war. Extra webfonts (Anton, Barlow, Space Grotesk) are gone from page heads. Four families in the Google request: Oswald, Archivo, IBM Plex Mono.
- Jewel sleeve (10px radius, 8px bezel, inset highlight) is tactile and digital — MiniDisc / iPod photo well, not skeuomorphic vinyl.
- Type roles stick when they stick: Oswald display, Archivo body, Plex specs. Plate lockup is liner notes, not a rave flyer.
- **Against:** Lucida Grande is claimed in README / `--ui` but **never loaded**. The stack falls to Geneva / Verdana. That is accidentally era-correct (the device font was system Lucida) — either commit to the system stack in the README, or subset Lucida/a legal equivalent. Do not add a fifth decorative family.
- Artists roster `#0c0e12` + Bondi-tinted radial (`rgba(186,204,224,.12)`) fights the steel field. Shop `store-bar` is charcoal on a steel page. `release-archive.css` still names `#050505` and cyan `rgba(126, 246, 255)` before the steel patch. Mixes CSS comments still say “Y2K steel / chrome.”

**Recommendations**

1. One field: `#E8E8E6`. Artist photos can sit in a dark well *inside* the sleeve/bezel. Roster copy and CTAs stay aluminum.
2. Shop filter bar = steel hairline + invert active chip, not `backdrop-filter` night. zine-pages already restyles chips when `body.zine-surface` — use that, delete the inline night bar in `merch.html`.
3. Document Lucida as a **system UI stack**, not a missing webfont. Stop promising a file that is not requested.
4. Put `CC004 · EP · 15:02` grammar on PDP facts, not only crate cards.

### 3.4 Interface & Interaction Design — 8.0/10 · **12.0 / 15**

**Evidence**

- Steel keys (3px radius, inset highlight, invert Play) feel like 2003 player software rebuilt in 2026. Plate hit is 42px in the sleeve corner, not a center-play glass overlay. Dock: jewel, LCD, hardware cluster, format buy, close. Playing = 1px `#2A2A28` ring + invert LED chip.
- Mobile wayfinding is hamburger + drawer (shown under 720px). Tab bar is retired (`display: none !important`). This was Pass F’s worst IA miss; it is closed.
- Library view toggle: List (default) / Sleeves. Sleeves is a CSS grid on `.cat-list.is-covers`. `flowRoot` is forced `hidden`. Correct.
- **Against:** Every PDP still mounts `js/tape-player.js`, which injects `.ra-reflect` and pointer-tilt (“iTunes jewel tilt + wet-floor reflection”). That is replica interaction on the object page. Gorilla/Inlet Knight buttons are `btn-light` / `btn-ghost`, a different radius and voice than `.btn-steel`. Now Playing stage is aluminum *after* a dark-glass block in the same file. `join-wheel` is a decorative hub on the membership card. Shop sticky bar steals the steel nav’s job.

**Recommendations**

1. Stop loading `tape-player.js` tilt/reflect, or gate it behind a class that no current page uses. Keep Side A/B track binding if that file still owns it.
2. One button: `.btn-steel`. PDPs, library shelf, artists, shop. Ghost is a text link, not a second pill dialect.
3. Membership desk: delete `.join-wheel`. Email + level radios are enough. It already looks like a card.
4. Collapse the dark-then-steel patches in `player.css` / `release-archive.css` so the interface is designed once.

### 3.5 Catalogue & Music Player Experience — 8.3/10 · **8.3 / 10**

**Evidence**

- `data/catalog.json` is the system of record: 16 releases, 4 artists, catalogue numbers, formats, member-relevant prices, Bandcamp IDs, durations. Every release has at least one cue. Library hydrates play buttons and filters from it. Homepage wall fetches it (6 cards, featured first).
- Player (`js/player.js`) streams via `/api/bandcamp-stream`, local preview fallback. LCD meta prefers catalogue. Errors surface in the dock. EQ bars are in the DOM and **forced `display: none`**. This is production listening.
- Featured LCD-equivalent: `CC004 · four tracks · 15:02` / `Digital $9 · cassette backorder`. Honest object. README now matches $9.
- **Against:** `/you-are-love` is the only PDP with `.listen-sleeve`. The other 15 are `ra-cover` (or a cassette). Inlet Knight is a toy. Library static HTML has **no** `.cat-play`; play appears only after `library.js` paints from JSON — if JS fails, you can buy, you cannot hear. Cover Flow CSS/JS listeners remain (`coverflow:change`). `player.js` still samples canvas energy and keeps `data-ipod` branches. Digital prices ($9 / $8 / $1.50 / $3) are commercially fine; they look unset only when the PDP omits the CC line.

**Recommendations**

1. One listening grammar: sleeve Play + dock + Plex tracklist. Remove `.ra-cassette` HTML. Keep A1/B2 as list indexes.
2. Include `.cat-play` in the static library rows (progressive enhancement), or a noscript “open the record” is already the title link — then say so in the lead.
3. Do not restore Cover Flow. Delete `.album-flow` CSS and the `coverflow:change` listener.
4. Leave Bandcamp CORS limitation as-is. Do not attach Web Audio to those streams.

### 3.6 Zine & Editorial Integration — 8.0/10 · **8.0 / 10**

**Evidence**

- Night Shift is a real zine: nameplate, slug (vancouver / cat 022 / pnw / date / live / free), desks, barcode as ornament, polaroid + tape, pull quote. Voice is specific (bathroom line, flyer on the fridge, no-fun-city). Not a Shopify blog.
- Home cover story is **Riscape: Heads Down** — correct pairing with the plate. “In the paper” is now **one** floor piece (*The Sticker on the Lens*), not Drake / Jhené / Dummy as a wall. Sequence on home is music first.
- Paper sits on the same steel (`--zine-paper: #E8E8E6`). Grain/fiber at low opacity is tactile. `/news` cover is also Riscape; the card index still opens with Drake (19 Sep).
- 78-item paper is a library of writing. Integration gap is **subject hierarchy on `/news`**, not lack of content. Masthead stamp says “zine.” Good.

**Recommendations**

1. Home issue: cover (signed artist) + one floor piece + one catalogue piece, then “full paper.” Current home is slightly thin (one card). Add *You Have to Flip It* / *You Are (Love)* as the catalogue inch — already in the paper.
2. Keep *Tonight’s Record* as a Night Shift column. Change the folio link to a Club Copy record while CC004 is on the plate, or label it clearly as a column, not “the record.”
3. Do not flatten Night Shift into a “blog.” Protect desks, ticker, polaroid, writing.
4. Schema on `/news`: signed cover first. Gossip can lead the card grid.

### 3.7 Motion & Micro-interactions — 7.8/10 · **3.9 / 5**

**Evidence**

- Useful motion: ticker (`prefers-reduced-motion` kills it), dock slide, invert chip, sleeve press (translateY 1px), hardware keys.
- Costume motion still mounted: jewel tilt + reflection on every PDP (`tape-player.js`). Roster photo `scale(1.04)` on hover. About sleeve grid the same. Stage open no longer uses glass (patched). EQ animation exists but is hidden — dead weight.
- Chapter-cut bars were retired on home (`home-zine.css`: “No chapter-cut bars”).

**Recommendations**

1. Motion = state only: invert, pip, progress, press, dock in.
2. Delete tilt/reflect. Keep reduced-motion paths.
3. Remove `.vcr-player__eq` markup if it cannot be shown.

### 3.8 Mobile & Responsive Experience — 8.0/10 · **4.0 / 5**

**Evidence**

- Plate stacks lockup → sleeve → spec → 2-up actions → ticker (`listen-plate.css`). Desktop becomes sleeve | copy. Considered, not a cropped iPod.
- Hamburger is `display: flex` under 720px. Drawer is steel, Oswald 32px — magazine index, not SF Symbols. Artists, Mixes, Contact, Cart are in the drawer. Logo is Home. `--tabbar-h: 0px`.
- Wall is 6 cards (JS). Play on the sleeve is tappable. Coarse-pointer 44px rules exist. Library Cover Flow cannot appear under 720px because the view is a grid anyway.
- **Against:** `/tapes` duplicate Mixes is worse on a short drawer. Plate actions go 2-column then full-width Play — good — but `btn-light` PDPs still `flex: 1 1 100%` stacked Buy-first. Dock + plate Play can double-offer transport (dock-away on hero is the right idea; PDPs are not `data-listen-plate`, so the dock may overlap the tracklist). Shop night bar is sticky under the nav on small screens — two chromes.

**Recommendations**

1. Keep hamburger + word drawer. Do not bring back a tab strip.
2. Release pages: same dock-away-while-hero pattern as home, or accept the dock as the only transport and let sleeve Play toggle it.
3. Fix Mixes duplication (see 3.2). Steel the shop bar (see 3.3).

### 3.9 Consistency & Design System — 7.0/10 · **3.5 / 5**

**Evidence**

- Stated system in README is clear (steel tokens, four type roles, listening plate, aluminum dock). Cache tags on reviewed pages are unified `?v=st32`.
- Components that *are* the system: `.listen-sleeve`, `.btn-steel`, `.vcr-player`, `.cat-row`, `.sleeve-card`, `.zine-masthead`. They should be the only dialects.
- **Against:** Two PDP templates (sleeve vs `ra-cover`/cassette). Two button dialects (`btn-steel` vs `btn-light`/`btn-chrome-on-dark`). `release-archive.css` is a dark file with a steel appendix. Cover Flow CSS is still titled as such. `home-folio.css` still styles an Instagram floor that is **not on `index.html`**. `home-zine.css` still has `--ipod-w`. `player.js` `data-ipod`. `join-wheel`. Shop inline night CSS. Planet inline night CSS. `club-copy-os.css` is appropriately small; the archaeology moved back into the page sheets.

**Recommendations**

1. One button, one sleeve, one dock, one list row. PDPs use those.
2. Delete unused Cover Flow, IG-floor, iPod width, and dark-continuum *selectors* once the steel rules are the source.
3. Do not load `tape-player.js` for tilt. Keep release-bind / player as the listen stack.

### 3.10 Technical Feasibility / Incremental Implementation — 8.8/10 · **4.4 / 5**

**Evidence**

- Static site, Vercel, Hobby function cap respected (scrapers in `scripts/`). Catalog, player, cart, membership already ship. No framework migration required.
- Highest-impact identity work is **copy-and-delete**: clone `/you-are-love` hero+listen onto the other PDPs; remove cassette HTML; restyle shop bar and roster chrome; remove Mixes inject; delete dead CSS. All local HTML/CSS/JS. No new libraries.
- Risk: `tape-player.js` may still bind Side A/B / previews on long albums — strip tilt, keep bind. `injectMixesNav` is shared; guard instead of deleting if some pages still lack Mixes (home/library/artists already have it).
- Do not add libraries, Web Audio, or replica wheels.

**Recommendations**

1. Implement P0 as HTML/CSS on existing classes. No new player.
2. Keep Bandcamp pipeline and Stripe as-is.
3. Treat Cover Flow / `data-ipod` / cassette chassis as freeze-then-remove.

---

## 4. Top 5 Strengths

1. **The listening plate** — A future-facing record object (sleeve + spec + Play) that reinterprets iPod-era grammar without rebuilding the hardware. Live on clubcopy.ca.
2. **Steel + spec type** — Aluminum field, Oswald lockups, Archivo body, Plex catalogue lines. Unmistakably digital, not nostalgic Bondi.
3. **A real catalogue player** — `catalog.json`, Bandcamp streams, aluminum invert dock, numbered library rows, member prices. Files you keep, not an embed.
4. **Night Shift as a paper** — Masthead, desks, polaroid, a voice that could only be this label’s Vancouver/PNW floor. Home now puts it *after* you can hear the house.
5. **Collectible economy** — Cassette backorder, Record Club tiers, SKUs, CC numbers, Legacy honesty for `VCR026*`. The site sells objects, not a lifestyle theme.

## 5. Top 5 Creative Gaps

1. **Two release templates** — `/you-are-love` is the Club Copy object. The other 15 PDPs are `ra-cover` + Buy-first pills; Inlet Knight is a cassette replica with iTunes tilt.
2. **Night chrome on Artists, Shop, Planet** — Charcoal slabs, “Enter,” sticky dark filter bar, blur nav. A second brand on the same URL.
3. **Music-first dies on the object page** — Play is the plate’s first key and Gorilla’s second. Catalogue numbers vanish between crate and PDP.
4. **Replica motion still mounted** — `tape-player.js` jewel tilt + wet-floor reflection on every release stage.
5. **OS archaeology** — Dark-continuum CSS, Cover Flow leftovers, `data-ipod` branches, duplicate Mixes, Instagram floor CSS for a section that is not on home.

---

## 6. P0 (Essential) Improvements

1. **One listening object on every release page.** Copy `/you-are-love`: `.listen-sleeve` + steel Play first + `CC#### · kind · duration` + invert tracklist driving the existing dock. Remove `.ra-cassette` from `/inlet-knight`. No new dependency.
2. **Kill replica interaction on the stage.** Stop injecting tilt/reflect from `js/tape-player.js`. Keep any Side A/B / preview binding the file still owns.
3. **Steel the remaining chrome.** Artists index/world: dark photographs, aluminum type and `.btn-steel`. Shop: delete the inline night `store-bar`; use the same hairline filter language as Library. Planet can stay a night *station* if it is labeled as one — not as Club Copy chrome.

## 7. P1 (Important) Improvements

1. Facts line on every PDP includes catalogue number (and `Legacy · VCR026*` when needed).
2. Guard or remove `injectMixesNav()` so `/tapes` does not list Mixes twice.
3. Home Night Shift: add one catalogue inch (the signed record’s paper) under the floor piece.
4. Folio *Tonight’s Record*: Club Copy cue, or a column label that cannot be mistaken for the plate.
5. One button dialect (`.btn-steel`). Retire `btn-light` / `btn-chrome-on-dark` on label surfaces.
6. Delete Cover Flow CSS/JS and unused IG-floor rules. Shrink the dark half of `release-archive.css`.
7. README: Lucida as system UI stack, not a webfont to fetch.

## 8. P2 (Polish) Improvements

1. Remove `data-ipod` branches and `--ipod-w` once nothing mounts them.
2. Remove `.vcr-player__eq` markup; analyser pump if unused.
3. `plate.js`: drop Gorilla `onAir` fallback now that CC004 is cued.
4. “Acquisition confirmed” modal → the site’s own voice (“Added. Receipt by email.”).
5. Footer: one link set (home is missing Join/Account relative to library).
6. `/news` schema ItemList: signed cover first.
7. Unify leftover `nav-on-dark` on `tapes.html` with `nav-light` (already mixed on the body).

---

## What not to do

- Do not put the Click Wheel back. Replica is solved on home; do not “celebrate” it on Inlet Knight or Mixes.
- Do not rebuild in a JS framework to find identity.
- Do not add neon, Bondi, lime fills, Frutiger cyan, or more broadcast bumpers.
- Do not scrape Instagram at request time, or remount the floor as Instagram UI.
- Do not flatten Night Shift into cards without a masthead.
- Do not hide Artists to “protect the plate.”
- Do not design a new player. The dock is the player.

---

## Score table

| Category | /10 | Weight | Weighted |
|---|---:|---:|---:|
| Brand Identity & Originality | 8.6 | 20 | 17.2 |
| Music-First UX & Information Architecture | 8.0 | 15 | 12.0 |
| Visual Language | 8.2 | 15 | 12.3 |
| Interface & Interaction Design | 8.0 | 15 | 12.0 |
| Catalogue & Music Player Experience | 8.3 | 10 | 8.3 |
| Zine & Editorial Integration | 8.0 | 10 | 8.0 |
| Motion & Micro-interactions | 7.8 | 5 | 3.9 |
| Mobile & Responsive Experience | 8.0 | 5 | 4.0 |
| Consistency & Design System | 7.0 | 5 | 3.5 |
| Technical Feasibility / Incremental Implementation | 8.8 | 5 | 4.4 |
| **Total** | | **100** | **86** |

---

If I could only implement five changes, they would be:

1. Port the You Are (Love) object (jewel sleeve, steel Play first, catalogue spec, invert tracklist) to every release page, and replace the Inlet Knight cassette chassis with that sleeve.
2. Remove iTunes jewel tilt and wet-floor reflection from `tape-player.js` so the record page stops impersonating iTunes 7.
3. Steel Artists chrome and the Shop filter bar — photographs may stay dark; type, nav, and chips stay aluminum.
4. Print `CC#### · kind · duration` on every PDP and make Play the first hardware key wherever a cue exists.
5. Delete leftover Cover Flow / iPod / dark-continuum CSS and stop injecting a second Mixes link so the steel OS is the source, not an override.
