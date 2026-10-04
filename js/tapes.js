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
    if (st && st.playing && st.track && st.track.id === id) {
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

  function cardHtml(t) {
    var cover = t.cover || "";
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
        ? '<img src="' + esc(cover) + '" alt="" width="500" height="500" loading="lazy"/>'
        : '<span class="tape-sleeve--blank" aria-hidden="true"></span>') +
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
      "</p></div></article>"
    );
  }

  function emptyHtml() {
    return (
      '<p class="mix-soon">No mixes yet.</p>' +
      '<p class="tape-dek" style="text-align:center"><a class="tape-link" href="https://soundcloud.com/ltdrifta" rel="noopener noreferrer" target="_blank">soundcloud.com/ltdrifta</a></p>'
    );
  }

  // Day = chill / variety. Night = heavier / dance.
  // A tape can pin itself with slot: "day" | "night" in the feed data; otherwise the first
  // matching rule wins and anything unmatched lands in Day. Edit NIGHT_RULES to re-sort.
  var NIGHT_RULES = [/loft music/i, /deep in the club/i, /pirate radio/i];

  function slotOf(t) {
    var pinned = String((t && t.slot) || "").toLowerCase();
    if (pinned === "day" || pinned === "night") return pinned;
    var hay = String((t && t.title) || "") + " " + String((t && t.dek) || "");
    for (var i = 0; i < NIGHT_RULES.length; i++) {
      if (NIGHT_RULES[i].test(hay)) return "night";
    }
    return "day";
  }

  function albumKey(t) {
    var cover = String((t && t.cover) || "").replace(/-t\d+x\d+(\.[a-z0-9]+)$/i, "$1");
    if (cover) return "c:" + cover;
    var dek = String((t && t.dek) || "").trim().toLowerCase();
    if (dek) return "d:" + dek;
    var title = String((t && t.title) || "").toLowerCase();
    if (/^loft music/.test(title)) return "t:loft";
    if (/^volume\b/.test(title)) return "t:volume";
    if (/^pirate radio/.test(title)) return "t:pirate";
    return "t:" + title.replace(/[\s(].*$/, "");
  }

  function gridCols(grid) {
    if (grid.classList.contains("tapes-grid--home")) {
      if (window.matchMedia("(min-width: 760px)").matches) return 4;
      if (window.matchMedia("(min-width: 640px)").matches) return 3;
      return 2;
    }
    if (window.matchMedia("(min-width: 860px)").matches) return 3;
    return 2;
  }

  function mixByAlbum(tapes, limit, cols, maxSame) {
    var list = tapes || [];
    var cap = maxSame > 0 ? maxSame : 2;
    var row = cols > 0 ? cols : 4;
    var max = limit > 0 ? Math.min(limit, list.length) : list.length;
    var groups = {};
    var keys = [];
    var i;
    for (i = 0; i < list.length; i++) {
      var t = list[i];
      var k = albumKey(t);
      if (!groups[k]) {
        groups[k] = [];
        keys.push(k);
      }
      groups[k].push(t);
    }
    var cursor = {};
    for (i = 0; i < keys.length; i++) cursor[keys[i]] = 0;

    function remaining(k) {
      return cursor[k] < groups[k].length;
    }

    function countInRow(out, key) {
      var start = Math.floor(out.length / row) * row;
      var n = 0;
      var j;
      for (j = start; j < out.length; j++) {
        if (albumKey(out[j]) === key) n += 1;
      }
      return n;
    }

    function take(out, key) {
      out.push(groups[key][cursor[key]]);
      cursor[key] += 1;
    }

    var out = [];
    var guard = 0;
    while (out.length < max && guard < max * 8) {
      guard += 1;
      var picked = "";
      var bestScore = 1e9;
      var r;
      for (r = 0; r < keys.length; r++) {
        var idx = (out.length + r) % keys.length;
        var key = keys[idx];
        if (!remaining(key)) continue;
        var inRow = countInRow(out, key);
        if (inRow >= cap) continue;
        var score = inRow * 100 + cursor[key];
        if (score < bestScore) {
          bestScore = score;
          picked = key;
        }
      }
      if (!picked) break;
      take(out, picked);
    }
    return out;
  }

  function paint(tapes) {
    lastTapes = tapes;
    var grids = document.querySelectorAll("[data-tapes-grid]");
    if (!grids.length) return;
    grids.forEach(function (grid) {
      var limit = parseInt(grid.getAttribute("data-tapes-limit") || "0", 10);
      var mix = grid.getAttribute("data-tapes-mix");
      var slot = grid.getAttribute("data-tapes-slot");
      var panel = slot ? grid.closest("[data-tapes-panel]") : null;
      var pool = slot
        ? tapes.filter(function (t) {
            return slotOf(t) === slot;
          })
        : tapes;
      var slice;
      if (mix) {
        var cap = parseInt(grid.getAttribute("data-tapes-row-cap") || "2", 10);
        slice = mixByAlbum(pool, limit, gridCols(grid), cap);
      } else {
        slice = limit > 0 ? pool.slice(0, limit) : pool;
      }
      if (panel) panel.hidden = !slice.length;
      if (!slice.length) {
        if (!panel) grid.innerHTML = emptyHtml();
        return;
      }
      grid.innerHTML = slice.map(cardHtml).join("");
      bind(grid);
    });
    syncButtons();
  }

  function hydrate() {
    nowEl = $("[data-tapes-now]");
    if (!$("[data-tapes-grid]")) return;
    loadList(function (tapes) {
      paint(
        (tapes || []).filter(function (t) {
          return t && t.permalink;
        })
      );
    });
  }

  window.addEventListener("vcr:player", function () {
    syncButtons();
  });

  hydrate();
})();
