#!/usr/bin/env python3
"""Build Night Shift issue pages from data/news.json and data/issues.json.

Story body copy is never touched. Adding Issue 02 is an entry in
data/issues.json plus issue: 2 on its stories. /news/issue-02 is rendered
from that data. Re-run this script to refresh the static Issue 01 pages.
"""
import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TRIAGE_PATH = Path("/home/ubuntu/.cursor/projects/workspace/uploads/triage_113d.json")

FORMAT = {
    "romford-kept-the-receipts": "Feature",
    "deep-sleep": "Feature",
    "still-looking-for-the-warehouse": "Feature",
    "rupture-at-twenty": "Feature",
    "the-skinny-last-issue": "Feature",
    "radial-wants-the-midsize-room": "Scene Report",
    "no-fun-city-still-raids-the-rooms": "Scene Report",
    "madame-lous-is-dead-bottlerocket-wants-the-basement": "Scene Report",
    "portland-finally-got-an-all-ages-temple": "Scene Report",
    "cobalt-party-like-the-lease-is-ending": "Scene Report",
    "fifa-vs-the-underground": "Scene Report",
    "eight-rooms-one-basement": "Scene Report",
    "she-showed-up": "Scene Report",
    "summer-of-jungle": "Scene Report",
    "bota": "Scene Report",
    "black-girl-magic": "Scene Report",
    "the-monk-in-the-booth": "Scene Report",
    "thirty-years-on-the-calendar": "Scene Report",
    "across-the-street": "Scene Report",
    "all-night-one-name": "Scene Report",
    "doors-at-six": "Scene Report",
    "while-he-was-playing": "Scene Report",
    "the-missing-p": "Review",
    "crystal-tears-on-the-westside": "Review",
    "love-deluxe": "Review",
    "mezzanine": "Review",
    "the-velvet-rope": "Review",
    "last-emperor": "Review",
    "dummy": "Review",
    "endtroducing": "Review",
    "ahmad-jamal-73": "Review",
    "donuts": "Review",
    "homogenic": "Review",
    "untrue": "Review",
    "to-hell-with-it": "Review",
    "caprisongs": "Review",
    "motomami": "Review",
    "what-i-want": "Review",
    "american-teenager": "Review",
    "working-for-the-knife": "Review",
    "nymph": "Review",
    "blue-rev": "Review",
    "the-sad-banger": "Review",
    "nanana": "Review",
    "fancy-that": "Review",
    "headphones-on": "Review",
    "the-chaos-came-back": "Review",
    "eusexua": "Review",
    "she-named-it-berghain": "Review",
    "they-settled-it-at-afterhours": "Essay",
    "the-sticker-on-the-lens": "Essay",
    "hello-kitty-pants": "Essay",
    "the-object-came-back": "Essay",
    "the-after-is-the-point": "Essay",
    "no-undo": "Essay",
    "drill-lyrics-on-trial": "Essay",
    "the-shoes-come-off": "Essay",
    "the-mini-held-nothing": "Essay",
    "the-bathroom-line": "Essay",
    "the-group-chat-is-the-door": "Essay",
    "she-kept-the-flyer": "Essay",
    "incense-before-the-aux": "Essay",
    "the-door-still-says-no": "Essay",
    "im-outside": "Essay",
    "the-jersey-stayed-on": "Essay",
    "they-sold-the-afters": "Essay",
    "buried-treasure": "Essay",
    "oil-and-chrome": "Essay",
    "the-rooms-opened": "Essay",
    "the-kitchen-was-the-club": "Essay",
    "the-coat-on-the-chair": "Essay",
    "the-file-is-the-record": "Essay",
    "the-wristband-in-the-drawer": "Essay",
    "the-platforms-came-back": "Essay",
    "the-algorithm-is-not-a-room": "Essay",
    "no-prompt-can-touch": "Essay",
    "the-camera-got-a-landlord": "Essay",
    "initial-d": "Essay",
    "six-times": "Essay",
    "drake-went-hot-topic": "Essay",
    "just-sports-means-equity": "Essay",
    "mouse-hired-an-empire": "Essay",
    "majors-monetized-the-booth": "Essay",
    "they-called-it-satan": "Essay",
    "selling-your-digs-back": "Essay",
    "the-monster-on-the-bag": "Essay",
    "please": "Release",
    "any-jungle": "Release",
    "j-adore": "Release",
    "champion-sound": "Release",
    "lions-gate": "Release",
    "summer-madness": "Release",
    "beat-tape": "Release",
    "riscape-on-club-copy": "Release",
    "inlet-knight-on-club-copy": "Release",
    "lt-drifta-on-club-copy": "Release",
    "cj-archer-interview": "Interview",
    "stars-for-the-floor": "Column",
}

