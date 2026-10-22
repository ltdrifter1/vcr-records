/* Night Shift — magazine chrome.
   Tonight's record, the wire, letters, live date. Stay in the zine. */
(function () {
  "use strict";

  var DAYS = "sun mon tue wed thu fri sat".split(" ");
  var MONTHS = "jan feb mar apr may jun jul aug sep oct nov dec".split(" ");

  function inStory() {
    return /\/news\/[^/]+/.test(location.pathname);
  }

  function asset(src) {
    if (!src) return src;
    if (/^https?:\/\//.test(src) || src.charAt(0) === "/") return src;
    return inStory() ? "../" + src : src;
  }

  function zineDate(d) {
    d = d || new Date();
    var dd = d.getDate();
    var yy = String(d.getFullYear()).slice(2);
    return (
      DAYS[d.getDay()] +
      " " +
      (dd < 10 ? "0" : "") +
      dd +
      " " +
      MONTHS[d.getMonth()] +
      " " +
      yy
    );
  }

  /* Seven nights. The apartment, the rain, the afters, the floor. */
  var TONIGHT = [
    {
      slug: "/news/love-deluxe",
      kicker: "sunday recovery",
      title: "Love Deluxe",
      artist: "Sade",
      dek: "Sade's fourth album, Epic, 26 October 1992. Quiet, on this record, is a decision with a rhythm section under it.",
      image: "news-love-deluxe.webp",
      spec: ["1992", "epic", "lp"]
    },
    {
      slug: "/news/dummy",
      kicker: "monday rain",
      title: "Dummy",
      artist: "Portishead",
      dek: "Portishead's debut, Go! Beat, 22 August 1994: a Bristol album that made the sample feel like a voice.",
      image: "news-dummy.webp",
      spec: ["1994", "go! beat", "lp"]
    },
    {
      slug: "/news/the-after-is-the-point",
      kicker: "tuesday afters",
      title: "Nobody Asked What to Put On",
      artist: "Night Shift",
      dek: "The photograph is the brochure. The night that matters starts when someone plays a record and nobody votes on it.",
      image: "news-afters.webp",
      spec: ["afters", "no vote"]
    },
    {
      slug: "/news/donuts",
      kicker: "wednesday loops",
      title: "Donuts",
      artist: "J Dilla",
      dek: "J Dilla's Donuts, Stones Throw, 7 February 2006: thirty-one short instrumentals, released three days before he died.",
      image: "news-donuts.webp",
      spec: ["2006", "stones throw", "lp"]
    },
    {
      slug: "/news/last-emperor",
      kicker: "thursday cinema",
      title: "The Last Emperor",
      artist: "Ryuichi Sakamoto",
      dek: "Sakamoto, Byrne, and Cong Su scored The Last Emperor in 1987. The music holds up with the film turned off.",
      image: "news-last-emperor.webp",
      spec: ["1987", "virgin", "ost"]
    },
    {
      slug: "/news/headphones-on",
      kicker: "friday floor",
      title: "Headphones On",
      artist: "Addison Rae",
      dek: "Addison’s debut is twelve tracks and no features. Charli said trust the ideas, and I did on the walk home.",
      image: "news-headphones.webp",
      spec: ["2025", "columbia", "lp"]
    },
    {
      slug: "/news/she-showed-up",
      kicker: "saturday door",
      title: "She Showed Up",
      artist: "Lorde",
      dek: "On 25 May 2025 Lorde stood in the crowd at Mary's Underground in Sydney for a night of her own song.",
      image: "news-showed-up.webp",
      spec: ["live", "no green room"]
    }
  ];

  /* The desk plays the record that is out, not a rotating outside LP. */
  var HOUSE = {
    slug: "/you-are-love",
    kicker: "CC004 · out now",
    title: "You Are (Love)",
    artist: "Riscape",
    dek: "Four tracks. Digital is live. Cassette is sold out.",
    image: "you-are-love-cover.webp",
    spec: ["CC004", "EP", "2026"]
  };

  function tonightPick() {
    return HOUSE;
  }

  function stampDates() {
    var nodes = document.querySelectorAll("[data-zine-date]");
    var label = zineDate();
    for (var i = 0; i < nodes.length; i++) nodes[i].textContent = label;
  }

  function specMarkup(bits) {
    if (!bits || !bits.length) return "";
    return bits.map(function (bit) {
      return "<span>" + bit + "</span>";
    }).join("");
  }

  function fillTonight(root) {
    var pick = tonightPick();
    var nodes = (root || document).querySelectorAll("[data-tonight]");
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      var link = el.tagName === "A" ? el : el.querySelector("[data-tonight-link]");
      var img = el.querySelector("[data-tonight-img]");
      var kicker = el.querySelector("[data-tonight-kicker]");
      var title = el.querySelector("[data-tonight-title]");
      var artist = el.querySelector("[data-tonight-artist]");
      var dek = el.querySelector("[data-tonight-dek]");
      var spec = el.querySelector("[data-tonight-spec]");
      if (link) link.setAttribute("href", pick.slug);
      if (el.tagName === "A") el.setAttribute("href", pick.slug);
      if (img) {
        img.setAttribute("src", asset(pick.image));
        img.setAttribute("alt", pick.title + ", " + pick.artist);
      }
      if (kicker) kicker.textContent = pick.kicker;
      if (title) title.textContent = pick.title;
      if (artist) artist.textContent = pick.artist;
      if (dek) dek.textContent = pick.dek;
      if (spec) {
        spec.innerHTML = specMarkup(pick.spec);
        spec.hidden = !pick.spec || !pick.spec.length;
      }
    }
  }

  function ensureStoryFolio() {
    if (!document.body.classList.contains("news-story")) return;
    if (document.querySelector(".story-meta, .zine-story-folio, [data-file-info]")) return;
    var crumbs = document.querySelector(".zine-story-crumbs");
    if (!crumbs) return;
    var kicker = document.querySelector(".news-kicker span");
    var desk = kicker ? kicker.textContent.trim() : "zine";
    var p = document.createElement("p");
    p.className = "zine-story-folio";
    p.innerHTML =
      "<span>night shift</span>" +
      "<span>" + desk + "</span>";
    crumbs.after(p);
  }

  function storySlug() {
    var path = location.pathname.replace(/\/$/, "");
    if (path.slice(-5) === ".html") path = path.slice(0, -5);
    return path;
  }

  function catNo(value) {
    var v = String(value || "").trim();
    if (!v || /^mix$/i.test(v)) return "";
    return v;
  }

  function cleanEmbed(src) {
    return String(src || "")
      .replace(/([?&])auto_play=true/gi, "$1auto_play=false")
      .replace(/([?&])autoplay=true/gi, "$1autoplay=false")
      .replace(/([?&])autoplay=1/gi, "$1autoplay=0");
  }

  function clock(seconds) {
    if (seconds == null || seconds === "") return "";
    var n = Number(seconds);
    if (!isFinite(n) || n < 0) return "";
    var s = Math.round(n);
    var h = Math.floor(s / 3600);
    var m = Math.floor((s % 3600) / 60);
    var r = s % 60;
    function pad(v) { return (v < 10 ? "0" : "") + v; }
    if (h > 0) return h + ":" + pad(m) + ":" + pad(r);
    return m + ":" + pad(r);
  }

  function isoLabel(iso) {
    if (!iso) return "";
    var parts = String(iso).split("-");
    if (parts.length < 3) return String(iso);
    var months = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ");
    var month = months[parseInt(parts[1], 10) - 1];
    if (!month) return String(iso);
    return String(parseInt(parts[2], 10)) + " " + month + " " + parts[0];
  }

  function normPath(value) {
    return String(value || "").replace(/\/+$/, "").toLowerCase();
  }

  function matchRelease(article, catalog) {
    var listen = article && article.listen;
    if (!listen || !listen.embed || !listen.url) return null;
    var releases = (catalog && catalog.releases) || [];
    var cat = String(listen.catalogue || "").trim();
    var page = normPath(listen.page);
    var url = normPath(listen.url);
    var byCat = null;
    var byPage = null;
    var byUrl = null;
    for (var i = 0; i < releases.length; i++) {
      var release = releases[i];
      if (cat && !/^mix$/i.test(cat) && (release.catalogue === cat || release.legacyCatalogue === cat)) byCat = release;
      if (page && page !== "/tapes" && normPath(release.page) === page) byPage = release;
      if (url && release.bandcampUrl && normPath(release.bandcampUrl) === url) byUrl = release;
    }
    return byCat || byPage || byUrl || null;
  }

  function nowAttrs(title, artist, catalogue) {
    return (
      ' data-now-title="' + esc(title || "") +
      '" data-now-artist="' + esc(artist || "") +
      '" data-now-cat="' + esc(catNo(catalogue)) + '"'
    );
  }

  function playerStage(listen, title, artist, catalogue) {
    var height = Number(listen.embedHeight) || (listen.kind === "mix" ? 166 : 120);
    var kind = listen.kind === "mix" ? "soundcloud" : "bandcamp";
    var label = "Play " + (title || "") + " by " + (artist || "");
    return (
      '<div class="listen-card-stage" data-embed-kind="' + esc(kind) + '" style="height:' + height + 'px">' +
      '<button type="button" class="listen-card-hit" data-listen-play data-embed="' + esc(listen.embed) + '"' +
      nowAttrs(title, artist, catalogue) +
      ' aria-label="' + esc(label) + '">' +
      '<span class="listen-card-meta">' +
      (catNo(catalogue) ? '<span class="listen-card-cat">' + esc(catNo(catalogue)) + "</span>" : "") +
      "<strong>" + esc(title || "") + "</strong>" +
      "<em>" + esc(artist || "") + "</em></span>" +
      '<span class="listen-card-cue">play</span>' +
      "</button></div>" +
      '<p class="listen-card-links">' +
      '<a href="' + esc(listen.url) + '" rel="noopener noreferrer" target="_blank">the recording</a>' +
      (listen.page ? '<a href="' + esc(listen.page) + '">catalogue</a>' : "") +
      "</p>"
    );
  }

  function listenCard(article) {
    var listen = article && article.listen;
    if (!listen || !listen.embed || !listen.url) return "";
    return (
      '<div class="listen-card">' +
      '<p class="zine-desk-kicker">listen</p>' +
      playerStage(listen, listen.title, listen.artist, listen.catalogue) +
      "</div>"
    );
  }

  function releaseCard(article, release) {
    var listen = article.listen;
    var tracks = (release.tracks || []).slice().sort(function (a, b) {
      return (Number(a.trackNum) || 0) - (Number(b.trackNum) || 0);
    });
    var trackHtml = "";
    for (var i = 0; i < tracks.length; i++) {
      if (!tracks[i].title) continue;
      var time = clock(tracks[i].duration);
      trackHtml += "<li><span>" + esc(tracks[i].title) + "</span>" + (time ? "<time>" + esc(time) + "</time>" : "") + "</li>";
    }
    var bits = [];
    if (release.kind) bits.push(release.kind);
    var formats = release.formats || {};
    Object.keys(formats).forEach(function (name) {
      var note = formats[name] && formats[name].note;
      bits.push(note ? name + " (" + note + ")" : name);
    });
    var when = isoLabel(release.released);
    var cover = release.coverThumb || release.cover || "";
    var title = release.title || listen.title || "";
    var artist = release.artist || listen.artist || "";
    var catalogue = release.catalogue || listen.catalogue || "";
    var alt = title && artist ? title + ", " + artist : (title || artist);
    return (
      '<article class="release-card">' +
      '<p class="zine-desk-kicker">release</p>' +
      '<div class="release-card-top">' +
      (cover ? '<img class="release-card-sleeve" src="' + esc(asset(cover)) + '" alt="' + esc(alt) + '" width="480" height="480"/>' : "") +
      '<div class="release-card-id">' +
      (catalogue ? '<p class="release-card-cat">' + esc(catalogue) + "</p>" : "") +
      "<h3>" + esc(title) + "</h3>" +
      (artist ? "<p>" + esc(artist) + "</p>" : "") +
      (when ? '<p class="release-card-meta">' + esc(when) + "</p>" : "") +
      (bits.length ? '<p class="release-card-meta">' + esc(bits.join(" · ")) + "</p>" : "") +
      "</div></div>" +
      (trackHtml ? '<ol class="release-card-tracks">' + trackHtml + "</ol>" : "") +
      playerStage(listen, title, artist, catalogue) +
      "</article>"
    );
  }

  function syncNowClearance() {
    var spacer = document.querySelector(".zine-now-spacer");
    var open = document.body.classList.contains("zine-now-on");
    var docked = document.body.classList.contains("has-vcr-player");
    if (open && docked) {
      if (!spacer) {
        spacer = document.createElement("div");
        spacer.className = "zine-now-spacer";
        spacer.setAttribute("aria-hidden", "true");
        document.body.appendChild(spacer);
      }
    } else if (spacer) {
      spacer.parentNode.removeChild(spacer);
    }
  }

  function closeNow(restore) {
    var bar = document.querySelector(".zine-now");
    if (restore !== false && bar && bar._frame && bar._button && bar._stage && bar._frame.parentNode === bar._stage) {
      try { bar._frame.src = "about:blank"; } catch (err) {}
      bar._stage.replaceChild(bar._button, bar._frame);
    }
    if (bar) {
      bar.hidden = true;
      bar._frame = null;
      bar._button = null;
      bar._stage = null;
    }
    document.body.classList.remove("zine-now-on");
    syncNowClearance();
  }

  function showNow(btn, stage, frame) {
    var bar = document.querySelector(".zine-now");
    if (!bar) {
      bar = document.createElement("div");
      bar.className = "zine-now";
      bar.setAttribute("role", "status");
      bar.setAttribute("aria-live", "polite");
      bar.innerHTML = '<p class="zine-sr">Now playing</p><p class="zine-now-meta"></p><button type="button" class="zine-now-close">Close</button>';
      bar.querySelector("button").addEventListener("click", function () { closeNow(true); });
      document.body.appendChild(bar);
      if (window.MutationObserver && !bar._watching) {
        bar._watching = true;
        new MutationObserver(function () {
          if (document.body.classList.contains("zine-now-on")) syncNowClearance();
        }).observe(document.body, { attributes: true, attributeFilter: ["class"] });
      }
    }
    var meta = bar.querySelector(".zine-now-meta");
    meta.textContent = "";
    function add(tag, text) {
      if (!text) return;
      if (meta.childNodes.length) meta.appendChild(document.createTextNode(" · "));
      var el = document.createElement(tag);
      el.textContent = text;
      meta.appendChild(el);
    }
    add("strong", btn.getAttribute("data-now-title") || "");
    add("span", btn.getAttribute("data-now-artist") || "");
    add("span", btn.getAttribute("data-now-cat") || "");
    bar.hidden = false;
    bar._button = btn;
    bar._stage = stage;
    bar._frame = frame;
    document.body.classList.add("zine-now-on");
    syncNowClearance();
  }

  function bindListen(root) {
    var buttons = (root || document).querySelectorAll("[data-listen-play]");
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener("click", function (event) {
        var btn = event.currentTarget;
        var stage = btn.parentNode;
        if (!stage || stage.querySelector("iframe")) return;
        closeNow(true);
        var frame = document.createElement("iframe");
        frame.src = cleanEmbed(btn.getAttribute("data-embed"));
        frame.title = btn.getAttribute("aria-label") || "Listen";
        frame.setAttribute("allow", "encrypted-media; fullscreen");
        frame.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
        stage.replaceChild(frame, btn);
        showNow(btn, stage, frame);
      });
    }
  }

  function injectStoryDesk(articles, catalog) {
    var article = document.querySelector("[data-zine-story]") || document.querySelector(".news-article");
    if (!article || document.querySelector(".zine-story-desk")) return;
    var nav = article.querySelector(".news-nav");
    var desk = document.createElement("aside");
    desk.className = "zine-story-desk";
    desk.setAttribute("aria-label", "Also on the desk");

    var slug = storySlug();
    var related = (articles || []).filter(function (a) {
      if (a.archived) return false;
      return a.slug !== slug;
    });
    var typeEl = article.querySelector(".news-kicker span");
    var typeHint = typeEl ? typeEl.textContent.toLowerCase() : "";
    var typeMap = {
      gossip: "gossip",
      fit: "gossip",
      ritual: "ritual",
      cover: "artist",
      listening: "listening",
      interview: "interview",
      release: "release",
      artist: "artist",
      note: "label",
      news: "label",
      scene: "label"
    };
    var want = typeMap[typeHint] || "";
    related.sort(function (a, b) {
      var as = a.type === want ? 0 : 1;
      var bs = b.type === want ? 0 : 1;
      if (as !== bs) return as - bs;
      return (b.date || "").localeCompare(a.date || "");
    });
    related = related.slice(0, 3);

    var relHtml = related
      .map(function (a) {
        return (
          '<a href="' +
          a.slug +
          '"><strong>' +
          (a.headline || "") +
          "</strong><span>" +
          (a.dek || "") +
          "</span></a>"
        );
      })
      .join("");

    var current = null;
    for (var c = 0; c < (articles || []).length; c++) {
      if (articles[c].slug === slug) current = articles[c];
    }

    var release = matchRelease(current, catalog);
    desk.innerHTML =
      (release ? releaseCard(current, release) : listenCard(current)) +
      '<div class="zine-also">' +
      '<p class="zine-desk-kicker">also on the desk</p>' +
      '<div class="zine-also-list">' +
      relHtml +
      "</div></div>";

    if (nav) article.insertBefore(desk, nav);
    else article.appendChild(desk);
    bindListen(desk);

    if (!article.querySelector(".zine-letters")) {
      article.insertBefore(lettersEl(), nav || null);
    }
  }

  function lettersEl() {
    var aside = document.createElement("aside");
    aside.className = "zine-letters";
    aside.id = aside.id || "";
    aside.innerHTML =
      '<p class="zine-desk-kicker">write the desk</p>' +
      "<h2>If it happened after two.</h2>" +
      "<p>Gossip, corrections, what you wore, what you played. We read it. The good ones get xeroxed.</p>" +
      '<form class="zine-letters-form" action="https://formspree.io/f/xdkwjzzr" method="POST">' +
      '<input type="hidden" name="_subject" value="Night Shift desk letter"/>' +
      '<label class="sr-only" for="zine-letter-email">Email</label>' +
      '<input id="zine-letter-email" type="email" name="email" placeholder="your email" required autocomplete="email"/>' +
      '<label class="sr-only" for="zine-letter-body">Letter</label>' +
      '<textarea id="zine-letter-body" name="letter" rows="3" placeholder="what happened / what you wore / what you played" required></textarea>' +
      '<input type="text" name="_gotcha" tabindex="-1" autocomplete="off" aria-hidden="true" class="zine-honeypot"/>' +
      "<button type=\"submit\">send to the desk</button>" +
      "</form>";
    return aside;
  }

  function ensureLettersOnIndex() {
    if (document.querySelector(".zine-letters")) return;
    var fridge = document.querySelector(".zine-fridge");
    var grid = document.querySelector(".news-grid");
    var host = fridge || grid;
    if (!host) return;
    var el = lettersEl();
    el.id = "desk";
    host.parentNode.insertBefore(el, host);
  }

  function loadNews(cb) {
    var url = asset("data/news.json");
    fetch(url, { credentials: "same-origin" })
      .then(function (r) {
        return r.ok ? r.json() : null;
      })
      .then(function (data) {
        cb(data && data.articles ? data.articles : []);
      })
      .catch(function () {
        cb([]);
      });
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function postedMeta(iso) {
    if (!iso) return "";
    var d = new Date(iso + "T12:00:00");
    if (isNaN(d.getTime())) return "";
    var dd = d.getDate();
    var yy = String(d.getFullYear()).slice(2);
    return (
      "posted " +
      (dd < 10 ? "0" : "") +
      dd +
      " " +
      MONTHS[d.getMonth()] +
      " " +
      yy
    );
  }

  function homePostHtml(a) {
    var kicker = a.format || a.typeLabel || a.kicker || a.type || "";
    return (
      '<a class="zine-post rv in" href="' +
      esc(a.slug) +
      '" data-date="' +
      esc(a.date) +
      '" data-type="' +
      esc(a.type || "") +
      '">' +
      '<div class="zine-post-art"><img src="' +
      esc(asset(a.image)) +
      '" alt="' +
      esc(a.imageAlt || a.headline || "") +
      '" width="1400" height="1400" loading="lazy"/></div>' +
      "<div>" +
      '<p class="zine-post-kicker">' +
      esc(kicker) +
      "</p>" +
      '<h3 class="zine-post-title">' +
      esc(a.headline || "") +
      "</h3>" +
      '<p class="zine-post-dek">' +
      esc(a.dek || "") +
      "</p>" +
      '<p class="zine-post-meta">' +
      postedMeta(a.date) +
      "</p>" +
      "</div></a>"
    );
  }

  function coverSlug() {
    var link = document.querySelector(".zine--home .zine-cover-title a, .zine-lead .zine-headline a");
    if (!link) return "";
    var href = link.getAttribute("href") || "";
    if (href.charAt(href.length - 1) === "/") href = href.slice(0, -1);
    return href;
  }

  function currentVolume(articles) {
    var current = 0;
    (articles || []).forEach(function (a) {
      if (!a.archived && a.volume != null && a.volume !== "" && Number(a.volume) > current) current = Number(a.volume);
    });
    return current;
  }

  function fillHomePosts(articles) {
    var root = document.querySelector("[data-zine-posts]");
    if (!root || root.querySelector(".zine-post")) return;
    var lead = coverSlug();
    var list = (articles || [])
      .slice()
      .sort(function (a, b) {
        return (b.date || "").localeCompare(a.date || "");
      })
      .filter(function (a) {
        if (a.archived || Number(a.volume) !== currentVolume(articles)) return false;
        var slug = a.slug || "";
        if (slug.charAt(slug.length - 1) === "/") slug = slug.slice(0, -1);
        return !lead || slug !== lead;
      })
      .slice(0, 3);
    if (!list.length) return;
    root.innerHTML = list.map(homePostHtml).join("");
  }

  function bindLibrarySearch() {
    var form = document.querySelector("[data-library-search]");
    if (!form) return;
    var input = form.querySelector("input");
    var status = document.querySelector("[data-library-status]");
    if (!input) return;
    loadNews(function (articles) {
      var index = (articles || []).map(function (a) {
        return {
          slug: a.slug,
          text: [a.headline, a.dek, a.format, a.kicker, (a.artists || []).join(" "), (a.places || []).join(" ")]
            .join(" ")
            .toLowerCase()
        };
      });
      function rowFor(slug) {
        for (var i = 0; i < index.length; i++) if (index[i].slug === slug) return index[i];
        return null;
      }
      function slugOf(el) {
        var link = el.querySelector("a[href*='/news/']");
        if (!link) return "";
        var href = link.getAttribute("href") || "";
        if (href.charAt(href.length - 1) === "/") href = href.slice(0, -1);
        return href;
      }
      function apply() {
        var terms = input.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
        var items = document.querySelectorAll(".issue-cover, .issue-toc li, .catalogue-list li, .start-here li, .library-files tbody tr");
        var seen = {};
        var shown = 0;
        for (var i = 0; i < items.length; i++) {
          var el = items[i];
          var slug = slugOf(el);
          if (!slug || slug === "/news" || slug.indexOf("/news/") !== 0) continue;
          if (slug.indexOf("/news/archive") === 0 || slug.indexOf("/news/artists") === 0 || slug.indexOf("/news/places") === 0 || slug.indexOf("/news/series") === 0 || slug.indexOf("/news/issue") === 0 || slug.indexOf("/news/vol-") === 0) continue;
          var row = rowFor(slug);
          var ok = !terms.length;
          if (!ok && row) {
            ok = true;
            for (var t = 0; t < terms.length; t++) {
              if (row.text.indexOf(terms[t]) === -1) ok = false;
            }
          }
          el.classList.toggle("library-dim", !ok);
          if (libraryInactive(el)) continue;
          if (ok && !seen[slug]) {
            seen[slug] = true;
            shown++;
          }
        }
        var blocks = document.querySelectorAll(".issue-contents > section, .back-catalogue > section, .start-here");
        for (var b = 0; b < blocks.length; b++) {
          var live = blocks[b].querySelector("li:not(.library-dim)");
          blocks[b].classList.toggle("library-dim", terms.length > 0 && !live);
        }
        if (status) {
          status.hidden = !terms.length;
          status.textContent = !terms.length ? "" : shown ? shown + " in the library" : "Nothing under that name.";
        }
      }
      input.addEventListener("input", apply);
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        apply();
      });
    });
  }

  function libraryInactive(el) {
    var listMode = document.documentElement.classList.contains("library-list");
    if (el.closest(".library-files")) return !listMode;
    if (el.closest(".back-catalogue") && el.closest(".catalogue-list")) return listMode;
    return false;
  }

  function compareLibraryRows(a, b, key, dir) {
    var av = a.getAttribute("data-" + key) || "";
    var bv = b.getAttribute("data-" + key) || "";
    if (!av && !bv) return 0;
    if (!av) return 1;
    if (!bv) return -1;
    var n = 0;
    if (key === "date" || key === "read" || key === "issue" || key === "volume") n = Number(av) - Number(bv);
    else n = av.localeCompare(bv, undefined, { sensitivity: "base", numeric: true });
    if (n === 0) return 0;
    return dir === "asc" ? n : -n;
  }

  function bindLibrarySort(files) {
    var buttons = files.querySelectorAll("[data-sort]");
    var tbody = files.querySelector("tbody");
    if (!buttons.length || !tbody) return;
    var key = "date";
    var dir = "desc";
    try {
      var saved = localStorage.getItem("cc-nightshift-sort") || "";
      var parts = saved.split(":");
      if (parts[0]) key = parts[0];
      if (parts[1] === "asc" || parts[1] === "desc") dir = parts[1];
    } catch (err) {}
    function apply(nextKey, nextDir) {
      key = nextKey;
      dir = nextDir;
      var rows = Array.prototype.slice.call(tbody.querySelectorAll("tr"));
      rows.sort(function (a, b) { return compareLibraryRows(a, b, key, dir); });
      for (var i = 0; i < rows.length; i++) tbody.appendChild(rows[i]);
      for (var h = 0; h < buttons.length; h++) {
        var th = buttons[h].closest("th") || buttons[h];
        var buttonKey = buttons[h].getAttribute("data-sort");
        th.setAttribute("aria-sort", buttonKey === key ? (dir === "asc" ? "ascending" : "descending") : "none");
      }
      try { localStorage.setItem("cc-nightshift-sort", key + ":" + dir); } catch (err) {}
    }
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener("click", function (event) {
        var nextKey = event.currentTarget.getAttribute("data-sort");
        var nextDir;
        if (nextKey !== key) nextDir = (nextKey === "date" || nextKey === "read" || nextKey === "issue" || nextKey === "volume") ? "desc" : "asc";
        else nextDir = dir === "asc" ? "desc" : "asc";
        apply(nextKey, nextDir);
      });
    }
    apply(key, dir);
  }

  function bindLibraryView() {
    var root = document.querySelector("[data-library-view]");
    var files = document.querySelector("[data-library-files]");
    if (!root || !files) return;
    var buttons = root.querySelectorAll("[data-library-mode]");
    function syncPressed() {
      var list = document.documentElement.classList.contains("library-list");
      for (var i = 0; i < buttons.length; i++) {
        var on = buttons[i].getAttribute("data-library-mode") === (list ? "list" : "cards");
        buttons[i].setAttribute("aria-pressed", on ? "true" : "false");
      }
    }
    function setMode(mode) {
      document.documentElement.classList.toggle("library-list", mode === "list");
      try { localStorage.setItem("cc-nightshift-view", mode); } catch (err) {}
      syncPressed();
      var input = document.querySelector("[data-library-search] input");
      if (input) input.dispatchEvent(new Event("input"));
    }
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener("click", function (event) {
        setMode(event.currentTarget.getAttribute("data-library-mode") || "cards");
      });
    }
    syncPressed();
    bindLibrarySort(files);
  }

  function paintIssueRun() {
    var index = document.querySelector("[data-issue-index]");
    if (!index) return;
    loadNews(function (articles) {
      function paint() {
        var cards = index.querySelectorAll(".issue-card");
        for (var i = 0; i < cards.length; i++) {
          var href = cards[i].getAttribute("href") || "";
          var match = href.match(/vol-(\d+)/) || href.match(/issue-(\d+)/);
          if (!match) continue;
          var number = parseInt(match[1], 10);
          var count = 0;
          for (var a = 0; a < articles.length; a++) {
            var vol = articles[a].volume != null && articles[a].volume !== "" ? Number(articles[a].volume) : Number(articles[a].issue);
            if (vol === number && !articles[a].archived) count++;
          }
          var label = count === 1 ? "1 story" : count + " stories";
          var el = cards[i].querySelector(".issue-count");
          if (!el) {
            el = document.createElement("span");
            el.className = "issue-count";
            var host = cards[i].querySelector("div") || cards[i];
            var title = host.querySelector("span:not(.issue-count)");
            if (title) host.insertBefore(el, title);
            else host.appendChild(el);
          }
          if (el.textContent !== label) el.textContent = label;
        }
      }
      paint();
      if (window.MutationObserver) {
        new MutationObserver(function () { paint(); }).observe(index, { childList: true });
      }
    });
  }

  function loadCatalog(cb) {
    fetch(asset("data/catalog.json"), { credentials: "same-origin" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) { cb(data); })
      .catch(function () { cb(null); });
  }

  function bindStarsPin() {
    var root = document.querySelector(".zine-stars-pin");
    if (!root) return;
    var scroller = root.querySelector(".zine-stars-pin-scroll");
    var items = root.querySelectorAll(".zine-stars-pin li");
    var n = root.querySelector("[data-stars-index]");
    if (!scroller || !items.length || !n) return;
    function update() {
      var edge = scroller.getBoundingClientRect().left;
      var best = 0;
      var bestDist = Infinity;
      for (var i = 0; i < items.length; i++) {
        var dist = Math.abs(items[i].getBoundingClientRect().left - edge);
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      }
      n.textContent = String(best + 1);
    }
    scroller.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  function bindListenKeys() {
    function paint(detail) {
      var track = detail && detail.track;
      var id = track && track.id;
      var on = !!(detail && detail.playing && id);
      var keys = document.querySelectorAll(".listen-key");
      for (var i = 0; i < keys.length; i++) {
        var match = on && keys[i].getAttribute("data-play-track") === id;
        keys[i].classList.toggle("is-playing", match);
        keys[i].setAttribute("aria-pressed", match ? "true" : "false");
      }
    }
    window.addEventListener("vcr:player", function (e) {
      paint(e.detail || {});
    });
  }

  ensureStoryFolio();
  stampDates();
  bindStarsPin();
  bindListenKeys();
  fillTonight();
  ensureLettersOnIndex();
  bindLibrarySearch();
  bindLibraryView();
  paintIssueRun();

  var homePosts = document.querySelector("[data-zine-posts]");
  var story = document.body.classList.contains("news-story") || document.querySelector(".news-article");
  if (homePosts || story) {
    loadNews(function (articles) {
      if (homePosts) fillHomePosts(articles);
      if (story) {
        loadCatalog(function (catalog) {
          injectStoryDesk(articles, catalog);
        });
      }
    });
  }
})();
