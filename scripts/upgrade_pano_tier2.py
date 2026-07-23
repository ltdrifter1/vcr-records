#!/usr/bin/env python3
"""
Tier 2 illustrator pass → store_pano_v4

1. Re-ink cash register into the blue counter (3/4 cel, cast shadow, room ink weight)
2. Paint electronic flyers directly into the yellow wall (tape, grit, no UI-card look)
3. Add quiet props on emptier walls (polaroid, neon stub, crate stencil)
4. Author lights-off with warm practicals (CRT / neon / lamp) instead of flat darken
5. Refresh register + flyer glows

VCR-original art only — balmingtiger used as atmosphere reference, not source assets.
"""
from __future__ import annotations

import math
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont, ImageOps, ImageChops

ROOT = Path(__file__).resolve().parents[1]
TEX = ROOT / "public" / "textures"
HOT = ROOT / "public" / "hotspots"
AUDIT = Path("/opt/cursor/artifacts/pano-tier2")

SRC_ON = TEX / "store_pano_v3.webp"
OUT_ON = TEX / "store_pano_v4.webp"
OUT_OFF = TEX / "store_pano_off_v4.webp"
OUT_LQIP = TEX / "store_pano_lqip_v4.webp"

INK = (20, 38, 28)
WALL_Y = (228, 198, 108)  # mustard flyer wall
WALL_MINT = (168, 186, 158)
COUNTER = (38, 108, 208)
CREAM = (255, 248, 232)
BEIGE = (226, 200, 148)
BEIGE_SHADE = (198, 172, 122)


def font(size: int, bold: bool = True):
    paths = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    ]
    for p in paths:
        if Path(p).exists():
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def wobble_rect(x0, y0, x1, y1, amp=2, seed=0):
    """Slightly irregular quad for hand-ink feel."""
    rng = random.Random(seed)
    pts = []
    for (x, y), dx, dy in [
        ((x0, y0), 1, 1),
        ((x1, y0), -1, 1),
        ((x1, y1), -1, -1),
        ((x0, y1), 1, -1),
    ]:
        pts.append((x + rng.randint(-amp, amp) * dx, y + rng.randint(-amp, amp) * dy))
    return pts