SECTION_ORDER = ["Feature", "Essay", "Interview", "Scene Report", "Review", "Release", "Mix", "Column"]
MONTHS = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split()
COVER_ID = "romford-kept-the-receipts"


def esc(value):
    return html.escape(value or "", quote=True)


def date_label(iso):
    year, month, day = iso.split("-")
    return f"{int(day)} {MONTHS[int(month) - 1]} {year}"


def posted_label(iso):
    year, month, day = iso.split("-")
    return f"posted {int(day):02d} {MONTHS[int(month) - 1].lower()} {year[2:]}"


def issue_label(article, triage):
    if article.get("issue") == 1:
        return "Issue 01"
    if triage.get(article["id"]) == "retire":
        return None
    return "Back Catalogue"


def meta_line(article, triage):
    parts = []
    label = issue_label(article, triage)
    if label:
        parts.append(label)
    if article.get("credit"):
        parts.append(article["credit"])
    if article.get("location"):
        parts.append(article["location"])
    parts.append(date_label(article["date"]))
    return " · ".join(parts)


def contents_html(stories, cover_id):
    groups = {name: [] for name in SECTION_ORDER}
    for article in stories:
        groups.setdefault(article["format"], []).append(article)
    blocks = []
    for name in SECTION_ORDER:
        items = groups.get(name) or []
        if not items:
            continue
        items = sorted(items, key=lambda article: article["date"], reverse=True)
        items.sort(key=lambda article: article["id"] != cover_id)
        rows = []
        for article in items:
            rows.append(
                "          <li>\n"
                f'            <a href="{esc(article["slug"])}">{esc(article["headline"])}</a>\n'
                f'            <span>{esc(article.get("dek") or "")}</span>\n'
                f'            <time datetime="{esc(article["date"])}">{esc(date_label(article["date"]))}</time>\n'
                "          </li>"
            )
        blocks.append(
            "      <section>\n"
            f"        <h3>{esc(name)}</h3>\n"
            '        <ol class="issue-toc">\n'
            + "\n".join(rows)
            + "\n        </ol>\n"
            "      </section>"
        )
    return (
        '    <section class="issue-contents" aria-labelledby="contents-title">\n'
        '      <h2 id="contents-title">Contents</h2>\n'
        + "\n".join(blocks)
        + "\n    </section>"
    )


def back_catalogue_html(stories):
    by_year = {}
    for article in stories:
        by_year.setdefault(article["date"][:4], []).append(article)
    blocks = []
    for year in sorted(by_year, reverse=True):
        items = sorted(by_year[year], key=lambda article: article["date"], reverse=True)
        rows = []
        for article in items:
            rows.append(
                "        <li>\n"
                f'          <a href="{esc(article["slug"])}">{esc(article["headline"])}</a>\n'
                f'          <em>{esc(article["format"])}</em>\n'
                f'          <time datetime="{esc(article["date"])}">{esc(date_label(article["date"]))}</time>\n'
                "        </li>"
            )
        blocks.append(
            "      <section>\n"
            f"        <h3>{esc(year)}</h3>\n"
            '        <ol class="catalogue-list">\n'
            + "\n".join(rows)
            + "\n        </ol>\n"
            "      </section>"
        )
    return (
        '    <section class="back-catalogue" id="back-catalogue">\n'
        "      <h2>Back Catalogue</h2>\n"
        "      <p>Earlier pieces from the desk, grouped by year. They are not part of a numbered issue.</p>\n"
        + "\n".join(blocks)
        + "\n    </section>"
    )


