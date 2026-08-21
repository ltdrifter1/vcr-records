/**
 * Bind a release page console to the shared VCRPlayer.
 * Removes the need for a second local Audio engine.
 *
 * Usage:
 *   VCRReleaseBind({ releaseId: 'together', tracks: [{ id, title }, ...] });
 *   VCRReleaseBind({ releaseId: 'need-you', tracks: [...], displayOnly: true });
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
    if (!opts || !opts.releaseId) return;
    var displayOnly = !!opts.displayOnly;
    if (!displayOnly && !window.VCRPlayer) return;

    var RELEASE_ID = opts.releaseId;
    var TRACKS = opts.tracks || [];
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

    function pad2(n) {
      return String(n).padStart(2, "0");
    }

    function setMsg(t, err) {
      if (!pMsg) return;
      pMsg.textContent = t || "";
      pMsg.className = "p-msg" + (err ? " err" : "");
    }

    function setPlaying(on) {
      if (playBtn) playBtn.classList.toggle("on", on);
      var consolePlay = $("ipPlayConsole");
      if (consolePlay) consolePlay.classList.toggle("on", on);
      var disc = $("releaseDisc");
      if (disc) disc.classList.toggle("is-spinning", on);
      var art = $("artworkWrap");
      if (art) art.classList.toggle("is-playing", on);
      var consoleEl = document.querySelector(".release-console");
      if (consoleEl) consoleEl.classList.toggle("is-live", on);
      trackRows.forEach(function (r, i) {
        r.classList.toggle("is-playing", !!(on && i === activeIdx));
      });
    }

    function setActive(idx) {
      if (idx < 0 || idx >= TRACKS.length) return;
      activeIdx = idx;
      var title = TRACKS[idx].title || "";
      if (trackName) trackName.textContent = title;
      /* Track title lives on the cassette acetate label */
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
      });
    }

    function trackIdAt(idx) {
      return TRACKS[idx] && TRACKS[idx].id ? TRACKS[idx].id : null;
    }

    function playAt(idx) {
      if (!TRACKS[idx] || TRACKS[idx].locked) return;
      setActive(idx);
      if (displayOnly) {
        setMsg(opts.displayMessage || "Full track after checkout.");
        return;
      }
      setMsg("Loading…");
      VCRPlayer.playRelease(RELEASE_ID, trackIdAt(idx), { autoplay: true }).then(function () {
        setMsg("");
      }).catch(function () {
        setMsg("Could not play this track.", true);
      });
    }

    function toggleOrStart() {
      if (displayOnly) {
        playAt(activeIdx);
        return;
      }
      var cur = VCRPlayer.current && VCRPlayer.current();
      if (cur && cur.releaseId === RELEASE_ID) VCRPlayer.toggle();
      else playAt(activeIdx);
    }

    if (playBtn) playBtn.addEventListener("click", toggleOrStart);

    var consolePlay = $("ipPlayConsole");
    if (consolePlay) consolePlay.addEventListener("click", toggleOrStart);

    var prev = $("ipPrev");
    if (prev) {
      prev.addEventListener("click", function () {
        if (displayOnly) {
          playAt(Math.max(0, activeIdx - 1));
          return;
        }
        var cur = VCRPlayer.current && VCRPlayer.current();
        if (cur && cur.releaseId === RELEASE_ID) VCRPlayer.prev();
        else playAt(Math.max(0, activeIdx - 1));
      });
    }

    var next = $("ipNext");
    if (next) {
      next.addEventListener("click", function () {
        if (displayOnly) {
          if (activeIdx < TRACKS.length - 1) playAt(activeIdx + 1);
          return;
        }
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
        if (!displayOnly) VCRPlayer.seek(+seekEl.value || 0);
      });
    }

    if (volEl && !displayOnly) {
      try {
        volEl.value = String(VCRPlayer.getVolume());
      } catch (e) {}
      volEl.addEventListener("input", function () {
        VCRPlayer.setVolume(+volEl.value || 0);
      });
    }

    trackRows.forEach(function (row, idx) {
      row.setAttribute("role", "button");
      row.setAttribute("tabindex", "0");
      row.addEventListener("click", function (e) {
        if (e.target.closest(".track-play-btn") || e.currentTarget === row) {
          if (displayOnly) {
            playAt(idx);
            return;
          }
          var cur = VCRPlayer.current && VCRPlayer.current();
          if (idx === activeIdx && cur && cur.releaseId === RELEASE_ID) VCRPlayer.toggle();
          else playAt(idx);
        }
      });
      row.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          row.click();
        }
      });
    });

    if (!displayOnly) {
      window.addEventListener("vcr:player", function (ev) {
        var d = ev.detail || {};
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
          } catch (e) {}
        }
        if (seekEl && d.duration) {
          seekEl.max = String(d.duration);
          if (!dragging) seekEl.value = String(d.currentTime || 0);
        }
        if (elapsedEl) elapsedEl.textContent = fmt(d.currentTime || 0);
        if (remainEl) remainEl.textContent = "-" + fmt((d.duration || 0) - (d.currentTime || 0));
        setMsg("");
      });
    }

    // Prime UI with first track title; don't load a second Audio.
    if (TRACKS.length) setActive(0);
    if (displayOnly && opts.displayMessage) setMsg(opts.displayMessage);
  };
})();
