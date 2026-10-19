#!/usr/bin/env python3
"""Download licensed lead photographs for stories that had none, or that shared another story's image."""

import json
import re
import urllib.parse
import urllib.request
from io import BytesIO
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
UA = {"User-Agent": "ClubCopyZine/1.0 (editorial; clubcopy.ca)"}

PHOTOS = [
    {
        "id": "the-missing-p",
        "file": "news-missing-p-sebadoh.webp",
        "commons": "File:Sebadoh-16.jpg",
        "author": "parttimemusic",
        "licence": "CC BY-SA 2.0",
        "licence_url": "https://creativecommons.org/licenses/by-sa/2.0/",
        "alt": "Sebadoh performing, a guitarist at a microphone under red stage light.",
    },
    {
        "id": "no-fun-city-still-raids-the-rooms",
        "file": "news-no-fun-city-vancouver.webp",
        "commons": "File:Vancouver Night Skyline (15141299159).jpg",
        "author": "Jerry Meaden",
        "licence": "CC BY 2.0",
        "licence_url": "https://creativecommons.org/licenses/by/2.0/",
        "alt": "Vancouver skyline at night from Spanish Banks, towers across the water.",
    },
    {
        "id": "madame-lous-is-dead-bottlerocket-wants-the-basement",
        "file": "news-madame-lous-crocodile.webp",
        "commons": "File:Crocodile Cafe.jpg",
        "author": "Joe Mabel",
        "licence": "CC BY-SA 3.0",
        "licence_url": "https://creativecommons.org/licenses/by-sa/3.0/",
        "alt": "The Crocodile Cafe on Second Avenue in Belltown, Seattle, seen from the street.",
    },
    {
        "id": "portland-finally-got-an-all-ages-temple",
        "file": "news-portland-downtown.webp",
        "commons": "File:Downtown Portland Oregon at Night (18103693355).jpg",
        "author": "Tony Webster",
        "licence": "CC BY 2.0",
        "licence_url": "https://creativecommons.org/licenses/by/2.0/",
        "alt": "Downtown Portland, Oregon at night, street lights and mid-rise blocks.",
    },
    {
        "id": "cobalt-party-like-the-lease-is-ending",
        "file": "news-cobalt-hotel.webp",
        "commons": "File:Cobalt-Motor-Hotel-Vancouver-BC.jpg",
        "author": "Gates of Ale",
        "licence": "CC BY-SA 3.0",
        "licence_url": "https://creativecommons.org/licenses/by-sa/3.0/",
        "alt": "The Cobalt Motor Hotel at 917 Main Street, Vancouver, in daylight.",
    },
    {
        "id": "fifa-vs-the-underground",
        "file": "news-fifa-bc-place.webp",
        "commons": "File:BC Place Stadium (2015).jpg",
        "author": "Mike",
        "licence": "CC BY-SA 2.0",
        "licence_url": "https://creativecommons.org/licenses/by-sa/2.0/",
        "alt": "BC Place stadium in Vancouver, the roof and the plaza in daylight.",
    },
    {
        "id": "majors-monetized-the-booth",
        "file": "news-majors-mixer.webp",
        "commons": "File:DJ Mixer.JPG",
        "author": "Jana C.",
        "licence": "public domain",
        "licence_url": "",
        "alt": "A DJ mixer on a table, faders and knobs, no one at it.",
    },
    {
        "id": "mouse-hired-an-empire",
        "file": "news-mouse-deadmau5.webp",
        "commons": "File:Deadmau5 crofoot kick.jpg",
        "author": "GoatLordServant",
        "licence": "CC BY 4.0",
        "licence_url": "https://creativecommons.org/licenses/by/4.0/",
        "alt": "deadmau5 performing live, mask on, one leg raised.",
    },
    {
        "id": "just-sports-means-equity",
        "file": "news-just-sports-sweeney.webp",
        "commons": "File:Sydney Sweeney 2019 by Glenn Francis.jpg",
        "author": "Glenn Francis",
        "licence": "CC BY-SA 4.0",
        "licence_url": "https://creativecommons.org/licenses/by-sa/4.0/",
        "alt": "Sydney Sweeney at a premiere, photographed by Glenn Francis.",
    },
]


def fetch(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=60) as resp:
        return resp.read()


