# Club Copy — Creative audit, round 3 (25 October 2026)

**Brief:** a fresh look at the redesign through one lens: does it look and feel like an underground electronic record label? Most of the energy goes to the first screen. Night Shift is covered at the end because it came up while this round was running. Nothing in this document has shipped; the hero proposal is a prototype in `docs/audit-3/`.

**Method:** rendered the live build at 1440, 1024 and 390 px, in idle, hover and on-air states. Re-shot the first screens of Numbers, Timedance, AD 93, Ostgut Ton, Warp, Dekmantel, Mood Hut (Vancouver), Hessle Audio and Livity Sound on Bandcamp. Measured type, geometry and fold on the current hero and on the prototype.

---

## 1. Score: does it read as an underground label?

| | /10 | Note |
|---|---|---|
| Ground and restraint | 9 | Black, one grotesk, mono data, one signal colour. Nothing decorative. This is right. |
| Catalogue as the site | 8 | Rows with the number first, library with filters and sleeves view. Numbers and Timedance would recognise it. |
| First screen | 5 | A product card: kicker, artist, title, a bordered "LCD" box, three button styles, a track list, a cover. Six layers where the references use three. And it is a week-old record while twenty newer ones sit below. |
| Type | 7 | Archivo wide at 600 is confident. Artist (grey, small) above title (white, huge) inverts the Numbers hierarchy, where the artist is the white line. |
| Signal of place and liveness | 4 | Nothing says where the label is or that anything is happening now. Club Copy has the one thing none of the references have, a real player, and the first screen hides it behind a plain Play button. |
| Night Shift | 4 | A 7,700 px wall of text rows. 13 of the 20 current stories have pictures; the index shows one. It reads as an archive, not a magazine. |
| Shop, cart, account, join | 8 | Quiet, consistent, out of the way. Correct for the genre. |
| Motion | 8 | Hover underline, sleeve lift, dock slide. Nothing else. Correct. |
| Phone | 7 | Clean, but the hero is 951 px tall and the track list falls under the fold. |
| Craft | 8 | No overflow, no console errors, aligned hairlines. The cover and the copy column start 31 px apart in the hero. |

**Overall: 68 / 100.** The system is right. The two places where people form an opinion, the first screen and the magazine, are the two that are below the system.

---

## 2. The first screen, in detail

### What the references do on the first screen

- **Numbers:** the newest record as one full-width row. Artist white, title grey, same size. The catalogue number and date in bold mono at the bottom-left. Cover on the right. Nothing else.
- **Timedance:** a logo on black. Two words of nav.
- **AD 93:** an almost empty white page. The footer is the page.
- **Mood Hut (Vancouver):** a strip of seven photographs, and in the corner `VANCOUVER, BC · 01:42`. A live clock. That one line does more for "a label from a place" than any copy.
- **Warp, Dekmantel:** a full-bleed photograph with the name small in a corner. Big-label budget; not the model.
- **Ostgut Ton:** a dark grid, two across, number above the name.

What they share: the first screen is **one record, or nothing**, and the type sits on the grid as a fact, not as a pitch.

### What the current hero does (measured at 1440 × 900)

| Element | Where | Finding |
|---|---|---|
| Kicker `OUT NOW · 18 OCTOBER 2026` | y 191 | The record is CC013, released 18 October. CC037 came out today. Twenty-four newer releases follow in the rows. The lead is hard-coded to `pitch-black` in the generator, and plate.js keeps the same default. |
| Artist 37 px grey, title 101 px white | y 247–380 | Inverted against Numbers. The artist is who you are following; it should be the white line. |
| "LCD" box, 560 × 69 | y 398 | A bordered mono box with `CC013 · Album · 3 tracks · 11:19` and `Digital $4`. It is the last gadget from the VCR identity. Underground labels do not draw devices. |
| Play (solid), Digital (outline), Release page (text) | y 485 | Three button styles in one row. "Release page" duplicates the title link. |
| Track list | y 557–710 | Good. The one part that says "this site plays music". |
| Cover 580 px, play key 48 px in the corner | x 820 | The cover is the best asset on the page (white label on black, the mark on the label). The play key on it is a small box in the corner. |
| Empty space | 160 px above, 160 px below | The block is vertically centred in a 100 svh box, so a third of the screen is dead on both sides. The rows below are edge-to-edge; the hero floats. |
| Phone | 951 px tall | Cover, kicker, artist, title, LCD, three buttons, then the tracks under the fold. |

### The proposal: the record is the page, and the page is the player

