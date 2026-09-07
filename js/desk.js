/* Club Copy — Discman on the bedroom desk still-life. */
(function () {
  "use strict";

  var desk = document.querySelector("[data-desk]");
  if (!desk) return;

  var RELEASE = desk.getAttribute("data-play-release") || "bridget-in-my-room";
  var playBtn = desk.querySelector("[data-desk-play]");
  var prevBtn = desk.querySelector("[data-desk-prev]");
  var nextBtn = desk.querySelector("[data-desk-next]");
  var lcdMode = desk.querySelector("[data-desk-lcd-mode]");
  var lcdTitle = desk.querySelector("[data-desk-lcd-title]");

  function state() {
    return window.VCRPlayer && VCRPlayer.getState ? VCRPlayer.getState() : null;
  }

  function isThis(track) {
    return !!(track && track.releaseId === RELEASE);
  }

  function sync(detail) {
    var d = detail || state() || {};
    var track = d.track;
    var mine = isThis(track);
    var playing = !!(mine && d.playing);
    desk.classList.toggle("is-playing", playing);
    if (playBtn) {
      playBtn.classList.toggle("is-on", playing);
      playBtn.setAttribute("aria-label", playing ? "Pause Bridget In My Room" : "Play Bridget In My Room");
    }
    if (lcdMode) lcdMode.textContent = playing ? "PLAY" : "STOP";
    if (lcdTitle) {
      lcdTitle.textContent = mine && track && track.title ? track.title : "BRIDGET";
    }
  }

  function play() {
    if (!window.VCRPlayer) return;
    var s = state();
    if (s && isThis(s.track)) {
      VCRPlayer.toggle();
      return;
    }
    VCRPlayer.playRelease(RELEASE, null, { autoplay: true, stage: false });
  }

  if (playBtn) {
    playBtn.addEventListener("click", function (e) {
      e.preventDefault();
      play();
    });
  }
  if (prevBtn) {
    prevBtn.addEventListener("click", function (e) {
      e.preventDefault();
      var s = state();
      if (s && isThis(s.track) && window.VCRPlayer) VCRPlayer.prev();
      else play();
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener("click", function (e) {
      e.preventDefault();
      var s = state();
      if (s && isThis(s.track) && window.VCRPlayer) VCRPlayer.next();
      else play();
    });
  }

  window.addEventListener("vcr:player", function (e) {
    sync(e.detail);
  });
  sync();
})();
