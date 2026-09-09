/* The Xerox — magazine chrome.
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

  /* Seven nights. The apartment, the rain, the kitchen, the floor. */
  var TONIGHT = [
    {
      slug: "/news/love-deluxe",
      kicker: "sunday recovery",
      title: "Love Deluxe",
      artist: "Sade",
      dek: "The apartment record. Put it on when you want the room to like you back.",
      image: "news-summer-madness.webp"
    },
    {
      slug: "/news/dummy",
      kicker: "monday rain",
      title: "Dummy",
      artist: "Portishead",
      dek: "Beth Gibbons. Rain on the window. The other door besides the crate shop.",
      image: "lookout-cover.webp"
    },
    {
      slug: "/news/the-after-is-the-point",
      kicker: "tuesday kitchen",
      title: "The After Is the Point",
      artist: "the xerox desk",
      dek: "The club is a rumor. The night that actually happens is the kitchen light.",
      image: "news-bridget-in-my-room.webp"
    },
    {
      slug: "/news/donuts",
      kicker: "wednesday loops",
      title: "Donuts",
      artist: "J Dilla",
      dek: "Put this on when your loops feel too clean.",
      image: "news-donuts.webp"
    },
    {
      slug: "/news/last-emperor",
      kicker: "thursday cinema",
      title: "The Last Emperor",
      artist: "Ryuichi Sakamoto",
      dek: "Big history that somehow feels private.",
      image: "news-last-emperor.webp"
    },
    {
      slug: "/news/eusexua",
      kicker: "friday floor",
      title: "When a Girl Feels Good",
      artist: "FKA twigs",
      dek: "She coined a word for the floor. The girls who dance already had the feeling.",
      image: "news-still-riding.webp"
    },
    {
      slug: "/news/she-showed-up",
      kicker: "saturday door",
      title: "She Showed Up",
      artist: "Lorde",
      dek: "Management wanted the green room. She wanted the floor.",
      image: "news-rosco-bw.webp"
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

  function fillTonight(root) {
    var pick = tonightPick();
    var nodes = (root || document).querySelectorAll("[data-tonight]");
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      var href = el.getAttribute("href") || el.querySelector("a[data-tonight-link]");
      var link = el.tagName === "A" ? el : el.querySelector("[data-tonight-link]");
      var img = el.querySelector("[data-tonight-img]");
      var kicker = el.querySelector("[data-tonight-kicker]");
      var title = el.querySelector("[data-tonight-title]");
      var artist = el.querySelector("[data-tonight-artist]");
      var dek = el.querySelector("[data-tonight-dek]");
      if (link) link.setAttribute("href", pick.slug);
      if (el.tagName === "A") el.setAttribute("href", pick.slug);
      if (img) {
        img.setAttribute("src", asset(pick.image));
        img.setAttribute("alt", pick.title + " — " + pick.artist);
      }
      if (kicker) kicker.textContent = pick.kicker;
      if (title) title.textContent = pick.title;
      if (artist) artist.textContent = pick.artist;
      if (dek) dek.textContent = pick.dek;
    }
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
      "<h2>Kitchen light, send it.</h2>" +
      "<p>Gossip, corrections, what you put on tonight. We read everything. The good letters get xeroxed.</p>" +
      '<form class="zine-letters-form" action="https://formspree.io/f/xdkwjzzr" method="POST">' +
      '<input type="hidden" name="_subject" value="Xerox desk letter"/>' +
      '<label class="sr-only" for="zine-letter-email">Email</label>' +
      '<input id="zine-letter-email" type="email" name="email" placeholder="your email" required autocomplete="email"/>' +
      '<label class="sr-only" for="zine-letter-body">Letter</label>' +
      '<textarea id="zine-letter-body" name="letter" rows="3" placeholder="what happened / what you played" required></textarea>' +
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

  stampDates();
  fillTonight();
  ensureLettersOnIndex();

  if (document.body.classList.contains("news-story") || document.querySelector(".news-article")) {
    loadNews(injectStoryDesk);
  }
})();
