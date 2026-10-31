#!/usr/bin/env python3
"""Board-formed concrete, and what the wall kept.

Tags were drawings, and a soft oval is a gradient. Neither is a wall.
This is the pour: board lines, the grain the lumber left, tie holes,
a roller that did not match, a flyer pulled off, a drip that dried.
Nothing you can read. Night is the mark. Day is the same wall, faded.
"""
from __future__ import annotations

import math
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
TILE = 800
MW, MH = 2000, 1500
INK = (32, 34, 36)
RUST = (168, 64, 36)
PAPER = (232, 226, 210)
GLUE = (92, 78, 58)


def blank(w, h):
    return Image.new("RGBA", (w, h), (0, 0, 0, 0))


def wrap_paste(base, layer):
    """Composite a layer onto a tile, wrapping anything that crosses an edge."""
    w, h = base.size
    for oy in (-h, 0, h):
        for ox in (-w, 0, w):
            if ox == 0 and oy == 0:
                base.alpha_composite(layer)
            else:
                base.alpha_composite(layer, (ox, oy))


def tile_blur(img, radius):
    if radius <= 0:
        return img
    w, h = img.size
    pad = int(radius * 3) + 2
    big = blank(w + pad * 2, h + pad * 2)
    for oy in (-1, 0, 1):
        for ox in (-1, 0, 1):
            big.alpha_composite(img, (pad + ox * w, pad + oy * h))
    big = big.filter(ImageFilter.GaussianBlur(radius))
    return big.crop((pad, pad, pad + w, pad + h))


