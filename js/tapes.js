/* Mixtapes — live SoundCloud @ltdrifta, with Bandcamp / local cues as fallback. */
(function () {
  "use strict";

  var audio = null;
  var currentId = "";
  var nowEl = null;
  var widget = null;
  var widgetReady = null;
  var widgetIframe = null;
  var dockEl = null;
  var playingPermalink = "";
  var switching = false;

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
      cb(data && data.tapes ? data.tapes : [], data || {});
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
    document.querySelectorAll("[data-tape-play], .tape-play[data-play-release], .tape-play[data-sc-url]").forEach(function (btn) {
      var live = false;
      if (btn.getAttribute("data-sc-url")) {
        live = btn.getAttribute("data-tape-id") === currentId && playingPermalink === btn.getAttribute("data-sc-url");
      } else if (btn.getAttribute("data-play-release") && window.VCRPlayer && VCRPlayer.current) {
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

  function pauseLocalAudio() {
    if (audio && !audio.paused) audio.pause();
  }

  function pauseBandcamp() {
    if (window.VCRPlayer && VCRPlayer.pause) VCRPlayer.pause();
  }

  function loadWidgetApi() {
    if (window.SC && window.SC.Widget) return Promise.resolve();
    if (widgetReady) return widgetReady;
    widgetReady = new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = "https://w.soundcloud.com/player/api.js";
      s.async = true;
      s.onload = function () {
        resolve();
      };
      s.onerror = function () {
        widgetReady = null;
        reject(new Error("widget"));
      };
      document.head.appendChild(s);
    });
    return widgetReady;
  }

  function ensureDock() {
    if (dockEl) return dockEl;
    dockEl = document.createElement("div");
    dockEl.className = "sc-dock";
    dockEl.setAttribute("data-sc-dock", "");
    dockEl.hidden = true;
    dockEl.innerHTML =
      '<p class="sc-dock-now" data-sc-dock-now></p>' +
      '<iframe title="SoundCloud player" allow="autoplay; encrypted-media" scrolling="no" frameborder="no"></iframe>';
    document.body.appendChild(dockEl);
    widgetIframe = dockEl.querySelector("iframe");
    return dockEl;
  }

  function widgetUrl(permalink, autoplay) {
    return (
      "https://w.soundcloud.com/player/?url=" +
      encodeURIComponent(permalink) +
      "&color=%231a1a1a&auto_play=" +
      (autoplay ? "true" : "false") +
      "&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=false"
    );
  }

  function bindWidgetEvents() {
    if (!widget) return;
    widget.bind(SC.Widget.Events.PLAY, function () {
      switching = false;
      playingPermalink = playingPermalink || "";
      if (dockEl) dockEl.hidden = false;
      document.body.classList.add("sc-playing");
      syncButtons();
    });
    widget.bind(SC.Widget.Events.PAUSE, function () {
      if (switching) return;
      document.body.classList.remove("sc-playing");
      currentId = "";
      playingPermalink = "";
      syncButtons();
      if (nowEl) nowEl.hidden = true;
    });
    widget.bind(SC.Widget.Events.FINISH, function () {
      document.body.classList.remove("sc-playing");
      currentId = "";
      playingPermalink = "";
      syncButtons();
      if (nowEl) nowEl.hidden = true;
    });
  }

  function playSoundCloud(btn) {
    var permalink = btn.getAttribute("data-sc-url");
    var id = btn.getAttribute("data-tape-id");
    var title = btn.getAttribute("data-tape-title") || "";
    var dj = btn.getAttribute("data-tape-dj") || "";
    if (!permalink) return;
    if (currentId === id && playingPermalink === permalink) {
      if (widget) widget.toggle();
      return;
    }
    pauseLocalAudio();
    pauseBandcamp();
    switching = true;
    currentId = id;
    playingPermalink = permalink;
    stampNow(title, dj);
    syncButtons();
    ensureDock();
    var nowDock = dockEl.querySelector("[data-sc-dock-now]");
    if (nowDock) nowDock.textContent = title + " — " + dj;
    loadWidgetApi()
      .then(function () {
        if (!widgetIframe) ensureDock();
        if (widget) {
          widget.load(permalink, { auto_play: true });
          dockEl.hidden = false;
          document.body.classList.add("sc-playing");
          return;
        }
        widgetIframe.src = widgetUrl(permalink, true);
        widget = SC.Widget(widgetIframe);
        bindWidgetEvents();
        dockEl.hidden = false;
        document.body.classList.add("sc-playing");
      })
      .catch(function () {
        markPending(id);
        currentId = "";
        playingPermalink = "";
        syncButtons();
      });
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
    if (widget) widget.pause();
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
    if (btn.getAttribute("data-sc-url")) {
      playSoundCloud(btn);
      return;
    }
    if (releaseId && playViaPlayer(btn, releaseId, trackId)) return;
    if (!src) return;
    if (widget) widget.pause();
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
    (root || document).querySelectorAll("[data-tape-play], .tape-play[data-play-release], .tape-play[data-sc-url]").forEach(function (btn) {
      if (btn.getAttribute("data-tape-bound")) return;
      btn.setAttribute("data-tape-bound", "1");
      btn.addEventListener("click", function () {
        playTape(btn);
      });
    });
  }

  function cardHtml(t) {
    var sleeve = t.cover || t._hasCover
      ? '<div class="tape-sleeve mix-sleeve"><img src="' +
        esc(t._cover || t.cover) +
        '" alt="' +
        esc(t.title) +
        " — " +
        esc(t.dj) +
        '" width="500" height="500" loading="lazy"/></div>'
      : '<div class="tape-sleeve tape-sleeve--blank" aria-hidden="true"></div>';
    var playAttrs = "";
    if (t.permalink) {
      playAttrs += ' data-sc-url="' + esc(t.permalink) + '"';
    } else if (t.releaseId) {
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
    var link = t.permalink
      ? '<a class="tape-link" href="' + esc(t.permalink) + '" rel="noopener noreferrer" target="_blank">SoundCloud</a>'
      : t.page
      ? '<a class="tape-link" href="' + esc(t.page) + '">mix</a>'
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
      '<p class="tape-spec">' +
      (t.year ? "<span>" + esc(t.year) + "</span>" : "") +
      (t.runtime ? "<span>" + esc(t.runtime) + "</span>" : "") +
      "</p>" +
      (t.dek ? '<p class="tape-dek">' + esc(t.dek) + "</p>" : "") +
      '<div class="tape-actions">' +
      play +
      link +
      "</div></div></article>"
    );
  }

  function emptyHtml() {
    return (
      '<p class="mix-soon">No mixes yet.</p>' +
      '<p class="tape-dek" style="text-align:center"><a class="tape-link" href="https://soundcloud.com/ltdrifta" rel="noopener noreferrer" target="_blank">soundcloud.com/ltdrifta</a></p>'
    );
  }

  function paint(tapes) {
    var grids = document.querySelectorAll("[data-tapes-grid]");
    if (!grids.length) {
      bind();
      return;
    }
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
  }

  function hydrate() {
    nowEl = $("[data-tapes-now]");
    var grid = $("[data-tapes-grid]");
    if (!grid) {
      bind();
      return;
    }
    loadList(function (tapes) {
      var scTapes = tapes.filter(function (t) {
        return t && (t.permalink || t.cover || t.audio || t.releaseId);
      });
      if (!scTapes.length) {
        var localOnly = tapes.filter(function (t) {
          return t && (t.cover || t.audio || t.releaseId);
        });
        if (!localOnly.length) {
          paint([]);
          bind();
          return;
        }
        Promise.all(
          localOnly.map(function (t) {
            var cover = asset(t.cover);
            var audioSrc = t.audio ? asset(t.audio) : "";
            return Promise.all([
              cover && cover.indexOf("http") !== 0 ? probe(cover) : Promise.resolve(!!cover),
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
          paint(ready.filter(function (t) {
            return t._hasCover || t._hasAudio || t.releaseId;
          }));
        });
        return;
      }
      paint(scTapes);
    });
  }

  window.addEventListener("vcr:player", function (ev) {
    var d = ev.detail || {};
    if (d.playing && widget) widget.pause();
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
    if (!matched && !d.playing && !playingPermalink) {
      currentId = "";
      if (nowEl) nowEl.hidden = true;
    }
    syncButtons();
  });

  hydrate();
})();