def download(photo):
    name = photo["commons"].split("File:", 1)[1]
    url = "https://commons.wikimedia.org/wiki/Special:FilePath/" + urllib.parse.quote(name) + "?width=1600"
    raw = fetch(url)
    im = Image.open(BytesIO(raw)).convert("RGB")
    im.thumbnail((1600, 1600), Image.Resampling.LANCZOS)
    dest = ROOT / photo["file"]
    im.save(dest, "WEBP", quality=78, method=6)
    photo["width"], photo["height"] = im.size
    page = "https://commons.wikimedia.org/wiki/" + urllib.parse.quote(photo["commons"].replace(" ", "_"))
    photo["source_url"] = page
    print(photo["file"], im.size, dest.stat().st_size)


def credit_html(photo):
    page = photo["source_url"]
    if photo["licence"] == "public domain":
        licence = "public domain"
    else:
        licence = '<a href="%s">%s</a>' % (photo["licence_url"], photo["licence"])
    return '%s, %s, via <a href="%s">Wikimedia Commons</a>' % (photo["author"], licence, page)


def credit_text(photo):
    return "Photo: %s, %s, via Wikimedia Commons" % (photo["author"], photo["licence"])


def patch_html(photo):
    path = ROOT / "news" / (photo["id"] + ".html")
    html = path.read_text(encoding="utf-8")
    src = "../" + photo["file"]
    figure = (
        '<figure class="news-article-hero">\n'
        '        <span class="zine-tape" aria-hidden="true"></span>\n'
        '        <img src="%s" alt="%s" width="%d" height="%d" fetchpriority="high"/>\n'
        '        <figcaption>%s</figcaption>\n'
        '      </figure>'
    ) % (src, photo["alt"], photo["width"], photo["height"], credit_html(photo))
    if re.search(r'<figure class="news-article-hero[\s\S]*?</figure>', html):
        html = re.sub(r'<figure class="news-article-hero[\s\S]*?</figure>', figure, html, count=1)
    else:
        html = html.replace('<p class="news-kicker">', figure + '\n      <p class="news-kicker">', 1)
    html = re.sub(
        r'(<p class="story-meta">)(.*?)(</p>)',
        lambda m: m.group(1) + inject_meta(m.group(2), photo["author"]) + m.group(3),
        html,
        count=1,
    )
    html = replace_meta_image(html, photo)
    path.write_text(html, encoding="utf-8")


def inject_meta(text, author):
    if "Photo:" in text:
        return text
    bit = "Photo: " + author
    if " · " in text:
        return text.replace(" · ", " · " + bit + " · ", 1)
    return text + " · " + bit


def replace_meta_image(html, photo):
    abs_url = "https://www.clubcopy.ca/" + photo["file"]
    html = re.sub(
        r'(<meta property="og:image" content=")[^"]+(")',
        r"\1" + abs_url + r"\2",
        html,
        count=1,
    )
    html = re.sub(
        r'(<meta name="twitter:image" content=")[^"]+(")',
        r"\1" + abs_url + r"\2",
        html,
        count=1,
    )
    html = re.sub(
        r'(<meta property="og:image:alt" content=")[^"]*(")',
        lambda m: m.group(1) + photo["alt"] + m.group(2),
        html,
        count=1,
    )
    html = re.sub(
        r'(<meta name="twitter:image:alt" content=")[^"]*(")',
        lambda m: m.group(1) + photo["alt"] + m.group(2),
        html,
        count=1,
    )
    return html


def patch_json(photos):
    path = ROOT / "data" / "news.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    by_id = {p["id"]: p for p in photos}
    for article in data["articles"]:
        photo = by_id.get(article["id"])
        if not photo:
            continue
        article["image"] = photo["file"]
        article["imageAlt"] = photo["alt"]
        article["credit"] = credit_text(photo)
        article["imageCredit"] = {
            "author": photo["author"],
            "licence": photo["licence"],
            "licenceUrl": photo["licence_url"] or None,
            "source": "Wikimedia Commons",
            "sourceUrl": photo["source_url"],
        }
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def main():
    for photo in PHOTOS:
        download(photo)
        patch_html(photo)
    patch_json(PHOTOS)
    print("patched", len(PHOTOS))


if __name__ == "__main__":
    main()