def quantize_alpha(img, step=8):
    r, g, b, a = img.split()
    a = a.point(lambda p: min(255, (p // step) * step))
    return Image.merge("RGBA", (r, g, b, a))


def fade(img, scale):
    r, g, b, a = img.split()
    return Image.merge("RGBA", (r, g, b, a.point(lambda p: int(p * scale))))


def board_concrete(rng):
    """A seamless pour. Only the things that actually repeat."""
    img = blank(TILE, TILE)
    pitch = 160  # board-formed, about six bands to a tile
    boards = TILE // pitch

    # A board here and there took the damp. A stain inside the band, not a stripe.
    tone = blank(TILE, TILE)
    td = ImageDraw.Draw(tone)
    for i in range(boards):
        if i % 2:
            continue
        y0 = i * pitch + 18
        td.rectangle((0, y0, TILE, y0 + pitch - 36), fill=(62, 66, 64, 10))
    img.alpha_composite(tile_blur(tone, 10))

    # Lumber grain, transferred. A few broken streaks in a board, not rules.
    grain = blank(TILE, TILE)
    gd = ImageDraw.Draw(grain)
    for i in range(boards):
        y0 = i * pitch
        for _ in range(rng.randint(2, 4)):
            y = y0 + rng.randint(14, pitch - 16)
            light = rng.random() < 0.4
            col = (236, 234, 228, rng.randint(22, 40)) if light else (*INK, rng.randint(22, 44))
            x = rng.randint(0, 80)
            while x < TILE:
                run = rng.randint(36, 160)
                gap = rng.randint(24, 90)
                gd.line(
                    [(x, y), (min(TILE, x + run), y + rng.choice((-1, 0, 0, 1)))],
                    fill=col,
                    width=rng.choice((1, 1, 2)),
                )
                x += run + gap
    img.alpha_composite(grain)

    # The seam where two boards met. Dark in the joint, light on the edge.
    seams = blank(TILE, TILE)
    sd = ImageDraw.Draw(seams)
    for i in range(boards):
        y_base = i * pitch
        pts_dark = []
        pts_light = []
        for x in range(0, TILE + 1, 4):
            wobble = math.sin(2 * math.pi * x / TILE * 2) * 1.4
            wobble += math.sin(2 * math.pi * x / TILE * 5 + i) * 0.6
            y = y_base + wobble
            pts_dark.append((x, y))
            pts_light.append((x, y - 2))
        sd.line(pts_dark, fill=(*INK, 46), width=1)
        sd.line(pts_light, fill=(244, 242, 236, 34), width=1)
    img.alpha_composite(seams)

    # Pebbles and bug holes. Clumped, not a field of identical dots.
    grit = blank(TILE, TILE)
    gd = ImageDraw.Draw(grit)
    for _ in range(28):
        cx = rng.randrange(TILE)
        cy = rng.randrange(TILE)
        for _ in range(rng.randint(4, 11)):
            x = cx + rng.randint(-18, 18)
            y = cy + rng.randint(-10, 10)
            light = rng.random() < 0.45
            a = rng.randint(36, 80)
            col = (230, 228, 222, a) if light else (44, 46, 44, a)
            r = rng.choice((1, 1, 2, 2, 3))
            gd.ellipse((x - r, y - r, x + r, y + r + rng.choice((0, 1))), fill=col)
    for _ in range(26):
        x = rng.randrange(TILE)
        y = rng.randrange(TILE)
        r = rng.choice((1, 2))
        gd.ellipse((x - r, y - r, x + r, y + r), fill=(36, 38, 36, rng.randint(50, 90)))
    img.alpha_composite(grit)

    # Snap ties. A pit in the pour, not a drawn ring.
    holes = blank(TILE, TILE)
    hd = ImageDraw.Draw(holes)
    for row, col, plug in ((0, 0, False), (0, 1, True), (1, 0, True), (1, 1, False)):
        cx = 180 + col * 400 + (6 if row else -4)
        cy = 220 + row * 400
        r = 5 if plug else 4
        hd.ellipse((cx - r - 1, cy - r, cx + r + 1, cy + r), fill=(*INK, 55))
        if plug:
            hd.ellipse((cx - 2, cy - 2, cx + 2, cy + 2), fill=(206, 204, 198, 50))
        else:
            hd.ellipse((cx - 2, cy - 2, cx + 2, cy + 2), fill=(*INK, 100))
    img.alpha_composite(tile_blur(holes, 0.7))
    return quantize_alpha(img, 4)


def bezier(p0, p1, p2, p3, n):
    pts = []
    for i in range(n):
        t = i / (n - 1)
        u = 1 - t
        x = u**3 * p0[0] + 3 * u**2 * t * p1[0] + 3 * u * t**2 * p2[0] + t**3 * p3[0]
        y = u**3 * p0[1] + 3 * u**2 * t * p1[1] + 3 * u * t**2 * p2[1] + t**3 * p3[1]
        pts.append((x, y))
    return pts


def spray(img, rng, pts, color, width, fall, seeds):
    """A can, not a brush. A wet spine, spit at the edge, dying at the ends."""
    spine = blank(*img.size)
    d = ImageDraw.Draw(spine)
    n = len(pts)
    # Break the pass where the can coughed, so it is not one perfect stroke.
    head = [(x, y) for i, (x, y) in enumerate(pts) if i / (n - 1) < 0.42]
    tail = [(x, y) for i, (x, y) in enumerate(pts) if i / (n - 1) > 0.5]
    if len(head) > 2:
        d.line(head, fill=(*color[:3], color[3]), width=width)
    if len(tail) > 2:
        d.line(tail, fill=(*color[:3], int(color[3] * 0.65)), width=max(2, width - 3))
    spine = spine.filter(ImageFilter.GaussianBlur(1.6))
    dust = blank(*img.size)
    dd = ImageDraw.Draw(dust)
    for i, (x, y) in enumerate(pts):
        t = i / (n - 1)
        pressure = math.sin(math.pi * t) ** 0.8
        for _ in range(int(seeds * pressure)):
            ang = rng.random() * math.tau
            rad = abs(rng.gauss(fall * 0.35, fall * 0.28))
            a = int(color[3] * 0.85 * pressure * rng.uniform(0.35, 1))
            if a < 12 or rad < width * 0.35:
                continue
            px = x + math.cos(ang) * rad
            py = y + math.sin(ang) * rad
            dd.ellipse((px - 1, py - 1, px + 1, py + 1), fill=(*color[:3], a))
    img.alpha_composite(spine)
    img.alpha_composite(dust)


def drip(img, x, y, length, width, color, break_at=None):
    layer = blank(*img.size)
    d = ImageDraw.Draw(layer)
    left, right = [], []
    bead_y = y + length
    for i in range(length):
        if break_at and break_at[0] < i < break_at[1]:
            continue
        wave = math.sin(i * 0.11) * 0.7
        w = width * (1 - (i / length) * 0.65)
        yy = y + i
        left.append((x + wave - w, yy))
        right.append((x + wave + w, yy))
        bead_y = yy
    if len(left) > 2:
        d.polygon(left + right[::-1], fill=color)
    d.ellipse(
        (x - width * 1.5, bead_y - 1, x + width * 1.7, bead_y + width * 2.4),
        fill=color,
    )
    img.alpha_composite(layer)


def marks(rng):
    """One wall, seen once. The events sit where a person could reach."""
    img = blank(MW, MH)

    # Someone rolled a close-but-wrong grey over an older pass.
    # Uneven strokes, cooler than the pour, not a rectangle of opacity.
    roller = blank(MW, MH)
    rd = ImageDraw.Draw(roller)
    for i in range(34):
        y = 210 + i * 8 + rng.randint(-1, 1)
        x0 = 1200 + rng.randint(-10, 50)
        x1 = 1740 - rng.randint(0, 120)
        if rng.random() < 0.22:
            x1 = x0 + rng.randint(70, 180)
        a = rng.randint(26, 48)
        rd.line([(x0, y), (x1, y)], fill=(108, 116, 112, a), width=rng.choice((3, 4)))
    img.alpha_composite(roller.filter(ImageFilter.GaussianBlur(1.3)))

    # The orange can. It lives on the open right, clear of the title column.
    orange = bezier((1080, 620), (1320, 500), (1620, 760), (1900, 580), 80)
    spray(img, rng, orange, (*RUST, 92), width=9, fall=40, seeds=7)
    drip(img, 1488, 740, 160, 2.1, (*RUST, 110))
    drip(img, 1705, 680, 64, 1.4, (*RUST, 80))

    # A second can, almost empty, on the buffed patch.
    black = bezier((1320, 160), (1500, 240), (1680, 420), (1560, 610), 70)
    spray(img, rng, black, (*INK, 80), width=5, fall=26, seeds=5)
    drip(img, 1610, 560, 150, 1.3, (*INK, 100), break_at=(48, 70))

    # The flyer was pulled. Paper, glue, a torn edge, tape that missed.
    paste = blank(MW, MH)
    pd = ImageDraw.Draw(paste)
    # Torn right edge and a missing bottom-left corner.
    edge = [(150, 620), (430, 608)]
    x, y = 430, 608
    while y < 690:
        y += rng.randint(7, 16)
        x += rng.randint(-14, 6)
        edge.append((min(468, max(360, x)), y))
    edge += [(448, 1032), (392, 1054), (210, 1048), (156, 820), (148, 620)]
    pd.polygon(edge, fill=(*PAPER, 168))
    # Tooth of the sheet, so it is paper and not a flat fill.
    for _ in range(18):
        fy = rng.randint(660, 1020)
        fx = rng.randint(190, 400)
        pd.line(
            [(fx, fy), (fx + rng.randint(16, 48), fy + rng.choice((-1, 0, 1)))],
            fill=(206, 198, 180, rng.randint(30, 55)),
            width=1,
        )
    # Crease and the shadow in the glue line.
    pd.line([(168, 790), (430, 776)], fill=(255, 252, 244, 50), width=1)
    pd.line([(168, 792), (430, 778)], fill=(*GLUE, 28), width=1)
    # Glue lip along the bottom, short, like the sheet lifted.
    pd.line([(190, 1054), (448, 1042)], fill=(*GLUE, 55), width=2)
    paste = paste.rotate(1.2, resample=Image.Resampling.BICUBIC, center=(300, 830))
    img.alpha_composite(paste)

    tape = blank(MW, MH)
    td = ImageDraw.Draw(tape)
    td.polygon(
        [(168, 586), (392, 570), (398, 588), (176, 606)],
        fill=(186, 164, 96, 70),
    )
    # The right end was peeled. A darker line where the adhesive gave up.
    td.line([(360, 574), (396, 586)], fill=(*GLUE, 80), width=1)
    td.line([(168, 588), (300, 578)], fill=(230, 214, 150, 40), width=1)
    img.alpha_composite(tape)

    # Two staples. One of them lost a leg.
    hw = ImageDraw.Draw(img)
    hw.line([(214, 636), (214, 648)], fill=(*INK, 140), width=1)
    hw.line([(226, 636), (226, 648)], fill=(*INK, 140), width=1)
    hw.line([(248, 640), (248, 650)], fill=(*INK, 90), width=1)

    # A corner that tore off and stayed.
    scrap = [(1288, 980), (1396, 968), (1372, 1044)]
    hw.polygon(scrap, fill=(*PAPER, 64))
    hw.line([(1288, 980), (1396, 968)], fill=(*GLUE, 50), width=1)

    # Rebar weep under a tie. Rust follows gravity, it does not bloom in a circle.
    weep = blank(MW, MH)
    wd = ImageDraw.Draw(weep)
    wx, wy = 1048, 430
    for i in range(220):
        spread = 7 * (1 - i / 260) + 1.2
        a = int(36 * (1 - i / 240))
        wd.line(
            [(wx - spread, wy + i), (wx + spread * 0.6, wy + i)],
            fill=(*RUST, max(a, 0)),
            width=1,
        )
    img.alpha_composite(weep.filter(ImageFilter.GaussianBlur(1.2)))
    hw = ImageDraw.Draw(img)
    hw.ellipse((wx - 8, wy - 8, wx + 8, wy + 8), fill=(*INK, 70))
    hw.ellipse((wx - 3, wy - 3, wx + 3, wy + 3), fill=(*RUST, 120))

    # A hairline the pour left. It wanders, then splits.
    crack = [(1544, 760)]
    x, y = 1544, 760
    while y < 1460:
        y += rng.randint(10, 22)
        x += rng.randint(-6, 4)
        crack.append((x, y))
    hw.line(crack, fill=(*INK, 100), width=1)
    branch = [crack[8]]
    x, y = crack[8]
    for _ in range(7):
        y += rng.randint(8, 16)
        x += rng.randint(3, 9)
        branch.append((x, y))
    hw.line(branch, fill=(*INK, 70), width=1)

    # Kick scuff, low, where a boot actually lands.
    for _ in range(16):
        x0 = rng.randint(60, 280)
        y0 = rng.randint(1260, 1420)
        x1 = x0 + rng.randint(40, 110)
        y1 = y0 + rng.randint(-8, 14)
        hw.line([(x0, y0), (x1, y1)], fill=(*INK, rng.randint(28, 64)), width=1)

    return quantize_alpha(img, 4)


def composite(wall, marks_img, bg):
    sheet = Image.new("RGBA", (MW, MH), bg)
    # One tile of concrete blown up across the preview, then the events.
    tile = wall.resize((TILE, TILE), Image.Resampling.NEAREST)
    for y in range(0, MH, TILE):
        for x in range(0, MW, TILE):
            sheet.alpha_composite(tile, (x, y))
    sheet.alpha_composite(marks_img)
    return sheet.convert("RGB")


def main():
    rng = random.Random(19)
    concrete = board_concrete(rng)
    night_marks = marks(rng)
    day_concrete = fade(concrete, 0.45)
    day_marks = fade(night_marks, 0.5)

    paths = {
        "concrete": ROOT / "css" / "wall-concrete.png",
        "concrete_day": ROOT / "css" / "wall-concrete-day.png",
        "marks": ROOT / "css" / "wall-graf.png",
        "marks_day": ROOT / "css" / "wall-graf-day.png",
    }
    concrete.save(paths["concrete"], optimize=True)
    day_concrete.save(paths["concrete_day"], optimize=True)
    night_marks.save(paths["marks"], optimize=True)
    day_marks.save(paths["marks_day"], optimize=True)

    night = composite(concrete, night_marks, (197, 199, 195, 255))
    day = composite(day_concrete, day_marks, (239, 239, 237, 255))
    night.save("/tmp/wall-night.jpg", quality=86)
    day.save("/tmp/wall-day.jpg", quality=86)
    # The phone crop: left of the wall, where the flyer is.
    night.crop((40, 80, 980, 1280)).save("/tmp/wall-night-phone.jpg", quality=86)
    for key, path in paths.items():
        print(f"{key}: {path.name} {path.stat().st_size}")


if __name__ == "__main__":
    main()
