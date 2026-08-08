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
  var bumperTimer = null;
  var bumperOpen = false;
  var BUMPER_MS = 1200;

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
    var vinyl = (release.formats && release.formats.vinyl) || null;
    var cassette = (release.formats && release.formats.cassette) || null;
    var digital = (release.formats && release.formats.digital) || null;
    return (release.tracks || [])
      .filter(function (t) {
        return t.preview;
      })
      .map(function (t) {
        return {
          id: t.id,
          title: t.title,
          src: t.preview,
          isPreview: true,
          previewDuration: t.previewDuration || 90,
          releaseId: release.id,
          releaseTitle: release.title,
          artist: release.artist,
          cover: release.cover,
          page: release.page,
          vinylSku: vinyl && vinyl.sku ? vinyl.sku : null,
          vinylPrice: vinyl && vinyl.price != null ? Number(vinyl.price) : null,
          vinylNote: vinyl && vinyl.note ? vinyl.note : null,
          vinylImage: (vinyl && vinyl.image) || release.cover,
          vinylStock: vinyl && vinyl.stock != null ? Number(vinyl.stock) : null,
          cassetteSku: cassette && cassette.sku ? cassette.sku : null,
          cassettePrice: cassette && cassette.price != null ? Number(cassette.price) : null,
          cassetteImage: (cassette && cassette.image) || release.cover,
          cassetteStock: cassette && cassette.stock != null ? Number(cassette.stock) : null,
          digitalPrice: digital && digital.price != null ? Number(digital.price) : null,
        };
      });
  }

  function addFormatToBag(track, format) {
    if (!track || !window.VCRCart) return false;
    if (format === "vinyl") {
      if (!track.vinylSku) return false;
      if (track.vinylStock != null && track.vinylStock <= 0) return false;
      window.VCRCart.add({
        sku: track.vinylSku,
        name: track.releaseTitle + " — Vinyl",
        price: track.vinylPrice,
        image: track.vinylImage || track.cover,
        qty: 1,
        id: track.vinylSku,
      });
      return true;
    }
    if (format === "cassette") {
      if (!track.cassetteSku) return false;
      if (track.cassetteStock != null && track.cassetteStock <= 0) return false;
      window.VCRCart.add({
        sku: track.cassetteSku,
        name: track.releaseTitle + " — Cassette",
        price: track.cassettePrice,
        image: track.cassetteImage || track.cover,
        qty: 1,
        id: track.cassetteSku,
      });
      return true;
    }
    return false;
  }

  function addVinylToBag(track) {
    return addFormatToBag(track, "vinyl");
  }

  function setRoomFormatsOpen(open) {
    var room = getRoom();
    var consoleEl = room && room.querySelector("[data-room-console]");
    if (consoleEl) consoleEl.classList.toggle("is-formats", !!open);
  }

  function flashBuyLabel(el, ok) {
    if (!el) return;
    var orig = el.getAttribute("data-label") || el.textContent;
    el.setAttribute("data-label", orig);
    el.textContent = ok ? "Added ✓" : "Shop release";
    clearTimeout(el._buyFlash);
    el._buyFlash = setTimeout(function () {
      el.textContent = orig;
    }, 1800);
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
      '<p class="vcr-player__bug">CC · Standby</p>' +
      '<p class="vcr-player__title"></p>' +
      '<p class="vcr-player__sub"></p>' +
      '<p class="vcr-player__upnext" data-upnext hidden></p>' +
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
      '<button type="button" class="vcr-player__buy" data-act="buy-vinyl" data-label="Add vinyl">Add vinyl</button>' +
      '<button type="button" class="vcr-player__btn vcr-player__close" data-act="close" aria-label="Close player">&times;</button>';

    var bumper = document.createElement("div");
    bumper.className = "vcr-bumper";
    bumper.id = "vcr-bumper";
    bumper.hidden = true;
    bumper.setAttribute("role", "dialog");
    bumper.setAttribute("aria-label", "Preview bumper");
    bumper.innerHTML =
      '<div class="vcr-bumper__card">' +
      '<p class="vcr-bumper__callsign">Club Copy</p>' +
      '<p class="vcr-bumper__title" data-bumper-title></p>' +
      '<p class="vcr-bumper__sub" data-bumper-sub></p>' +
      '<div class="vcr-bumper__actions">' +
      '<button type="button" class="vcr-bumper__btn" data-act="buy-vinyl">Add vinyl</button>' +
      '<button type="button" class="vcr-bumper__btn vcr-bumper__btn--ghost" data-act="bumper-skip">Skip</button>' +
      "</div>" +
      "</div>";

    var stage = document.createElement("div");
    stage.className = "vcr-stage";
    stage.id = "vcr-stage";
    stage.hidden = true;
    stage.innerHTML =
      '<div class="vcr-stage__bg" aria-hidden="true"></div>' +
      '<button type="button" class="vcr-stage__close" data-act="stage-close" aria-label="Close stage">&times;</button>' +
      '<div class="vcr-stage__content">' +
      '<img class="vcr-stage__art" alt="" />' +
      '<p class="vcr-stage__kicker"><span class="vcr-stage__bug">CC</span> Now</p>' +
      '<h2 class="vcr-stage__title"></h2>' +
      '<p class="vcr-stage__artist"></p>' +
      '<p class="vcr-stage__upnext" data-stage-upnext hidden></p>' +
      '<div class="vcr-stage__controls">' +
      '<button type="button" class="vcr-stage__btn" data-act="prev" aria-label="Previous"><svg class="vcr-ico vcr-ico--prev" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6h2.2v12H6zm3.4 6 8.6 6.2V5.8z"/></svg></button>' +
      '<button type="button" class="vcr-stage__btn vcr-stage__btn--play" data-act="toggle" aria-label="Play"><svg class="vcr-ico vcr-ico--play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.2v13.6L19.2 12z"/></svg><svg class="vcr-ico vcr-ico--pause" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.4v14H7zm6.6 0H17v14h-3.4z"/></svg></button>' +
      '<button type="button" class="vcr-stage__btn" data-act="next" aria-label="Next"><svg class="vcr-ico vcr-ico--next" viewBox="0 0 24 24" aria-hidden="true"><path d="M15.8 6H18v12h-2.2zm-1.2 6L6 5.8v12.4z"/></svg></button>' +
      "</div>" +
      '<input type="range" class="vcr-stage__scrub" min="0" max="1000" value="0" aria-label="Seek" />' +
      '<div class="vcr-stage__actions">' +
      '<a class="vcr-stage__link" data-page href="#">Album</a>' +
      '<button type="button" class="vcr-stage__link" data-act="buy-vinyl" data-label="Add vinyl">Add vinyl</button>' +
      "</div>" +
      '<p class="vcr-stage__hint">90s preview · bumper at end · Esc close</p>' +
      "</div>";

    document.body.appendChild(dock);
    document.body.appendChild(stage);
    document.body.appendChild(bumper);

    dock.addEventListener("click", onDockClick);
    stage.addEventListener("click", onStageClick);
    bumper.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-act]");
      if (btn) handleAct(btn.getAttribute("data-act"), btn);
    });
    dock.querySelector(".vcr-player__scrub").addEventListener("input", onScrub);
    stage.querySelector(".vcr-stage__scrub").addEventListener("input", onScrub);
    document.addEventListener("keydown", onKey);

    ui = { dock: dock, stage: stage, bumper: bumper };
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

  function peekNext() {
    if (index < 0 || index >= queue.length - 1) return null;
    return queue[index + 1];
  }

  function upNextLabel(track) {
    if (!track) return "";
    return "Up next · " + track.title;
  }

  function clearBumper() {
    bumperOpen = false;
    if (bumperTimer) {
      clearTimeout(bumperTimer);
      bumperTimer = null;
    }
    if (ui && ui.bumper) {
      ui.bumper.hidden = true;
      ui.bumper.classList.remove("is-on");
    }
    document.body.classList.remove("vcr-bumper-open");
  }

  function showBumperThenNext() {
    ensureUI();
    var track = current();
    var nextTrack = peekNext();
    bumperOpen = true;
    document.body.classList.add("vcr-bumper-open");
    if (ui.bumper) {
      ui.bumper.hidden = false;
      ui.bumper.classList.add("is-on");
      var title = ui.bumper.querySelector("[data-bumper-title]");
      var sub = ui.bumper.querySelector("[data-bumper-sub]");
      if (title) title.textContent = track ? track.releaseTitle : "Club Copy";
      if (sub) {
        sub.textContent = nextTrack
          ? upNextLabel(nextTrack)
          : "End of preview · Add to bag";
      }
      var buy = ui.bumper.querySelector('[data-act="buy-vinyl"]');
      if (buy) {
        if (track && track.cassetteSku) {
          buy.setAttribute("data-act", "buy-cassette");
          buy.textContent = track.cassettePrice != null
            ? "Add cassette · $" + track.cassettePrice
            : "Add cassette";
          buy.hidden = false;
        } else if (track && track.vinylSku) {
          buy.setAttribute("data-act", "buy-vinyl");
          buy.textContent = track.vinylPrice != null
            ? "Add vinyl · $" + track.vinylPrice
            : "Add vinyl";
          buy.hidden = false;
        } else {
          buy.hidden = true;
        }
      }
    }
    emit();
    bumperTimer = setTimeout(function () {
      clearBumper();
      if (nextTrack) next(true);
      else pause();
    }, BUMPER_MS);
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
      handleAct(btn.getAttribute("data-act"), btn);
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
    var album = room.querySelector("[data-room-album]");
    var page = room.querySelector("[data-room-page]");
    var disc = room.querySelector("[data-room-disc]");
    var toggleBtn = room.querySelector('[data-act="toggle"]');

    if (art && track) art.src = track.cover;
    if (bg && track) bg.style.backgroundImage = 'url("' + track.cover + '")';
    if (title && track) title.textContent = track.title;
    if (artist && track) artist.textContent = track.artist;
    if (album && track) album.textContent = track.releaseTitle;
    if (page && track) page.href = track.page || "/";

    var cartBtn = room.querySelector('[data-act="open-formats"]');
    if (cartBtn && cartBtn.textContent.indexOf("Added") < 0) {
      cartBtn.textContent = "Add to cart";
      cartBtn.setAttribute("data-label", "Add to cart");
    }

    var formatBtns = room.querySelectorAll('[data-act="buy-format"]');
    formatBtns.forEach(function (btn) {
      var format = btn.getAttribute("data-format");
      if (format === "vinyl") {
        var hasVinyl = !!(track && track.vinylSku);
        btn.hidden = !hasVinyl;
        btn.textContent = track && track.vinylPrice != null ? "Vinyl · $" + track.vinylPrice : "Vinyl";
        btn.disabled = !!(track && track.vinylStock != null && track.vinylStock <= 0);
      } else if (format === "cassette") {
        var hasCassette = !!(track && track.cassetteSku);
        btn.hidden = !hasCassette;
        btn.textContent = track && track.cassettePrice != null ? "Cassette · $" + track.cassettePrice : "Cassette";
        btn.disabled = !!(track && track.cassetteSku && track.cassetteStock != null && track.cassetteStock <= 0);
      } else if (format === "digital") {
        btn.hidden = false;
        btn.textContent = track && track.digitalPrice != null ? "Digital · $" + track.digitalPrice : "Digital";
        btn.disabled = false;
      }
    });

    var roomHint = room.querySelector(".hero-console-hint");
    if (roomHint && track) {
      roomHint.textContent = track.isPreview
        ? "90s preview · bumper at end · Esc minimize"
        : "Space play/pause · Esc minimize";
    }
    var up = room.querySelector("[data-room-upnext]");
    if (up) {
      var nxt = peekNext();
      if (nxt) {
        up.hidden = false;
        up.textContent = upNextLabel(nxt);
      } else {
        up.hidden = true;
        up.textContent = "";
      }
    }
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
    dock.classList.toggle("is-playing", !!playing);

    var bug = dock.querySelector(".vcr-player__bug");
    if (bug) bug.textContent = playing ? "CC · On air" : "CC · Standby";

    dock.querySelector(".vcr-player__art").src = track.cover;
    dock.querySelector(".vcr-player__title").textContent = track.title;
    dock.querySelector(".vcr-player__sub").textContent =
      (track.isPreview ? "Preview · " : "") +
      track.artist +
      " — " +
      track.releaseTitle;
    var dockUp = dock.querySelector("[data-upnext]");
    if (dockUp) {
      var n1 = peekNext();
      if (n1) {
        dockUp.hidden = false;
        dockUp.textContent = upNextLabel(n1);
      } else {
        dockUp.hidden = true;
        dockUp.textContent = "";
      }
    }
    var buy = dock.querySelector(".vcr-player__buy");
    if (buy) {
      var physicalSku = track.cassetteSku || track.vinylSku;
      var physicalPrice = track.cassetteSku ? track.cassettePrice : track.vinylPrice;
      var physicalAct = track.cassetteSku ? "buy-cassette" : "buy-vinyl";
      var physicalLabel = track.cassetteSku ? "Add cassette" : "Add vinyl";
      buy.hidden = !(physicalSku || track.page);
      if (physicalSku) {
        buy.setAttribute("data-act", physicalAct);
        if (!buy.getAttribute("data-label") || buy.textContent.indexOf("Added") < 0) {
          buy.textContent = physicalPrice != null
            ? physicalLabel + " · $" + physicalPrice
            : physicalLabel;
          buy.setAttribute("data-label", buy.textContent);
        }
      } else {
        buy.removeAttribute("data-act");
        buy.setAttribute("data-act", "buy-page");
        buy.textContent = "Shop";
        buy.setAttribute("data-label", "Shop");
      }
    }

    stage.querySelector(".vcr-stage__art").src = track.cover;
    stage.querySelector(".vcr-stage__bg").style.backgroundImage =
      'url("' + track.cover + '")';
    stage.querySelector(".vcr-stage__title").textContent = track.title;
    stage.querySelector(".vcr-stage__artist").textContent =
      (track.isPreview ? "Preview · " : "") +
      track.artist +
      " · " +
      track.releaseTitle;
    stage.querySelector("[data-page]").href = track.page || "/";
    var stageVinyl = stage.querySelector('[data-act="buy-vinyl"]');
    if (stageVinyl) {
      if (track.cassetteSku) {
        stageVinyl.hidden = false;
        stageVinyl.setAttribute("data-act", "buy-cassette");
        if (stageVinyl.textContent.indexOf("Added") < 0) {
          stageVinyl.textContent = track.cassettePrice != null
            ? "Add cassette · $" + track.cassettePrice
            : "Add cassette";
          stageVinyl.setAttribute("data-label", stageVinyl.textContent);
        }
      } else if (track.vinylSku) {
        stageVinyl.hidden = false;
        stageVinyl.setAttribute("data-act", "buy-vinyl");
        if (stageVinyl.textContent.indexOf("Added") < 0) {
          stageVinyl.textContent = track.vinylPrice != null
            ? "Add vinyl · $" + track.vinylPrice
            : "Add vinyl";
          stageVinyl.setAttribute("data-label", stageVinyl.textContent);
        }
      } else {
        stageVinyl.hidden = true;
      }
    }
    var hint = stage.querySelector(".vcr-stage__hint");
    if (hint) {
      hint.textContent = track.isPreview
        ? "90s preview · bumper at end · Esc close"
        : "Space play/pause · ← → seek · Esc close";
    }
    var stageUp = stage.querySelector("[data-stage-upnext]");
    if (stageUp) {
      var n2 = peekNext();
      if (n2) {
        stageUp.hidden = false;
        stageUp.textContent = upNextLabel(n2);
      } else {
        stageUp.hidden = true;
        stageUp.textContent = "";
      }
    }

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
            nextTrack: peekNext(),
            playing: !!(audio && !audio.paused),
            currentTime: audio ? audio.currentTime : 0,
            duration: audio ? audio.duration || 0 : 0,
            stageOpen: stageOpen,
            roomOpen: roomOpen,
            bumperOpen: bumperOpen,
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
    var track = current();
    if (track && track.isPreview) {
      showBumperThenNext();
      return;
    }
    next(true);
  }

  function onScrub(e) {
    if (!audio || !audio.duration) return;
    audio.currentTime = (Number(e.target.value) / 1000) * audio.duration;
  }

  function onDockClick(e) {
    var buyBtn = e.target.closest(".vcr-player__buy");
    if (buyBtn) {
      e.preventDefault();
      handleAct(buyBtn.getAttribute("data-act") || "buy-page", buyBtn);
      return;
    }
    var btn = e.target.closest("[data-act]");
    if (btn) {
      handleAct(btn.getAttribute("data-act"), btn);
      return;
    }
    if (e.target.closest(".vcr-player__stage-hit") || e.target.closest(".vcr-player__art") || e.target.closest(".vcr-player__meta")) {
      if (getRoom()) openRoom({ scroll: true });
      else openStage();
    }
  }

  function onStageClick(e) {
    var btn = e.target.closest("[data-act]");
    if (btn) handleAct(btn.getAttribute("data-act"), btn);
  }

  function handleAct(act, el) {
    if (act === "bumper-skip") {
      clearBumper();
      next(true);
      return;
    }
    if (act === "toggle") {
      if (bumperOpen) {
        clearBumper();
        next(true);
        return;
      }
      toggle();
    } else if (act === "prev") {
      clearBumper();
      prev();
    } else if (act === "next") {
      clearBumper();
      next(true);
    } else if (act === "close") {
      clearBumper();
      stop(true);
    } else if (act === "stage-close") closeStage();
    else if (act === "room-close") closeRoom();
    else if (act === "open-formats") {
      setRoomFormatsOpen(true);
    } else if (act === "close-formats") {
      setRoomFormatsOpen(false);
    } else if (act === "buy-format") {
      var fmtTrack = current();
      var format = el ? el.getAttribute("data-format") : null;
      if (!fmtTrack || !format) return;
      if (format === "digital") {
        if (fmtTrack.page) {
          window.location.href = fmtTrack.page;
        }
        setRoomFormatsOpen(false);
        return;
      }
      if (format === "cassette" && !fmtTrack.cassetteSku) {
        if (fmtTrack.page) {
          window.location.href = fmtTrack.page;
        }
        setRoomFormatsOpen(false);
        return;
      }
      if (format === "vinyl" && fmtTrack.vinylStock != null && fmtTrack.vinylStock <= 0) {
        if (el) el.textContent = "Sold out";
        return;
      }
      if (format === "cassette" && fmtTrack.cassetteStock != null && fmtTrack.cassetteStock <= 0) {
        if (el) el.textContent = "Sold out";
        return;
      }
      if (addFormatToBag(fmtTrack, format)) {
        setRoomFormatsOpen(false);
        var cartBtn = getRoom() && getRoom().querySelector('[data-act="open-formats"]');
        flashBuyLabel(cartBtn, true);
      } else if (fmtTrack.page) {
        window.location.href = fmtTrack.page;
      }
    } else if (act === "buy-vinyl") {
      var track = current();
      if (track && track.vinylStock != null && track.vinylStock <= 0) {
        if (el) {
          el.textContent = "Sold out";
        }
        return;
      }
      if (addVinylToBag(track)) flashBuyLabel(el, true);
      else if (track && track.page) window.location.href = track.page;
    } else if (act === "buy-cassette") {
      var cassTrack = current();
      if (cassTrack && cassTrack.cassetteStock != null && cassTrack.cassetteStock <= 0) {
        if (el) el.textContent = "Sold out";
        return;
      }
      if (addFormatToBag(cassTrack, "cassette")) flashBuyLabel(el, true);
      else if (cassTrack && cassTrack.page) window.location.href = cassTrack.page;
    } else if (act === "buy-page") {
      var t = current();
      if (t && t.page) window.location.href = t.page;
    }
  }

  function onKey(e) {
    if (!current()) return;
    var tag = (e.target && e.target.tagName) || "";
    if (tag === "INPUT" || tag === "TEXTAREA" || e.target.isContentEditable) return;
    var immersive = stageOpen || roomOpen;

    if (e.code === "Space" && (immersive || document.body.classList.contains("has-vcr-player"))) {
      e.preventDefault();
      if (bumperOpen) {
        clearBumper();
        next(true);
      } else {
        toggle();
      }
    } else if (e.code === "ArrowRight" && immersive) {
      e.preventDefault();
      if (audio) audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 5);
    } else if (e.code === "ArrowLeft" && immersive) {
      e.preventDefault();
      if (audio) audio.currentTime = Math.max(0, audio.currentTime - 5);
    } else if (e.code === "Escape" && bumperOpen) {
      clearBumper();
      next(true);
    } else if (e.code === "Escape" && roomOpen) {
      var consoleEl = getRoom() && getRoom().querySelector("[data-room-console]");
      if (consoleEl && consoleEl.classList.contains("is-formats")) {
        setRoomFormatsOpen(false);
      } else {
        closeRoom();
      }
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
    clearBumper();
    index = i;
    var track = queue[index];
    ensureAudio();
    var playSrc = track.src;
    if (audio.src !== new URL(playSrc, window.location.origin).href) {
      audio.src = playSrc;
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
    setRoomFormatsOpen(false);
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
      nextTrack: peekNext(),
      playing: !!(audio && !audio.paused),
      currentTime: audio ? audio.currentTime : 0,
      duration: audio ? audio.duration || 0 : 0,
      stageOpen: stageOpen,
      roomOpen: roomOpen,
      bumperOpen: bumperOpen,
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
