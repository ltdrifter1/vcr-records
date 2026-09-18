# Club Copy — Creative brief

**Living document.** Edit this file in place. Do not add Pass B/C/D sequels.

When the site ships, update **Current snapshot** and **Scorecard**. Change **Identity**, **Preserve**, and **Do not reopen** only on purpose.

| | |
|---|---|
| Role | Senior Creative Director / Brand / UX (music, editorial, culture) |
| Site | clubcopy.ca · static HTML/CSS/JS |
| Snapshot | branch `cursor/y2k-player-upgrade-3d53` · 18 September 2026 |
| Score | **84 / 100** |

---

## Identity

Club Copy is a future-facing independent record label from the Pacific Northwest. The site is a **small library you can hear, keep, and subscribe to.**

Inspired by early digital music culture (1999–2005): iPod-era interfaces, MP3 players, CD-ROM software, digital cameras, underground club graphics.

**Reinterpret that era. Do not recreate it.** Grammar, not props.

The site should feel: minimal, tactile, music-first, metadata-rich, collectible, unmistakably digital.

Slogan: *Music we want to keep.*

**Position:** brushed steel + LCD ink + invert-select. Not Bondi ice, not lime rave, not iOS glass, not a Click Wheel replica.

---

## Grammar (use) vs props (do not ship)

| Use | Do not ship |
|---|---|
| Invert-select lists | Click Wheel chassis, MENU/Select hub |
| Recessed LCD, Lucida / Plex specs | iTunes Cover Flow as the catalogue |
| Aluminum spec bar (hardware keys beside the display) | iOS pill, Spotify embed, lime LED |
| Catalogue IDs on spec lines (`CC004 · EP · cassette`) | Fake iPod / nano / QuickTime as logo |
| Square sleeves, play bezel, format tiles | Cassette hi-fi illustration as page identity |
| Night Shift voice (floor / fit / afters) | Blog grid, press-release English |
| Contact-sheet floor (camera roll) | Instagram UI, gold foil, `/api` scrapers |
| Motion = state (LED, invert, progress, cart flash) | Scanlines on daylight, visualizers, vinyl crackle |

---

## Design system

### Type

| Role | Face | Use |
|---|---|---|
| Display | Oswald 500/600/700 | Titles, lockups, nav |
| Body | Archivo 400/600 | Zine, notes |
| UI / LCD | Lucida Grande, Lucida Sans Unicode, Geneva, system UI | Menus, player, alerts |
| Spec | IBM Plex Mono 400/500 | Catalogue, times, prices, SKUs, handles |

Do not load Space Grotesk, Anton, Newsreader, Source Serif, Archivo Black, Share Tech Mono, Barlow unless Night Shift has a documented exception. Oswald is enough gothic.

### Colour

| Token | Hex | Role |
|---|---|---|
| Steel | `#E8E8E6` | Page |
| Pearl | `#F4F4F2` | Cards, playing fill |
| Soft | `#D2D2D0` | Rules, LCD well |
| Ink | `#1A1A1A` | Text |
| Muted / dim | `#5C5C5A` / `#7A7A78` | Meta |
| Stamp | `#B8B8B4` | Hover fill, chips |
| Select | `#2A2A28` | Invert selection, playing outline |
| LED | `#E4E4E0` | Idle pip |
| Night well | `#111111` | Floor / artwork surround, not whole templates |

Playing = invert (graphite + pearl). Never lime, Bondi, cyan, or champagne foil.

### Components

Keep: steel nav, sleeve + play bezel, LCD list, aluminum deck, Regular/Club tiles, Night Shift masthead, join radios, square-ish chrome buttons, contact-sheet card.

Radius 4–12px, not iOS pills. Duration `--dur: 280ms`.

---

## Current snapshot

Update this table when identity work ships.

| Surface | Now |
|---|---|
| Homepage | Steel **listening plate** (You Are (Love) / Riscape). Play sounds the sleeve. |
| Nav | **Library · Artists · Zine · Shop · Join** (+ cart). Photo roster stays off home. |
| In rotation | Crate of **12**, play only if cued. |
| Night Shift | Masthead + lead + headlines. Full paper at `/news`. |
| Floor | 12-up mixed stills under the paper (`@ltdrifta` + `@clubcopyrecords`), static JSON, no `/api` scrape. |
| Record Club | Desk after the floor. Stamp/graphite, not gold. |
| Library | List default. Cover Flow only via `?view=covers`. |
| Player | Aluminum LCD dock: invert play, pearl On air, chrome-bead scrub, catalogue in the bug. Not an iOS pill. |
| Object pages | `/you-are-love` steel. Desire-class pages still a darker archive dialect. |
| `/api` | 7 handlers. Helpers in `/lib`. No Instagram scrapers. |

**Communicates:** a small steel library with a paper, a camera roll, and a record you can hear.

