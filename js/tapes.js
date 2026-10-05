/* Mixtapes — live SoundCloud @ltdrifta, played through the Club Copy dock. */
(function () {
  "use strict";

  var nowEl = null;
  var lastTapes = [];

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function asset(src) {
    if (!src) return src;
    if (/^https?:\/\//.test(src) || src.charAt(0) === "/") return src;
    return /\/news\/[^/]+/.test(location.pathname) ? "../" + src : src;
  }

  function esc(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function loadList(cb) {
    function fromJson(data) {
      cb(data && data.tapes ? data.tapes : []);
    }
    fetch("/api/soundcloud-feed", { credentials: "same-origin", headers: { Accept: "application/json" } })
      .then(function (r) {
        return r.ok ? r.json() : null;
      })
      .then(function (data) {
        if (data && data.tapes && data.tapes.length) {
          fromJson(data);
          return;
        }
        return fetch(asset("data/mixtapes.json"), { credentials: "same-origin" })
          .then(function (r) {
            return r.ok ? r.json() : null;
          })
          .then(fromJson);
      })
      .catch(function () {
        fetch(asset("data/mixtapes.json"), { credentials: "same-origin" })
          .then(function (r) {
            return r.ok ? r.json() : null;
          })
          .then(fromJson)
          .catch(function () {
            fromJson({ tapes: [] });
          });
      });
  }

  function stampNow(title, dj) {
    if (!nowEl) return;
    nowEl.hidden = false;
    nowEl.textContent = title + " — " + dj;
  }

  function syncButtons() {
    var st = window.VCRPlayer && VCRPlayer.getState ? VCRPlayer.getState() : null;
    var liveId = st && st.track && st.playing && st.track.releaseId === "mixes" ? st.track.id : "";
    document.querySelectorAll(".tape-play[data-sc-url], .mix-art[data-sc-url]").forEach(function (btn) {
      var live = btn.getAttribute("data-tape-id") === liveId;
      btn.classList.toggle("is-live", live);
      var label = btn.querySelector("[data-mix-play-label]");
      if (label) label.textContent = live ? "pause" : "play";
      else if (btn.classList.contains("tape-play") && !btn.classList.contains("mix-art")) {
        btn.textContent = live ? "pause" : "play";
      }
      btn.setAttribute("aria-label", (live ? "Pause " : "Play ") + (btn.getAttribute("data-tape-title") || "mix"));
    });
    if (liveId && st.track) stampNow(st.track.title, st.track.artist);
    else if (nowEl) nowEl.hidden = true;
  }

  function playMix(btn) {
    var permalink = btn.getAttribute("data-sc-url");
    var id = btn.getAttribute("data-tape-id");
    if (!permalink || !window.VCRPlayer || !VCRPlayer.playMix) return;
    var st = VCRPlayer.getState && VCRPlayer.getState();
    // Same mix again: pause, resume, or retry inside this tap (never restart it from scratch).
    if (st && st.track && st.track.id === id) {
      VCRPlayer.toggle();
      return;
    }
    var item = null;
    for (var i = 0; i < lastTapes.length; i++) {
      if (lastTapes[i].id === id) item = lastTapes[i];
    }
    if (!item) {
      item = {
        id: id,
        title: btn.getAttribute("data-tape-title") || "",
        dj: btn.getAttribute("data-tape-dj") || "L.T. Drifta",
        cover: btn.getAttribute("data-tape-cover") || "",
        permalink: permalink,
        year: btn.getAttribute("data-tape-year") || "",
      };
    }
    VCRPlayer.playMix(item, lastTapes);
  }

  function bind(root) {
    (root || document).querySelectorAll(".tape-play[data-sc-url], .mix-art[data-sc-url]").forEach(function (btn) {
      if (btn.getAttribute("data-tape-bound")) return;
      btn.setAttribute("data-tape-bound", "1");
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        playMix(btn);
      });
    });
  }

  // Genre tags under each mix. A tape that carries its own `genres` (array or comma list, from the
  // feed or the data file) uses those. Otherwise the rules below read the TITLE only (a description
  // can say "Copy House Publishing" and mean nothing by it) and a mix that matches nothing shows no
  // tags rather than a guess. To tag a series, add a rule: [/title regex/i, ["Tag", "Tag"]].
  var GENRE_RULES = [
    [/jungle/i, ["Jungle"]],
    [/\b(drum\s*(&|and|n)\s*bass|dnb|d&b)\b/i, ["Drum & Bass"]],
    [/\b(uk\s+)?garage\b/i, ["UK Garage"]],
    [/\bhouse\b/i, ["House"]],
    [/\btechno\b/i, ["Techno"]],
    [/\bdisco\b/i, ["Disco"]],
    [/\brave\b/i, ["Rave"]],
    [/\bhip[\s-]*hop\b|\bboom[\s-]*bap\b/i, ["Hip Hop"]],
    [/\bbreak(s|beats?)\b/i, ["Breaks"]],
    [/\bjazz/i, ["Jazz"]],
    [/\bfunk/i, ["Funk"]],
    [/\bambient\b/i, ["Ambient"]],
    [/\bdub\b/i, ["Dub"]],
    [/\blo[\s-]*fi\b/i, ["Lo-fi"]],
  ];

  function genresOf(t) {
    var out = [];
    function add(g) {
      var s = String(g || "").replace(/\s+/g, " ").trim();
      if (!s) return;
      for (var i = 0; i < out.length; i++) {
        if (out[i].toLowerCase() === s.toLowerCase()) return;
      }
      out.push(s);
    }
    var given = t && (t.genres || t.genre);
    if (given) {
      (Array.isArray(given) ? given : String(given).split(/[,|]/)).forEach(add);
    } else {
      var title = String((t && t.title) || "");
      GENRE_RULES.forEach(function (rule) {
        if (rule[0].test(title)) rule[1].forEach(add);
      });
    }
    return out.slice(0, 3);
  }

  function cardHtml(t) {
    var cover = t.cover || "";
    var genres = genresOf(t);
    var sleeve =
      '<button type="button" class="mix-art tape-play" data-sc-url="' +
      esc(t.permalink) +
      '" data-tape-id="' +
      esc(t.id) +
      '" data-tape-title="' +
      esc(t.title) +
      '" data-tape-dj="' +
      esc(t.dj) +
      '" data-tape-cover="' +
      esc(cover) +
      '" data-tape-year="' +
      esc(t.year) +
      '" aria-label="Play ' +
      esc(t.title) +
      '">' +
      (cover
        ? '<img src="' + esc(cover) + '" alt="" width="500" height="500" loading="lazy" decoding="async"/>'
        : '<span class="tape-sleeve--blank" aria-hidden="true"></span>') +
      '<span class="mix-eq" aria-hidden="true"><i></i><i></i><i></i></span>' +
      '<span class="mix-art-play" data-mix-play-label>play</span>' +
      "</button>";
    return (
      '<article class="mix-card" data-tape="' +
      esc(t.id) +
      '">' +
      sleeve +
      '<div class="mix-body">' +
      "<h3 class=\"tape-title mix-title\">" +
      esc(t.title) +
      "</h3>" +
      '<p class="tape-spec">' +
      (t.runtime ? "<span>" + esc(t.runtime) + "</span>" : "") +
      (t.year ? "<span>" + esc(t.year) + "</span>" : "") +
      "</p>" +
      (genres.length
        ? '<ul class="mix-genres" aria-label="Genres">' +
          genres
            .map(function (g) {
              return "<li>" + esc(g) + "</li>";
            })
            .join("") +
          "</ul>"
        : "") +
      "</div></article>"
    );
  }

  // Artwork that fails to load (offline, blocked, expired) becomes a plain sleeve, not a broken-image icon.
  document.addEventListener(
    "error",
    function (e) {
      var img = e.target;
      if (!img || img.tagName !== "IMG" || !img.closest || !img.closest(".mix-art")) return;
      var blank = document.createElement("span");
      blank.className = "tape-sleeve--blank";
      blank.setAttribute("aria-hidden", "true");
      img.replaceWith(blank);
    },
    true
  );

  function emptyHtml(failed) {
    return (
      '<div class="mix-empty">' +
      '<p class="mix-soon">' +
      (failed ? "Couldn&rsquo;t load the mixes." : "No mixes yet.") +
      "</p>" +
      '<p class="mix-empty-actions">' +
      (failed ? '<button type="button" class="tape-link" data-tapes-retry>Try again</button>' : "") +
      '<a class="tape-link" href="https://soundcloud.com/ltdrifta" rel="noopener noreferrer" target="_blank">soundcloud.com/ltdrifta</a>' +
      "</p></div>"
    );
  }

  // Day = chill / variety. Night = heavier / dance.
  // A tape can pin itself with slot: "day" | "night" in the feed data; otherwise the first
  // matching rule wins and anything unmatched lands in Day. Edit NIGHT_RULES to re-sort.
  var NIGHT_RULES = [/loft/i, /deep in the club/i, /nightshift/i, /liquid love/i, /deep[\s._-]+in[\s._-]+(th[ae]|da)[\s._-]+jungle/i];

  // Title-only keywords for dance mixes (not the description, and not "club": that is the label name).
  var NIGHT_TITLE_WORDS = /\b(house|techno|dance|rave|disco|garage|dnb|drum\s*(&|and|n)\s*bass|warehouse)\b/i;

  // Releases that were posted to SoundCloud but live in the catalogue (Bandcamp) — keep them out of Mixes.
  var RELEASE_RULES = [/molly\s*haze/i, /molly\W{0,3}s?\s+hazy/i, /hazy\s+edit/i, /\bm[\s._-]+a[\s._-]+s[\s._-]+s[\s._-]+i[\s._-]+v[\s._-]+e\b/i];

  // Mixes we do not want on the site at all.
  var HIDE_RULES = [/dirt road radio/i];

  function isRelease(t) {
    var hay = String((t && t.title) || "") + " " + String((t && t.permalink) || "");
    for (var i = 0; i < RELEASE_RULES.length; i++) {
      if (RELEASE_RULES[i].test(hay)) return true;
    }
    for (var j = 0; j < HIDE_RULES.length; j++) {
      if (HIDE_RULES[j].test(hay)) return true;
    }
    return false;
  }

  function slotOf(t) {
    var pinned = String((t && t.slot) || "").toLowerCase();
    if (pinned === "day" || pinned === "night") return pinned;
    var hay = String((t && t.title) || "") + " " + String((t && t.dek) || "");
    for (var i = 0; i < NIGHT_RULES.length; i++) {
      if (NIGHT_RULES[i].test(hay)) return "night";
    }
    if (NIGHT_TITLE_WORDS.test(String((t && t.title) || ""))) return "night";
    return "day";
  }

  // One card per mix. "Nightshift (Vol.3)" and "Nightshift (Vol.2)", every "Deep in Tha Jungle"
  // episode, and "Volume 1" ... "Volume 6" are one mix however the volumes are numbered or illustrated.
  var KNOWN_SERIES = [
    [/nightshift/i, "nightshift"],
    [/loft/i, "loft"],
    [/liquid[\s._-]+love/i, "liquid love"],
    [/deep[\s._-]+in[\s._-]+(th[ae]|da)[\s._-]+jungle/i, "deep in the jungle"],
  ];

  // Title with volume / part / date / number noise removed. "" when nothing else is left ("Volume 6").
  function baseOf(title) {
    return String(title || "")
      .toLowerCase()
      .replace(/\(.*?\)|\[.*?\]/g, " ")
      .replace(/\b(vol(ume)?s?|part|pt|no|ep|episode|chapter|side)\.?\s*[\divxl]+\b/g, " ")
      .replace(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\b/g, " ")
      .replace(/[\d#]+/g, " ")
      .replace(/[^a-z ]+/g, " ")
      .replace(/\s+/g, " ")
      .replace(/( (mix|mixtape|vol|volume|pt|part|ep|episode))+$/, "")
      .trim();
  }

  function seriesOf(title) {
    var raw = String(title || "");
    for (var k = 0; k < KNOWN_SERIES.length; k++) {
      if (KNOWN_SERIES[k][0].test(raw)) return KNOWN_SERIES[k][1];
    }
    var base = baseOf(raw);
    return base.length > 2 ? base : "";
  }

  function coverKey(t) {
    return String((t && t.cover) || "")
      .replace(/[?#].*$/, "")
      .replace(/-t\d+x\d+(\.[a-z0-9]+)$/i, "$1")
      .replace(/-original(\.[a-z0-9]+)$/i, "$1");
  }

  // Two tapes are the same mix when they share a series, or share artwork AND either the same
  // description or the same bare title. (Artwork alone is not enough: SoundCloud hands the
  // profile picture to every tape without art, and those are not one mix.)
  function sameMix(a, b) {
    var sa = seriesOf(a.title);
    if (sa && sa === seriesOf(b.title)) return true;
    var ca = coverKey(a);
    if (!ca || ca !== coverKey(b)) return false;
    var da = String(a.dek || "").trim().toLowerCase();
    if (da && da === String(b.dek || "").trim().toLowerCase()) return true;
    return baseOf(a.title) === baseOf(b.title);
  }

  // Keeps the first (newest) tape of every mix, in feed order.
  function onePerMix(tapes) {
    var kept = [];
    (tapes || []).forEach(function (t) {
      for (var i = 0; i < kept.length; i++) {
        if (sameMix(kept[i], t)) return;
      }
      kept.push(t);
    });
    return kept;
  }

  function paint(tapes) {
    var mixes = onePerMix(tapes);
    var shown = [];
    var grids = document.querySelectorAll("[data-tapes-grid]");
    if (!grids.length) return;
    grids.forEach(function (grid) {
      var limit = parseInt(grid.getAttribute("data-tapes-limit") || "0", 10);
      var slot = grid.getAttribute("data-tapes-slot");
      var panel = slot ? grid.closest("[data-tapes-panel]") : null;
      var pool = slot
        ? mixes.filter(function (t) {
            return slotOf(t) === slot;
          })
        : mixes;
      var slice = limit > 0 ? pool.slice(0, limit) : pool;
      if (panel) panel.hidden = !slice.length;
      grid.removeAttribute("aria-busy");
      if (!slice.length) {
        if (!panel) grid.innerHTML = emptyHtml(false);
        return;
      }
      grid.innerHTML = slice.map(cardHtml).join("");
      shown = shown.concat(slice);
      bind(grid);
    });
    // Next / previous in the dock walk exactly what is on screen: one tape per mix.
    lastTapes = shown;
    syncButtons();
    warmWhenVisible();
  }

  // Build the SoundCloud embed just before a mix is tapped. Phones only allow playback that
  // starts inside the tap, so the player must already be loaded by then.
  function warmWhenVisible() {
    if (!window.VCRPlayer || !VCRPlayer.warmMix || !lastTapes.length) return;
    var first = lastTapes[0].permalink;
    var grid = $("[data-tapes-grid]");
    var go = function () {
      VCRPlayer.warmMix(first);
    };
    if (!grid || !("IntersectionObserver" in window)) {
      go();
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        if (entries.some(function (e) { return e.isIntersecting; })) {
          io.disconnect();
          go();
        }
      },
      { rootMargin: "300px 0px" }
    );
    io.observe(grid);
  }

  function fail() {
    document.querySelectorAll("[data-tapes-grid]").forEach(function (grid) {
      var panel = grid.getAttribute("data-tapes-slot") ? grid.closest("[data-tapes-panel]") : null;
      grid.removeAttribute("aria-busy");
      if (panel) panel.hidden = true;
      else grid.innerHTML = emptyHtml(true);
    });
    var primary = $("[data-tapes-grid]");
    var host = primary && primary.closest("[data-tapes-panel]");
    if (host) {
      host.hidden = false;
      primary.innerHTML = emptyHtml(true);
    }
  }

  function hydrate() {
    nowEl = $("[data-tapes-now]");
    if (!$("[data-tapes-grid]")) return;
    loadList(function (tapes) {
      var usable = (tapes || []).filter(function (t) {
        return t && t.permalink && !isRelease(t);
      });
      if (!usable.length && !(tapes && tapes.length)) {
        fail();
        return;
      }
      paint(usable);
    });
  }

  document.addEventListener("click", function (e) {
    var retry = e.target.closest && e.target.closest("[data-tapes-retry]");
    if (!retry) return;
    document.querySelectorAll("[data-tapes-grid]").forEach(function (g) {
      g.setAttribute("aria-busy", "true");
    });
    hydrate();
  });

  window.addEventListener("vcr:player", function () {
    syncButtons();
  });

  hydrate();
})();
