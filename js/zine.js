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
    if (document.querySelector(".story-meta, .zine-story-folio")) return;
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

  function listenCard(article) {
    var listen = article && article.listen;
    if (!listen || !listen.embed || !listen.url) return "";
    var height = Number(listen.embedHeight) || (listen.kind === "mix" ? 166 : 120);
    var kind = listen.kind === "mix" ? "soundcloud" : "bandcamp";
    var label = "Play " + (listen.title || "") + " by " + (listen.artist || "");
    return (
      '<div class="listen-card">' +
      '<p class="zine-desk-kicker">listen</p>' +
      '<div class="listen-card-stage" data-embed-kind="' +
      esc(kind) +
      '" style="height:' +
      height +
      'px">' +
      '<button type="button" class="listen-card-hit" data-listen-play data-embed="' +
      esc(listen.embed) +
      '" aria-label="' +
      esc(label) +
      '">' +
      '<span class="listen-card-meta">' +
      '<span class="listen-card-cat">' +
      esc(listen.catalogue || "") +
      "</span>" +
      "<strong>" +
      esc(listen.title || "") +
      "</strong>" +
      "<em>" +
      esc(listen.artist || "") +
      "</em></span>" +
      '<span class="listen-card-cue">play</span>' +
      "</button></div>" +
      '<p class="listen-card-links">' +
      '<a href="' +
      esc(listen.url) +
      '" rel="noopener noreferrer" target="_blank">the recording</a>' +
      (listen.page ? '<a href="' + esc(listen.page) + '">catalogue</a>' : "") +
      "</p></div>"
    );
  }

  function bindListen(root) {
    var buttons = (root || document).querySelectorAll("[data-listen-play]");
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener("click", function (event) {
        var btn = event.currentTarget;
        var stage = btn.parentNode;
        if (!stage || stage.querySelector("iframe")) return;
        var frame = document.createElement("iframe");
        frame.src = btn.getAttribute("data-embed");
        frame.title = btn.getAttribute("aria-label") || "Listen";
        frame.setAttribute("allow", "autoplay; encrypted-media; fullscreen");
        frame.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
        stage.replaceChild(frame, btn);
      });
    }
  }

  function injectStoryDesk(articles) {
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

    desk.innerHTML =
      listenCard(current) +
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
        if (a.archived || a.issue !== 1) return false;
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
        var items = document.querySelectorAll(".issue-cover, .issue-toc li, .catalogue-list li, .start-here li");
        var seen = {};
        var shown = 0;
        for (var i = 0; i < items.length; i++) {
          var el = items[i];
          var slug = slugOf(el);
          if (!slug || slug === "/news" || slug.indexOf("/news/") !== 0) continue;
          if (slug.indexOf("/news/archive") === 0 || slug.indexOf("/news/artists") === 0 || slug.indexOf("/news/places") === 0 || slug.indexOf("/news/series") === 0 || slug.indexOf("/news/issue") === 0) continue;
          var row = rowFor(slug);
          var ok = !terms.length;
          if (!ok && row) {
            ok = true;
            for (var t = 0; t < terms.length; t++) {
              if (row.text.indexOf(terms[t]) === -1) ok = false;
            }
          }
          el.classList.toggle("library-dim", !ok);
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

  ensureStoryFolio();
  stampDates();
  fillTonight();
  ensureLettersOnIndex();
  bindLibrarySearch();

  var homePosts = document.querySelector("[data-zine-posts]");
  var story = document.body.classList.contains("news-story") || document.querySelector(".news-article");
  if (homePosts || story) {
    loadNews(function (articles) {
      if (homePosts) fillHomePosts(articles);
      if (story) injectStoryDesk(articles);
    });
  }
})();
