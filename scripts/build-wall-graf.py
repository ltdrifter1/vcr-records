#!/usr/bin/env python3
"""Paint the Club Copy wall: simple tags, not a mural.

Ink outlines, one orange misregister, a few drips. The same marks are
written twice — night, and a faded day pass of the same paint.
"""
from __future__ import annotations

import math
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
W, H = 2000, 1600
INK = (22, 24, 26)
ORANGE = (226, 59, 16)


def layer(w, h):
    return Image.new("RGBA", (w, h), (0, 0, 0, 0))


def stamp(base, sprite, xy, rot=0):
    if rot:
        sprite = sprite.rotate(rot, expand=True, resample=Image.Resampling.BICUBIC)
    x, y = xy
    base.alpha_composite(sprite, (int(x - sprite.width / 2), int(y - sprite.height / 2)))


def disc(draw, x, y, r, color):
    draw.ellipse((x - r, y - r, x + r, y + r), fill=color)


def stroke(draw, pts, width, color):
    if len(pts) < 2:
        return
    draw.line(pts, fill=color, width=width, joint="curve")
    r = width / 2
    for x, y in (pts[0], pts[-1]):
        disc(draw, x, y, r, color)


def drip(draw, x, y, length, color, width):
    end = y + length
    draw.line([(x, y), (x + length * 0.04, end)], fill=color, width=max(3, width // 3))
    disc(draw, x + length * 0.04, end, max(4, width * 0.42), color)


def ring(size, box, width, color):
    """Outline ellipse. box is (x0, y0, x1, y1) inside the sprite."""
    img = layer(*size)
    mask = Image.new("L", size, 0)
    md = ImageDraw.Draw(mask)
    md.ellipse(box, fill=255)
    x0, y0, x1, y1 = box
    md.ellipse((x0 + width, y0 + width, x1 - width, y1 - width), fill=0)
    paint = Image.new("RGBA", size, color)
    alpha = mask.point(lambda p, a=color[3]: p * a // 255)
    paint.putalpha(alpha)
    img.alpha_composite(paint)
    return img


def overspray(size, box, color, blur):
    img = layer(*size)
    d = ImageDraw.Draw(img)
    d.ellipse(box, fill=color)
    return img.filter(ImageFilter.GaussianBlur(blur))


def throwup_cc():
    """Two bubble letters, black outline, orange force-field, one drip."""
    s = (460, 340)
    img = layer(*s)
    img.alpha_composite(overspray(s, (40, 30, 420, 300), (*INK, 46), 14))
    # orange sits off-register, behind the ink
    orange = layer(*s)
    orange.alpha_composite(ring(s, (28, 36, 250, 268), 22, (*ORANGE, 200)))
    orange.alpha_composite(ring(s, (168, 18, 420, 286), 22, (*ORANGE, 200)))
    img.alpha_composite(orange)
    img.alpha_composite(ring(s, (18, 28, 240, 260), 26, (*INK, 230)))
    img.alpha_composite(ring(s, (158, 8, 410, 276), 26, (*INK, 230)))
    d = ImageDraw.Draw(img)
    drip(d, 300, 250, 68, (*INK, 230), 26)
    drip(d, 312, 248, 52, (*ORANGE, 180), 16)
    # a few specks off the can
    rng = random.Random(4)
    for _ in range(18):
        x = rng.randint(20, 440)
        y = rng.randint(16, 300)
        disc(d, x, y, rng.choice((1, 1, 2)), (*INK, rng.randint(70, 140)))
    return img


def arrow():
    s = (280, 150)
    img = layer(*s)
    d = ImageDraw.Draw(img)
    ink = (*INK, 225)
    shaft = [(18, 78), (168, 70), (168, 78)]
    stroke(d, shaft, 18, ink)
    head = [(150, 28), (250, 74), (150, 124), (168, 74)]
    stroke(d, head, 16, ink)
    drip(d, 96, 86, 46, ink, 16)
    return img


def star():
    s = (170, 170)
    img = layer(*s)
    d = ImageDraw.Draw(img)
    cx, cy, r = 84, 86, 62
    pts = []
    for i in range(10):
        ang = -math.pi / 2 + i * math.pi / 5
        rad = r if i % 2 == 0 else r * 0.42
        pts.append((cx + rad * math.cos(ang), cy + rad * math.sin(ang)))
    pts.append(pts[0])
    # orange echo, then ink
    echo = [(x + 5, y + 4) for x, y in pts]
    stroke(d, echo, 8, (*ORANGE, 190))
    stroke(d, pts, 10, (*INK, 225))
    return img


def swoosh():
    """One-line tag. A marker swung once, period at the end."""
    s = (420, 180)
    img = layer(*s)
    d = ImageDraw.Draw(img)
    pts = []
    for i in range(28):
        t = i / 27
        x = 24 + t * 340
        y = 110 - math.sin(t * math.pi) * 70 - t * 18
        y += math.sin(t * 9) * 3
        pts.append((x, y))
    stroke(d, [(x + 4, y + 3) for x, y in pts], 10, (*ORANGE, 150))
    stroke(d, pts, 16, (*INK, 220))
    disc(d, pts[-1][0] + 16, pts[-1][1] + 8, 7, (*INK, 220))
    drip(d, 180, 78, 58, (*INK, 210), 14)
    return img


def crown():
    s = (200, 120)
    img = layer(*s)
    d = ImageDraw.Draw(img)
    ink = (*INK, 220)
    pts = [(16, 96), (16, 48), (52, 78), (100, 16), (148, 78), (184, 44), (184, 96), (16, 96)]
    stroke(d, pts, 12, ink)
    drip(d, 100, 96, 18, ink, 10)
    return img


def word_copy():
    """Block COPY. Straight letters, a bar underneath, one drip off the Y."""
    s = (520, 210)
    img = layer(*s)
    img.alpha_composite(overspray(s, (20, 16, 490, 170), (*INK, 36), 10))
    d = ImageDraw.Draw(img)
    ink = (*INK, 225)
    hot = (*ORANGE, 175)
    # orange bar first, slipped down-right
    stroke(d, [(28, 158), (470, 164)], 10, hot)

    def c(ox, oy):
        stroke(d, [(ox + 78, oy + 18), (ox + 28, oy + 28), (ox + 16, oy + 70), (ox + 28, oy + 112), (ox + 80, oy + 122)], 14, ink)

    def o(ox, oy):
        img.alpha_composite(ring(s, (ox, oy, ox + 96, oy + 128), 14, ink))

    def p(ox, oy):
        stroke(d, [(ox + 16, oy + 128), (ox + 16, oy + 14)], 14, ink)
        img.alpha_composite(ring(s, (ox + 8, oy + 8, ox + 86, oy + 78), 13, ink))

    def y(ox, oy):
        stroke(d, [(ox + 10, oy + 14), (ox + 40, oy + 62)], 14, ink)
        stroke(d, [(ox + 74, oy + 14), (ox + 28, oy + 128)], 14, ink)
        drip(d, ox + 30, oy + 128, 42, ink, 14)

    c(24, 16)
    o(130, 18)
    p(250, 16)
    y(360, 16)
    stroke(d, [(24, 152), (470, 156)], 12, ink)
    return img


def cross():
    s = (120, 120)
    img = layer(*s)
    d = ImageDraw.Draw(img)
    ink = (*INK, 200)
    stroke(d, [(18, 18), (102, 102)], 12, ink)
    stroke(d, [(100, 20), (16, 104)], 12, ink)
    return img


def oval():
    s = (220, 150)
    img = layer(*s)
    img.alpha_composite(ring(s, (10, 16, 200, 130), 14, (*INK, 210)))
    d = ImageDraw.Draw(img)
    drip(d, 108, 120, 22, (*INK, 200), 12)
    return img


def specks(rng, n, box):
    s = (box[2] - box[0], box[3] - box[1])
    img = layer(*s)
    d = ImageDraw.Draw(img)
    for _ in range(n):
        x = rng.randint(0, s[0] - 1)
        y = rng.randint(0, s[1] - 1)
        disc(d, x, y, rng.choice((1, 1, 2, 3)), (*INK, rng.randint(80, 160)))
    return img


def paint():
    rng = random.Random(30)
    img = layer(W, H)
    # Left band (x ~ 150–700) is what a phone shows. Keep it out of the
    # top 480px, where the title and the filter chips sit.
    # The right-of-centre band is the desktop header gap.
    stamp(img, star(), (1148, 158), rot=10)
    stamp(img, throwup_cc(), (860, 250), rot=-3)
    stamp(img, arrow(), (280, 1080), rot=-6)
    stamp(img, swoosh(), (520, 1360), rot=-3)
    stamp(img, oval(), (200, 720), rot=8)
    stamp(img, crown(), (330, 1510), rot=5)
    stamp(img, word_copy(), (1180, 1280), rot=-2)
    stamp(img, cross(), (640, 1540), rot=14)
    stamp(img, specks(rng, 20, (0, 0, 150, 90)), (180, 1000))
    stamp(img, specks(rng, 12, (0, 0, 100, 70)), (1120, 160))
    return img


def fade(img, scale):
    r, g, b, a = img.split()
    a = a.point(lambda p: int(p * scale))
    out = Image.merge("RGBA", (r, g, b, a))
    return out


def main():
    night = paint()
    day = fade(night, 0.46)
    night_path = ROOT / "css" / "wall-graf.png"
    day_path = ROOT / "css" / "wall-graf-day.png"
    night.save(night_path, optimize=True)
    day.save(day_path, optimize=True)
    # contact sheet on both concretes, for a quick look
    for name, wall, bg in (
        ("night", night, (197, 199, 195, 255)),
        ("day", day, (239, 239, 237, 255)),
    ):
        sheet = Image.new("RGBA", wall.size, bg)
        sheet.alpha_composite(wall)
        sheet.resize((1000, 800), Image.Resampling.LANCZOS).convert("RGB").save(
            f"/tmp/wall-{name}.jpg", quality=86
        )
    print(f"wrote {night_path.name} {night_path.stat().st_size} bytes")
    print(f"wrote {day_path.name} {day_path.stat().st_size} bytes")


if __name__ == "__main__":
    main()
