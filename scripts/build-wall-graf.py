#!/usr/bin/env python3
"""A concrete wall with the ghost of UK street paint.

Overspray and a washed-out drip. Nothing you can read.
Night is the mark; day is the same paint, faded further.
"""
from __future__ import annotations

import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
W, H = 2000, 1600
INK = (28, 30, 32)


def layer():
    return Image.new("RGBA", (W, H), (0, 0, 0, 0))


def mist(img, box, alpha, blur):
    cloud = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(cloud).ellipse(box, fill=(*INK, alpha))
    img.alpha_composite(cloud.filter(ImageFilter.GaussianBlur(blur)))


def dots(img, rng, n, box, alpha):
    d = ImageDraw.Draw(img)
    x0, y0, x1, y1 = box
    for _ in range(n):
        x = rng.randint(x0, x1)
        y = rng.randint(y0, y1)
        r = rng.choice((1, 1, 1, 2))
        a = rng.randint(alpha // 2, alpha)
        d.ellipse((x - r, y - r, x + r, y + r), fill=(*INK, a))


def drip(img, x, y, length, alpha):
    d = ImageDraw.Draw(img)
    d.line([(x, y), (x + 1, y + length)], fill=(*INK, alpha), width=2)
    d.ellipse((x - 2, y + length - 2, x + 3, y + length + 3), fill=(*INK, alpha))


def paint():
    rng = random.Random(7)
    img = layer()
    # Dried cans. A tone in the concrete, not a drawing on it.
    mist(img, (60, 180, 640, 620), 12, 42)
    mist(img, (1100, 60, 1760, 520), 10, 48)
    mist(img, (520, 900, 1200, 1340), 11, 44)
    mist(img, (20, 1100, 420, 1520), 9, 36)
    # Runs that have almost washed out.
    drip(img, 240, 460, 70, 18)
    drip(img, 1520, 360, 48, 14)
    drip(img, 880, 1120, 36, 12)
    # Overspray, the same weight as the grain.
    dots(img, rng, 36, (160, 240, 560, 620), 22)
    dots(img, rng, 22, (1280, 180, 1660, 480), 18)
    dots(img, rng, 18, (680, 1000, 1080, 1280), 16)
    return img.filter(ImageFilter.GaussianBlur(0.8))


def fade(img, scale):
    r, g, b, a = img.split()
    return Image.merge("RGBA", (r, g, b, a.point(lambda p: int(p * scale))))


def main():
    night = paint()
    day = fade(night, 0.42)
    night_path = ROOT / "css" / "wall-graf.png"
    day_path = ROOT / "css" / "wall-graf-day.png"
    night.save(night_path, optimize=True)
    day.save(day_path, optimize=True)
    for name, wall, bg in (
        ("night", night, (197, 199, 195, 255)),
        ("day", day, (239, 239, 237, 255)),
    ):
        sheet = Image.new("RGBA", wall.size, bg)
        sheet.alpha_composite(wall)
        sheet.resize((1000, 800), Image.Resampling.LANCZOS).convert("RGB").save(
            f"/tmp/wall-{name}.jpg", quality=86
        )
    print("wrote", night_path.name, night_path.stat().st_size)


if __name__ == "__main__":
    main()