def cover_html(issue, article, prefix):
    credit = article.get("credit")
    caption = f"<figcaption>{esc(credit)}</figcaption>" if credit else ""
    note = issue.get("editorsNote") or ""
    note_html = f'<p class="issue-editors-note">{esc(note)}</p>' if note else ""
    image = prefix + article["image"]
    return (
        '    <article class="issue-cover">\n'
        f'      <p class="issue-kicker">Night Shift · {esc(issue["title"])} · {esc(issue["dateLabel"])}</p>\n'
        '      <figure class="issue-cover-figure">\n'
        f'        <img src="{esc(image)}" alt="{esc(article.get("imageAlt") or article["headline"])}" width="1200" height="1200"/>\n'
        f"        {caption}\n"
        "      </figure>\n"
        f'      <p class="issue-cover-format">{esc(article["format"])}</p>\n'
        f'      <h2 class="issue-cover-headline"><a href="{esc(article["slug"])}">{esc(article["headline"])}</a></h2>\n'
        f'      <p class="issue-cover-dek">{esc(article.get("dek") or "")}</p>\n'
        f"      {note_html}\n"
        "    </article>"
    )


def shell(title, description, canonical, main, depth):
    pre = "../" if depth else ""
    font = (
        "https://fonts.googleapis.com/css2?family=Archivo:ital,wdth,wght@0,75,400;0,100,400;0,100,500;0,100,600;0,100,700;1,100,400"
        "&family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Oswald:wght@500;600;700&display=swap"
    )
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"/>
  <title>{esc(title)}</title>
  <meta name="description" content="{esc(description)}"/>
  <meta name="theme-color" content="#E8E8E6"/>
  <link rel="canonical" href="{esc(canonical)}"/>
  <meta property="og:type" content="website"/>
  <meta property="og:site_name" content="Club Copy"/>
  <meta property="og:title" content="{esc(title)}"/>
  <meta property="og:description" content="{esc(description)}"/>
  <meta property="og:url" content="{esc(canonical)}"/>
  <meta property="og:locale" content="en_CA"/>
  <link rel="icon" href="{pre}favicon.png" type="image/png"/>
  <link rel="apple-touch-icon" href="{pre}apple-touch-icon.png"/>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="{font}" rel="stylesheet">
  <link rel="stylesheet" href="{pre}css/site.css?v=st33"/>
  <link rel="stylesheet" href="{pre}css/news.css?v=st37"/>
  <link rel="stylesheet" href="{pre}css/zine-pages.css?v=st33"/>
  <link rel="stylesheet" href="/css/graphic-pass.css?v=gp4"/>
</head>
<body id="top" class="news-listing nav-on-dark zine-surface nav-light">
<a class="skip-link" href="#main">Skip to content</a>
<header class="nav" id="nav">
  <div class="nav-inner">
    <a href="/" class="nav-logo" aria-label="Club Copy home"><img src="{pre}club-copy-nav-ink.webp" alt="Club Copy" width="901" height="418"/></a>
    <nav class="nav-links" aria-label="Primary">
      <a href="/library">Library</a>
      <a href="/artists">Artists</a>
      <a href="/tapes">Mixtapes</a>
      <a href="/news">Zine</a>
      <a href="/merch">Shop</a>
      <a href="/#join">Join</a>
    </nav>
    <div class="nav-end">
      <a href="/cart" class="nav-cart" data-cart-link aria-label="Cart">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
          <path d="M6 8h15l-1.4 8.4a2 2 0 0 1-2 1.6H9a2 2 0 0 1-2-1.6L5 4H2"/>
          <circle cx="10" cy="20" r="1.2" fill="currentColor" stroke="none"/>
          <circle cx="18" cy="20" r="1.2" fill="currentColor" stroke="none"/>
        </svg>
        <span class="nav-cart-count" data-cart-count hidden>0</span>
      </a>
      <button class="nav-ham" id="navHam" aria-label="Menu" aria-expanded="false"><span></span><span></span><span></span></button>
    </div>
  </div>
