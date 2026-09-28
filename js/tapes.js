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

  function paint(tapes) {
    lastTapes = tapes;
    var grids = document.querySelectorAll("[data-tapes-grid]");
    if (!grids.length) return;
    grids.forEach(function (grid) {
      var limit = parseInt(grid.getAttribute("data-tapes-limit") || "0", 10);
      var slice = limit > 0 ? tapes.slice(0, limit) : tapes;
      if (!slice.length) {
        grid.innerHTML = emptyHtml();
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
