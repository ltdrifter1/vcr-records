/* Mixtapes — play Bandcamp cues through VCRPlayer, with local /tapes as fallback. */
(function () {
  "use strict";

  var audio = null;
  var currentId = "";
  var nowEl = null;

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
    fetch(asset("data/mixtapes.json"), { credentials: "same-origin" })
      .then(function (r) {
        return r.ok ? r.json() : null;
      })
      .then(function (data) {
        cb(data && data.tapes ? data.tapes : []);
      })
      .catch(function () {
        cb([]);
      });
  }

  function probe(url) {
    return fetch(url, {
      method: "GET",
      headers: { Range: "bytes=0-0" },
      credentials: "same-origin"
    }).then(function (r) {
      return r.ok || r.status === 206;
    }).catch(function () {
      return false;
    });
  }

  function ensureAudio() {
    if (audio) return audio;
    audio = new Audio();
    audio.addEventListener("ended", function () {
      currentId = "";
      syncButtons();
      if (nowEl) nowEl.hidden = true;
    });
    audio.addEventListener("error", function () {
      markPending(currentId);
      currentId = "";
      syncButtons();
    });
    return audio;
  }

  function markPending(id) {
    document.querySelectorAll('.tape-play[data-tape-id="' + id + '"]').forEach(function (btn) {
      btn.classList.add("is-pending");
      btn.disabled = true;
      btn.textContent = "unavailable";
    });
  }

  function syncButtons() {
    document.querySelectorAll("[data-tape-play], .tape-play[data-play-release]").forEach(function (btn) {
      var live = false;
      if (btn.getAttribute("data-play-release") && window.VCRPlayer && VCRPlayer.current) {
        var t = VCRPlayer.current();
        var st = VCRPlayer.getState && VCRPlayer.getState();
        var releaseId = btn.getAttribute("data-play-release");
        var trackId = btn.getAttribute("data-play-track") || "";
        live = !!(t && t.releaseId === releaseId && (!trackId || t.id === trackId) && st && st.playing);
      } else {
        live = btn.getAttribute("data-tape-id") === currentId && audio && !audio.paused;
      }
      btn.classList.toggle("is-live", !!live);
      if (!btn.disabled) btn.textContent = live ? "pause" : "play";
    });
  }

  function stampNow(title, dj) {
    if (!nowEl) return;
    nowEl.hidden = false;
    nowEl.textContent = title + " — " + dj;
  }

  function playViaPlayer(btn, releaseId, trackId) {
    if (!window.VCRPlayer || !VCRPlayer.playRelease) return false;
    var id = btn.getAttribute("data-tape-id") || releaseId;
    var title = btn.getAttribute("data-tape-title") || "";
    var dj = btn.getAttribute("data-tape-dj") || "";
    var cur = VCRPlayer.current && VCRPlayer.current();
    var playing = !!(VCRPlayer.getState && VCRPlayer.getState().playing);
    if (cur && cur.releaseId === releaseId && (!trackId || cur.id === trackId) && playing) {
      VCRPlayer.toggle();
      currentId = "";
      syncButtons();
      if (nowEl) nowEl.hidden = true;
      return true;
    }
    currentId = id;
    stampNow(title, dj);
    syncButtons();
    VCRPlayer.playRelease(releaseId, trackId || null, { autoplay: true }).then(function (queued) {
      if (!queued) {
        markPending(id);
        currentId = "";
        syncButtons();
        return;
      }
      syncButtons();
    }).catch(function () {
      markPending(id);
      currentId = "";
      syncButtons();
    });
    return true;
  }

  function playTape(btn) {
    var releaseId = btn.getAttribute("data-play-release");
    var trackId = btn.getAttribute("data-play-track") || "";
    var src = btn.getAttribute("data-tape-play");
    var id = btn.getAttribute("data-tape-id");
    var title = btn.getAttribute("data-tape-title") || "";
    var dj = btn.getAttribute("data-tape-dj") || "";
    if (btn.disabled) return;
    if (releaseId && playViaPlayer(btn, releaseId, trackId)) return;
    if (!src) return;
    var a = ensureAudio();
    if (currentId === id && !a.paused) {
      a.pause();
      currentId = "";
      syncButtons();
      if (nowEl) nowEl.hidden = true;
      return;
    }
    currentId = id;
    a.src = src;
    a.play()
      .then(function () {
        stampNow(title, dj);
        syncButtons();
      })
      .catch(function () {
        markPending(id);
        currentId = "";
        syncButtons();
      });
  }

  function bind(root) {
    (root || document).querySelectorAll("[data-tape-play], .tape-play[data-play-release]").forEach(function (btn) {
      if (btn.getAttribute("data-tape-bound")) return;
      btn.setAttribute("data-tape-bound", "1");
      btn.addEventListener("click", function () {
        playTape(btn);
      });
    });
  }

  function cardHtml(t) {
    var sleeve = t._hasCover
      ? '<div class="tape-sleeve mix-sleeve"><img src="' +
        esc(t._cover) +
        '" alt="' +
        esc(t.title) +
        " — " +
        esc(t.dj) +
        '" width="1400" height="1400" loading="lazy"/></div>'
      : '<div class="tape-sleeve tape-sleeve--blank" aria-hidden="true"></div>';
    var playAttrs = "";
    if (t.releaseId) {
      playAttrs += ' data-play-release="' + esc(t.releaseId) + '"';
      if (t.trackId) playAttrs += ' data-play-track="' + esc(t.trackId) + '"';
    } else if (t.audio) {
      playAttrs += ' data-tape-play="' + esc(t._audio || asset(t.audio)) + '"';
    }
    var play = playAttrs
      ? '<button type="button" class="tape-play"' +
        playAttrs +
        ' data-tape-id="' +
        esc(t.id) +
        '" data-tape-title="' +
        esc(t.title) +
        '" data-tape-dj="' +
        esc(t.dj) +
        '">play</button>'
      : "";
    var link = t.page
      ? '<a class="tape-link" href="' + esc(t.page) + '">release</a>'
      : "";
    return (
      '<article class="mix-card tape" data-tape="' +
      esc(t.id) +
      '">' +
      sleeve +
      '<div class="mix-body">' +
      '<p class="mix-lcd">Mix</p>' +
      '<h3 class="tape-title mix-title">' +
      esc(t.title) +
      "</h3>" +
      '<em class="tape-dj">' +
      esc(t.dj) +
      "</em>" +
      '<p class="tape-spec"><span>' +
      esc(t.year) +
      "</span><span>" +
      esc(t.runtime) +
      "</span></p>" +
      (t.dek ? '<p class="tape-dek">' + esc(t.dek) + "</p>" : "") +
      '<div class="tape-actions">' +
      play +
      link +
      "</div></div></article>"
    );
  }

  function hydrate() {
    nowEl = $("[data-tapes-now]");
    var grid = $("[data-tapes-grid]");
    if (!grid) {
      bind();
      return;
    }
    loadList(function (tapes) {
      if (!tapes.length) {
        bind();
        return;
      }
      Promise.all(
        tapes.map(function (t) {
          var cover = asset(t.cover);
          var audioSrc = t.audio ? asset(t.audio) : "";
          return Promise.all([
            probe(cover),
            audioSrc ? probe(audioSrc) : Promise.resolve(false)
          ]).then(function (flags) {
            t._hasCover = flags[0];
            t._hasAudio = flags[1];
            t._cover = cover;
            t._audio = audioSrc;
            return t;
          });
        })
      ).then(function (ready) {
        var live = ready.filter(function (t) {
          return t._hasCover || t._hasAudio || t.releaseId || t.page === "/mixtape";
        });
        if (!live.length) {
          bind();
          return;
        }
        grid.innerHTML = live.map(cardHtml).join("");
        bind(grid);
      });
    });
  }

  window.addEventListener("vcr:player", function (ev) {
    var d = ev.detail || {};
    var t = d.track;
    var matched = false;
    document.querySelectorAll(".tape-play[data-play-release]").forEach(function (btn) {
      var releaseId = btn.getAttribute("data-play-release");
      var trackId = btn.getAttribute("data-play-track") || "";
      var live = !!(t && t.releaseId === releaseId && (!trackId || t.id === trackId) && d.playing);
      if (live) {
        matched = true;
        currentId = btn.getAttribute("data-tape-id") || releaseId;
        stampNow(btn.getAttribute("data-tape-title") || "", btn.getAttribute("data-tape-dj") || "");
      }
    });
    if (!matched && !d.playing) {
      currentId = "";
      if (nowEl) nowEl.hidden = true;
    }
    syncButtons();
  });

  hydrate();
})();
