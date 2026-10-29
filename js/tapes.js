/* Mixtapes — live SoundCloud @ltdrifta, played through the Club Copy dock. */
(function () {
  "use strict";

  var nowEl = null;
  var lastTapes = [];
  var mixes = [];
  var tapeGenre = "";
  var filtersBound = false;
  var genreKey = "";

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
      if (!label && btn.classList.contains("tape-play") && !btn.classList.contains("mix-art")) {
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
        dj: artistName(btn.getAttribute("data-tape-dj")),
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

  // Genre tags under each mix, first match wins:
  //   1. SoundCloud's own genre + tags for that mix, snapshotted into data/mix-genres.json by
  //      scripts/sync-soundcloud-genres.js (the RSS feed does not carry them);
  //   2. a `genres` list (array or comma string) on the tape itself;
  //   3. the rules below, which read the TITLE only (a description can say "Copy House Publishing"
  //      and mean nothing by it). A mix that matches nothing shows no tags rather than a guess.
  // To tag a series by hand, add a rule: [/title regex/i, ["Tag", "Tag"]].
  var scTags = {};

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

  function slugGenre(name) {
    return String(name || "")
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function readMix() {
    try {
      return String(new URLSearchParams(window.location.search || "").get("mix") || "").trim();
    } catch (e) {
      return "";
    }
  }

  function writeMix() {
    try {
      var url = new URL(window.location.href);
      if (tapeGenre) url.searchParams.set("mix", tapeGenre);
      else url.searchParams.delete("mix");
      var next = url.pathname + (url.searchParams.toString() ? "?" + url.searchParams.toString() : "") + url.hash;
      if (next !== window.location.pathname + window.location.search + window.location.hash) {
        window.history.replaceState({}, "", next);
      }
    } catch (e) {}
    var more = document.querySelector("#mixtapes .sec-link");
    if (more) more.setAttribute("href", "/tapes" + (tapeGenre ? "?mix=" + encodeURIComponent(tapeGenre) : ""));
  }

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
    var given = (t && scTags[t.id]) || (t && (t.genres || t.genre));
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

  // Lanes use a short set of styles. SoundCloud tags are too fine ("neosoul", "1980s") to sit in the bar.
  var FILTER_GENRES = [
    ["House", /\bhouse\b/i],
    ["Drum & Bass", /\b(drum\s*(&|and|n)\s*bass|dnb|d\s*&\s*b)\b/i],
    ["Jungle", /\bjungle\b|\brollers\b/i],
    ["UK Garage", /\b(uk\s*)?garage\b|\buk bass\b/i],
    ["Hip Hop", /hip[\s-]*hop|\brap\b/i],
    ["Breaks", /\bbreaks?\b|\bbreakbeat\b|\bbreatbeat\b/i],
    ["Jazz", /\bjazz\b/i],
    ["Soul", /\bsoul\b|\br\s*&\s*b\b|\brnb\b/i],
    ["Ambient", /\bambient\b|\bdowntempo\b/i],
    ["Techno", /\btechno\b/i],
    ["Shoegaze", /shoegaze|dream\s*pop/i]
  ];

  function filterGenresOf(t) {
    var hay = genresOf(t).concat([t && t.title, t && t.dek]).join(" ");
    var given = (t && scTags[t.id]) || (t && (t.genres || t.genre));
    if (given) hay += " " + (Array.isArray(given) ? given.join(" ") : String(given));
    var out = [];
    FILTER_GENRES.forEach(function (pair) {
      if (pair[1].test(hay)) out.push(pair[0]);
    });
    return out;
  }

  function cardGenres(t) {
    var grouped = filterGenresOf(t);
    return (grouped.length ? grouped : genresOf(t)).slice(0, 3);
  }

  function artistName(name) {
    return String(name || "").replace(/L\.T\. Drifta/g, "LT Drifta") || "LT Drifta";
  }

  // A short note under the title, when the description isn't just the title repeated.
  function talker(t) {
    var dek = String((t && t.dek) || "").replace(/\s+/g, " ").trim();
    var title = String((t && t.title) || "").replace(/\s+/g, " ").trim();
    if (!dek) return "";
    if (title && dek.toLowerCase().indexOf(title.toLowerCase()) !== -1) return "";
    if (dek.length > 80) {
      var cut = dek.slice(0, 77).replace(/\s+\S*$/, "");
      dek = (cut || dek.slice(0, 77)) + "…";
    }
    return '<p class="mix-talker">' + esc(dek) + "</p>";
  }

  function cardHtml(t) {
    var cover = t.cover || "";
    var dj = artistName(t.dj);
    var genres = cardGenres(t);
    var attrs =
      ' data-sc-url="' +
      esc(t.permalink) +
      '" data-tape-id="' +
      esc(t.id) +
      '" data-tape-title="' +
      esc(t.title) +
      '" data-tape-dj="' +
      esc(dj) +
      '" data-tape-cover="' +
      esc(cover) +
      '" data-tape-year="' +
      esc(t.year) +
      '" aria-label="Play ' +
      esc(t.title) +
      '"';
    return (
      '<article class="mix-card" data-tape="' +
      esc(t.id) +
      '" data-genres="' +
      esc(genres.map(slugGenre).filter(Boolean).join(" ")) +
      '">' +
      '<button type="button" class="mix-hit tape-play"' +
      attrs +
      ">" +
      '<span class="mix-art">' +
      (cover
        ? '<img src="' + esc(cover) + '" alt="" width="300" height="300" loading="lazy" decoding="async"/>'
        : '<span class="tape-sleeve--blank" aria-hidden="true"></span>') +
      '<span class="mix-art-play" data-mix-play-label aria-hidden="true">' +
      '<svg class="mix-glyph mix-glyph--play" viewBox="0 0 24 24" width="12" height="12" aria-hidden="true"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>' +
      '<svg class="mix-glyph mix-glyph--pause" viewBox="0 0 24 24" width="12" height="12" aria-hidden="true"><path fill="currentColor" d="M7 5h3.4v14H7zM13.6 5H17v14h-3.4z"/></svg>' +
      "</span></span>" +
      '<span class="tape-title mix-title">' +
      esc(t.title) +
      "</span></button>" +
      talker(t) +
      '<p class="tape-spec mono"><span>' +
      esc(dj) +
      "</span>" +
      (t.runtime ? "<span>" + esc(t.runtime) + "</span>" : "") +
      (t.year ? "<span>" + esc(t.year) + "</span>" : "") +
      genres
        .map(function (g) {
          return "<span>" + esc(g) + "</span>";
        })
        .join("") +
      "</p></article>"
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

  // SoundCloud's genre + tags, when the title itself doesn't say the style
  // ("ROLLIN' NICE", "r a i n i e r ' s house"). Umbrella words like "Electronic" are left out.
  var NIGHT_GENRE = /\b(house|techno|dance|rave|disco|garage|jungle|drum\s*(&|and|n)\s*bass|d\s*&\s*b|dnb|breakbeat|breaks|footwork|rollers|bass|warehouse)\b/i;

  // Releases that were posted to SoundCloud but live in the catalogue — keep them out of Mixes.
  var RELEASE_RULES = [/molly\s*haze/i, /molly\W{0,3}s?\s+hazy/i, /hazy\s+edit/i, /\bm[\s._-]+a[\s._-]+s[\s._-]+s[\s._-]+i[\s._-]+v[\s._-]+e\b/i, /what'?s\s+luv/i, /\babsolutely\s+not\b/i];

  // Mixes we do not want on the site at all.
  var HIDE_RULES = [/dirt road radio/i];

  // Same cut as lib/soundcloud.js: a mix is at least 20 minutes. Shorter uploads are singles.
  var MIX_MIN_SECONDS = 20 * 60;

  function runtimeSeconds(raw) {
    var parts = String(raw || "").trim().split(":");
    if (!parts.length || parts.some(function (p) { return !/^\d+$/.test(p); })) return 0;
    if (parts.length === 3) return (+parts[0]) * 3600 + (+parts[1]) * 60 + (+parts[2]);
    if (parts.length === 2) return (+parts[0]) * 60 + (+parts[1]);
    return +parts[0];
  }

  function isLongMix(t) {
    return runtimeSeconds(t && t.runtime) >= MIX_MIN_SECONDS;
  }

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
    var title = String((t && t.title) || "");
    var hay = title + " " + String((t && t.dek) || "");
    for (var i = 0; i < NIGHT_RULES.length; i++) {
      if (NIGHT_RULES[i].test(hay)) return "night";
    }
    var given = (t && scTags[t.id]) || (t && (t.genres || t.genre));
    if (given) {
      var list = Array.isArray(given) ? given : String(given).split(/[,|]/);
      if (NIGHT_GENRE.test(list.join(" "))) return "night";
    }
    if (NIGHT_TITLE_WORDS.test(title)) return "night";
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

  function genreItems() {
    var seen = {};
    var items = [];
    mixes.forEach(function (t) {
      filterGenresOf(t).forEach(function (name) {
        var id = slugGenre(name);
        if (!id || seen[id]) return;
        seen[id] = true;
        items.push({ id: id, name: name });
      });
    });
    items.sort(function (a, b) {
      return genreCount(b.id) - genreCount(a.id) || a.name.localeCompare(b.name);
    });
    return items;
  }

  function genreCount(value) {
    var n = 0;
    mixes.forEach(function (t) {
      if (!value) {
        n++;
        return;
      }
      if (filterGenresOf(t).some(function (g) { return slugGenre(g) === value; })) n++;
    });
    return n;
  }

  function renderGenreBar() {
    var root = document.querySelector("[data-tape-filters]");
    if (!root) return;
    var items = genreItems();
    if (!items.length) {
      root.hidden = true;
      return;
    }
    root.hidden = false;
    var seg = root.querySelector(".seg");
    var key = items.map(function (item) { return item.id; }).join("|");
    if (seg && seg.getAttribute("data-key") !== key) {
      var html = '<span class="plate" aria-hidden="true"></span>';
      html += '<button type="button" role="radio" data-value="" data-label="All" aria-checked="true" tabindex="0">All<span class="n">0</span></button>';
      items.forEach(function (item) {
        html += '<button type="button" role="radio" data-value="' + esc(item.id) + '" data-label="' + esc(item.name) + '" aria-checked="false" tabindex="-1">' + esc(item.name) + '<span class="n">0</span></button>';
      });
      seg.innerHTML = html;
      seg.setAttribute("data-key", key);
    }
    if (window.ClubLanes) ClubLanes.sync(root, { genre: tapeGenre, artist: "" }, function (kind, value) {
      return kind === "genre" ? genreCount(value) : 0;
    });
  }

  function ensureFilterBind() {
    var root = document.querySelector("[data-tape-filters]");
    if (!root || filtersBound) return;
    filtersBound = true;
    tapeGenre = readMix();
    if (window.ClubLanes) {
      ClubLanes.bind(root, function (next) {
        tapeGenre = next.genre || "";
        writeMix();
        paintGrids();
      });
      return;
    }
    root.addEventListener("click", function (e) {
      var btn = e.target.closest && e.target.closest(".seg button");
      if (!btn || !root.contains(btn)) return;
      tapeGenre = btn.getAttribute("data-value") || "";
      writeMix();
      paintGrids();
    });
  }

  function paint(tapes) {
    mixes = onePerMix(tapes);
    ensureFilterBind();
    renderGenreBar();
    paintGrids();
  }

  function paintGrids() {
    var shown = [];
    var grids = document.querySelectorAll("[data-tapes-grid]");
    if (!grids.length) return;
    var filtering = !!tapeGenre;
    grids.forEach(function (grid) {
      var limit = parseInt(grid.getAttribute("data-tapes-limit") || "0", 10);
      var slot = grid.getAttribute("data-tapes-slot");
      var panel = slot ? grid.closest("[data-tapes-panel]") : null;
      var pool = slot
        ? mixes.filter(function (t) {
            return slotOf(t) === slot;
          })
        : mixes;
      if (filtering) {
        pool = pool.filter(function (t) {
          return filterGenresOf(t).some(function (g) { return slugGenre(g) === tapeGenre; });
        });
      }
      var slice = !filtering && limit > 0 ? pool.slice(0, limit) : pool;
      if (panel) panel.hidden = !slice.length;
      grid.removeAttribute("aria-busy");
      if (!slice.length) {
        grid.innerHTML = "";
        if (!panel) grid.innerHTML = emptyHtml(false);
        return;
      }
      grid.innerHTML = slice.map(cardHtml).join("");
      shown = shown.concat(slice);
      bind(grid);
    });
    var empty = document.querySelector("[data-tape-empty]");
    if (empty) empty.hidden = shown.length > 0;
    var countEl = document.querySelector("[data-tape-count]");
    if (countEl) countEl.textContent = shown.length === 1 ? "1 mix" : shown.length + " mixes";
    renderGenreBar();
    writeMix();
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

  // SoundCloud genre/tag snapshot. Optional: if it is missing or unreadable the cards just fall
  // back to the title rules.
  function loadTags(cb) {
    fetch(asset("data/mix-genres.json"), { credentials: "same-origin" })
      .then(function (r) {
        return r.ok ? r.json() : null;
      })
      .then(function (data) {
        scTags = (data && data.tags) || {};
      })
      .catch(function () {})
      .then(cb);
  }

  function hydrate() {
    nowEl = $("[data-tapes-now]");
    if (!$("[data-tapes-grid]")) return;
    loadTags(function () {
      loadList(function (tapes) {
        var usable = (tapes || []).filter(function (t) {
          return t && t.permalink && !isRelease(t) && isLongMix(t);
        });
        if (!usable.length && !(tapes && tapes.length)) {
          fail();
          return;
        }
        paint(usable);
      });
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
