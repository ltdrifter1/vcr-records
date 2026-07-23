# VCR Store Art Upgrade Plan

Audit target: balmingtiger.com **interaction + atmosphere** (not a copy of their art).
Room source of truth: `public/textures/store_pano_v4.webp` (4096×2048 equirect) + matching `*_off` / LQIP / hotspot glows.

## Tier 1 — shipped

| Change | Detail |
|---|---|
| Cash register facing | Customer display + keypad face the room. |
| Poster theme | Punk collage → spaced house/electronic flyers. |
| Density | Cleared payphone wall; tightened Archive hit. |
| Atmosphere | Soft polish + Flicker practicals. |

## Tier 2 — shipped (this pass)

| Change | Detail |
|---|---|
| Re-ink register | 3/4 cel body, cast shadow into blue counter, wear speckles, room ink weight. Glow refreshed. |
| Flyers into wall | Yellow wall wiped clean; 5 electronic flyers + booth-side pair painted with tape, grit, irregular ink (not UI cards). |
| Quiet props | Staff polaroid, OPEN LATE neon stub, HANDLE WITH CARE 174 stencil, small vinyl pin — evening density. |
| Lights-off practicals | `store_pano_off_v4.webp` with CRT cyan, entrance neon, ceiling lamp warm pools (not flat darken). |
| Paths | `lib/pano.ts` → `store_pano_v4` / `_off_v4` / `_lqip_v4`. |

Tooling: `scripts/upgrade_pano_tier2.py`.

## Gaps still open (Tier 3)

| Gap | Needs |
|---|---|
| True hand-ink continuity | Human illustrator re-inks overlays into shared stroke weight across the whole room. |
| Empty mint storytelling | A few more unique painted props (not stickers) on large empty walls. |
| Gate ↔ room continuity | Gate brand field samples a still from v4 so enter → explore is one world. |
| Full UV retune | After a real paint pass, re-author every glow silhouette from final art. |

## Tier 3 — Full room reskin

- New painted `store_pano_v5` in one continuous PNW-cel language.
- Retune UVs in `sections.ts`, `AmbientHits.tsx`, `LampHotspot.tsx`, `CrtScreen.tsx`, `LightBeams.tsx`, `Flicker.tsx`.
- Gate samples the room.

## Do / don’t

- **Do** keep VCR-original art; use BT only as interaction + atmosphere reference.
- **Don’t** paste BT (or other) copyrighted posters/characters into the pano.
- **Do** keep hotspot IDs stable so shop / audio / panels keep working.
