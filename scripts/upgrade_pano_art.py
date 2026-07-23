#!/usr/bin/env python3
"""
Art upgrade pass for VCR store equirect (store_pano_v3):
  • Redraw cash register facing the room (customer display toward viewer)
  • Replace crowded punk flyer collage with fewer house/electronic posters
  • Soft cel polish; sync lights-off + LQIP + glows

Original VCR artwork only — does not copy balmingtiger.com assets.
"""
from __future__ import annotations

import math
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[1]
TEX = ROOT / "public" / "textures"
HOT = ROOT / "public" / "hotspots"
AUDIT = Path("/opt/cursor/artifacts/pano-audit")

ON = TEX / "store_pano_v3.webp"
OFF = TEX / "store_pano_off_v3.webp"
LQIP = TEX / "store_pano_lqip_v3.webp"
REG_GLOW = HOT / "cash-register_glow.webp"
FLYER_GLOW = HOT / "flyer-wall_glow.webp"

INK = (20, 38, 28)
CREAM = (255, 248, 232)
WALL_Y = (234, 208, 120)
COUNTER = (40, 110, 210)


def font(size: int, bold: bool = True):
    paths = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    ]
    for p in paths:
        if Path(p).exists():
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def soft_clear(im: Image.Image, box, color, feather=8):
    x0, y0, x1, y1 = box
    patch = Image.new("RGB", (x1 - x0, y1 - y0), color)
    mask = Image.new("L", (x1 - x0, y1 - y0), 0)
    ImageDraw.Draw(mask).rectangle([feather, feather, x1 - x0 - feather, y1 - y0 - feather], fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(feather))
    im.paste(patch, (x0, y0), mask)


def draw_register() -> Image.Image:
    """
    Customer-facing cel register:
      - Display + keypad face the room (toward viewer)
      - Body sits on the blue counter, clerk side toward the door
    """
    w, h = 420, 320
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # counter shadow
    d.ellipse([40, 270, 380, 310], fill=(0, 0, 0, 50))

    # body
    body = [50, 90, 360, 280]
    d.rounded_rectangle(body, 16, fill=(232, 210, 160), outline=INK, width=4)
    # side panel depth
    d.polygon([(360, 100), (390, 120), (390, 270), (360, 280)], fill=(210, 185, 140), outline=INK)
    d.line([(360, 100), (360, 280)], fill=INK, width=3)

    # customer display (faces us)
    d.rounded_rectangle([110, 40, 300, 105], 10, fill=(30, 48, 38), outline=INK, width=4)
    d.rectangle([125, 52, 285, 92], fill=(18, 36, 28), outline=INK, width=2)
    d.text((165, 58), "0.00", font=font(28), fill=(90, 255, 140))

    # keypad deck facing us
    d.rounded_rectangle([90, 130, 320, 250], 10, fill=(245, 230, 190), outline=INK, width=3)
    # keys grid
    keys = [
        ("7", "8", "9"),
        ("4", "5", "6"),
        ("1", "2", "3"),
        ("C", "0", "OK"),
    ]
    kx0, ky0 = 110, 145
    kw, kh, gap = 42, 20, 8
    for r, row in enumerate(keys):
        for c, label in enumerate(row):
            x = kx0 + c * (kw + gap)
            y = ky0 + r * (kh + gap)
            fill = (255, 180, 90) if label == "OK" else (255, 120, 100) if label == "C" else (250, 245, 230)
            d.rounded_rectangle([x, y, x + kw, y + kh], 4, fill=fill, outline=INK, width=2)
            tw = d.textbbox((0, 0), label, font=font(11))
            d.text((x + (kw - (tw[2] - tw[0])) / 2, y + 2), label, font=font(11), fill=INK)

    # receipt slot
    d.rectangle([250, 110, 290, 122], fill=(40, 40, 40), outline=INK, width=2)
    # brand plate
    d.rounded_rectangle([70, 255, 160, 272], 4, fill=(125, 255, 179), outline=INK, width=2)
    d.text((82, 256), "VCR", font=font(12), fill=INK)

    return img


