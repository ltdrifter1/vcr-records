# VCR Store Panorama V7 — Illustrator Brief (job post + production spec)

## Job title to post

**"Illustrator needed: 360° record-store panorama redraw + silhouette
edge-glow masks (VCR Records, WebGL)"**

## Who to hire

A 2D texture / matte painter — ideally the artist who painted the current
360 room — not a Three.js engineer. Ideal profile: Photoshop / Procreate
artist who has done equirectangular / panorama work plus game-UI glow
masks, VFX mattes, or interactive hotspot edges. A creative developer
alone can't invent accurate silhouettes from a filled rectangle, and a
matte painter who has never touched a 2:1 equirect will bend the
architecture at the poles and the wrap seam.

Where to look: the artist who painted the current room (best fit), then
panorama / skybox artists on ArtStation with game or VR credits.

---

## Scope — one 360° room redraw, same layout logic, new dressing

Redraw the VCR Records store panorama. **Keep the composition, the camera
logic, and every interactive object's position** — the site's hotspots and
lookto aim points are authored against fixed coordinates and must not be
re-authored. This is a redecoration + redraw, not a new floor plan.

### Scene changes (v6 → v7)

1. **Posters out, shelves in.** Remove all wall posters. Replace them with
   wall-mounted shelving stocked with records (face-out sleeves + spines)
   and cassettes. The record sleeves and cassette labels provide the
   room's color — walls stay clean.
2. **New palette: bright neutral, zero purple.** The purple ceiling,
   purple counter, and purple curtains are gone. Use warm whites, cream,
   soft grays, and natural wood tones. Keep the room bright and airy.
   Small saturated accents are fine (sleeve art, the VCR RECORD SHOP
   sign), but no purple anywhere in the room.
3. **Listening booth → turntable station.** Replace the curtained LISTEN
   booth with a vinyl turntable and headphones on a stand, built into the
   wall shelving. It must stay centered on the booth's current anchor
   (see table below) so the Music hotspot keeps aiming at it.
4. **Move the entrance door.** The door currently sits at file-x ≈ 0.82,
   crowding the counter. Move it into the empty wall span at
   **file-x 0.90–0.96**. Do not place it closer than 4% to the image's
   left/right edges — the outer ~3% is cross-faded for the wrap seam.

### Hard constraint — interactive anchors (do not move these)

Coordinates are fractions of the delivered 2:1 image: `x` from the left
edge, `y` from the top. Each object's silhouette must contain its anchor,
and the object should stay inside its current footprint box (±3%).

| Object | Anchor (x, y) | Footprint box (x0–x1, y0–y1) |
|---|---|---|
| CRT television | 0.116, 0.487 | 0.073–0.160, 0.422–0.553 |
| Turntable station (was booth) | 0.244, 0.474 | 0.192–0.296, 0.322–0.625 |
| Record-bin island | 0.514, 0.564 | 0.472–0.557, 0.488–0.640 |
| Cash register (on counter) | 0.665, 0.503 | 0.624–0.706, 0.451–0.555 |
| Rotary phone (on counter) | 0.758, 0.524 | 0.721–0.796, 0.486–0.563 |

The turntable station may be shorter than the old booth (we can shrink
the hotspot in code) but its stand must be centered near the anchor.

---

## Deliverables

1. **`store_pano_v7`** — 2:1 equirectangular, sRGB, **4096×2048 minimum**
   (8192×4096 welcome), lossless PNG or max-quality WebP. Lights-on only —
   we grade the lights-off twin in the build pipeline.
2. **Layered source file** (PSD/Procreate) with architecture, shelving,
   props, and light separated.
3. **Five edge masks** following the exact painted outline of each object:
   - `listening-booth_edge` (the turntable station)
   - `crt-tv_edge`
   - `record-bins_edge`
   - `cash-register_edge`
   - `phone-booth_edge`

### Edge mask specs

- 1024px on the long side, RGBA (transparent WebP or PNG — we convert).
- White/cream stroke on transparent background.
- **Soft outer falloff only — no filled shape, no text, no labels.** The
  runtime tints and breathes the rim; a filled slab breaks the effect.
- Each mask must line up with the object in the equirect pano. We supply
  the UV crop rectangles (the footprint boxes above) and screenshots; the
  mask canvas is the crop of the pano at that box.
- Reference feel: balmingtiger.com hover aura (warm edge light) — but
  **original art only, no BT assets**.

Note: we have an automated rim extractor as a fallback, so flat, clean
cel fills behind each object make everything easier — but hand-drawn
masks that hug the painted silhouette are the preferred deliverable.

## Acceptance checks

- Left and right edges wrap without a visible seam; no props inside the
  outer 4% of either edge.
- Zenith and nadir contain valid artwork (no flat caps, no smearing).
- Vertical door frames and shelf posts don't bend at the horizon.
- Every anchor in the table lands inside its object's silhouette
  (we verify with `npm run verify:aim` renders and will send you the
  frames if anything drifts).
- No purple anywhere; posters gone; door clear of the counter.
- Any in-room text reads correctly (we mirror-flip the texture for the
  sphere interior — we'll confirm orientation on the first WIP pass).

## What we handle in code (not the artist's job)

- Lights-off night grade, LQIP preview, and WebP encoding
  (`scripts/build-v6-pano.py` pipeline, updated for v7).
- Drop-in replacing `public/hotspots/<id>_edge.webp` — file names and
  code paths are already wired (`goldEdge` + rim/bloom in
  `app/components/Hotspot.tsx`).
- Tuning glow breath speed / rim + bloom opacity (single `GLOW` constant
  block in `Hotspot.tsx`).
- Verifying aim framing per hotspot (`npm run verify:aim` renders each
  lookto view with the edge mask overlaid).
- Hotspot plane sizes (`w`/`h` in `app/data/sections.ts`) if the new
  turntable station is smaller than the old booth.
