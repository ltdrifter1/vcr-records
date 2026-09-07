/* Club Copy — Sony CD Walkman on the Y2K chrome desk still-life. */
(function () {
  "use strict";

  var desk = document.querySelector("[data-desk]");
  if (!desk) return;

  var RELEASE = desk.getAttribute("data-play-release") || "bridget-in-my-room";
  var playBtn = desk.querySelector("[data-desk-play]");
  var prevBtn = desk.querySelector("[data-desk-prev]");
  var nextBtn = desk.querySelector("[data-desk-next]");
  var stopBtn = desk.querySelector("[data-desk-stop]");
  var volDown = desk.querySelector("[data-desk-vol-down]");
  var volUp = desk.querySelector("[data-desk-vol-up]");
  var lcdMode = desk.querySelector("[data-desk-lcd-mode]");
  var lcdTitle = desk.querySelector("[data-desk-lcd-title]");
  var lcdTrack = desk.querySelector("[data-desk-lcd-track]");
  var lcdTime = desk.querySelector("[data-desk-lcd-time]");

  function state() {
    return window.VCRPlayer && VCRPlayer.getState ? VCRPlayer.getState() : null;
  }

  function isThis(track) {
    return !!(track && track.releaseId === RELEASE);
  }

  function pad3(n) {
    n = Math.max(1, Number(n) || 1);
    return n < 10 ? "00" + n : n < 100 ? "0" + n : String(n);
  }

  function trackNo(track) {
    if (!track) return "001";
    var id = String(track.id || "");
    var m = id.match(/(\d+)$/);
    if (m) return pad3(parseInt(m[1], 10));
    return "001";
  }

  function fmtTime(s) {
    s = Math.max(0, Math.floor(Number(s) || 0));
    var m = Math.floor(s / 60);
    var r = s % 60;
    return m + ":" + (r < 10 ? "0" : "") + r;
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
    if (lcdMode) lcdMode.textContent = playing ? "▶" : "";
    if (lcdTitle) lcdTitle.textContent = "BRIDGET";
    if (lcdTrack) lcdTrack.textContent = mine ? trackNo(track) : "001";
    if (lcdTime) lcdTime.textContent = mine ? fmtTime(d.currentTime) : "0:00";
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

  function nudgeVol(delta) {
    if (!window.VCRPlayer || !VCRPlayer.getVolume || !VCRPlayer.setVolume) return;
    VCRPlayer.setVolume(VCRPlayer.getVolume() + delta);
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
  if (stopBtn) {
    stopBtn.addEventListener("click", function (e) {
      e.preventDefault();
      var s = state();
      if (s && isThis(s.track) && window.VCRPlayer && VCRPlayer.pause) VCRPlayer.pause();
    });
  }
  if (volDown) {
    volDown.addEventListener("click", function (e) {
      e.preventDefault();
      nudgeVol(-0.1);
    });
  }
  if (volUp) {
    volUp.addEventListener("click", function (e) {
      e.preventDefault();
      nudgeVol(0.1);
    });
  }

  window.addEventListener("vcr:player", function (e) {
    sync(e.detail);
  });
  sync();
})();
