#!/usr/bin/env python3
"""
V7 panorama production bake — bright-neutral redecorated store.

Input : art/vcr-pano-v7-src.png  (1536x1024 cel painting: cream walls,
        wood shelving with records + cassettes instead of posters, turntable
        listening nook, door moved away from the counter, zero purple)
Output: public/textures/store_pano_v7.webp        4096x2048 lights-on
        public/textures/store_pano_off_v7.webp    4096x2048 lights-off grade
        public/textures/store_pano_lqip_v7.webp   512x256 preview
        public/hotspots/<id>_edge.webp            silhouette rim masks
        public/hotspots/crt_frame.webp            bezel overlay (tube hole)
        public/hotspots/crt_backing_off.webp      dark tube (focused, no video)
        public/hotspots/crt_backing_playing.webp  black tube behind video

Masks and CRT overlays are generated in gnomonically projected plane space —
the exact billboard footprint Hotspot.tsx / CrtScreen.tsx render — so they
line up with the pano at any plane size (the v7 LISTEN tower spans ~77°).

Segmentation: cel ink outlines close every object, so background is whatever
a flood fill from the crop border can reach without crossing an ink line.
This survives the low-contrast cream-on-cream palette (register vs wall).

Run: python3 scripts/build-v7-pano.py
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "art" / "vcr-pano-v7-src.png"
OUT_ON = ROOT / "public" / "textures" / "store_pano_v7.webp"
OUT_OFF = ROOT / "public" / "textures" / "store_pano_off_v7.webp"
OUT_LQIP = ROOT / "public" / "textures" / "store_pano_lqip_v7.webp"
HOTSPOT_DIR = ROOT / "public" / "hotspots"

W, H = 4096, 2048
SEAM_BAND = 128  # px cross-faded across the wrap seam

# Hotspot billboard planes — MUST mirror app/data/sections.ts (u, v, w, h).
# Edge masks are drawn in these planes' projected space.
PLANES = {
    "listening-booth": (0.756, 0.49, 35.2, 75.0),
    "crt-tv": (0.862, 0.534, 33.8, 19.1),
    "record-bins": (0.482, 0.578, 25.0, 30.9),
    "cash-register": (0.328, 0.488, 22.8, 14.7),
    "phone-booth": (0.229, 0.532, 25.9, 12.2),
}
MASK_PLANE_RADIUS = 47.5  # SPHERE_RADIUS - 0.5 (Hotspot.tsx)
CRT_PLANE_RADIUS = 47.2  # SPHERE_RADIUS - 0.8 (CrtScreen.tsx)

# Ink-flood tuning per target: (ink luminance threshold, opening iterations)
SEG = {
    "listening-booth": (120, 3),
    "crt-tv": (120, 2),
    "record-bins": (120, 3),
    "cash-register": (110, 2),
    "phone-booth": (110, 2),
}

# Lamp pools for the lights-off grade (file-space u/v of the V7 source).
LAMP_POOLS = (
    (0.258, 0.19, 0.13, 0.5),
    (0.291, 0.23, 0.12, 0.45),
    (0.431, 0.165, 0.14, 0.5),
    (0.501, 0.11, 0.16, 0.4),  # fan cluster
    (0.919, 0.44, 0.16, 0.4),  # door window daylight spill
)


def bake_pano() -> Image.Image:
    src = Image.open(SRC).convert("RGB")
    if src.size != (1536, 1024):
        raise SystemExit(f"unexpected source size {src.size}")

    pano = src.resize((W, H), Image.Resampling.LANCZOS)
    # Two-pass unsharp keeps the clean ink lines crisp after the 2.67x upscale.
    pano = pano.filter(ImageFilter.UnsharpMask(radius=1.8, percent=85, threshold=2))
    pano = pano.filter(ImageFilter.UnsharpMask(radius=3.6, percent=32, threshold=3))

    # Wrap band: cross-fade left/right edges so u=0 joins u=1 seamlessly.
    arr = np.asarray(pano).astype(np.float32)
    band = SEAM_BAND
    left = arr[:, :band].copy()
    right = arr[:, -band:].copy()
    t = (np.arange(band, dtype=np.float32) / (band - 1))[None, :, None]
    blend = right * (1 - t) + left * t
    half = band // 2
    arr[:, :half] = blend[:, half:]
    arr[:, -half:] = blend[:, :half]
    return Image.fromarray(arr.astype(np.uint8))


def lights_off(pano: Image.Image) -> Image.Image:
    """Night grade: cool, dark, faint pools under the hanging lamps."""
    a = np.asarray(pano).astype(np.float32) / 255.0

    dark = a ** 1.2
    dark[..., 0] *= 0.4
    dark[..., 1] *= 0.45
    dark[..., 2] *= 0.62

    yy, xx = np.mgrid[0 : pano.height, 0 : pano.width].astype(np.float32)
    warm = np.zeros_like(a)
    for fu, fv, radius, gain in LAMP_POOLS:
        cx, cy = fu * pano.width, fv * pano.height
        d2 = ((xx - cx) / (radius * pano.width)) ** 2 + (
            (yy - cy) / (radius * pano.width)
        ) ** 2
        glow = np.exp(-d2)[..., None] * gain
        warm += glow * np.array([1.0, 0.72, 0.38])[None, None, :]

    out = np.clip(dark + warm * a * 0.9, 0, 1)
    return Image.fromarray((out * 255).astype(np.uint8))


def plane_basis(u: float, v: float, radius: float):
    """Billboard basis matching uvToSpherical + lookAt(origin).

    three.js Object3D.lookAt points a non-camera's +z AT the target, so the
    plane's +z faces the origin and textures read in file space (verified:
    v6 file-space crops rendered un-mirrored on these billboards).
    """
    yaw = (u - 0.5) * np.pi * 2 - np.pi / 2
    pitch = (0.5 - v) * np.pi
    cp, sp = np.cos(pitch), np.sin(pitch)
    sy, cy = np.sin(yaw), np.cos(yaw)
    center = np.array([-sy * cp, sp, -cy * cp]) * radius
    z_ax = -center / np.linalg.norm(center)
    x_ax = np.cross(np.array([0.0, 1.0, 0.0]), z_ax)
    x_ax /= np.linalg.norm(x_ax)
    y_ax = np.cross(z_ax, x_ax)
    return center, x_ax, y_ax


def project_pano_to_plane(
    pano: np.ndarray,
    u: float,
    v: float,
    pw: float,
    ph: float,
    radius: float,
    tex_w: int,
    tex_h: int,
) -> np.ndarray:
    """Sample the pano along rays through every texel of the billboard plane."""
    center, x_ax, y_ax = plane_basis(u, v, radius)
    mu = (np.arange(tex_w) + 0.5) / tex_w
    mv = (np.arange(tex_h) + 0.5) / tex_h
    gu, gv = np.meshgrid(mu, mv)
    lx = (gu - 0.5) * pw
    ly = (0.5 - gv) * ph
    pos = center[None, None, :] + lx[..., None] * x_ax + ly[..., None] * y_ax
    d = pos / np.linalg.norm(pos, axis=-1, keepdims=True)

    theta = np.arccos(np.clip(d[..., 1], -1, 1))
    st = np.maximum(np.sin(theta), 1e-9)
    phi = np.mod(np.arctan2(d[..., 2] / st, -d[..., 0] / st), 2 * np.pi)
    file_u = np.mod(1 - phi / (2 * np.pi), 1)
    file_v = theta / np.pi

    h, w = pano.shape[:2]
    px = np.clip((file_u * w).astype(np.int32), 0, w - 1)
    py = np.clip((file_v * h).astype(np.int32), 0, h - 1)
    return pano[py, px]


def edge_mask(pano_arr: np.ndarray, sid: str) -> Image.Image:
    """Silhouette rim in billboard space via ink-outline flood segmentation."""
    u, v, pw, ph = PLANES[sid]
    scale = 1024 / max(pw, ph)
    tw = max(2, round(pw * scale))
    th = max(2, round(ph * scale))
    crop = project_pano_to_plane(
        pano_arr, u, v, pw, ph, MASK_PLANE_RADIUS, tw, th
    ).astype(np.float32)

    ink_thr, open_iters = SEG[sid]
    lum = crop.max(axis=2)
    ink = lum < ink_thr
    # Slight dilation seals anti-aliased line gaps before flooding.
    ink = ndimage.binary_dilation(ink, iterations=1)

    # Background = reachable from the crop border without crossing ink.
    free = ~ink
    labels, _ = ndimage.label(free)
    border_labels = np.unique(
        np.concatenate([labels[0, :], labels[-1, :], labels[:, 0], labels[:, -1]])
    )
    bg = np.isin(labels, border_labels[border_labels != 0])
    obj = ~bg

    obj = ndimage.binary_closing(obj, iterations=3)
    obj = ndimage.binary_fill_holes(obj)
    # Opening drops thin ink tails (baseboard / wall trim lines).
    obj = ndimage.binary_opening(obj, iterations=open_iters)

    # Keep the component anchored at the plane center (the target itself).
    labels, n = ndimage.label(obj)
    if n > 1:
        cy, cx = th // 2, tw // 2
        center_label = labels[cy, cx]
        if center_label == 0:
            ys, xs = np.nonzero(obj)
            if len(ys):
                idx = np.argmin((ys - cy) ** 2 + (xs - cx) ** 2)
                center_label = labels[ys[idx], xs[idx]]
        if center_label:
            obj = labels == center_label
    obj = ndimage.binary_fill_holes(obj)

    rim = obj & ~ndimage.binary_erosion(obj, iterations=7)
    rim_f = ndimage.gaussian_filter(rim.astype(np.float32), 3.0)
    rim_f = np.clip(rim_f * 2.4, 0, 1)

    out = np.zeros((th, tw, 4), dtype=np.uint8)
    out[..., 0:3] = 255
    out[..., 3] = (rim_f * 255).astype(np.uint8)
    return Image.fromarray(out)


def rounded_rect_alpha(tw: int, th: int, rel_w: float, rel_h: float, radius_frac: float, feather: float = 2.0) -> np.ndarray:
    """Anti-aliased centered rounded-rect mask (1 inside, 0 outside)."""
    yy, xx = np.mgrid[0:th, 0:tw].astype(np.float32)
    cx, cy = tw / 2, th / 2
    hw, hh = rel_w * tw / 2, rel_h * th / 2
    r = radius_frac * min(hw, hh) * 2
    dx = np.abs(xx - cx) - (hw - r)
    dy = np.abs(yy - cy) - (hh - r)
    dist = np.hypot(np.maximum(dx, 0), np.maximum(dy, 0)) + np.minimum(
        np.maximum(dx, dy), 0
    ) - r
    return np.clip(0.5 - dist / feather, 0, 1)


def crt_overlays(pano_arr: np.ndarray) -> None:
    """Bezel frame (tube hole) + tube backings, in CrtScreen plane space."""
    u, v, w, h = PLANES["crt-tv"]
    frame_w, frame_h = w * 0.88, h * 0.78
    tw = 1024
    th = max(2, round(tw * frame_h / frame_w))

    rgb = project_pano_to_plane(
        pano_arr, u, v, frame_w, frame_h, CRT_PLANE_RADIUS, tw, th
    )
    # Tube glass = the 0.7w x 0.58h video plane inside the 0.88w x 0.78h frame.
    hole = rounded_rect_alpha(tw, th, 0.7 / 0.88, 0.58 / 0.78, 0.14, feather=3.0)
    frame = np.dstack([rgb, ((1 - hole) * 255).astype(np.uint8)])
    Image.fromarray(frame).save(HOTSPOT_DIR / "crt_frame.webp", "WEBP", quality=92)
    print(f"wrote crt_frame.webp {tw}x{th}")

    # Backings render on planes of screen*1.04 / screen*1.02 — draw the tube
    # rounded-rect at ~1/1.04 relative size so it matches the painted glass.
    bw = 1024
    bh = max(2, round(bw * (h * 0.58) / (w * 0.7)))
    for name, base, edge_gain in (
        ("crt_backing_off", (32, 36, 42), 0.55),
        ("crt_backing_playing", (5, 5, 6), 0.9),
    ):
        glass = rounded_rect_alpha(bw, bh, 1 / 1.04, 1 / 1.04, 0.14, feather=3.0)
        yy, xx = np.mgrid[0:bh, 0:bw].astype(np.float32)
        r2 = ((xx - bw / 2) / (bw / 2)) ** 2 + ((yy - bh / 2) / (bh / 2)) ** 2
        shade = 1 - edge_gain * np.clip(r2, 0, 1)
        img = np.zeros((bh, bw, 4), dtype=np.uint8)
        for c in range(3):
            img[..., c] = np.clip(base[c] * shade, 0, 255).astype(np.uint8)
        img[..., 3] = (glass * 255).astype(np.uint8)
        Image.fromarray(img).save(HOTSPOT_DIR / f"{name}.webp", "WEBP", quality=90)
        print(f"wrote {name}.webp {bw}x{bh}")


def main() -> None:
    pano = bake_pano()
    pano.save(OUT_ON, "WEBP", quality=90, method=6)
    print(f"wrote {OUT_ON.name} {pano.size}")

    off = lights_off(pano)
    off.save(OUT_OFF, "WEBP", quality=88, method=6)
    print(f"wrote {OUT_OFF.name}")

    pano.resize((512, 256), Image.Resampling.LANCZOS).save(
        OUT_LQIP, "WEBP", quality=70
    )
    print(f"wrote {OUT_LQIP.name}")

    pano_arr = np.asarray(pano.convert("RGB"))
    for sid in PLANES:
        mask = edge_mask(pano_arr, sid)
        out = HOTSPOT_DIR / f"{sid}_edge.webp"
        mask.save(out, "WEBP", quality=90)
        cover = np.asarray(mask)[..., 3]
        print(f"wrote {out.name} {mask.size} rim={100 * (cover > 30).mean():.1f}%")

    crt_overlays(pano_arr)


if __name__ == "__main__":
    main()
