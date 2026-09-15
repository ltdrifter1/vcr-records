/**
 * Bind a release page console to the shared VCRPlayer.
 * Removes the need for a second local Audio engine.
 *
 * Usage:
 *   VCRReleaseBind({ releaseId: 'the-process', tracks: [{ id, title }, ...] });
 */
(function () {
  "use strict";

  function fmt(s) {
    s = Math.max(0, Math.floor(isFinite(s) ? s : 0));
    return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
  }

  function $(id) {
    return document.getElementById(id);
  }

  window.VCRReleaseBind = function (opts) {
    if (!opts || !opts.releaseId || !window.VCRPlayer) return;

    var RELEASE_ID = opts.releaseId;
    var TRACKS = (opts.tracks || []).map(function (t) {
      return Object.assign({}, t);
    });
    var dragging = false;
    var activeIdx = 0;

    var playBtn = $("ipPlay");
    var seekEl = $("ipSeek");
    var volEl = $("ipVolume");
    var elapsedEl = $("ipElapsed");
    var remainEl = $("ipRemaining");
    var trackName = $("ipTrackName");
    var trackIndex = $("ipTrackIndex");
    var artistEl = $("ipArtist");
    var releaseEl = $("ipRelease");
    var pMsg = $("pMsg");
    var trackRows = Array.prototype.slice.call(document.querySelectorAll(".track-row"));
    var consolePlay = $("ipPlayConsole");
    var deck = document.querySelector(".release-console") || document.querySelector(".ra-deck");

    function pad2(n) {
      return String(n).padStart(2, "0");
    }

    function setMsg(t, err) {
      if (!pMsg) return;
      pMsg.textContent = t || "";
      pMsg.className = "p-msg" + (err ? " err" : "");
    }

    function hasPreview(tr) {
      return !!(tr && tr.locked !== true);
    }

    function firstPlayable() {
      var i;
      for (i = 0; i < TRACKS.length; i++) {
        if (hasPreview(TRACKS[i])) return i;
      }
      return TRACKS.length ? 0 : -1;
    }

    function ensurePauseIcon(btn) {
      if (!btn || btn.querySelector(".i-pause")) return;
      var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("class", "i-pause");
      svg.setAttribute("viewBox", "0 0 24 24");
      svg.setAttribute("aria-hidden", "true");
      var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", "M7 5h3.4v14H7zm6.6 0H17v14h-3.4z");
      svg.appendChild(path);
      btn.appendChild(svg);
    }

    function ensureVolume() {
      if (volEl) return volEl;
      var wrap = document.querySelector(".ra-stereo-vol");
      if (!wrap) return null;
      wrap.removeAttribute("aria-hidden");
      var input = document.createElement("input");
      input.id = "ipVolume";
      input.type = "range";
      input.min = "0";
      input.max = "1";
      input.step = "0.01";
      input.value = "0.8";
      input.setAttribute("aria-label", "Volume");
      wrap.appendChild(input);
      volEl = input;
      return volEl;
    }

    function setPlaying(on) {
      if (playBtn) playBtn.classList.toggle("on", on);
      if (consolePlay) {
        consolePlay.classList.toggle("on", on);
        consolePlay.setAttribute("aria-label", on ? "Pause" : "Play");
      }
      if (deck) deck.classList.toggle("is-live", on);
      var disc = $("releaseDisc");
      if (disc) disc.classList.toggle("is-spinning", on);
      var art = $("artworkWrap");
      if (art) art.classList.toggle("is-playing", on);
      var times = document.querySelector(".ra-vfd-times");
      if (times) {
        times.innerHTML = on
          ? "<span>PLAY</span><span>90s</span>"
          : "<span>READY</span><span>STOP</span>";
        times.classList.toggle("ra-vfd-times--idle", !on);
      }
      var hero = document.querySelector(".ra-hero");
      if (hero) hero.classList.toggle("is-live", on);
      trackRows.forEach(function (r, i) {
        r.classList.toggle("is-playing", !!(on && i === activeIdx));
      });
    }

    function setActive(idx) {
      if (idx < 0 || idx >= TRACKS.length) return;
      activeIdx = idx;
      var title = TRACKS[idx].title || "";
      if (trackName) trackName.textContent = title;
      var stampTitle = document.getElementById("ipStampTitle");
      if (stampTitle) stampTitle.textContent = title;
      var stampSide = document.getElementById("ipStampSide");
      if (stampSide) {
        var side = TRACKS[idx].side;
        if (!side) {
          var half = Math.ceil(TRACKS.length / 2) || 1;
          side = idx < half ? "A" : "B";
        }
        stampSide.textContent = "Side " + side;
      }
      if (trackIndex) {
        trackIndex.textContent = pad2(idx + 1) + " / " + pad2(TRACKS.length);
      }
      trackRows.forEach(function (r, i) {
        r.classList.toggle("is-active", i === idx);
        r.classList.toggle("is-locked", !hasPreview(TRACKS[i]));
      });
    }

    function trackIdAt(idx) {
      return TRACKS[idx] && TRACKS[idx].id ? TRACKS[idx].id : null;
    }

    function playAt(idx) {
      if (idx < 0 || !TRACKS[idx]) return;
      if (!hasPreview(TRACKS[idx])) {
        setMsg("No preview on this cue — full track after checkout.");
        return;
      }
      setActive(idx);
      setMsg("Loading…");
      VCRPlayer.playRelease(RELEASE_ID, trackIdAt(idx), { autoplay: true }).then(function (queued) {
        if (queued) setMsg("90s preview · full file after checkout.");
        else setMsg("Could not play this track.", true);
      }).catch(function () {
        setMsg("Could not play this track.", true);
      });
    }

    function toggleOrStart() {
      var cur = VCRPlayer.current && VCRPlayer.current();
      if (cur && cur.releaseId === RELEASE_ID) {
        VCRPlayer.toggle();
        return;
      }
      var idx = hasPreview(TRACKS[activeIdx]) ? activeIdx : firstPlayable();
      playAt(idx);
    }

    function mergeCatalog(data) {
      if (!data || !data.releases) return;
      var release = null;
      var i;
      for (i = 0; i < data.releases.length; i++) {
        if (data.releases[i].id === RELEASE_ID) {
          release = data.releases[i];
          break;
        }
      }
      if (!release || !release.tracks) return;
      TRACKS.forEach(function (local) {
        var cat = release.tracks.find(function (t) {
          return t.id === local.id || t.title === local.title;
        });
        if (!cat) {
          local.locked = true;
          return;
        }
        if (cat.preview) local.preview = cat.preview;
        local.locked = !cat.preview;
      });
      trackRows.forEach(function (r, idx) {
        r.classList.toggle("is-locked", !hasPreview(TRACKS[idx]));
      });
      var playable = TRACKS.filter(hasPreview).length;
      var note = document.querySelector(".ra-tracks-note");
      if (note && playable && playable < TRACKS.length) {
        if (note.textContent.indexOf("preview") < 0) {
          note.textContent = note.textContent.replace(/· files after checkout/, "· 90s preview on available cues · files after checkout");
        }
      }
    }

    ensurePauseIcon(consolePlay);
    ensurePauseIcon(playBtn);
    volEl = ensureVolume();
    var mode = document.querySelector(".ra-vfd-mode");
    if (mode) mode.textContent = "PREVIEW";

    if (playBtn) playBtn.addEventListener("click", toggleOrStart);
    if (consolePlay) consolePlay.addEventListener("click", toggleOrStart);

    var prev = $("ipPrev");
    if (prev) {
      prev.addEventListener("click", function () {
        var cur = VCRPlayer.current && VCRPlayer.current();
        if (cur && cur.releaseId === RELEASE_ID) VCRPlayer.prev();
        else playAt(Math.max(0, activeIdx - 1));
      });
    }

    var next = $("ipNext");
    if (next) {
      next.addEventListener("click", function () {
        var cur = VCRPlayer.current && VCRPlayer.current();
        if (cur && cur.releaseId === RELEASE_ID) VCRPlayer.next(true);
        else if (activeIdx < TRACKS.length - 1) playAt(activeIdx + 1);
      });
    }

    if (seekEl) {
      seekEl.addEventListener("pointerdown", function () {
        dragging = true;
      });
      seekEl.addEventListener("pointerup", function () {
        dragging = false;
      });
      seekEl.addEventListener("input", function () {
        if (elapsedEl) elapsedEl.textContent = fmt(+seekEl.value || 0);
      });
      seekEl.addEventListener("change", function () {
        VCRPlayer.seek(+seekEl.value || 0);
      });
    }

    if (volEl) {
      function syncVolDial() {
        var dial = volEl.closest(".ra-stereo-vol") && volEl.closest(".ra-stereo-vol").querySelector(".ra-stereo-vol-dial");
        if (dial) dial.style.setProperty("--rot", ((+volEl.value || 0) * 240 - 120) + "deg");
      }
      try {
        volEl.value = String(VCRPlayer.getVolume());
      } catch (e) {}
      syncVolDial();
      volEl.addEventListener("input", function () {
        VCRPlayer.setVolume(+volEl.value || 0);
        syncVolDial();
      });
    }

    trackRows.forEach(function (row, idx) {
      row.setAttribute("role", "button");
      row.setAttribute("tabindex", "0");
      row.addEventListener("click", function (e) {
        if (e.target.closest(".track-play-btn") || e.currentTarget === row) {
          var cur = VCRPlayer.current && VCRPlayer.current();
          if (idx === activeIdx && cur && cur.releaseId === RELEASE_ID && hasPreview(TRACKS[idx])) {
            VCRPlayer.toggle();
          } else {
            playAt(idx);
          }
        }
      });
      row.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          row.click();
        }
      });
    });

    window.addEventListener("vcr:player", function (ev) {
      var d = ev.detail || {};
      if (d.error && d.track && d.track.releaseId === RELEASE_ID) {
        setPlaying(false);
        setMsg("Could not play this preview.", true);
        return;
      }
      var t = d.track;
      if (!t || t.releaseId !== RELEASE_ID) {
        setPlaying(false);
        return;
      }
      var idx = TRACKS.findIndex(function (tr) {
        return tr.id === t.id || tr.title === t.title;
      });
      if (idx >= 0) setActive(idx);
      setPlaying(!!d.playing);
      if (artistEl && t.artist) artistEl.textContent = t.artist;
      if (releaseEl && t.releaseTitle) releaseEl.textContent = t.releaseTitle;
      if (volEl) {
        try {
          volEl.value = String(VCRPlayer.getVolume());
          var dial = volEl.closest(".ra-stereo-vol") && volEl.closest(".ra-stereo-vol").querySelector(".ra-stereo-vol-dial");
          if (dial) dial.style.setProperty("--rot", ((+volEl.value || 0) * 240 - 120) + "deg");
        } catch (e) {}
      }
      if (seekEl && d.duration) {
        seekEl.max = String(d.duration);
        if (!dragging) seekEl.value = String(d.currentTime || 0);
      }
      if (elapsedEl) elapsedEl.textContent = fmt(d.currentTime || 0);
      if (remainEl) remainEl.textContent = "-" + fmt((d.duration || 0) - (d.currentTime || 0));
      if (d.playing) setMsg("90s preview · full file after checkout.");
    });

    if (TRACKS.length) setActive(0);

    fetch("/data/catalog.json")
      .then(function (r) {
        return r.ok ? r.json() : null;
      })
      .then(mergeCatalog)
      .catch(function () {});
  };
})();
