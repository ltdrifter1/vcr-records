#!/usr/bin/env python3
"""The mark, printed once, too big to be a logo.

Not a wall texture. The oval and the star are screened like a two-colour
pull: black at 15 degrees, the signal red only where the second pass
missed. The top-left stays empty so the headline sits on the paper.
Day is the same pull with the light up.
"""
from __future__ import annotations

import math
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
LOGO = ROOT / "club-copy-nav-ink.webp"
W, H = 2000, 1500
NIGHT_BG = (197, 199, 195, 255)
DAY_BG = (239, 239, 237, 255)


def logo_mask():
    logo = Image.open(LOGO).convert("RGBA")
    tw = 2700
    th = int(logo.size[1] * tw / logo.size[0])
    big = logo.resize((tw, th), Image.Resampling.LANCZOS)
    mask = Image.new("L", (W, H), 0)
    # Cropped so a laptop sees the arc and the right of the word, not a centered lockup.
    mask.paste(big.getchannel("A"), (-860, 160))
    return mask


def rim(src, dx, dy):
    shifted = Image.new("L", src.size, 0)
    shifted.paste(src, (dx, dy))
    s = np.array(shifted, dtype=np.int16)
    o = np.array(src, dtype=np.int16)
    return Image.fromarray(np.clip(s - o, 0, 255).astype(np.uint8), "L")


def halftone(mask, step, angle, rgb, scale, rad_k):
    layer = Image.new("RGBA", mask.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    px = mask.load()
    rad = math.radians(angle)
    cs, sn = math.cos(rad), math.sin(rad)
    width, height = mask.size
    corners = ((0, 0), (width, 0), (0, height), (width, height))
    us = [x * cs + y * sn for x, y in corners]
    vs = [-x * sn + y * cs for x, y in corners]
    u = min(us) - step
    u1 = max(us) + step
    v0 = min(vs) - step
    v1 = max(vs) + step
    while u < u1:
        v = v0
        while v < v1:
            x = u * cs - v * sn
            y = u * sn + v * cs
            ix, iy = int(x), int(y)
            if 0 <= ix < width and 0 <= iy < height:
                a = px[ix, iy]
                if a > 48:
                    t = a / 255
                    r = 1.3 + t * step * rad_k
                    aa = min(210, int(scale * (80 + 100 * t)))
                    draw.ellipse((x - r, y - r, x + r, y + r), fill=(*rgb, aa))
            v += step
        u += step
    return layer


def plate(mask, red, night):
    if night:
        ink = (18, 20, 22)
        hot = (226, 59, 16)
        ink_scale, hot_scale = 0.5, 0.9
    else:
        ink = (28, 30, 32)
        hot = (210, 60, 16)
        ink_scale, hot_scale = 0.32, 0.55
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    img.alpha_composite(halftone(red, 17, 75, hot, hot_scale, 0.22))
    img.alpha_composite(halftone(mask, 15, 15, ink, ink_scale, 0.32))
    return img


def save(img, path):
    # The plate is a few inks. A palette keeps the download small.
    out = img.quantize(colors=32, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE)
    out.save(path, optimize=True)


def main():
    mask = logo_mask()
    red = rim(mask, 20, 12)
    night = plate(mask, red, True)
    day = plate(mask, red, False)
    paths = {
        "night": ROOT / "css" / "wall-graf.png",
        "day": ROOT / "css" / "wall-graf-day.png",
    }
    save(night, paths["night"])
    save(day, paths["day"])

    preview = Image.new("RGBA", (W, H), NIGHT_BG)
    preview.alpha_composite(Image.open(paths["night"]).convert("RGBA"))
    preview.convert("RGB").save("/tmp/wall-night.jpg", quality=86)
    day_preview = Image.new("RGBA", (W, H), DAY_BG)
    day_preview.alpha_composite(Image.open(paths["day"]).convert("RGBA"))
    day_preview.convert("RGB").save("/tmp/wall-day.jpg", quality=86)
    for key, path in paths.items():
        print(f"{key}: {path.name} {path.stat().st_size}")


if __name__ == "__main__":
    main()
