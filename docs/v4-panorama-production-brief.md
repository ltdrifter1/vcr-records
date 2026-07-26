# VCR Store Panorama V4 — Production Brief

## Goal

Redraw the existing VCR Records store as a more spacious 360° environment
without replacing its identity, objects, palette, or cel-animation language.

## Architectural changes

- Raise the illustrated ceiling by roughly 30–35%.
- Extend the main aisle and floor sightline.
- Increase wall area and breathing room between major props.
- Keep a natural standing eye-level horizon with stronger
  foreground / midground / background separation.
- Preserve the current interactive landmarks: listening booth, CRT, record
  bins, cash register, rotary phone, and their relative navigation order.
- Keep the scene unmistakably VCR Records; do not reproduce another site's
  furniture, room layout, props, artwork, type, or palette.

## Required production deliverables

1. `store_pano_v4.webp` — 8192×4096, 2:1 equirectangular, sRGB.
2. `store_pano_off_v4.webp` — same projection and dimensions, lights-off.
3. `store_pano_lqip_v4.webp` — 512×256 preview.
4. Layered source file with architecture, props, light, and texture separated.
5. Five 1024×1024 RGBA edge masks matching the final projection:
   listening booth, CRT, record bins, cash register, and phone.

## Acceptance checks

- Left and right edges wrap without a visible seam.
- Vertical poles and door frames do not bend unexpectedly at the horizon.
- Zenith and nadir contain valid artwork (no flat caps or duplicated pixels).
- No duplicated props at the seam.
- Existing hotspots can be re-authored against recognizable landmarks.
- Text in the room reads correctly after the BackSide texture flip.
- A 132° horizontal view reads as one open room, not a crowded crop.

## Generated concept status

The generated V4 concept is an art-direction frame only. It demonstrates the
taller ceiling, deeper aisle, larger wall planes, and stronger depth hierarchy.
It is **not** a shippable panorama: the generator returned 1536×1024 (3:2),
not 2:1 equirectangular, and the left/right boundaries are not seam-validated.
It must be redrawn or outpainted in a panorama-aware workflow before replacing
the live V3 texture.
