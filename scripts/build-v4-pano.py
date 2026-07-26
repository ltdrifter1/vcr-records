#!/usr/bin/env python3
"""
V5 panorama production bake — hand-drawn 90s cartoon pass.

Input : art/vcr-pano-v5-src.png  (1536x1024 pencil/marker cel painting,
        wrap-aware edges, VCR RECORD SHOP lettering)
Output: public/textures/store_pano_v5.webp        4096x2048 lights-on
        public/textures/store_pano_off_v5.webp    4096x2048 lights-off grade
        public/textures/store_pano_lqip_v5.webp   512x256 preview
        public/hotspots/<id>_edge.webp            silhouette rim masks

The source is composed as a full 360-degree strip with both edges ending on
plain wall, so the bake stretches to 2:1, cross-fades a wrap band so the
seam is invisible, then derives the lights-off grade and LQIP.

Run: python3 scripts/build-v4-pano.py
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "art" / "vcr-pano-v5-src.png"
OUT_ON = ROOT / "public" / "textures" / "store_pano_v5.webp"
OUT_OFF = ROOT / "public" / "textures" / "store_pano_off_v5.webp"
OUT_LQIP = ROOT / "public" / "textures" / "store_pano_lqip_v5.webp"
HOTSPOT_DIR = ROOT / "public" / "hotspots"

W, H = 4096, 2048
SEAM_BAND = 128  # px cross-faded across the wrap seam

# Landmark boxes in source pixels (1536x1024).
# Spherical u = 1 - file_u (BackSide flip); w/h from angular span at R=47.5.
TARGETS = {
    "crt-tv": (112, 432, 246, 566),
    "listening-booth": (295, 330, 455, 640),
    "record-bins": (725, 500, 855, 655),
    "cash-register": (958, 462, 1085, 568),
    "phone-booth": (1108, 498, 1222, 576),
}

# Known-good background sample points in source pixels (1536x1024):
# flat cel fills for wall / carpet / ceiling / cabinet wood / counter purple.
BG_POINTS = {
    "wall": (1480, 400),
    "wall_dark": (30, 470),
    "wall_mid": (700, 400),
    "carpet": (700, 980),
    "carpet_dark": (80, 950),
    "ceiling": (760, 40),
    "cabinet": (150, 585),
    "counter": (955, 630),
    "counter_top": (950, 530),
    "counter_edge": (980, 558),
}

# Per-target background refs — the object is whatever is far from these.
TARGET_BG = {
    "crt-tv": ("wall", "wall_dark", "wall_mid", "cabinet", "carpet"),
    "listening-booth": ("wall", "wall_dark", "wall_mid", "carpet"),
    "record-bins": ("wall", "wall_mid", "carpet", "carpet_dark", "ceiling"),
    "cash-register": (
        "wall",
        "wall_mid",
        "counter",
        "counter_top",
        "counter_edge",
        "carpet",
    ),
    "phone-booth": ("wall", "wall_mid", "counter", "counter_top", "counter_edge"),
}


def bake_pano() -> Image.Image:
    src = Image.open(SRC).convert("RGB")
    if src.size != (1536, 1024):
        raise SystemExit(f"unexpected source size {src.size}")

    pano = src.resize((W, H), Image.Resampling.LANCZOS)
    # Two-pass unsharp keeps hand-drawn ink lines crisp after the 2.67x upscale.
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

    yy, xx = np.mgrid[0:pano.height, 0:pano.width].astype(np.float32)
    warm = np.zeros_like(a)
    # Lamp pools (file-space u fractions of the source painting).
    for fu, fv, radius, gain in (
        (0.426, 0.14, 0.16, 0.55),
        (0.514, 0.115, 0.14, 0.5),
        (0.605, 0.13, 0.15, 0.5),
        (0.87, 0.45, 0.2, 0.35),  # door window spill
    ):
        cx, cy = fu * pano.width, fv * pano.height
        d2 = ((xx - cx) / (radius * pano.width)) ** 2 + (
            (yy - cy) / (radius * pano.width)
        ) ** 2
        glow = np.exp(-d2)[..., None] * gain
        warm += glow * np.array([1.0, 0.72, 0.38])[None, None, :]

    out = np.clip(dark + warm * a * 0.9, 0, 1)
    return Image.fromarray((out * 255).astype(np.uint8))


def edge_mask(
    pano: Image.Image, sid: str, box_1536: tuple[int, int, int, int]
) -> Image.Image:
    """Silhouette rim (artist-edge style) from the flat-shaded painting."""
    sx, sy = W / 1536.0, H / 1024.0
    x0, y0, x1, y1 = box_1536
    crop = np.asarray(
        pano.crop(
            (int(x0 * sx), int(y0 * sy), int(x1 * sx), int(y1 * sy))
        ).convert("RGB")
    ).astype(np.float32)
    h, w = crop.shape[:2]

    full = np.asarray(pano.convert("RGB")).astype(np.float32)

    def sample(px, py):
        cx_, cy_ = int(px * sx), int(py * sy)
        return np.median(
            full[cy_ - 6 : cy_ + 6, cx_ - 6 : cx_ + 6].reshape(-1, 3), axis=0
        )

    bgs = [sample(*BG_POINTS[name]) for name in TARGET_BG[sid]]

    dist = np.full((h, w), 1e9, dtype=np.float32)
    for bg in bgs:
        d = np.sqrt(((crop - np.asarray(bg)[None, None, :]) ** 2).sum(axis=2))
        dist = np.minimum(dist, d)

    obj = dist > 72.0
    obj = ndimage.binary_closing(obj, iterations=4)
    obj = ndimage.binary_fill_holes(obj)
    obj = ndimage.binary_opening(obj, iterations=2)

    # Keep the component anchored at the box center (the target itself).
    labels, n = ndimage.label(obj)
    if n > 1:
        cy, cx = h // 2, w // 2
        center_label = labels[cy, cx]
        if center_label == 0:
            # Nearest component to center.
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

    out = np.zeros((h, w, 4), dtype=np.uint8)
    out[..., 0:3] = 255
    out[..., 3] = (rim_f * 255).astype(np.uint8)

    img = Image.fromarray(out)
    scale = 1024 / max(img.size)
    img = img.resize(
        (max(2, round(img.width * scale)), max(2, round(img.height * scale))),
        Image.Resampling.LANCZOS,
    )
    return img


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

    for sid, box in TARGETS.items():
        mask = edge_mask(pano, sid, box)
        out = HOTSPOT_DIR / f"{sid}_edge.webp"
        mask.save(out, "WEBP", quality=90)
        cover = np.asarray(mask)[..., 3]
        print(
            f"wrote {out.name} {mask.size} rim={100 * (cover > 30).mean():.1f}%"
        )


if __name__ == "__main__":
    main()