</header>
<div class="nav-drawer" id="navDrawer" aria-hidden="true">
  <a href="/library">Library</a>
  <a href="/artists">Artists</a>
  <a href="/tapes">Mixtapes</a>
  <a href="/news">Zine</a>
  <a href="/merch">Shop</a>
  <a href="/#join">Join</a>
  <a href="/contact">Contact</a>
  <a href="/cart">Cart</a>
</div>
<main id="main" class="news-index">
  <div class="zine-sheet">
{main}
  </div>
</main>
<footer class="footer">
  <div class="band">
    <div class="footer-top">
      <div>
        <a class="footer-wordmark" href="/">Club Copy</a>
        <p class="footer-publisher"><a href="/about">Copy House Publishing</a></p>
        <p class="footer-mail"><a href="mailto:charlie@clubcopy.ca">charlie@clubcopy.ca</a></p>
      </div>
      <div>
        <label for="footerEmail">Email updates</label>
        <form class="footer-form" action="https://formspree.io/f/xdkwjzzr" method="POST">
          <input type="email" id="footerEmail" name="email" placeholder="Email" required autocomplete="email"/>
          <input type="text" name="_gotcha" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px"/>
          <button type="submit">Join</button>
        </form>
        <p class="footer-note">Subscribe for updates.</p>
      </div>
    </div>
    <div class="footer-bottom">
      <p class="footer-copy">© 2026 Club Copy</p>
      <div class="footer-links">
        <a href="/library">Library</a>
        <a href="/artists">Artists</a>
        <a href="/tapes">Mixtapes</a>
        <a href="/news">Zine</a>
        <a href="/merch">Shop</a>
        <a href="/shipping">Shipping</a>
        <a href="/planet">Planet MP3</a>
        <a href="/contact">Contact</a>
      </div>
    </div>
  </div>