def paper_noise(img: Image.Image, amount=0.08, seed=1):
    rng = random.Random(seed)
    w, h = img.size
    noise = Image.new("RGB", (w, h), (128, 128, 128))
    p = noise.load()
    for _ in range(w * h // 8):
        x = rng.randrange(w)
        y = rng.randrange(h)
        v = rng.randint(90, 165)
        p[x, y] = (v, v, v)
    noise = noise.filter(ImageFilter.GaussianBlur(0.4))
    return Image.blend(img.convert("RGB"), noise, amount).convert(img.mode)


def wipe_region(im: Image.Image, box, color, protect=None):
    x0, y0, x1, y1 = [int(v) for v in box]
    px = im.load()
    for y in range(max(0, y0), min(im.size[1], y1)):
        for x in range(max(0, x0), min(im.size[0], x1)):
            if protect and protect(x, y, px[x, y]):
                continue
            px[x, y] = color


def is_phone_red(rgb):
    r, g, b = rgb[:3]
    return r > 145 and r > g + 45 and r > b + 45 and g < 135


def is_crt(x, rgb):
    r, g, b = rgb[:3]
    if x < 2550:
        return False
    # cyan screen or dark CRT body
    if b > 190 and g > 170 and r < 170:
        return True
    if r < 90 and g < 90 and b < 100:
        return True
    return False


# ---------------------------------------------------------------------------
# 1) Cash register — 3/4 cel, cast into counter
# ---------------------------------------------------------------------------

def paint_register(im: Image.Image) -> Image.Image:
    # Clear old sticker-register footprint
    wipe_region(im, (1505, 875, 1980, 1235), WALL_MINT)
    d = ImageDraw.Draw(im)
    # Restore blue counter under machine
    d.rectangle([1505, 1135, 1980, 1235], fill=COUNTER)
    d.line([(1505, 1135), (1980, 1135)], fill=INK, width=3)

    layer = Image.new("RGBA", im.size, (0, 0, 0, 0))
    ld = ImageDraw.Draw(layer)
    ox, oy = 1535, 900

    # Contact shadow on counter (oval, soft)
    shadow = Image.new("RGBA", im.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.ellipse([ox + 25, oy + 250, ox + 390, oy + 295], fill=(0, 0, 0, 70))
    shadow = shadow.filter(ImageFilter.GaussianBlur(3))
    layer = Image.alpha_composite(layer, shadow)
    ld = ImageDraw.Draw(layer)

    # Body — slight 3/4: front face + right side slab
    front = wobble_rect(ox + 40, oy + 70, ox + 320, oy + 255, amp=2, seed=11)
    ld.polygon(front, fill=BEIGE, outline=INK)
    # thicken outline
    ld.line(front + [front[0]], fill=INK, width=4)

    side = [(ox + 320, oy + 78), (ox + 365, oy + 100), (ox + 365, oy + 245), (ox + 320, oy + 255)]
    ld.polygon(side, fill=BEIGE_SHADE, outline=INK)
    ld.line(side + [side[0]], fill=INK, width=3)

    # Top lip
    ld.polygon(
        [(ox + 48, oy + 70), (ox + 312, oy + 70), (ox + 355, oy + 95), (ox + 85, oy + 95)],
        fill=(240, 220, 175),
        outline=INK,
    )

    # Customer display (faces room)
    disp = wobble_rect(ox + 95, oy + 25, ox + 275, oy + 88, amp=1, seed=22)
    ld.polygon(disp, fill=(30, 46, 36), outline=INK)
    ld.line(disp + [disp[0]], fill=INK, width=4)
    ld.rectangle([ox + 110, oy + 38, ox + 260, oy + 76], fill=(14, 28, 20), outline=INK, width=2)
    ld.text((ox + 145, oy + 42), "0.00", font=font(24), fill=(85, 255, 130))

    # Keypad deck
    deck = wobble_rect(ox + 75, oy + 115, ox + 290, oy + 235, amp=2, seed=33)
    ld.polygon(deck, fill=(244, 228, 188), outline=INK)
    ld.line(deck + [deck[0]], fill=INK, width=3)

    keys = [("7", "8", "9"), ("4", "5", "6"), ("1", "2", "3"), ("C", "0", "OK")]
    for r, row in enumerate(keys):
        for c, lab in enumerate(row):
            x = ox + 95 + c * 52
            y = oy + 128 + r * 25
            fill = (255, 170, 85) if lab == "OK" else (255, 115, 100) if lab == "C" else (252, 246, 230)
            ld.rounded_rectangle([x, y, x + 44, y + 18], 3, fill=fill, outline=INK, width=2)
            bb = ld.textbbox((0, 0), lab, font=font(10))
            ld.text((x + (44 - (bb[2] - bb[0])) / 2, y + 2), lab, font=font(10), fill=INK)

    # Receipt slot + brand chip
    ld.rectangle([ox + 230, oy + 95, ox + 270, oy + 108], fill=(35, 35, 35), outline=INK, width=2)
    ld.rounded_rectangle([ox + 55, oy + 240, ox + 135, oy + 258], 3, fill=(125, 255, 179), outline=INK, width=2)
    ld.text((ox + 72, oy + 241), "VCR", font=font(11), fill=INK)

    # Wear speckles (match room grit)
    rng = random.Random(174)
    for _ in range(40):
        x = rng.randint(ox + 50, ox + 300)
        y = rng.randint(oy + 80, oy + 240)
        ld.ellipse([x, y, x + 2, y + 2], fill=(180, 150, 90, 90))

    out = Image.alpha_composite(im.convert("RGBA"), layer)
    return out.convert("RGB")


# ---------------------------------------------------------------------------
# 2) Electronic flyers — painted into wall
# ---------------------------------------------------------------------------

def make_flyer(size, bg, accent, title, lines, motif, seed=0) -> Image.Image:
    rng = random.Random(seed)
    w, h = size
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # paper with slight uneven edge
    pts = wobble_rect(3, 3, w - 4, h - 4, amp=3, seed=seed)
    d.polygon(pts, fill=bg)
    d.line(pts + [pts[0]], fill=INK, width=4)

    # header band
    d.polygon(wobble_rect(10, 12, w - 12, int(h * 0.28), amp=1, seed=seed + 1), fill=accent)
    ft = font(max(13, h // 7))
    fs = font(max(10, h // 12), bold=False)
    tb = d.textbbox((0, 0), title, font=ft)
    d.text(((w - (tb[2] - tb[0])) / 2, 16), title, font=ft, fill=CREAM if sum(accent) < 420 else INK)
    y = int(h * 0.2)
    for line in lines:
        sb = d.textbbox((0, 0), line, font=fs)
        d.text(((w - (sb[2] - sb[0])) / 2, y), line, font=fs, fill=INK)
        y += 14

    mx0, my0, mx1, my1 = 16, int(h * 0.36), w - 16, h - 22
    if motif == "bars":
        n = 7
        gap = 4
        bw = max(4, (mx1 - mx0 - gap * (n - 1)) // n)
        for i in range(n):
            x = mx0 + i * (bw + gap)
            bh = int((0.25 + 0.7 * abs(math.sin(i * 0.85 + seed))) * (my1 - my0))
            col = accent if i % 2 == 0 else (255, 229, 102)
            d.rectangle([x, my1 - bh, x + bw, my1], fill=col, outline=INK, width=2)
    elif motif == "waves":
        for row, col in enumerate([(125, 255, 179), accent, (122, 215, 255)]):
            pts = []
            yb = my0 + 12 + row * 18
            for x in range(mx0, mx1, 4):
                pts.append((x, yb + int(9 * math.sin((x + row * 25 + seed) * 0.07))))
            d.line(pts, fill=col, width=4)
    elif motif == "vinyl":
        cx, cy = (mx0 + mx1) // 2, (my0 + my1) // 2
        r = min(mx1 - mx0, my1 - my0) // 2 - 4
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=INK, outline=INK)
        d.ellipse([cx - r + 12, cy - r + 12, cx + r - 12, cy + r - 12], outline=accent, width=4)
        d.ellipse([cx - 8, cy - 8, cx + 8, cy + 8], fill=accent, outline=INK, width=2)
    elif motif == "grid":
        d.rectangle([mx0, my0, mx1, my1], fill=(12, 28, 22), outline=INK, width=2)
        for i in range(5):
            x = mx0 + 8 + i * ((mx1 - mx0 - 16) // 4)
            d.line([(x, my0 + 6), (x, my1 - 6)], fill=accent, width=2)
        d.text((mx0 + 14, (my0 + my1) // 2 - 8), "174 BPM", font=fs, fill=CREAM)
    elif motif == "bolt":
        # simple lightning / rave mark
        bolt = [
            (mx0 + 40, my0 + 8),
            (mx1 - 50, my0 + 8),
            (mx0 + 70, (my0 + my1) // 2),
            (mx1 - 40, (my0 + my1) // 2),
            (mx0 + 35, my1 - 8),
            (mx0 + 95, (my0 + my1) // 2 + 10),
            (mx0 + 55, (my0 + my1) // 2 + 10),
        ]
        d.polygon(bolt, fill=accent, outline=INK)

    # masking tape
    for tx, ty, tw, ang in [
        (w // 2 - 22, 0, 44, rng.randint(-6, 6)),
        (8, h - 18, 36, rng.randint(-8, 8)),
        (w - 44, h - 18, 36, rng.randint(-8, 8)),
    ]:
        tape = Image.new("RGBA", (tw, 12), (0, 0, 0, 0))
        ImageDraw.Draw(tape).rectangle([0, 0, tw - 1, 11], fill=(232, 220, 170, 210), outline=INK + (180,))
        tape = tape.rotate(ang, expand=True, resample=Image.BICUBIC)
        img.alpha_composite(tape, (tx, ty))

    # pin dots
    for sx, sy in [(10, 14), (w - 16, 14)]:
        d.ellipse([sx, sy, sx + 5, sy + 5], fill=(60, 60, 60), outline=INK)

    img = paper_noise(img, 0.06, seed).convert("RGBA")
    return img


def paste_into(im: Image.Image, art: Image.Image, xy, angle=0) -> Image.Image:
    a = art.rotate(angle, expand=True, resample=Image.BICUBIC) if angle else art
    # soft contact shadow
    sh = Image.new("RGBA", a.size, (0, 0, 0, 0))
    ImageDraw.Draw(sh).polygon(
        wobble_rect(4, 4, a.size[0] - 2, a.size[1] - 2, amp=1, seed=9),
        fill=(0, 0, 0, 45),
    )
    sh = sh.filter(ImageFilter.GaussianBlur(1.5))
    out = im.convert("RGBA")
    out.alpha_composite(sh, (xy[0] + 3, xy[1] + 4))
    out.alpha_composite(a, xy)
    return out.convert("RGB")


def paint_flyers(im: Image.Image) -> Image.Image:
    def protect(x, y, rgb):
        return is_phone_red(rgb) or is_crt(x, rgb)

    # Clear Tier-1 card patches + leftover punk scraps on yellow wall
    wipe_region(im, (1680, 500, 2650, 930), WALL_Y, protect=protect)
    wipe_region(im, (1700, 540, 1930, 820), WALL_Y, protect=protect)
    # booth-side leftover stickers
    wipe_region(im, (3455, 555, 3735, 910), WALL_Y)

    flyers = [
        # size, bg, accent, title, lines, motif, seed, angle, xy
        ((155, 200), (22, 40, 30), (125, 255, 179), "VCR NIGHTS", ["EVERY FRIDAY", "NO COVER"], "bars", 1, -3, (2010, 525)),
        ((160, 185), (48, 22, 68), (255, 110, 180), "WAREHOUSE", ["DEEP HOUSE", "02:00–06:00"], "waves", 2, 2, (2235, 510)),
        ((148, 192), (18, 52, 42), (255, 229, 102), "JUNGLE TEK", ["174 BPM", "STEPPAS"], "grid", 3, -2, (2465, 535)),
        ((150, 175), (28, 55, 110), (122, 215, 255), "AFTER HOURS", ["DRUM & BASS"], "vinyl", 4, 3, (2155, 720)),
        ((142, 188), (55, 20, 25), (255, 122, 90), "RAVE REPEAT", ["EAT · SLEEP ·"], "bolt", 5, -1, (1735, 555)),
    ]
    for size, bg, accent, title, lines, motif, seed, ang, xy in flyers:
        f = make_flyer(size, bg, accent, title, lines, motif, seed=seed)
        im = paste_into(im, f, xy, angle=ang)

    # Two quieter booth-side posters (replacing Joy Division / Talking Heads zone)
    f1 = make_flyer((118, 150), (22, 40, 30), (125, 255, 179), "VCR MIX", ["VOL. 04"], "waves", 6)
    f2 = make_flyer((112, 142), (48, 28, 70), (255, 229, 102), "HOUSE", ["EDITS"], "vinyl", 7)
    im = paste_into(im, f1, (3485, 585), -2)
    im = paste_into(im, f2, (3610, 640), 2)
    return im


# ---------------------------------------------------------------------------
# 3) Quiet wall props — even density
# ---------------------------------------------------------------------------

def paint_quiet_props(im: Image.Image) -> Image.Image:
    layer = Image.new("RGBA", im.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)

    # A) Staff polaroid — empty wall between CRT and headphones (file ~3200,620)
    px, py = 3180, 580
    # polaroid frame
    d.rounded_rectangle([px, py, px + 95, py + 115], 4, fill=(245, 240, 225), outline=INK, width=3)
    d.rectangle([px + 10, py + 10, px + 85, py + 80], fill=(60, 90, 110), outline=INK, width=2)
    # tiny person silhouette
    d.ellipse([px + 35, py + 22, px + 58, py + 45], fill=CREAM, outline=INK, width=2)
    d.rectangle([px + 32, py + 45, px + 62, py + 72], fill=(40, 60, 80), outline=INK, width=2)
    d.text((px + 18, py + 88), "STAFF '96", font=font(9), fill=INK)
    # tape
    d.rectangle([px + 30, py - 4, px + 65, py + 6], fill=(230, 215, 160), outline=INK, width=1)

    # B) Neon stub fragment — upper wall near records entrance (file ~550,520)
    nx, ny = 560, 500
    d.rounded_rectangle([nx, ny, nx + 120, ny + 36], 8, fill=(20, 30, 50), outline=INK, width=3)
    # glow tube
    d.rounded_rectangle([nx + 10, ny + 10, nx + 110, ny + 26], 6, fill=(255, 90, 170), outline=INK, width=2)
    glow = Image.new("RGBA", im.size, (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse([nx - 10, ny - 8, nx + 130, ny + 44], fill=(255, 90, 170, 55))
    glow = glow.filter(ImageFilter.GaussianBlur(6))
    layer = Image.alpha_composite(layer, glow)
    d = ImageDraw.Draw(layer)
    d.text((nx + 28, ny + 11), "OPEN LATE", font=font(10), fill=CREAM)

    # C) Crate stencil sticker — emptier mint/yellow wall right of bins divider feel (file ~3000,1100 area mid-low)
    # Place on wall above bins left side / mid wall
    cx, cy = 2920, 620
    d.rounded_rectangle([cx, cy, cx + 130, cy + 70], 3, fill=(210, 185, 120), outline=INK, width=3)
    d.rectangle([cx + 8, cy + 8, cx + 122, cy + 62], outline=INK, width=2)
    d.text((cx + 16, cy + 14), "HANDLE", font=font(11), fill=INK)
    d.text((cx + 14, cy + 30), "WITH CARE", font=font(11), fill=INK)
    d.text((cx + 40, cy + 48), "174", font=font(12), fill=(180, 40, 40))

    # D) Small vinyl forever companion sticker near empty mint by door trim (file ~1860,700)
    sx, sy = 1865, 700
    d.ellipse([sx, sy, sx + 54, sy + 54], fill=(20, 38, 28), outline=INK, width=3)
    d.ellipse([sx + 18, sy + 18, sx + 36, sy + 36], fill=(125, 255, 179), outline=INK, width=2)

    out = Image.alpha_composite(im.convert("RGBA"), layer)
    return out.convert("RGB")


# ---------------------------------------------------------------------------
# 4) Lights-off with practicals
# ---------------------------------------------------------------------------

def author_lights_off(on: Image.Image) -> Image.Image:
    dark = ImageEnhance.Brightness(on).enhance(0.38)
    dark = ImageEnhance.Color(dark).enhance(0.55)
    dark = ImageEnhance.Contrast(dark).enhance(1.05)

    glow = Image.new("RGBA", on.size, (0, 0, 0, 0))
    g = ImageDraw.Draw(glow)
    W, H = on.size

    def blob(u, v, rx, ry, color, alpha):
        """u,v in file space 0..1"""
        cx, cy = int(u * W), int(v * H)
        col = color + (alpha,)
        g.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=col)

    # CRT cyan spill (file u ≈ 1-0.30 = 0.70)
    blob(0.70, 0.42, 220, 180, (90, 210, 255), 70)
    # Neon RECORDS / entrance (file leftish ~0.12-0.18)
    blob(0.14, 0.30, 180, 120, (80, 160, 255), 55)
    blob(0.14, 0.34, 100, 70, (255, 90, 170), 45)
    # Ceiling lamp warm (spherical lamp u=0.5 → file 0.5)
    blob(0.50, 0.16, 260, 160, (255, 180, 90), 50)
    # Listening booth headphone alcove
    blob(0.80, 0.40, 140, 120, (255, 200, 120), 35)
    # Phone LED / red practical
    blob(0.514, 0.45, 90, 80, (255, 80, 60), 30)
    # OPEN LATE stub we painted
    blob(0.15, 0.26, 80, 40, (255, 90, 170), 40)

    glow = glow.filter(ImageFilter.GaussianBlur(28))
    base = dark.convert("RGBA")
    lit = Image.alpha_composite(base, glow)
    # keep a whisper of on-art for readability
    return Image.blend(lit.convert("RGB"), on, 0.06)


# ---------------------------------------------------------------------------
# 5) Glows
# ---------------------------------------------------------------------------

def write_glows():
    # Register — forward display + body
    g = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
    d = ImageDraw.Draw(g)
    d.rounded_rectangle([120, 160, 400, 390], 24, fill=(255, 255, 255, 255))
    d.rounded_rectangle([160, 85, 355, 170], 14, fill=(255, 255, 255, 255))
    d.rounded_rectangle([150, 200, 370, 345], 12, fill=(255, 255, 255, 230))
    g = g.filter(ImageFilter.GaussianBlur(8))
    core = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
    dc = ImageDraw.Draw(core)
    dc.rounded_rectangle([140, 175, 385, 375], 18, fill=(255, 255, 255, 255))
    dc.rounded_rectangle([175, 95, 340, 160], 12, fill=(255, 255, 255, 255))
    Image.alpha_composite(g, core).save(HOT / "cash-register_glow.webp", "WEBP", quality=90, method=6)

    # Flyer wall — 5 spaced poster silhouettes
    fg = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
    fd = ImageDraw.Draw(fg)
    for box in [
        (40, 50, 150, 270),
        (175, 35, 310, 240),
        (335, 55, 460, 280),
        (120, 290, 270, 450),
        (20, 300, 100, 460),
    ]:
        fd.rounded_rectangle(box, 10, fill=(255, 255, 255, 215))
    fg.filter(ImageFilter.GaussianBlur(11)).save(HOT / "flyer-wall_glow.webp", "WEBP", quality=90, method=6)

    # Optional lamp glow from silhouette asset if missing usable — keep existing lamp_glow.webp


def polish(im: Image.Image) -> Image.Image:
    im = ImageEnhance.Color(im).enhance(1.025)
    im = ImageEnhance.Contrast(im).enhance(1.02)
    soft = im.filter(ImageFilter.GaussianBlur(0.45))
    im = Image.blend(im, soft, 0.04)
    return paper_noise(im, 0.025, seed=909).convert("RGB")


def main():
    AUDIT.mkdir(parents=True, exist_ok=True)
    on = Image.open(SRC_ON).convert("RGB")
    print("src", SRC_ON, on.size)

    on = paint_register(on)
    on = paint_flyers(on)
    on = paint_quiet_props(on)
    on = polish(on)

    on.save(OUT_ON, "WEBP", quality=92, method=6)
    print("wrote", OUT_ON)

    off = author_lights_off(on)
    off.save(OUT_OFF, "WEBP", quality=90, method=6)
    print("wrote", OUT_OFF)

    on.resize((256, 128), Image.Resampling.LANCZOS).save(OUT_LQIP, "WEBP", quality=72, method=6)
    write_glows()
    print("glows ok")

    on.crop((1480, 860, 2020, 1240)).save(AUDIT / "register-after.png")
    on.crop((1600, 500, 2900, 1000)).save(AUDIT / "flyer-after.png")
    on.crop((2800, 500, 3600, 1000)).save(AUDIT / "mint-booth-after.png")
    on.crop((0, 450, 900, 1000)).save(AUDIT / "entrance-after.png")
    off.crop((1600, 500, 2900, 1000)).save(AUDIT / "flyer-off.png")
    off.crop((2400, 500, 3200, 1100)).save(AUDIT / "crt-off.png")
    print("audit ok")


if __name__ == "__main__":
    main()
