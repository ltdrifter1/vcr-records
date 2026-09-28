#!/usr/bin/env python3
"""Port the You Are (Love) listening object onto every catalogue PDP."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG = json.loads((ROOT / "data" / "catalog.json").read_text())
RELEASES = {r["id"]: r for r in CATALOG["releases"]}

PAGES = {
    "gorilla.html": "gorilla",
    "still-riding.html": "still-riding",
    "she-spells-doom.html": "she-spells-doom",
    "champion-sound.html": "champion-sound",
    "the-mystic-jade-touch.html": "the-mystic-jade-touch",
    "ep1.html": "ep1",
    "ep-6.html": "ep-6",
    "classic-jazz.html": "classic-jazz",
    "summer-madness.html": "summer-madness",
    "bridget-in-my-room.html": "bridget-in-my-room",
    "j-adore.html": "j-adore",
    "need-you.html": "need-you",
    "letters-from-another-era.html": "letters-from-another-era",
    "mixtape.html": "mixtape",
    "inlet-knight.html": "inlet-knight",
    "you-are-love.html": "you-are-love",
}


def money(n) -> str:
    n = float(n)
    if n == int(n):
        return f"${int(n)}"
    return f"${n:.2f}"


def fmt_dur(sec: float) -> str:
    sec = int(sec or 0)
    return f"{sec // 60}:{sec % 60:02d}"


def spec_lines(rel: dict) -> tuple[str, str]:
    cat = str(rel.get("catalogue") or "")
    legacy = cat.upper().startswith("VCR")
    tracks = rel.get("tracks") or []
    total = sum(float(t.get("duration") or 0) for t in tracks)
    kind = rel.get("kind") or ""
    head = f"Legacy · {cat}" if legacy else cat
    line1 = " · ".join(b for b in (head, kind, fmt_dur(total) if total else "") if b)
    fmts = rel.get("formats") or {}
    bits = []
    if fmts.get("digital"):
        bits.append(f"Digital {money(fmts['digital']['price'])}")
    cass = fmts.get("cassette")
    if cass:
        bits.append("cassette backorder" if cass.get("backorder") else f"cassette {money(cass['price'])}")
    vinyl = fmts.get("vinyl")
    if vinyl:
        bits.append(f"vinyl {money(vinyl['price'])}")
    return line1, " · ".join(bits)


def matching_div(html: str, start: int) -> tuple[int, int]:
    """Return [open, close_end) for the div whose open tag starts at start."""
    assert html.startswith("<div", start)
    i = html.find(">", start) + 1
    depth = 1
    while i < len(html) and depth:
        next_open = html.find("<div", i)
        next_close = html.find("</div>", i)
        if next_close < 0:
            raise ValueError("unclosed div")
        if next_open >= 0 and next_open < next_close:
            depth += 1
            i = html.find(">", next_open) + 1
        else:
            depth -= 1
            i = next_close + len("</div>")
    return start, i


def sleeve_html(rel: dict, existing: str) -> str:
    cover = rel.get("cover") or ""
    m = re.search(r'<img[^>]+alt="([^"]*)"', existing)
    alt = m.group(1) if m else f"{rel.get('title')} — {rel.get('artist')}"
    width = "1200"
    height = "1200"
    wm = re.search(r'<img[^>]+width="(\d+)"', existing)
    hm = re.search(r'<img[^>]+height="(\d+)"', existing)
    if wm:
        width = wm.group(1)
    if hm:
        height = hm.group(1)
    return (
        f'        <div class="listen-sleeve">\n'
        f'          <img src="{cover}" alt="{alt}" width="{width}" height="{height}" fetchpriority="high"/>\n'
        f'          <button type="button" class="listen-sleeve-hit" id="ipPlay" aria-label="Play / pause">\n'
        f'            <span class="listen-glyph">\n'
        f'              <svg class="i-play glyph-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>\n'
        f'              <svg class="i-pause glyph-pause" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.4v14H7zM13.6 5H17v14h-3.4z"/></svg>\n'
        f'            </span>\n'
        f'          </button>\n'
        f'        </div>\n'
    )


def cta_buttons(rel: dict, existing: str) -> str:
    fmts = rel.get("formats") or {}
    digital = fmts.get("digital")
    cassette = fmts.get("cassette")
    has_digital_btn = 'id="buyDigitalBtn"' in existing
    buy_is_cassette = bool(
        cassette and (
            "Buy Cassette" in existing
            or 'id="buyBtn">Cassette' in existing
            or (has_digital_btn and 'id="buyBtn"' in existing)
        )
    )
    parts = [
        '<button type="button" class="btn btn-steel btn-steel--play" id="heroListen">Play</button>'
    ]
    if digital and cassette:
        d_id = "buyDigitalBtn" if (has_digital_btn or buy_is_cassette) else "buyBtn"
        c_id = "buyBtn" if d_id == "buyDigitalBtn" else "buyDigitalBtn"
        parts.append(
            f'<button type="button" class="btn btn-steel" id="{d_id}">Digital · {money(digital["price"])}</button>'
        )
        cass_label = "Cassette · $20"
        if cassette.get("backorder"):
            cass_label = "Cassette · $20"
        parts.append(
            f'<button type="button" class="btn btn-steel" id="{c_id}">{cass_label}</button>'
        )
    elif digital:
        parts.append(
            f'<button type="button" class="btn btn-steel" id="buyBtn">Digital · {money(digital["price"])}</button>'
        )
    elif cassette:
        parts.append(
            f'<button type="button" class="btn btn-steel" id="buyBtn">Cassette · {money(cassette["price"])}</button>'
        )
    return "\n          ".join(parts)


def replace_stage(html: str, rel: dict) -> str:
    idx = html.find('id="artworkWrap"')
    if idx < 0:
        raise ValueError("no artworkWrap")
    open_idx = html.rfind("<div", 0, idx)
    start, end = matching_div(html, open_idx)
    inner_open = html.find(">", start) + 1
    new_inner = "\n" + sleeve_html(rel, html[start:end])
    return html[:inner_open] + new_inner + "      " + html[end - len("</div>") :]


def replace_facts(html: str, rel: dict) -> str:
    m = re.search(r'<div class="ra-hero-facts">[\s\S]*?</div>', html)
    if not m:
        raise ValueError("no facts")
    line1, line2 = spec_lines(rel)
    block = f'<div class="ra-hero-facts">\n          {line1}'
    if line2:
        block += f"<br/>\n          {line2}"
    block += "\n        </div>"
    return html[: m.start()] + block + html[m.end() :]


def replace_ctas(html: str, rel: dict) -> str:
    m = re.search(r'<div class="ra-hero-ctas"[^>]*>[\s\S]*?</div>', html)
    if not m:
        raise ValueError("no ctas")
    block = m.group(0)
    # Keep schema metas; replace buttons only.
    metas = re.findall(r'<(?:meta|link)[^>]*>', block)
    buttons = cta_buttons(rel, block)
    rebuilt = block[: block.find(">") + 1]
    if metas:
        rebuilt += "\n          " + "\n          ".join(metas)
    rebuilt += "\n          " + buttons + "\n        </div>"
    return html[: m.start()] + rebuilt + html[m.end() :]


def ensure_listen_css(html: str) -> str:
    html = html.replace("?v=st32", "?v=st33")
    if "listen-object.css" in html:
        return html
    needle = '<link rel="stylesheet" href="css/release-archive.css?v=st33"/>'
    insert = (
        '<link rel="stylesheet" href="css/listen-object.css?v=st33"/>\n'
        "  " + needle
    )
    if needle not in html:
        raise ValueError("release-archive stylesheet missing")
    return html.replace(needle, insert, 1)


def rewrite_modal(html: str) -> str:
    html = html.replace("<h2>Acquisition confirmed</h2>", "<h2>Added. Receipt by email.</h2>")
    html = html.replace(
        "<p>Thanks for supporting independent music. Your receipt and download details are on their way by email.</p>",
        "<p>Thanks for keeping the record. Download details are on their way.</p>",
    )
    return html


def transform(path: Path, release_id: str) -> None:
    rel = RELEASES[release_id]
    html = path.read_text()
    html = ensure_listen_css(html)
    html = rewrite_modal(html)
    html = replace_stage(html, rel)
    html = replace_facts(html, rel)
    html = replace_ctas(html, rel)
    path.write_text(html)
    print("updated", path.name)


def main() -> None:
    for name, rid in PAGES.items():
        transform(ROOT / name, rid)


if __name__ == "__main__":
    main()