**Still unfinished:** catalogue numbers are in `catalog.json` and the dock, but the plate kicker and sleeve cards still say `EP · 2026` / `four tracks · 15:02` instead of `CC004 · EP · cassette`. Home Night Shift is still closer to “the issue” than “the front.” Inner CSS is still a lock on top of leftovers (`club-copy-os.css`, `--bondi` alias, `js/ipod.js` unused on home). Cover Flow still exists as a product.

---

## Scorecard

Weighted. Re-score when you change a row; do not average in old passes.

| Category | /10 | Weight | Weighted | Note |
|---|---:|---:|---:|---|
| Brand identity & originality | 8.5 | 20 | 17.0 | Steel plate is the logo. Lime and Click Wheel are gone. |
| Music-first UX & IA | 8.0 | 15 | 12.0 | Five-link nav, playable feature, Artists in the mast. |
| Visual language | 8.0 | 15 | 12.0 | One steel world on home. Archive templates still a second dialect. |
| Interface & interaction | 8.0 | 15 | 12.0 | Plate buttons + invert dock. Mobile plate still crowded. |
| Catalogue & player | 8.5 | 10 | 8.5 | Dock is the right object. Spec lines still hide CC numbers. |
| Zine & editorial | 8.0 | 10 | 8.0 | Voice is the culture engine. Home lead is still a spread. |
| Motion | 7.5 | 5 | 3.8 | Invert, pip, progress. No visualizer. |
| Mobile | 7.5 | 5 | 3.8 | No wheel. Dock above the tab bar. |
| Design system | 5.5 | 5 | 2.8 | Tokens exist; files still fight (OS lock, leftover iPod JS). |
| Incremental feasibility | 8.0 | 5 | 4.0 | Static site. Keep `/api` under Hobby 12. |
| **Total** |  | **100** | **84** | |

---

## Preserve

- Steel field, LCD ink, invert-select, pearl playing state.
- Oswald / Archivo / Lucida / Plex.
- Listening plate as the first screen (record, not device).
- Aluminum dock: chassis + LCD + hardware keys + sounding-SKU buy.
- Night Shift writing. Do not “clean” it into captions.
- Catalogue schema (CC numbers, SKUs, Club vs Regular, cassette backorder).
- Floor as contact sheet, snapshot + local stills.
- Record Club as a desk (Free / Club / Premium + credit toward physical).
- Bandcamp `mp3-128` via `/api/bandcamp-stream`; local `previews/` fallback; no Web Audio on those streams.
- LCD “Added” toast.

---

## Do not reopen

- Bondi / ice cyan / Frutiger Airport.
- Click Wheel (or nano, iTunes window, QuickTime) as the homepage or the logo.
- Lime / acid green as brand or playing colour.
- Cover Flow as the default library.
- Instagram scrapers under `/api` (Hobby 12-function cap).
- Luxury-black fashion site because Desire is dark.
- Spotify / Apple Music as the face of listening.
- Flattening Night Shift into a CMS blog grid.

---

## Open — revise this list

These are the remaining high-leverage gaps. Strike, rewrite, or reorder as you decide. Do not add decoration above this list.

1. **Catalogue IDs on public spec lines** — plate LCD, sleeve cards, library rows: `CC004 · EP · cassette`. Keep numbers off the H1 if they feel cold.
2. **Home Night Shift as a front page** — masthead + one image + three headlines + link to `/news`. Not the whole issue under the plate.
3. **One object-page template** — Desire-class releases on the same steel as `/you-are-love` (Play + Buy + specs). Dark only as an artwork well.
4. **OS hygiene** — one token file; delete unused `js/ipod.js` / leftover Aqua comments; one cache tag; rename `vcr-*` only when those files are already open.
5. **Cover Flow** — keep buried or delete. Do not make it better.
6. **Mobile plate** — two chrome buttons (Play · Digital); cassette as text.
7. **Price docs** — README digital **$8** vs live catalog **$9**. Pick one source of truth.
8. **Planet MP3** — named app on steel, or clearly a separate product.

### Out of scope unless you say so

Framework rewrite, new motion library, new replica objects as heroes, putting scrapers back under `/api`.

---

## Homepage shape (target)

1. Steel mast — wordmark, five links, cart  
2. Now — featured plate that plays the sleeve  
3. In rotation — 8–12 sleeves, play if cued → Library  
4. Night Shift front — slug + one image + three headlines → the paper  
5. From the floor — 12 mixed stills  
6. Record Club — three levels  
7. Footer — Club Copy, publisher, Planet MP3 as app  

No empty mixtapes. No Instagram in primary nav. No 100vh gadget.

---

## Player (target)

One aluminum spec bar. Plate LCD and bottom dock share state.

- Data: artist, title, `CCxxx`, index, time, format of *this* object  
- Controls: prev / play-pause / next / scrub / buy-that-format  
- State: grey pip idle; invert On air; `is-live` only on the sounding sleeve  
- No Bandcamp string, no lime, no visualizer  

---

## Prior work (deleted)

Stacked Pass A–E audits (replica iPod, live≠git, Vercel Hobby RCA, floor/nav, lime dock) were accurate in their moment and are **retired**. History lives in git. This file is the brief going forward.
