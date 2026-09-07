/* Club Copy — Walkman + Rio on the Y2K chrome desk still-life. */
(function () {
  "use strict";

  var desk = document.querySelector("[data-desk]");
  if (!desk) return;

  var options = desk.querySelectorAll("[data-desk-option]");
  if (!options.length) return;

  var sleeveLink = desk.querySelector("[data-desk-sleeve-link]");
  var sleeveImg = desk.querySelector("[data-desk-sleeve-img]");
  var cardCat = desk.querySelector("[data-desk-card-cat]");
  var cardLink = desk.querySelector("[data-desk-card-link]");
  var cardSub = desk.querySelector("[data-desk-card-sub]");

  function state() {
    return window.VCRPlayer && VCRPlayer.getState ? VCRPlayer.getState() : null;
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

  function releaseOf(opt) {
    return opt.getAttribute("data-desk-release") || opt.getAttribute("data-play-release") || "";
  }

  function titleOf(opt) {
    return opt.getAttribute("data-title") || "";
  }

  function lcdLabel(opt) {
    return opt.getAttribute("data-lcd-title") || titleOf(opt).toUpperCase().slice(0, 10);
  }

  function isThis(opt, track) {
    return !!(track && track.releaseId === releaseOf(opt));
  }

  function activeOption() {
    return desk.querySelector("[data-desk-option].is-active") || options[0];
  }

  function showOption(opt) {
    if (!opt) return;
    for (var i = 0; i < options.length; i++) {
      options[i].classList.toggle("is-active", options[i] === opt);
    }
    var page = opt.getAttribute("data-page") || "#";
    var cover = opt.getAttribute("data-cover") || "";
    var title = titleOf(opt);
    var artist = opt.getAttribute("data-artist") || "";
    if (sleeveLink) sleeveLink.setAttribute("href", page);
    if (sleeveImg) {
      sleeveImg.setAttribute("src", cover);
      sleeveImg.setAttribute("alt", title + " — " + artist);
    }
    if (cardCat) cardCat.textContent = opt.getAttribute("data-cat") || "";
    if (cardLink) {
      cardLink.setAttribute("href", page);
      cardLink.textContent = title;
    }
    if (cardSub) cardSub.textContent = opt.getAttribute("data-sub") || "";
  }

  function syncOption(opt, detail) {
    var d = detail || state() || {};
    var track = d.track;
    var mine = isThis(opt, track);
    var playing = !!(mine && d.playing);
    var title = titleOf(opt);
    opt.classList.toggle("is-playing", playing);
    var playBtn = opt.querySelector("[data-desk-play]");
    if (playBtn) {
      playBtn.classList.toggle("is-on", playing);
      playBtn.setAttribute("aria-label", playing ? "Pause " + title : "Play " + title);
    }
    var lcdMode = opt.querySelector("[data-desk-lcd-mode]");
    var lcdTitle = opt.querySelector("[data-desk-lcd-title]");
    var lcdTrack = opt.querySelector("[data-desk-lcd-track]");
    var lcdTime = opt.querySelector("[data-desk-lcd-time]");
    if (lcdMode) lcdMode.textContent = playing ? "▶" : "";
    if (lcdTitle) lcdTitle.textContent = lcdLabel(opt);
    if (lcdTrack) lcdTrack.textContent = mine ? trackNo(track) : "001";
    if (lcdTime) lcdTime.textContent = mine ? fmtTime(d.currentTime) : "0:00";
  }

  function sync(detail) {
    var d = detail || state() || {};
    var anyPlaying = false;
    for (var i = 0; i < options.length; i++) {
      syncOption(options[i], d);
      if (options[i].classList.contains("is-playing")) anyPlaying = true;
    }
    desk.classList.toggle("is-playing", anyPlaying);
    if (d.playing && d.track) {
      for (var j = 0; j < options.length; j++) {
        if (isThis(options[j], d.track)) {
          showOption(options[j]);
          break;
        }
      }
    }
  }

  function play(opt) {
    if (!window.VCRPlayer || !opt) return;
    showOption(opt);
    var release = releaseOf(opt);
    var s = state();
    if (s && isThis(opt, s.track)) {
      VCRPlayer.toggle();
      return;
    }
    VCRPlayer.playRelease(release, null, { autoplay: true, stage: false });
  }

  function nudgeVol(delta) {
    if (!window.VCRPlayer || !VCRPlayer.getVolume || !VCRPlayer.setVolume) return;
    VCRPlayer.setVolume(VCRPlayer.getVolume() + delta);
  }

  function bindOption(opt) {
    var playBtn = opt.querySelector("[data-desk-play]");
    var prevBtn = opt.querySelector("[data-desk-prev]");
    var nextBtn = opt.querySelector("[data-desk-next]");
    var stopBtn = opt.querySelector("[data-desk-stop]");
    var volDown = opt.querySelector("[data-desk-vol-down]");
    var volUp = opt.querySelector("[data-desk-vol-up]");

    opt.addEventListener("click", function (e) {
      if (e.target.closest("a, button")) return;
      showOption(opt);
    });

    if (playBtn) {
      playBtn.addEventListener("click", function (e) {
        e.preventDefault();
        play(opt);
      });
    }
    if (prevBtn) {
      prevBtn.addEventListener("click", function (e) {
        e.preventDefault();
        var s = state();
        if (s && isThis(opt, s.track) && window.VCRPlayer) VCRPlayer.prev();
        else play(opt);
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener("click", function (e) {
        e.preventDefault();
        var s = state();
        if (s && isThis(opt, s.track) && window.VCRPlayer) VCRPlayer.next();
        else play(opt);
      });
    }
    if (stopBtn) {
      stopBtn.addEventListener("click", function (e) {
        e.preventDefault();
        var s = state();
        if (s && isThis(opt, s.track) && window.VCRPlayer && VCRPlayer.pause) VCRPlayer.pause();
      });
    }
    if (volDown) {
      volDown.addEventListener("click", function (e) {
        e.preventDefault();
        showOption(opt);
        nudgeVol(-0.1);
      });
    }
    if (volUp) {
      volUp.addEventListener("click", function (e) {
        e.preventDefault();
        showOption(opt);
        nudgeVol(0.1);
      });
    }
  }

  for (var i = 0; i < options.length; i++) bindOption(options[i]);

  window.addEventListener("vcr:player", function (e) {
    sync(e.detail);
  });
  showOption(activeOption());
  sync();
})();
