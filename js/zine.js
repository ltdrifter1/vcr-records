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
      dek: "Sade, 1992. The record I leave on when people are still in the apartment.",
      image: "news-love-deluxe.webp",
      spec: ["1992", "epic", "lp"]
    },
    {
      slug: "/news/dummy",
      kicker: "monday rain",
      title: "Dummy",
      artist: "Portishead",
      dek: "Portishead on a Cumberland afternoon, rain on the glass. I still start people here.",
      image: "news-dummy.webp",
      spec: ["1994", "go! beat", "lp"]
    },
    {
      slug: "/news/the-after-is-the-point",
      kicker: "tuesday afters",
      title: "Nobody Asked What to Put On",
      artist: "Night Shift",
      dek: "The club photo is a lie with good lighting. The night starts when somebody puts a record on and nobody takes a vote.",
      image: "news-afters.webp",
      spec: ["afters", "no vote"]
    },
    {
      slug: "/news/donuts",
      kicker: "wednesday loops",
      title: "Donuts",
      artist: "J Dilla",
      dek: "Put this on when your loops feel too clean, when everything lands on the grid like it was afraid to be late to its own party.",
      image: "news-donuts.webp",
      spec: ["2006", "stones throw", "lp"]
    },
    {
      slug: "/news/last-emperor",
      kicker: "thursday cinema",
      title: "The Last Emperor",
      artist: "Ryuichi Sakamoto",
      dek: "Sakamoto, off the movie. I put it on when the apartment needs a temperature, not a plot.",
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
      dek: "Mary’s Underground threw a Lorde night, and then Lorde walked in and skipped the green room.",
      image: "news-showed-up.webp",
      spec: ["live", "no green room"]
    }
  ];

  function tonightPick() {
    return TONIGHT[new Date().getDay()];
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
    if (document.querySelector(".zine-story-folio")) return;
    var crumbs = document.querySelector(".zine-story-crumbs");
    if (!crumbs) return;
    var kicker = document.querySelector(".news-kicker span");
    var desk = kicker ? kicker.textContent.trim() : "zine";
    var p = document.createElement("p");
    p.className = "zine-story-folio";
    p.innerHTML =
      "<span>vol. xxii · vancouver</span>" +
      "<span data-zine-date></span>" +
      "<span>" + desk + "</span>";
    crumbs.after(p);
  }

  function storySlug() {
    var path = location.pathname.replace(/\/$/, "");
    if (path.slice(-5) === ".html") path = path.slice(0, -5);
    return path;
  }

  function injectStoryDesk(articles) {
    var article = document.querySelector("[data-zine-story]") || document.querySelector(".news-article");
    if (!article || document.querySelector(".zine-story-desk")) return;
    var nav = article.querySelector(".news-nav");
    var desk = document.createElement("aside");
    desk.className = "zine-story-desk";
    desk.setAttribute("aria-label", "Also on the desk");

    var pick = tonightPick();
    var slug = storySlug();
    var related = (articles || []).filter(function (a) {
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

    desk.innerHTML =
      '<div class="zine-tonight zine-tonight--story" data-tonight>' +
      '<p class="zine-desk-kicker">tonight\'s record</p>' +
      '<a class="zine-tonight-card" data-tonight-link href="' +
      pick.slug +
      '">' +
      '<img data-tonight-img src="' +
      asset(pick.image) +
      '" alt="" width="1400" height="1400"/>' +
      "<div>" +
      '<p class="zine-tonight-night" data-tonight-kicker>' +
      pick.kicker +
      "</p>" +
      '<strong data-tonight-title>' +
      pick.title +
      "</strong>" +
      '<em data-tonight-artist>' +
      pick.artist +
      "</em>" +
      '<p class="zine-spec" data-tonight-spec>' +
      specMarkup(pick.spec) +
      "</p>" +
      '<span data-tonight-dek>' +
      pick.dek +
      "</span>" +
      "<b>put it on →</b>" +
      "</div></a></div>" +
      '<div class="zine-also">' +
      '<p class="zine-desk-kicker">also on the desk</p>' +
      '<div class="zine-also-list">' +
      relHtml +
      "</div></div>";

    if (nav) article.insertBefore(desk, nav);
    else article.appendChild(desk);

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
    var kicker = a.typeLabel || a.kicker || a.type || "";
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

  function fillHomePosts(articles) {
    var root = document.querySelector("[data-zine-posts]");
    if (!root) return;
    var list = (articles || [])
      .slice()
      .sort(function (a, b) {
        return (b.date || "").localeCompare(a.date || "");
      })
      .slice(0, 3);
    if (!list.length) return;
    root.innerHTML = list.map(homePostHtml).join("");
  }

  ensureStoryFolio();
  stampDates();
  fillTonight();
  ensureLettersOnIndex();

  var homePosts = document.querySelector("[data-zine-posts]");
  var story = document.body.classList.contains("news-story") || document.querySelector(".news-article");
  if (homePosts || story) {
    loadNews(function (articles) {
      if (homePosts) fillHomePosts(articles);
      if (story) injectStoryDesk(articles);
    });
  }
})();