def draw_poster(size, bg, accent, title, subtitle, motif="bars") -> Image.Image:
    w, h = size
    img = Image.new("RGBA", size, (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([2, 2, w - 3, h - 3], 8, fill=bg, outline=INK, width=4)
    # tape strips
    d.rectangle([w // 2 - 18, 0, w // 2 + 18, 10], fill=(230, 220, 180, 220), outline=INK, width=1)

    head_h = int(h * 0.26)
    d.rectangle([8, 10, w - 9, head_h], fill=accent)
    ft = font(max(13, h // 8))
    fs = font(max(10, h // 13), bold=False)
    tb = d.textbbox((0, 0), title, font=ft)
    d.text(((w - (tb[2] - tb[0])) / 2, 14), title, font=ft, fill=CREAM if sum(accent) < 400 else INK)
    if subtitle:
        sb = d.textbbox((0, 0), subtitle, font=fs)
        d.text(((w - (sb[2] - sb[0])) / 2, head_h - 18), subtitle, font=fs, fill=INK)

    mx0, my0, mx1, my1 = 16, head_h + 12, w - 16, h - 18
    if motif == "bars":
        n = 7
        gap = 5
        bw = max(4, (mx1 - mx0 - gap * (n - 1)) // n)
        for i in range(n):
            x = mx0 + i * (bw + gap)
            bh = int((0.3 + 0.65 * abs(math.sin(i * 0.85 + 0.4))) * (my1 - my0))
            col = accent if i % 2 == 0 else (255, 229, 102)
            d.rectangle([x, my1 - bh, x + bw, my1], fill=col, outline=INK, width=2)
    elif motif == "waves":
        for row, col in enumerate([(125, 255, 179), accent, (122, 215, 255)]):
            pts = []
            yb = my0 + 16 + row * 20
            for x in range(mx0, mx1, 5):
                pts.append((x, yb + int(9 * math.sin((x + row * 30) * 0.07))))
            d.line(pts, fill=col, width=4)
    elif motif == "vinyl":
        cx, cy = (mx0 + mx1) // 2, (my0 + my1) // 2 + 4
        r = min(mx1 - mx0, my1 - my0) // 2 - 6
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=INK)
        d.ellipse([cx - r + 12, cy - r + 12, cx + r - 12, cy + r - 12], outline=accent, width=4)
        d.ellipse([cx - 9, cy - 9, cx + 9, cy + 9], fill=accent, outline=INK, width=2)
    elif motif == "grid":
        d.rectangle([mx0, my0, mx1, my1], fill=(12, 28, 22), outline=INK, width=2)
        for i in range(4):
            x = mx0 + 10 + i * ((mx1 - mx0 - 20) // 3)
            d.line([(x, my0 + 8), (x, my1 - 8)], fill=accent, width=2)
        for j in range(3):
            y = my0 + 12 + j * ((my1 - my0 - 24) // 2)
            d.line([(mx0 + 8, y), (mx1 - 8, y)], fill=(255, 229, 102), width=1)
        d.text((mx0 + 18, (my0 + my1) // 2 - 8), "174 BPM", font=fs, fill=CREAM)

    # pin dots
    for sx, sy in [(12, 14), (w - 18, 14), (12, h - 18), (w - 18, h - 18)]:
        d.ellipse([sx, sy, sx + 6, sy + 6], fill=(70, 70, 70), outline=INK, width=1)
    return img


def paste_rgba(base: Image.Image, overlay: Image.Image, xy, angle=0) -> Image.Image:
    art = overlay.rotate(angle, expand=True, resample=Image.BICUBIC) if angle else overlay
    # soft shadow
    sh = Image.new("RGBA", art.size, (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle([8, 8, art.size[0] - 2, art.size[1] - 2], 8, fill=(0, 0, 0, 55))
    sh = sh.filter(ImageFilter.GaussianBlur(2))
    out = base.convert("RGBA")
    out.alpha_composite(sh, (xy[0] + 4, xy[1] + 5))
    out.alpha_composite(art, xy)
    return out.convert("RGB")


def fix_cash_register(im: Image.Image) -> Image.Image:
    # file-space bbox covering old register on blue counter
    x0, y0, x1, y1 = 1500, 870, 1985, 1235
    # restore counter + wall behind register
    soft_clear(im, (x0, y0, x1, y1 - 55), (200, 210, 170), feather=5)  # wall-ish
    # blue counter band
    ImageDraw.Draw(im).rectangle([x0, y1 - 95, x1, y1], fill=COUNTER)
    # ink edge of counter
    ImageDraw.Draw(im).line([(x0, y1 - 95), (x1, y1 - 95)], fill=INK, width=3)

    reg = draw_register()
    # place so it sits on counter; slightly left of door knob area
    px = x0 + 20
    py = y0 + 10
    return paste_rgba(im, reg, (px, py), angle=0)


def rebuild_flyer_wall(im: Image.Image) -> Image.Image:
    """
    Clear punk collage above/around payphone, keep door + phone + CRT.
    Place 4 spaced electronic / house posters with breathing room.
    """
    # Main collage above payphone (yellow wall)
    # Leave payphone roughly y>820, x~2050-2300
    soft_clear(im, (1985, 505, 2620, 820), WALL_Y, feather=7)
    # also clear smaller flyers tucked beside phone upper area
    soft_clear(im, (2310, 780, 2620, 900), WALL_Y, feather=5)
    # clear overlapping stickers left-upper near door trim but keep door
    soft_clear(im, (1920, 520, 2020, 700), WALL_Y, feather=4)

    posters = [
        ((150, 195), (20, 38, 28), (125, 255, 179), "VCR NIGHTS", "FRIDAYS", "bars", -2, (2020, 530)),
        ((155, 180), (48, 22, 70), (255, 110, 180), "WAREHOUSE", "DEEP HOUSE", "waves", 2, (2210, 515)),
        ((140, 185), (18, 55, 45), (255, 229, 102), "JUNGLE", "174 BPM", "grid", -1, (2410, 545)),
        ((145, 170), (28, 55, 110), (122, 215, 255), "AFTER HOURS", "D&B / BREAKS", "vinyl", 3, (2140, 720)),
    ]

    out = im
    for size, bg, accent, title, sub, motif, ang, xy in posters:
        p = draw_poster(size, bg, accent, title, sub, motif)
        out = paste_rgba(out, p, xy, angle=ang)

    # Listening-booth side: replace Joy Division / Talking Heads with 2 electronic posters
    soft_clear(out, (3460, 560, 3725, 900), WALL_Y, feather=6)
    p1 = draw_poster((115, 150), (20, 38, 28), (125, 255, 179), "VCR", "MIX SERIES", "waves")
    p2 = draw_poster((110, 140), (50, 30, 80), (255, 229, 102), "HOUSE", "EDITS", "vinyl")
    out = paste_rgba(out, p1, (3480, 590), -2)
    out = paste_rgba(out, p2, (3605, 640), 2)

    # Near employees door: swap leftover punk energy poster for rave cel sticker
    soft_clear(out, (1710, 545, 1915, 800), WALL_Y, feather=5)
    p3 = draw_poster((165, 210), (20, 38, 28), (255, 122, 90), "EAT SLEEP", "RAVE REPEAT", "bars")
    out = paste_rgba(out, p3, (1725, 555), -1)

    return out


def polish(im: Image.Image) -> Image.Image:
    im = ImageEnhance.Color(im).enhance(1.035)
    im = ImageEnhance.Contrast(im).enhance(1.025)
    soft = im.filter(ImageFilter.GaussianBlur(0.55))
    im = Image.blend(im, soft, 0.06)
    # fine grain
    rng = random.Random(909)
    W, H = im.size
    grain = Image.new("RGB", (W, H), (128, 128, 128))
    gp = grain.load()
    for _ in range(W * H // 55):
        x = rng.randrange(W)
        y = rng.randrange(H)
        v = rng.randint(100, 155)
        gp[x, y] = (v, v, v)
    grain = grain.filter(ImageFilter.GaussianBlur(0.35))
    return Image.blend(im, grain, 0.03)


def write_register_glow():
    g = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
    d = ImageDraw.Draw(g)
    # body + forward display
    d.rounded_rectangle([130, 170, 390, 380], 22, fill=(255, 255, 255, 255))
    d.rounded_rectangle([170, 95, 350, 175], 14, fill=(255, 255, 255, 255))
    d.rounded_rectangle([160, 210, 360, 340], 12, fill=(255, 255, 255, 230))
    g = g.filter(ImageFilter.GaussianBlur(7))
    core = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
    dc = ImageDraw.Draw(core)
    dc.rounded_rectangle([150, 180, 380, 370], 18, fill=(255, 255, 255, 255))
    dc.rounded_rectangle([180, 105, 340, 170], 12, fill=(255, 255, 255, 255))
    Image.alpha_composite(g, core).save(REG_GLOW, "WEBP", quality=90, method=6)


def write_flyer_glow():
    g = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
    d = ImageDraw.Draw(g)
    for box in [(70, 60, 190, 260), (220, 45, 360, 240), (380, 80, 470, 290), (150, 290, 300, 450)]:
        d.rounded_rectangle(box, 10, fill=(255, 255, 255, 210))
    g.filter(ImageFilter.GaussianBlur(12)).save(FLYER_GLOW, "WEBP", quality=90, method=6)


def main():
    AUDIT.mkdir(parents=True, exist_ok=True)
    on = Image.open(ON).convert("RGB")
    print("in", on.size)

    on = fix_cash_register(on)
    on = rebuild_flyer_wall(on)
    on = polish(on)

    on.save(ON, "WEBP", quality=92, method=6)
    print("wrote", ON)

    off = ImageEnhance.Brightness(on).enhance(0.42)
    off = ImageEnhance.Color(off).enhance(0.72)
    off = Image.blend(off, on, 0.07)
    off.save(OFF, "WEBP", quality=90, method=6)
    print("wrote", OFF)

    on.resize((256, 128), Image.Resampling.LANCZOS).save(LQIP, "WEBP", quality=70, method=6)
    write_register_glow()
    write_flyer_glow()
    print("glows ok")

    on.crop((1480, 860, 2020, 1240)).save(AUDIT / "register-after.png")
    on.crop((1600, 500, 2900, 1000)).save(AUDIT / "flyer-wide-after.png")
    on.crop((0, int(0.2 * on.size[1]), on.size[0], int(0.45 * on.size[1]))).resize((2048, 256)).save(
        AUDIT / "upper-walls-after.png"
    )
    print("audit ok")


if __name__ == "__main__":
    main()
