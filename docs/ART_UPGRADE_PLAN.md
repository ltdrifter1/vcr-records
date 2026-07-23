# VCR Store Art Upgrade Plan

Audit target: balmingtiger.com **interaction + atmosphere** (not a copy of their art).
Room source of truth: `public/textures/store_pano_v3.webp` (4096×2048 equirect) + matching `*_off` / LQIP / hotspot glows.

## What shipped in this pass (Tier 1)

| Change | Detail |
|---|---|
| Cash register facing | Redrew register so **customer display + keypad face the room** (was clerk-facing / “backwards”). Updated `cash-register_glow.webp` + hit size in `sections.ts`. |
| Poster theme | Replaced the dense punk collage (NOFX / Rancid / Bad Religion / Sonic Youth cluster) with **4 spaced house/electronic flyers** (VCR Nights, Warehouse Deep House, Jungle 174, After Hours D&B) + door/booth electronic stickers. |
| Density | Cleared yellow wall around the payphone; tightened Archive hotspot (`w/h`), moved ambient `poster` hit off the collage. |
| Atmosphere | Soft cel polish on pano; remounted low `Flicker` neon practicals; existing FilmFX wash + LightBeams. |
| Tooling | `scripts/upgrade_pano_art.py` documents the surgical edit approach for future passes. |

## Gaps vs balmingtiger (honest)

| Gap | Why code can’t finish it |
|---|---|
| Line weight / brush texture | BT rooms feel hand-inked with uneven stroke + paper grain. Our base art is clean cel flats; PIL overlays can’t fully fake that. |
| Prop storytelling density | BT fills every wall with unique painted props. We thinned posters but large mint walls are still empty. |
| Register / flyer integration | New posters/register are stil cel-correct but read slightly “pasted” until a painter re-inks edges into the wall. |
| Lights-off mood | Off pano is a darkened twin; BT-like practical pools need painted light. |

## Tier 2 — Illustrator pass (recommended next)

1. **Re-ink cash register** into the counter (cast shadow into blue top, shared outline weight with phone/door).
2. **Paint 4–6 original electronic flyers** (warehouse/rave/house/jungle) directly into the equirect — same ink as the room, tape corners, slight paper curl — then delete programmatic overlays.
3. **Add 3 quiet props** on empty mint walls (crate sticker, neon fragment, staff photo) so density is even, not one crowded wall.
4. **Author lights-off** with warm practicals (CRT spill, neon, lamp) instead of global darken.
5. Re-export glows from final silhouettes (`cash-register`, `flyer-wall`, optional lamp).

**Files:** `store_pano_v4.webp`, `store_pano_off_v4.webp`, LQIP, matching `/public/hotspots/*_glow.webp`, then bump paths in `lib/pano.ts`.

## Tier 3 — Full room reskin

- New `store_pano_v4` in one continuous PNW-cel language from gate → room.
- Retune every UV in `sections.ts`, `AmbientHits.tsx`, `LampHotspot.tsx`, `CrtScreen.tsx`, `LightBeams.tsx`, `Flicker.tsx`.
- Gate brand field samples a still from the room so enter → explore feels like one world.

## Do / don’t

- **Do** keep VCR-original art; use BT only as interaction + atmosphere reference.
- **Don’t** paste BT (or other) copyrighted posters/characters into the pano.
- **Do** keep hotspot IDs stable so shop / audio / panels keep working.
