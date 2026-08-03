(function () {
  "use strict";

  var STORAGE_KEY = "vcr-player-v1";
  var catalogCache = null;
  var queue = [];
  var index = -1;
  var audio = null;
  var ui = null;
  var stageOpen = false;
  var roomOpen = false;
  var roomBound = false;
  var listenBound = false;
  var inited = false;
  var audioUnlocked = false;
  var playGateTimer = null;

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function loadCatalog() {
    if (catalogCache) return Promise.resolve(catalogCache);
    return fetch("/data/catalog.json")
      .then(function (r) {
        if (!r.ok) throw new Error("catalog");
        return r.json();
      })
      .then(function (data) {
        catalogCache = data;
        return data;
      });
  }

  function persist() {
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          releaseId: queue[index] && queue[index].releaseId,
          trackId: queue[index] && queue[index].id,
          time: audio ? audio.currentTime : 0,
          playing: audio && !audio.paused,
        })
      );
    } catch (e) {}
  }

  function readPersist() {
    try {
      return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "null");
    } catch (e) {
      return null;
    }
  }

  function buildQueueFromRelease(release) {
    return (release.tracks || [])
      .filter(function (t) {
        return t.src;
      })
      .map(function (t) {
        return {
          id: t.id,
          title: t.title,
          src: t.src,
          releaseId: release.id,
          releaseTitle: release.title,
          artist: release.artist,
          cover: release.cover,
          page: release.page,
          bandcampAlbum: release.bandcampAlbum || release.bandcamp,
        };
      });
  }

  function ensureAudio() {
    if (audio) return audio;
    audio = new Audio();
    audio.preload = "metadata";
    audio.volume = 0.8;
    audio.playsInline = true;
    audio.setAttribute("playsinline", "");
    audio.setAttribute("webkit-playsinline", "");
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("play", onPlayState);
    audio.addEventListener("pause", onPlayState);
    audio.addEventListener("loadedmetadata", onTime);
    return audio;
  }

  function unlockAudioFromGesture() {
    ensureAudio();
    if (audioUnlocked) return;
    audioUnlocked = true;
    try {
      var silent = audio.play();
      if (silent && typeof silent.then === "function") {
        silent
          .then(function () {
            if (!queue.length) {
              audio.pause();
              try { audio.currentTime = 0; } catch (e) {}
            }
          })
          .catch(function () {});
      }
    } catch (e) {}
  }

  function bindGestureUnlock() {
    var unlock = function () {
      unlockAudioFromGesture();
      document.removeEventListener("pointerdown", unlock, true);
      document.removeEventListener("touchstart", unlock, true);
      document.removeEventListener("keydown", unlock, true);
    };
    document.addEventListener("pointerdown", unlock, true);
    document.addEventListener("touchstart", unlock, { capture: true, passive: true });
    document.addEventListener("keydown", unlock, true);
  }

  function ensurePlayGate() {
    var el = document.getElementById("vcr-play-gate");
    if (el) return el;
    el = document.createElement("div");
    el.id = "vcr-play-gate";
    el.className = "vcr-play-gate";
    el.setAttribute("role", "status");
    el.innerHTML =
      '<span>Tap to play</span>' +
      '<button type="button" data-gate-play>Play</button>';
    el.querySelector("[data-gate-play]").addEventListener("click", function () {
      hidePlayGate();
      unlockAudioFromGesture();
      play();
    });
    document.body.appendChild(el);
    return el;
  }

  function showPlayGate() {
    var el = ensurePlayGate();
    el.classList.add("is-on");
    clearTimeout(playGateTimer);
    playGateTimer = setTimeout(hidePlayGate, 6000);
  }

  function hidePlayGate() {
    var el = document.getElementById("vcr-play-gate");
    if (el) el.classList.remove("is-on");
    clearTimeout(playGateTimer);
  }

  function safePlay() {
    ensureAudio();
    if (!current()) return Promise.resolve();
    return audio.play().then(function () {
      hidePlayGate();
    }).catch(function (err) {
      var name = err && err.name;
      if (name === "NotAllowedError" || name === "AbortError") showPlayGate();
    });
  }

  function setTogglePlaying(btn, playing) {
    if (!btn) return;
    btn.classList.toggle("is-playing", !!playing);
    btn.setAttribute("aria-label", playing ? "Pause" : "Play");
  }

  function ensureUI() {
    if (ui) return ui;
    var dock = document.createElement("div");
    dock.className = "vcr-player";
    dock.id = "vcr-player";
    dock.setAttribute("role", "region");
    dock.setAttribute("aria-label", "Now playing");
    dock.innerHTML =
      '<button type="button" class="vcr-player__stage-hit" aria-label="Open listening room"></button>' +
      '<img class="vcr-player__art" alt="" width="48" height="48" />' +
      '<div class="vcr-player__meta">' +
      '<p class="vcr-player__title"></p>' +
      '<p class="vcr-player__sub"></p>' +
      "</div>" +
      '<div class="vcr-player__controls">' +
      '<button type="button" class="vcr-player__btn" data-act="prev" aria-label="Previous"><svg class="vcr-ico vcr-ico--prev" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6h2.2v12H6zm3.4 6 8.6 6.2V5.8z"/></svg></button>' +
      '<button type="button" class="vcr-player__btn vcr-player__btn--play" data-act="toggle" aria-label="Play"><svg class="vcr-ico vcr-ico--play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.2v13.6L19.2 12z"/></svg><svg class="vcr-ico vcr-ico--pause" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.4v14H7zm6.6 0H17v14h-3.4z"/></svg></button>' +
      '<button type="button" class="vcr-player__btn" data-act="next" aria-label="Next"><svg class="vcr-ico vcr-ico--next" viewBox="0 0 24 24" aria-hidden="true"><path d="M15.8 6H18v12h-2.2zm-1.2 6L6 5.8v12.4z"/></svg></button>' +
      "</div>" +
      '<div class="vcr-player__progress-wrap">' +
      '<input type="range" class="vcr-player__scrub" min="0" max="1000" value="0" aria-label="Seek" />' +
      '<div class="vcr-player__times"><span data-cur>0:00</span><span data-dur>0:00</span></div>' +
      "</div>" +
      '<a class="vcr-player__buy" href="#" target="_blank" rel="noopener">Buy</a>' +
      '<button type="button" class="vcr-player__btn vcr-player__close" data-act="close" aria-label="Close player">&times;</button>';

    var stage = document.createElement("div");
    stage.className = "vcr-stage";
    stage.id = "vcr-stage";
    stage.hidden = true;
    stage.innerHTML =
      '<div class="vcr-stage__bg" aria-hidden="true"></div>' +
      '<button type="button" class="vcr-stage__close" data-act="stage-close" aria-label="Close stage">&times;</button>' +
      '<div class="vcr-stage__content">' +
      '<img class="vcr-stage__art" alt="" />' +
      '<p class="vcr-stage__kicker">Now playing</p>' +
      '<h2 class="vcr-stage__title"></h2>' +
      '<p class="vcr-stage__artist"></p>' +
      '<div class="vcr-stage__controls">' +
      '<button type="button" class="vcr-stage__btn" data-act="prev" aria-label="Previous"><svg class="vcr-ico vcr-ico--prev" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6h2.2v12H6zm3.4 6 8.6 6.2V5.8z"/></svg></button>' +
      '<button type="button" class="vcr-stage__btn vcr-stage__btn--play" data-act="toggle" aria-label="Play"><svg class="vcr-ico vcr-ico--play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.2v13.6L19.2 12z"/></svg><svg class="vcr-ico vcr-ico--pause" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.4v14H7zm6.6 0H17v14h-3.4z"/></svg></button>' +
      '<button type="button" class="vcr-stage__btn" data-act="next" aria-label="Next"><svg class="vcr-ico vcr-ico--next" viewBox="0 0 24 24" aria-hidden="true"><path d="M15.8 6H18v12h-2.2zm-1.2 6L6 5.8v12.4z"/></svg></button>' +
      "</div>" +
      '<input type="range" class="vcr-stage__scrub" min="0" max="1000" value="0" aria-label="Seek" />' +
      '<div class="vcr-stage__actions">' +
      '<a class="vcr-stage__link" data-page href="#">Album</a>' +
      '<a class="vcr-stage__link" data-buy href="#" target="_blank" rel="noopener">Buy on Bandcamp</a>' +
      "</div>" +
      '<p class="vcr-stage__hint">Space play/pause · ← → seek · Esc close</p>' +
      "</div>";

    document.body.appendChild(dock);
    document.body.appendChild(stage);

    dock.addEventListener("click", onDockClick);
    stage.addEventListener("click", onStageClick);
    dock.querySelector(".vcr-player__scrub").addEventListener("input", onScrub);
    stage.querySelector(".vcr-stage__scrub").addEventListener("input", onScrub);
    document.addEventListener("keydown", onKey);

    ui = { dock: dock, stage: stage };
    return ui;
  }

  function fmt(sec) {
    if (!isFinite(sec) || sec < 0) return "0:00";
    var m = Math.floor(sec / 60);
    var s = Math.floor(sec % 60);
    return m + ":" + (s < 10 ? "0" : "") + s;
  }

  function current() {
    return index >= 0 ? queue[index] : null;
  }

  function getRoom() {
    return document.querySelector("[data-listening-room]");
  }

  function bindRoom(room) {
    if (!room || roomBound) return;
    roomBound = true;
    room.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-act]");
      if (!btn || !room.contains(btn)) return;
      handleAct(btn.getAttribute("data-act"));
    });
    var scrub = room.querySelector("[data-room-scrub]");
    if (scrub) scrub.addEventListener("input", onScrub);
  }

  function renderRoom(track, playing) {
    var room = getRoom();
    if (!room) return;
    bindRoom(room);

    var art = room.querySelector("[data-room-art]");
    var bg = room.querySelector("[data-room-bg]");
    var title = room.querySelector("[data-room-title]");
    var artist = room.querySelector("[data-room-artist]");
    var page = room.querySelector("[data-room-page]");
    var disc = room.querySelector("[data-room-disc]");
    var toggleBtn = room.querySelector('[data-act="toggle"]');

    if (art && track) art.src = track.cover;
    if (bg && track) bg.style.backgroundImage = 'url("' + track.cover + '")';
    if (title && track) title.textContent = track.title;
    if (artist && track) {
      artist.textContent = track.artist + " · " + track.releaseTitle;
    }
    if (page && track) page.href = track.page || "/";
    if (toggleBtn) {
      if (toggleBtn.querySelector(".vcr-ico--play") || toggleBtn.querySelector(".glyph-play")) {
        setTogglePlaying(toggleBtn, playing);
        toggleBtn.classList.toggle("on", !!playing);
      } else {
        toggleBtn.textContent = playing ? "❚❚" : "▶";
        toggleBtn.setAttribute("aria-label", playing ? "Pause" : "Play");
      }
    }
    if (disc) disc.classList.toggle("is-spinning", !!playing);
    room.classList.toggle("is-playing", !!playing);
    room.classList.toggle("is-live", roomOpen);
    room.setAttribute("aria-live", roomOpen ? "polite" : "off");
  }

  function render() {
    ensureUI();
    var track = current();
    var dock = ui.dock;
    var stage = ui.stage;
    var playing = !!(audio && !audio.paused);

    if (!track) {
      dock.classList.remove("is-visible");
      document.body.classList.remove("has-vcr-player");
      closeStage();
      closeRoom();
      renderRoom(null, false);
      return;
    }

    dock.classList.add("is-visible");
    document.body.classList.add("has-vcr-player");

    dock.querySelector(".vcr-player__art").src = track.cover;
    dock.querySelector(".vcr-player__title").textContent = track.title;
    dock.querySelector(".vcr-player__sub").textContent =
      track.artist + " — " + track.releaseTitle;
    var buy = dock.querySelector(".vcr-player__buy");
    buy.href = track.bandcampAlbum || track.page || "#";

    stage.querySelector(".vcr-stage__art").src = track.cover;
    stage.querySelector(".vcr-stage__bg").style.backgroundImage =
      'url("' + track.cover + '")';
    stage.querySelector(".vcr-stage__title").textContent = track.title;
    stage.querySelector(".vcr-stage__artist").textContent =
      track.artist + " · " + track.releaseTitle;
    stage.querySelector("[data-page]").href = track.page || "/";
    stage.querySelector("[data-buy]").href =
      track.bandcampAlbum || track.page || "#";

    setTogglePlaying(dock.querySelector('[data-act="toggle"]'), playing);
    setTogglePlaying(stage.querySelector('[data-act="toggle"]'), playing);

    renderRoom(track, playing);
    updateMediaSession(track, playing);
  }

  function onTime() {
    if (!audio || !ui) return;
    var dur = audio.duration || 0;
    var cur = audio.currentTime || 0;
    var ratio = dur ? Math.round((cur / dur) * 1000) : 0;
    ui.dock.querySelector(".vcr-player__scrub").value = String(ratio);
    ui.stage.querySelector(".vcr-stage__scrub").value = String(ratio);
    ui.dock.querySelector("[data-cur]").textContent = fmt(cur);
    ui.dock.querySelector("[data-dur]").textContent = fmt(dur);
    var room = getRoom();
    if (room) {
      var roomScrub = room.querySelector("[data-room-scrub]");
      if (roomScrub) roomScrub.value = String(ratio);
      var curEl = room.querySelector("[data-room-cur]");
      var durEl = room.querySelector("[data-room-dur]");
      if (curEl) curEl.textContent = fmt(cur);
      if (durEl) durEl.textContent = fmt(dur);
    }
    persist();
    emit();
  }

  function emit() {
    try {
      var track = current();
      window.dispatchEvent(
        new CustomEvent("vcr:player", {
          detail: {
            track: track,
            playing: !!(audio && !audio.paused),
            currentTime: audio ? audio.currentTime : 0,
            duration: audio ? audio.duration || 0 : 0,
            stageOpen: stageOpen,
            roomOpen: roomOpen,
          },
        })
      );
    } catch (e) {}
  }

  function onPlayState() {
    render();
    persist();
    emit();
  }

  function onEnded() {
    next(true);
  }

  function onScrub(e) {
    if (!audio || !audio.duration) return;
    audio.currentTime = (Number(e.target.value) / 1000) * audio.duration;
  }

  function onDockClick(e) {
    var btn = e.target.closest("[data-act]");
    if (btn) {
      handleAct(btn.getAttribute("data-act"));
      return;
    }
    if (e.target.closest(".vcr-player__stage-hit") || e.target.closest(".vcr-player__art") || e.target.closest(".vcr-player__meta")) {
      if (getRoom()) openRoom({ scroll: true });
      else openStage();
    }
  }

  function onStageClick(e) {
    var btn = e.target.closest("[data-act]");
    if (btn) handleAct(btn.getAttribute("data-act"));
  }

  function handleAct(act) {
    if (act === "toggle") toggle();
    else if (act === "prev") prev();
    else if (act === "next") next(true);
    else if (act === "close") stop(true);
    else if (act === "stage-close") closeStage();
    else if (act === "room-close") closeRoom();
  }

  function onKey(e) {
    if (!current()) return;
    var tag = (e.target && e.target.tagName) || "";
    if (tag === "INPUT" || tag === "TEXTAREA" || e.target.isContentEditable) return;
    var immersive = stageOpen || roomOpen;

    if (e.code === "Space" && (immersive || document.body.classList.contains("has-vcr-player"))) {
      e.preventDefault();
      toggle();
    } else if (e.code === "ArrowRight" && immersive) {
      e.preventDefault();
      if (audio) audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 5);
    } else if (e.code === "ArrowLeft" && immersive) {
      e.preventDefault();
      if (audio) audio.currentTime = Math.max(0, audio.currentTime - 5);
    } else if (e.code === "Escape" && roomOpen) {
      closeRoom();
    } else if (e.code === "Escape" && stageOpen) {
      closeStage();
    }
  }

  function updateMediaSession(track, playing) {
    if (!("mediaSession" in navigator) || !track) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.artist,
        album: track.releaseTitle,
        artwork: [{ src: track.cover, sizes: "1200x1200", type: "image/webp" }],
      });
      navigator.mediaSession.playbackState = playing ? "playing" : "paused";
      navigator.mediaSession.setActionHandler("play", function () {
        play();
      });
      navigator.mediaSession.setActionHandler("pause", function () {
        pause();
      });
      navigator.mediaSession.setActionHandler("previoustrack", function () {
        prev();
      });
      navigator.mediaSession.setActionHandler("nexttrack", function () {
        next(true);
      });
    } catch (err) {}
  }

  function setDeepLink(track, replace) {
    if (!track) return;
    try {
      var url = new URL(window.location.href);
      url.searchParams.set("play", track.releaseId);
      url.searchParams.set("t", track.id);
      if (stageOpen || roomOpen) url.searchParams.set("stage", "1");
      else url.searchParams.delete("stage");
      history[replace ? "replaceState" : "replaceState"]({}, "", url);
    } catch (e) {}
  }

  function loadTrack(i, autoplay) {
    if (i < 0 || i >= queue.length) return;
    index = i;
    var track = queue[index];
    ensureAudio();
    if (audio.src !== new URL(track.src, window.location.origin).href) {
      audio.src = track.src;
    }
    render();
    emit();
    setDeepLink(track, true);
    if (autoplay) {
      return safePlay();
    }
    return Promise.resolve();
  }

  function applyRelease(catalog, releaseId, trackId, opts) {
    var release = (catalog.releases || []).find(function (r) {
      return r.id === releaseId;
    });
    if (!release) return null;
    var nextQueue = buildQueueFromRelease(release);
    if (!nextQueue.length) {
      var bc = release.bandcampAlbum || release.bandcamp;
      if (bc) window.open(bc, "_blank", "noopener");
      return null;
    }
    queue = nextQueue;
    var i = 0;
    if (trackId) {
      var found = queue.findIndex(function (t) {
        return t.id === trackId;
      });
      if (found >= 0) i = found;
    }
    loadTrack(i, opts.autoplay !== false);
    if (opts.stage) {
      if (getRoom()) openRoom({ scroll: opts.scroll !== false });
      else openStage();
    }
    return current();
  }

  function playRelease(releaseId, trackId, opts) {
    opts = opts || {};
    // Keep the user-gesture chain intact for iOS Safari by creating Audio now
    // and applying a cached catalog synchronously when available.
    unlockAudioFromGesture();
    if (catalogCache) {
      return Promise.resolve(applyRelease(catalogCache, releaseId, trackId, opts));
    }
    return loadCatalog().then(function (catalog) {
      return applyRelease(catalog, releaseId, trackId, opts);
    });
  }

  function play() {
    ensureAudio();
    if (!current()) return;
    safePlay();
  }

  function pause() {
    if (audio) audio.pause();
  }

  function toggle() {
    if (!audio || !current()) return;
    if (audio.paused) play();
    else pause();
  }

  function next(autoplay) {
    if (index < queue.length - 1) loadTrack(index + 1, autoplay !== false);
    else pause();
  }

  function prev() {
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    if (index > 0) loadTrack(index - 1, true);
  }

  function stop(hide) {
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
    if (hide) {
      queue = [];
      index = -1;
      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch (e) {}
      try {
        var url = new URL(window.location.href);
        url.searchParams.delete("play");
        url.searchParams.delete("t");
        url.searchParams.delete("stage");
        history.replaceState({}, "", url);
      } catch (e) {}
    }
    render();
  }

  function openStage() {
    if (!current()) return;
    if (getRoom()) {
      openRoom({ scroll: true });
      return;
    }
    ensureUI();
    closeRoom();
    stageOpen = true;
    ui.stage.hidden = false;
    document.body.classList.add("vcr-stage-open");
    setDeepLink(current(), true);
    render();
    emit();
  }

  function closeStage() {
    stageOpen = false;
    if (ui) ui.stage.hidden = true;
    document.body.classList.remove("vcr-stage-open");
    if (current()) setDeepLink(current(), true);
    emit();
  }

  function openRoom(opts) {
    opts = opts || {};
    var room = getRoom();
    if (!room || !current()) return;
    ensureUI();
    closeStage();
    roomOpen = true;
    bindRoom(room);
    room.classList.add("is-live");
    document.body.classList.add("listening-room-live");
    if (opts.scroll) {
      var rect = room.getBoundingClientRect();
      var vh = window.innerHeight || 0;
      // Only scroll when the room isn't already the main thing on screen
      // (avoids iOS toolbar jank when Play is pressed from the hero).
      var mostlyVisible = rect.top < vh * 0.2 && rect.bottom > vh * 0.55;
      if (!mostlyVisible) {
        try {
          room.scrollIntoView({ behavior: "smooth", block: "start" });
        } catch (e) {
          room.scrollIntoView(true);
        }
      }
    }
    setDeepLink(current(), true);
    render();
    emit();
  }

  function closeRoom() {
    var room = getRoom();
    roomOpen = false;
    if (room) room.classList.remove("is-live");
    document.body.classList.remove("listening-room-live");
    if (current()) setDeepLink(current(), true);
    emit();
  }

  function bindListenUI(root) {
    root = root || document;
    if (listenBound && root === document) return;
    if (root === document) listenBound = true;
    root.querySelectorAll("[data-play-release]").forEach(function (el) {
      el.addEventListener("click", function (e) {
        e.preventDefault();
        unlockAudioFromGesture();
        var releaseId = el.getAttribute("data-play-release");
        var trackId = el.getAttribute("data-play-track");
        var wantStage = el.hasAttribute("data-play-stage");
        var cur = current();
        // Same release: toggle; reopen immersive UI when requested and minimized.
        if (cur && cur.releaseId === releaseId && !trackId) {
          if (wantStage) {
            if (getRoom()) {
              if (!roomOpen) openRoom({ scroll: true });
              else toggle();
            } else if (!stageOpen) openStage();
            else toggle();
          } else {
            toggle();
          }
          return;
        }
        playRelease(releaseId, trackId, {
          autoplay: true,
          stage: wantStage,
        });
      });
    });
  }

  function hydrateFromURL() {
    var params = new URLSearchParams(window.location.search);
    var playId = params.get("play");
    var trackId = params.get("t");
    var stage = params.get("stage") === "1";
    if (playId) {
      return playRelease(playId, trackId, { autoplay: true, stage: stage }); // may show Tap to play on iOS
    }
    var saved = readPersist();
    if (saved && saved.releaseId && saved.playing) {
      return playRelease(saved.releaseId, saved.trackId, { autoplay: false }).then(function () {
        if (audio && saved.time) audio.currentTime = saved.time;
      });
    }
    return Promise.resolve();
  }

  function getState() {
    return {
      track: current(),
      playing: !!(audio && !audio.paused),
      currentTime: audio ? audio.currentTime : 0,
      duration: audio ? audio.duration || 0 : 0,
      stageOpen: stageOpen,
      roomOpen: roomOpen,
    };
  }

  function init() {
    if (inited) return;
    inited = true;
    ensureUI();
    bindGestureUnlock();
    bindListenUI(document);
    // Prefetch catalog so the first tap can start playback in-gesture on iOS.
    loadCatalog().catch(function () {});
    hydrateFromURL();
  }

  window.VCRPlayer = {
    playRelease: playRelease,
    openStage: openStage,
    closeStage: closeStage,
    openRoom: openRoom,
    closeRoom: closeRoom,
    toggle: toggle,
    play: play,
    pause: pause,
    next: next,
    prev: prev,
    seek: function (t) {
      if (audio) audio.currentTime = t;
    },
    setVolume: function (v) {
      ensureAudio();
      audio.volume = Math.max(0, Math.min(1, Number(v) || 0));
    },
    getVolume: function () {
      return audio ? audio.volume : 0.8;
    },
    getAudio: function () {
      return audio;
    },
    current: current,
    getState: getState,
    init: init,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
