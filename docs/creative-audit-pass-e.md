# Club Copy — Creative Audit, Pass E (listening dock)

**Role:** Senior Creative Director, Brand Designer, UX/UI Designer (music / editorial / culture)  
**Scope:** Repository `main` at `c8c554a` and the live dock as captured 18 September 2026. **No product UI was redesigned for this write-up.** Implementation that follows is scoped to the Continuity Deck only.  
**Previous:** [Pass A](creative-audit.md) 67 · [Pass B](creative-audit-pass-b.md) 75 · [Pass C](creative-audit-pass-c.md) deploy RCA · [Pass D](creative-audit-pass-d.md) 80  
**Constraint:** Preserve distinctive work. Smallest high-impact set. Reinterpret 1999–2005 digital culture; do not recreate it. No green.

---

## 1. Executive Summary

The site’s identity is now a steel library with a paper. Pass D’s remaining gaps (floor, catalogue IDs, Artists in the mast) are either shipped or out of this pass. The object that still argues with the brief is the **floating player**.

The dock is the right typology: aluminum chassis, recessed LCD, hardware keys, format buy. It is not an iOS pill and not a Click Wheel. That is worth keeping.

What it currently communicates, while audio is running: *a lime-green gadget*. The play triangle, LED, EQ bars, native scrub thumb, and playing outline all use `--acid: #C6F000`. The subtitle still says **Bandcamp**. The Now Playing sheet is still an iOS Music glass stage. Those three facts pull the listening experience back toward costume — rave fill, platform chrome, Apple Music — after the homepage finally stopped wearing an iPod.

The brief wants a future-facing label inspired by iPod-era *grammar* (list, invert-select, LCD type, clicky confirmation), MP3-player *hardware* (bezel, inset display, tactile keys), CD-ROM *software* (spec sheet, index, duration), and digital-camera *state* (a small power pip, not a rec-red toy). None of those sources used lime as the identity of play. iPod 4G, iTunes 4, and QuickTime played in graphite and pearl.

**Verdict:** Keep the aluminum spec bar. Retire acid as the sound of the label. Make playing = invert. Put catalogue language in the LCD. Leave Night Shift, the plate, and the floor alone.

---

## 2. What to preserve

- Brushed-steel chassis (`#f4f4f2 → #c0c0bc`), 4–6px radius, inset highlight. Not a pill.
- Recessed LCD well with Lucida title and Plex times. Scanline at low opacity is LCD, not VHS, if it stays quiet.
- Track index `01 / 04`, Standby / On air, Up next, format buy on the sounding SKU.
- Hardware prev / play / next cluster sitting *beside* the display, not inside a glass capsule.
- Sleeve jewel with a 1px bezel.
- Bandcamp stream pipeline, local preview fallback, no Web Audio on CORS-less streams.
- Dock-away while the listening plate owns the first screen.

---

## 3. What fails the brief (dock only)

| Evidence | Why it fails |
|---|---|
| Play key: black square, **lime triangle** | Acid is 2000s rave fill. Playing should be invert-select (graphite well, pearl glyph) — iPod/iTunes grammar, not a glowstick. |
| LED pip + EQ bars + `accent-color` scrub + playing 1px ring | All `--acid`. One leftover lime is a state light. Five limes is a brand. |
| Subtitle `Bandcamp · Riscape — You Are (Love)` | Platform credit on the LCD. Should be catalogue: `CC004 · Riscape`. |
| Native range thumb | Browser chrome, often green. 2003 players used a chrome bead on a graphite track. |
| Close `×` reading as an orphan under the bar | Accidental, not hardware. |
| `.vcr-stage` glass sheet + mint `#7CFFB2` air pip | Second OS: iOS Music. Dock and stage should share steel invert. |
| `--acid` still `#C6F000` in `player.css :root` | Player stylesheet reasserts the colour the OS lock already tried to quiet (`--led: #E4E4E0`). |
| Sleeve “On air” chips still acid (`home-zine.css`) | Crate and dock disagree the moment a record plays. |

---

## 4. Target: one aluminum spec bar (Y2K modern, no replica)

**Not:** iOS pill, Spotify embed, Click Wheel, Cover Flow, VHS deck, Bondi, lime LED, Frutiger cyan.

**Yes:** the software that would have shipped *with* a 2003 player, rebuilt in 2026.

- **Chassis** — same steel. Playing = 1px select (`#2A2A28`), not a lime halo.
- **LCD** — deeper well; index + catalogue; invert **On air** chip (graphite fill, pearl type, pearl pip). Idle pip is stamp grey.
- **Play** — graphite key, pearl triangle/pause. Pressed inset. Never green.
- **Scrub** — custom track: ink fill, pearl/chrome bead thumb. `--scrub` for WebKit fill.
- **EQ** — ink LCD pixels or none. No visualizer energy, no acid glow.
- **Buy** — unchanged chrome chip; label stays the sounding format.
- **Copy** — Lucida title, Plex spec. No Bandcamp string.
- **Stage** — keep sheet; play key already pearl-on-white. Air chip matches dock invert, not mint.

Motion = state only: invert chip, pip, progress, press. `prefers-reduced-motion` already kills EQ/dock slide.

---

## 5. Smallest set (this pass)

1. Restyle the dock in `css/player.css`: kill `--acid` usage, invert play/LED, custom scrub, hardware keys.  
2. LCD copy in `js/player.js`: catalogue + artist; duration fallback from catalog; `--scrub` on timeupdate.  
3. Align sleeve on-air + `status-chip--air` to invert/pearl so the crate does not reintroduce lime next to the dock.

**Out of scope:** Click Wheel revival, Cover Flow, Bondi, Night Shift rewrite, new `/api` functions, renaming `vcr-player` internals (touch only what this pass opens).

---

## 6. Score impact (dock only)

Pass D scored Catalogue & Music Player **8.0 / 10**. The dock typology earned that. Lime + Bandcamp + native scrub hold the last two points. This pass should land the player as **steel invert**, which is the distinctive Club Copy position: iPod grammar without iPod chassis, digital without rave.