</footer>
<script src="{pre}js/site.js"></script>
<script src="{pre}js/cart.js"></script>
<script src="{pre}js/issue.js"></script>
</body>
</html>
"""


def item_list(stories):
    items = []
    for index, article in enumerate(stories, start=1):
        items.append(
            '      {"@type": "ListItem", "position": %d, "name": %s, "url": "https://www.clubcopy.ca%s"}'
            % (index, json.dumps(article["headline"], ensure_ascii=False), article["slug"])
        )
    return ",\n".join(items)


def main():
    triage = json.loads(TRIAGE_PATH.read_text())
    triage.setdefault("buried-treasure", "elevate")
    news_path = ROOT / "data" / "news.json"
    data = json.loads(news_path.read_text())
    articles = data["articles"]
    ids = [article["id"] for article in articles]
    missing = [story_id for story_id in ids if story_id not in FORMAT]
    extra = [story_id for story_id in FORMAT if story_id not in ids]
    if missing or extra:
        raise SystemExit(f"format map mismatch missing={missing} extra={extra}")
    unknown = [story_id for story_id in ids if story_id not in triage]
    if unknown:
        raise SystemExit(f"triage missing {unknown}")

    order = {article["id"]: index for index, article in enumerate(articles)}
    for article in articles:
        article["format"] = FORMAT[article["id"]]
        verdict = triage[article["id"]]
        if verdict in ("keep", "elevate") and (article["date"] >= "2026-09-01" or article["id"] == "stars-for-the-floor"):
            article["issue"] = 1
        else:
            article["issue"] = None
        rebuilt = {}
        for key, value in list(article.items()):
            rebuilt[key] = value
            if key == "date":
                rebuilt["issue"] = article["issue"]
                rebuilt["format"] = article["format"]
        # date-loop inserted duplicates if issue/format already existed later
        article.clear()
        seen = set()
        for key, value in rebuilt.items():
            if key in seen:
                continue
            seen.add(key)
            article[key] = value
        if "issue" not in article:
            article["issue"] = 1 if FORMAT else None

    cover = next(article for article in articles if article["id"] == COVER_ID)
    if triage[COVER_ID] != "keep" or cover["issue"] != 1:
        raise SystemExit("cover story is not an Issue 01 keep")
    issue = {
        "number": 1,
        "title": "Issue 01",
        "date": "2026-10-19",
        "dateLabel": "October 2026",
        "coverSlug": cover["slug"],
        "coverImage": cover["image"],
        "coverImageAlt": cover.get("imageAlt") or cover["headline"],
        "editorsNote": "Editor’s note to come.",
    }
    issues_doc = {"current": 1, "issues": [issue]}
    (ROOT / "data" / "issues.json").write_text(json.dumps(issues_doc, indent=2, ensure_ascii=False) + "\n")
    news_path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")

    issue_stories = [article for article in articles if article.get("issue") == 1]
    back = [
        article
        for article in articles
        if article.get("issue") is None and triage[article["id"]] != "retire"
    ]
    linked = issue_stories_sorted(issue_stories) + sorted(back, key=lambda article: article["date"], reverse=True)

    for article in articles:
        path = ROOT / "news" / f"{article['id']}.html"
        text = path.read_text()
        line = meta_line(article, triage)
        updated, count = re.subn(
            r'<p class="story-meta">.*?</p>',
            f'<p class="story-meta">{esc(line)}</p>',
            text,
            count=1,
        )
        if count != 1:
            raise SystemExit(f"no story-meta in {article['id']}")
        path.write_text(updated)

    news = (ROOT / "news.html").read_text()
    letters = re.search(r'<aside class="zine-letters" id="desk">.*?</aside>', news, re.S)
    if not letters:
        raise SystemExit("letters block missing")
    start = news.find('      <article class="zine-lead')
    end = news.find("</main>")
    if start < 0 or end < 0:
        raise SystemExit("news markers missing")
    # Keep the sheet open; the lead starts inside .news-index-front.
    block = (
        cover_html(issue, cover, "")
        + "\n"
        + contents_html(issue_stories, COVER_ID)
        + "\n      "
        + letters.group(0)
        + "\n    </div>\n"
        + back_catalogue_html(back)
        + '\n    <p class="issue-jump"><a href="/news/issues">All issues</a></p>\n  </div>\n'
    )
    news = news[:start] + block + news[end:]
    news = news.replace(
        "<span>vancouver</span>\n          <span>night shift</span>",
        "<span>issue 01</span>\n          <span>october 2026</span>",
        1,
    )
    news = news.replace(
        'content="Night Shift: the floor, the fit, the afters. Vancouver evening paper from the Club Copy desk."',
        'content="Night Shift, Issue 01. October 2026."',
    )
    news = news.replace(
        'content="The floor, the fit, the afters. Vancouver evening paper from the Club Copy desk."',
        'content="Night Shift, Issue 01. October 2026."',
    )
    news = news.replace("https://www.clubcopy.ca/news-deep-sleep.webp", "https://www.clubcopy.ca/" + cover["image"])
    news = news.replace(
        'content="A timber DJ booth with a corrugated roof inside a slate cavern, teal climbing helmets in the crowd, hands raised, G-SHOCK Sessions projected on the rock"',
        'content="' + esc(cover.get("imageAlt") or cover["headline"]) + '"',
    )
    ld = (
        "{\n"
        '  "@context": "https://schema.org",\n'
        '  "@type": "CollectionPage",\n'
        '  "@id": "https://www.clubcopy.ca/news#page",\n'
        '  "name": "Night Shift, Issue 01",\n'
        '  "description": "Night Shift, Issue 01. October 2026.",\n'
        '  "url": "https://www.clubcopy.ca/news",\n'
        '  "mainEntity": {\n'
        '    "@type": "ItemList",\n'
        f'    "numberOfItems": {len(linked)},\n'
        '    "itemListElement": [\n'
        + item_list(linked)
        + "\n    ]\n  }\n}"
    )
    news, count = re.subn(
        r'<script type="application/ld\+json">.*?</script>',
        '<script type="application/ld+json">\n' + ld + "\n  </script>",
        news,
        count=1,
        flags=re.S,
    )
    if count != 1:
        raise SystemExit("ld+json not replaced")
    news = re.sub(
        r"<script>\s*\(function \(\) \{\s*var bar = document\.querySelector\('\.news-filters'\);.*?</script>\n",
        "",
        news,
        count=1,
        flags=re.S,
    )
    (ROOT / "news.html").write_text(news)

    issue_main = (
        '    <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><a href="/news">Night Shift</a><span>/</span>Issue 01</nav>\n'
        + cover_html(issue, cover, "../")
        + "\n"
        + contents_html(issue_stories, COVER_ID)
        + '\n    <p class="issue-jump"><a href="/news">Current issue</a> · <a href="/news/issues">All issues</a></p>'
    )
    (ROOT / "news" / "issue-01.html").write_text(
        shell(
            "Issue 01 | Night Shift",
            "Night Shift, Issue 01. October 2026.",
            "https://www.clubcopy.ca/news/issue-01",
            issue_main,
            1,
        )
    )

    card = (
        '    <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><a href="/news">Night Shift</a><span>/</span>Issues</nav>\n'
        '    <header class="issues-head">\n'
        "      <p>Night Shift</p>\n"
        "      <h1>Issues</h1>\n"
        "    </header>\n"
        '    <div class="issue-index" data-issue-index>\n'
        f'      <a class="issue-card" href="/news/issue-01">\n'
        f'        <img src="../{esc(cover["image"])}" alt="{esc(cover.get("imageAlt") or "")}" width="1200" height="1200"/>\n'
        "        <div>\n"
        "          <p>Issue 01</p>\n"
        "          <strong>October 2026</strong>\n"
        f'          <span>{esc(cover["headline"])}</span>\n'
        "        </div>\n"
        "      </a>\n"
        "    </div>\n"
        + back_catalogue_html(back)
    )
    (ROOT / "news" / "issues.html").write_text(
        shell(
            "Issues | Night Shift",
            "Night Shift issues and the back catalogue.",
            "https://www.clubcopy.ca/news/issues",
            card,
            1,
        )
    )

    # Dynamic shell for issue numbers that do not have a static file yet.
    dynamic = shell(
        "Issue | Night Shift",
        "A Night Shift issue.",
        "https://www.clubcopy.ca/news/issues",
        '    <div data-issue-page></div>',
        1,
    )
    (ROOT / "news" / "issue.html").write_text(dynamic)

    home = (ROOT / "index.html").read_text()
    home = home.replace(
        "<span>vancouver</span>\n          <span>night shift</span>",
        "<span>issue 01</span>\n          <span>october 2026</span>",
        1,
    )
    home_lead = f"""      <article class="zine-lead rv">
        <figure class="zine-polaroid is-frame">
          <img src="{esc(cover["image"])}" alt="{esc(cover.get("imageAlt") or "")}" width="1200" height="1200"/>
          <figcaption>{esc(cover.get("credit") or "")}</figcaption>
        </figure>
        <div class="zine-mast">
          <div class="zine-mast-rail">
            <p class="zine-kicker">issue 01</p>
            <p class="zine-spec"><span>{esc(cover["format"])}</span><span>october 2026</span></p>
          </div>
          <h3 class="zine-cover-title"><a href="{esc(cover["slug"])}">{esc(cover["headline"])}</a></h3>
          <p class="zine-pull"><a href="{esc(cover["slug"])}">{esc(cover.get("dek") or "")}</a></p>
          <p class="zine-mast-credit"><span>issue 01</span><time datetime="{esc(cover["date"])}">{esc(date_label(cover["date"]))}</time></p>
        </div>
      </article>"""
    home, count = re.subn(r'      <article class="zine-lead rv">.*?</article>', home_lead, home, count=1, flags=re.S)
    if count != 1:
        raise SystemExit("home lead not replaced")
    others = [article for article in issue_stories_sorted(issue_stories) if article["id"] != COVER_ID][:3]
    posts = []
    for article in others:
        posts.append(
            f'        <a class="zine-post rv" href="{esc(article["slug"])}" data-date="{esc(article["date"])}" data-type="{esc(article["format"])}">\n'
            f'          <div class="zine-post-art"><img src="{esc(article["image"])}" alt="{esc(article.get("imageAlt") or "")}" width="1200" height="1200" loading="lazy"/></div>\n'
            "          <div>\n"
            f'            <p class="zine-post-kicker">{esc(article["format"])}</p>\n'
            f'            <h3 class="zine-post-title">{esc(article["headline"])}</h3>\n'
            f'            <p class="zine-post-dek">{esc(article.get("dek") or "")}</p>\n'
            f'            <p class="zine-post-meta">{esc(posted_label(article["date"]))}</p>\n'
            "          </div>\n"
            "        </a>"
        )
    home, count = re.subn(
        r'(<div class="zine-posts zine-posts--home" data-zine-posts>).*?(</div>\s*<p class="zine-foot">)',
        "\\1\n" + "\n".join(posts) + "\n      \\2",
        home,
        count=1,
        flags=re.S,
    )
    if count != 1:
        raise SystemExit("home posts not replaced")
    home = home.replace("<p class=\"zine-desk-kicker\">night shift</p>", "<p class=\"zine-desk-kicker\">issue 01</p>", 1)
    (ROOT / "index.html").write_text(home)

    sitemap = (ROOT / "sitemap.xml").read_text()
    insert = """  <url>
    <loc>https://www.clubcopy.ca/news/issues</loc>
    <lastmod>2026-10-19</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://www.clubcopy.ca/news/issue-01</loc>
    <lastmod>2026-10-19</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