Prototype: `docs/audit-3/hero-prototype.html` + `hero-prototype.css` (served from the repo root it loads the real `css/cc.css` and the real cover). Renders in `docs/audit-3/hero-proposed-*.png`.

**Structure, top to bottom, one hairline grid**

1. **Top line** (mono, 12 px, hairline under it): left `LATEST · 25 OCTOBER 2026`; right `CUMBERLAND, BC · 14:07`, a live clock in the label's time zone (`America/Vancouver`). When something is playing the left becomes `■ ON AIR · 01 · Lenzman, Redeyes – High & Low (Remix)` in the signal colour, with the square blinking slowly (no animation under reduced motion).
2. **Lockup**, top-left, aligned to the top of the cover: artist in ink, title in the second ink, **same size**, Archivo wide 600, line-height .94. Size is set at build time from the longer of artist and title, so "Pitch Black" gets 120 px and a 37-character remix title gets 58 px on two lines. Never three lines. A hyphen with spaces in a title is set as an en dash.
3. **Player strip**, bottom-left, on the same hairline as the bottom of the cover: a Play key with a glyph (solid, 56 px tall) joined to a `Digital · $1.50` key (outline). Under it the track rows: number, title, duration. The playing row keeps its black ground; its number turns signal, its time reads `1:16 / 4:27`, and a 2 px signal line grows along the bottom of the row as the track plays. No orange slab.
4. **Cover**, right, 44 vw or the row height, whichever is smaller, flush to the right gutter. Hover or focus brings up a large centred play key (up to 112 px, black square, ink outline, so it reads on a white label and on a dark sleeve). On touch it sits at the bottom-right at 56 px. Playing: the key turns signal and shows pause; the 8 px signal square appears at the top-left of the sleeve as it does today.
5. **Foot line** (mono, hairline above and below): `CC037 · SINGLE · 1 TRACK · DIGITAL` with the catalogue number in ink, and `RELEASE PAGE →` at the right. This is the Numbers line, moved to where the eye lands after the cover.

**What is removed:** the kicker "Out now", the LCD box, the price in the status line, the text button "Release page", the three-style button row, the centred floating layout.

**Which record leads:** the newest release that has a stream, unless `catalog.lead` names one (for an album you want to keep up through a run of singles). Today that is CC037. The build decides, so the home page is right the morning a record drops without anyone editing a template.

**Why this is the best version of a Club Copy first screen, not just a cleaner one**

- It is one record, as the references do it, but it **plays**. None of them can do that. The clock, the on-air line, the growing progress line and the pause key are all true states, not decoration, so they pass the discipline test and still make the page feel like a station that is on.
- The place line gives the label a home in one glance. Mood Hut proves the device; it is the most Pacific Northwest thing a page can do without a photograph.
- Artist white, title grey, same size, is the strongest label-type convention there is. It reads from across the room.
- The cover becomes an object with nothing drawn over it until you ask.
- Everything is on the row grid, so the hero and the rows beneath are one surface.

**Measured on the prototype**

| | 1440 × 900 | 1024 × 768 | 390 × 844 |
|---|---|---|---|
| Hero height | 900 (fills the screen) | 768 | 772, whole hero above the fold including one track and the foot line |
| Cover | 634 px | 451 px | 358 px |
| Title | 56 px, 2 lines (37 chars) / 109 px, 1 line ("Pitch Black") | 40 px | 30 px / 47 px |
| Horizontal overflow | none | none | none |

**Contract kept:** `[data-listen-plate]`, `#platePlay`, `#platePlayHit`, `#plateBuyDigital`, `#plateBuy`, `.listen-plate`, `.listen-sleeve`, `[data-plate-art]`, `.hero-track[data-play-release][data-play-track]`, `.listen-plate-actions`. plate.js and player.js run unchanged; the only additions are the clock (ten lines) and the progress variable from `vcr:player` `currentTime / duration`. The LCD elements go; plate.js already null-checks them.

**Decisions for you**

- The place on the clock line. "Cumberland, BC" is what two roster lines say; the about page says British Columbia. One word to change.
- Whether the lead should be the newest record (default) or pinned with `catalog.lead`.

---

## 3. Night Shift

**What happened:** the redesign applied the AD 93 archive discipline to the magazine. It is right for a catalogue and wrong for a monthly with pictures. The old index was a magazine (masthead block, cover photograph, stars pin, numbered contents). The new one is 7,707 px of text rows at 1440: a feature, then 20 rows, a stars strip, 10 more rows, then 44 archive rows by year.

