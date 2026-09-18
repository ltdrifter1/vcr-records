#!/usr/bin/env python3
"""Apply Club Copy identity upgrades: nav, catalog URL, cache bump helpers."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

NAV_LINKS = """    <nav class="nav-links" aria-label="Primary">
      <a href="/library">Library</a>
      <a href="/artists">Artists</a>
      <a href="/news">Zine</a>
      <a href="/merch">Shop</a>
      <a href="{join}">Join</a>
    </nav>"""

DRAWER = """<div class="nav-drawer" id="navDrawer" aria-hidden="true">
  <a href="/library">Library</a>
  <a href="/artists">Artists</a>
  <a href="/news">Zine</a>
  <a href="/merch">Shop</a>
  <a href="{join}">Join</a>
  <a href="/contact">Contact</a>
  <a href="/cart">Cart</a>
</div>"""

HERO = r'''  <!-- Featured release -->
  <section class="hero plate-hero" id="room" data-listen-plate data-release="you-are-love" aria-label="You Are (Love)">
    <div class="hero-ground" aria-hidden="true"></div>
    <div class="hero-stage">
      <div class="listen-plate">
        <header class="hero-lockup">
          <p class="hero-lockup-kicker">CC004 · EP · cassette</p>
          <p class="hero-lockup-artist"><a href="/artists/riscape">Riscape</a></p>
          <h1 class="hero-lockup-title"><a href="/you-are-love">You Are (Love)</a></h1>
        </header>
        <div class="listen-plate-object">
          <div class="listen-sleeve">
            <img src="you-are-love-cover.webp" alt="You Are (Love) — Riscape" width="1254" height="1254"/>
            <button type="button" class="listen-sleeve-hit" id="platePlayHit" aria-label="Play on air">
              <span class="listen-glyph">
                <svg class="glyph-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>
                <svg class="glyph-pause" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.4v14H7zM13.6 5H17v14h-3.4z"/></svg>
              </span>
            </button>
          </div>
          <div class="listen-plate-lcd">
            <p class="listen-plate-cat">CC004 · four tracks · $20 cassette</p>
            <p class="listen-plate-status" data-plate-status>Cassette pre-order. Play what’s on air.</p>
          </div>
          <div class="listen-plate-actions">
            <button type="button" class="btn btn-fill" id="platePlay">Play on air</button>
            <button type="button" class="btn btn-ghost" id="plateBuy">Cassette · $20</button>
            <a class="btn btn-ghost" href="/you-are-love">Details</a>
          </div>
        </div>
      </div>
    </div>
    <p class="visually-hidden">Club Copy is a Pacific Northwest label for house, jungle, and instrumental hip-hop. Featured: You Are (Love) by Riscape.</p>
'''


def patch_nav_block(html: str, join: str) -> str:
    html = re.sub(
        r'<nav class="nav-links" aria-label="Primary">.*?</nav>',
        NAV_LINKS.format(join=join),
        html,
        count=1,
        flags=re.S,
    )
    html = re.sub(
        r'<div class="nav-drawer" id="navDrawer"[^>]*>.*?</div>',
        DRAWER.format(join=join),
        html,
        count=1,
        flags=re.S,
    )
    return html


def patch_index(path: Path) -> None:
    html = path.read_text()
    html = patch_nav_block(html, "#join")
    html = html.replace(
        'href="https://fonts.googleapis.com/css2?family=Anton&family=Archivo:ital,wdth,wght@0,75,400;0,100,400;0,100,600;0,100,700;1,100,400&family=Archivo+Black&family=Barlow+Condensed:ital,wght@0,600;0,700;0,800;0,900;1,600&family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;1,400&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,600;0,6..72,700;0,6..72,800;1,6..72,400;1,6..72,600&family=Oswald:wght@500;600;700&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;0,8..60,700;1,8..60,400;1,8..60,600&family=Space+Grotesk:wght@400;500;600;700&display=swap"',
        'href="https://fonts.googleapis.com/css2?family=Archivo:ital,wdth,wght@0,100,400;0,100,600;1,100,400&family=IBM+Plex+Mono:ital,wght@0,400;0,500;1,400&family=Oswald:wght@500;600;700&display=swap"',
    )
    html = html.replace('css/listen-object.css?v=st18', 'css/listen-object.css?v=st19')
    if "css/listen-plate.css" not in html:
        html = html.replace(
            'css/listen-object.css?v=st19"/>',
            'css/listen-object.css?v=st19"/>\n  <link rel="stylesheet" href="css/listen-plate.css?v=st19"/>',
        )
    html = html.replace("?v=st18", "?v=st19")
    html = re.sub(
        r"  <!-- Featured release -->\n  <section class=\"hero\".*?(?=\n    <div class=\"hero-ticker\")",
        HERO,
        html,
        count=1,
        flags=re.S,
    )
    html = html.replace('href="/news/please"', 'href="/you-are-love"')
    html = html.replace("js/ipod.js", "js/plate.js")
    # Restore zine article URL that we just overwrote
    html = html.replace(
        '<a class="zine-post rv" href="/you-are-love" data-date="2026-09-08" data-type="release">',
        '<a class="zine-post rv" href="/news/please" data-date="2026-09-08" data-type="release">',
    )
    html = re.sub(
        r'\n      <section class="zine-stars zine-stars--home rv".*?</section>\n',
        "\n",
        html,
        count=1,
        flags=re.S,
    )
    # Keep three home posts: shoes, mini, mezzanine — drop the rest
    html = re.sub(
        r'(<a class="zine-post rv" href="/news/mezzanine".*?</a>)\n        <a class="zine-post rv" href="/news/the-sticker-on-the-lens".*<a class="zine-post rv" href="/news/please".*?</a>\n',
        r"\1\n",
        html,
        count=1,
        flags=re.S,
    )
    html = html.replace(
        "// Ticker chip / now-playing line. Click-wheel play + buy live in js/ipod.js.",
        "// Ticker chip / now-playing line. Plate play + buy live in js/plate.js.",
    )
    path.write_text(html)
    print("patched", path)


def patch_other_html() -> None:
    for path in ROOT.rglob("*.html"):
        if path.name == "index.html":
            continue
        rel = str(path.relative_to(ROOT))
        if "/node_modules/" in rel:
            continue
        text = path.read_text(errors="ignore")
        if 'class="nav-links"' not in text:
            continue
        join = "/#join"
        new = patch_nav_block(text, join)
        if new != text:
            path.write_text(new)
            print("nav", path.relative_to(ROOT))


def main() -> None:
    patch_index(ROOT / "index.html")
    patch_other_html()


if __name__ == "__main__":
    main()