"""
    if "https://www.clubcopy.ca/news/issues" not in sitemap:
        sitemap = sitemap.replace(
            "    <loc>https://www.clubcopy.ca/news</loc>\n",
            "    <loc>https://www.clubcopy.ca/news</loc>\n",
            1,
        )
        sitemap = sitemap.replace(
            """  <url>
    <loc>https://www.clubcopy.ca/news</loc>
    <lastmod>2026-10-18</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
""",
            """  <url>
    <loc>https://www.clubcopy.ca/news</loc>
    <lastmod>2026-10-19</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
"""
            + insert,
            1,
        )
        (ROOT / "sitemap.xml").write_text(sitemap)

    print("issue", len(issue_stories), "back", len(back), "linked", len(linked))
    print("COVER", cover["headline"], cover["format"])
    for name in SECTION_ORDER:
        rows = [article["headline"] for article in issue_stories if article["format"] == name]
        if rows:
            print(f"\n{name}")
            for row in rows:
                print(" -", row)


def issue_stories_sorted(stories):
    ordered = sorted(stories, key=lambda article: article["date"], reverse=True)
    ordered.sort(key=lambda article: SECTION_ORDER.index(article["format"]) if article["format"] in SECTION_ORDER else 99)
    ordered.sort(key=lambda article: article["id"] != COVER_ID)
    return ordered


if __name__ == "__main__":
    main()