**Findings**

1. 100 of 128 stories have an image; 13 of the 20 in Vol. 10 do. The index shows one. The home page zine rows already show thumbnails; the index does not.
2. Three lists of the same stories on one page (contents, start here, back catalogue). The back catalogue has its own page (`/news/archive`).
3. The volume cover (`cover: G-Shock (press)`) is a 346 px thumbnail at the right of the feature. A magazine leads with its cover.
4. Story pages are fine: full-width hero image, mono caption, kicker, measured body. Keep.

**Proposal (same rows, same type, no new system)**

- **Cover.** Under the masthead, the volume's cover image full width at 3:2 with the volume line on it: `VOL. 10 · OCTOBER 2026 · 20 STORIES · COVER: G-SHOCK (PRESS)`. One image, like a front page.
- **Contents.** The 20 current stories as rows with thumbnails where one exists (the `row--story` fragment from the home page), numbered 01–20 in mono, grouped by format with a mono kicker. Rows without an image stay text rows; the mix is the magazine.
- **Stars** keeps its place between the feature and the contents, at the same height.
- **Start here** goes to the volumes page. **Back catalogue** becomes the last ten with a link to the archive. Target length under 3,500 px.

This is a template change in `scripts/site/pages/zine.js` and about forty lines of CSS. The JS contracts (`[data-zine-story]`, the stars pin, archive search) do not move.

---

## 4. Molly Haze

Removed in this round, since it was a content request rather than a design one: dropped from `data/catalog.json`, the library roster order and the generated pages; the artist page and photo deleted; the nine old redirects that landed on the page now land on `/artists`, plus a redirect for the retired page itself. Three Night Shift stories mention the name in their prose (two interviews and the Strait piece); those links now go to the roster. The prose is left as written. Pushed on `claude/wizardly-knuth-bv0p5y`, not merged.

---

## 5. If I could only implement three changes

1. **The hero above, exactly as prototyped.** Generator (`scripts/site/pages/home.js`), about 90 lines of CSS replacing the `.lead*`, `.lcd` and `.listen-sleeve` rules, the clock and progress additions in `js/plate.js`, and the lead-selection rule. Half a day including verification at three widths and the on-air states.
2. **Night Shift as a magazine** (section 3). Half a day.
3. **Artist white, title grey, same size** on release rows and release pages too, so the hero's hierarchy is the site's. One CSS rule and a swap of two lines in `fragments.js` and `release.js`.

---

## 6. Shipped (25 October 2026)

- The hero as prototyped, with the lead pinned to Pitch Black through `lead` in `data/catalog.json` (clear the field and the newest streamable release leads). Clock, on-air line and progress line live in `js/plate.js`.
- Night Shift front page: the volume's cover full width, then the pictured stories as a three-across grid and the text pieces as a numbered list, stars in place, ten pieces from before the volumes with the full list and "Start here" moved to `/news/issues`. 6,280 px at 1440, from 7,700.
- Artist in ink, title in the second ink, same size, on the hero, the release rows and the release page. The release page also loses the LCD box; its keys join into one strip like the hero's.
- Verified: 20 behaviour checks pass; home, Night Shift and release pages render at 1440, 1024 and 390 with no overflow and no script errors; the on-air state paints the top line, the keys, the sleeve and the progress line.
- Second pass on the hero, same day: the lead is a row, not a screen. Natural height, so the next release is on the first screen; the top line reads `Club Copy · Cumberland, BC` with the clock at the right; the foot carries `CC013 · Album · 18 October 2026` in the Numbers position; the "Releases" heading between the lead and the rows is gone, with "All 27 releases →" after the rows.
- Mixtapes as rows, same day: `js/tapes.js` renders each mix as a row (DJ, runtime, year and genres in one mono line, the title in the display face, a play key, the sleeve at the right); the home shows three day and three night. The on-air mix gets the ON AIR prefix and signal keys like a release row.
- Video mixtapes on the home page: `scripts/sync-youtube-videos.js` reads the L.T. Drifta channel's public RSS into `data/videos.json`, the build renders the latest four as rows, and a daily workflow keeps them current. A click plays the video in the row on `youtube-nocookie.com` and pauses the site player.
- Shop and Night Shift rows, same day: products are rows on `/merch` (type, fit and stock in mono, the name in the display face, the lede, a "View · $price" key, the product at the right); shop.js filters and sort are unchanged. The home Night Shift block leads with pictured pieces, adds read time and a "Read →" line.
