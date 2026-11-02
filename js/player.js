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
  var roomInView = true;
  var roomObserver = null;
  var listenBound = false;
  var inited = false;
  var audioUnlocked = false;
  var playGateTimer = null;
  var bumperTimer = null;
  var bumperOpen = false;
  var formatFlash = null;
  var formatFlashTimer = 0;
  var BUMPER_MS = 1200;
  var chromaCache = {};
  var chromaSrc = "";
  var audioCtx = null;
  var analyser = null;
  var analyserBins = null;
  var energyRaf = 0;
  var meterHeld = false;
  var energyArmed = false;
  var lastPreviewError = "";
  var toastTimer = 0;
  var scWidget = null;
  var scApi = null;
  var scPlaying = false;
  var scReady = false;
  var scLoaded = "";
  var scSeq = 0;
  var scTapTimer = 0;
  var scPosition = 0;
  var scDuration = 0;
  var scPoll = 0;
  var scPauseFromUs = false;
  /* User's play/pause wish, stored apart from the element's paused flag.
     Restore must not write this back as false while the new page is still loading. */
  var playIntent = false;
  var restoreLock = false;
  var tapResume = false;
  var signalLost = false;
  var stallTimer = 0;
  var pendingRestorePlay = false;

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function absoluteAsset(src) {
    if (!src) return "";
    try {
      return new URL(src, window.location.origin).href;
    } catch (e) {
      return String(src);
    }
  }

  function escAttr(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;");
  }

  function stockOk(stock) {
    return stock == null || !(Number(stock) <= 0);
  }

  function reduceMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function clampByte(n) {
    return Math.max(0, Math.min(255, Math.round(n)));
  }

  function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    var max = Math.max(r, g, b);
    var min = Math.min(r, g, b);
    var h = 0;
    var s = 0;
    var l = (max + min) / 2;
    if (max !== min) {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h /= 6;
    }
    return [h, s, l];
  }

  function hslToRgb(h, s, l) {
    var r;
    var g;
    var b;
    if (s === 0) {
      r = g = b = l;
    } else {
      var hue2rgb = function (p, q, t) {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };
      var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      var p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }
    return [clampByte(r * 255), clampByte(g * 255), clampByte(b * 255)];
  }

  function rgbStr(rgb) {
    return rgb[0] + ", " + rgb[1] + ", " + rgb[2];
  }

  function applyChroma(palette) {
    if (!palette) return;
    if (document.body.classList.contains("zine-surface")) return;
    var root = document.documentElement;
    root.style.setProperty("--room-a", rgbStr(palette.a));
    root.style.setProperty("--room-b", rgbStr(palette.b));
    root.style.setProperty("--room-c", rgbStr(palette.c));
    document.body.classList.add("vcr-chroma");
  }

  function pickPalette(data) {
    var buckets = {};
    var i;
    for (i = 0; i < data.length; i += 4) {
      var r = data[i];
      var g = data[i + 1];
      var b = data[i + 2];
      var a = data[i + 3];
      if (a < 140) continue;
      var hsl = rgbToHsl(r, g, b);
      if (hsl[2] < 0.08 || hsl[2] > 0.88) continue;
      if (hsl[1] < 0.12) continue;
      var key = String(Math.round(hsl[0] * 18));
      if (!buckets[key]) buckets[key] = { h: 0, s: 0, l: 0, w: 0, r: 0, g: 0, b: 0 };
      var w = hsl[1] * (1 - Math.abs(hsl[2] - 0.42) * 1.4) + 0.08;
      buckets[key].h += hsl[0] * w;
      buckets[key].s += hsl[1] * w;
      buckets[key].l += hsl[2] * w;
      buckets[key].r += r * w;
      buckets[key].g += g * w;
      buckets[key].b += b * w;
      buckets[key].w += w;
    }
    var ranked = Object.keys(buckets)
      .map(function (k) {
        var x = buckets[k];
        return {
          key: k,
          w: x.w,
          h: x.h / x.w,
          s: x.s / x.w,
          l: x.l / x.w,
          rgb: [clampByte(x.r / x.w), clampByte(x.g / x.w), clampByte(x.b / x.w)],
        };
      })
      .sort(function (p, q) {
        return q.w - p.w;
      });
    if (!ranked.length) {
      return {
        a: [168, 92, 128],
        b: [48, 48, 46],
        c: [196, 168, 132],
      };
    }
    var primary = ranked[0];
    var secondary = ranked[0];
    for (i = 1; i < ranked.length; i++) {
      var dh = Math.abs(ranked[i].h - primary.h);
      if (dh > 0.5) dh = 1 - dh;
      if (dh > 0.12) {
        secondary = ranked[i];
        break;
      }
    }
    var lift = function (swatch, sat, lit) {
      return hslToRgb(swatch.h, Math.min(0.78, swatch.s * sat), Math.max(0.22, Math.min(0.62, swatch.l * lit)));
    };
    var thirdH = (primary.h + 0.18) % 1;
    return {
      a: lift(primary, 1.38, 1.12),
      b: lift(secondary, 1.28, 1.0),
      c: hslToRgb(thirdH, Math.min(0.74, primary.s * 0.9 + 0.24), 0.56),
    };
  }

  function sampleCover(src) {
    if (!src) return;
    var key = String(src).split("?")[0];
    if (chromaSrc === key) return;
    if (chromaCache[key]) {
      chromaSrc = key;
      applyChroma(chromaCache[key]);
      return;
    }
    var img = new Image();
    img.decoding = "async";
    img.onload = function () {
      try {
        var canvas = document.createElement("canvas");
        canvas.width = 28;
        canvas.height = 28;
        var ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, 28, 28);
        var palette = pickPalette(ctx.getImageData(0, 0, 28, 28).data);
        chromaCache[key] = palette;
        chromaSrc = key;
        applyChroma(palette);
      } catch (err) {}
    };
    img.src = key;
  }

  function setAirState(playing) {
    document.body.classList.toggle("is-air", !!playing);
    if (!playing) {
      document.documentElement.style.setProperty("--room-energy", "0.18");
    }
  }

  function pumpEnergy() {
    if (!analyser || !analyserBins) return;
    var energy = levelFromBins();
    document.documentElement.style.setProperty("--room-energy", energy.toFixed(3));
    paintMeter(energy);
    if (audio && !audio.paused && !reduceMotion()) {
      energyRaf = requestAnimationFrame(pumpEnergy);
    } else {
      energyRaf = 0;
    }
  }

  function mediaOriginSafe() {
    var src = audio && (audio.currentSrc || audio.src);
    if (!src) return false;
    try {
      var u = new URL(src, window.location.href);
      if (u.origin !== window.location.origin) return false;
      /* A 302 to bcbits is cross-origin once it settles. Only the pipe stays here. */
      if (/bcbits\.com|bandcamp\.com/i.test(u.hostname)) return false;
      if (/bandcamp-stream/i.test(u.pathname) && !/[?&]pipe=1(?:&|$)/.test(u.search)) return false;
      return true;
    } catch (e) {
      return false;
    }
  }

  function levelFromBins() {
    if (!analyser || !analyserBins) return 0;
    analyser.getByteFrequencyData(analyserBins);
    var sum = 0;
    var i;
    for (i = 2; i < analyserBins.length; i++) sum += analyserBins[i];
    var avg = sum / Math.max(1, analyserBins.length - 2) / 255;
    return Math.max(0, Math.min(1, Math.pow(avg, 0.72) * 1.15));
  }

  function paintMeter(level) {
    if (!ui || !ui.dock) return;
    var meter = ui.dock.querySelector("[data-lcd-meter]");
    if (!meter) return;
    var bars = meter.querySelectorAll("i");
    var lit = Math.round((Number(level) || 0) * bars.length);
    if (lit < 1 && level > 0.04) lit = 1;
    if (lit > bars.length) lit = bars.length;
    var i;
    for (i = 0; i < bars.length; i++) {
      bars[i].classList.toggle("is-on", i < lit);
      bars[i].classList.toggle("is-peak", lit > 0 && i === lit - 1);
    }
    meter.hidden = false;
    ui.dock.classList.add("is-meter");
  }

  function hideMeter() {
    if (!ui || !ui.dock) return;
    ui.dock.classList.remove("is-meter");
    var meter = ui.dock.querySelector("[data-lcd-meter]");
    if (meter) meter.hidden = true;
  }

  function ensureAudioContext() {
    if (audioCtx) return audioCtx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try {
      audioCtx = new AC();
    } catch (e) {
      audioCtx = null;
      return null;
    }
    audioCtx.addEventListener("statechange", function () {
      if (audioCtx && audioCtx.state === "running" && audio && !audio.paused) startEnergy();
    });
    return audioCtx;
  }

  function resumeAudioContext() {
    if (!audioCtx || audioCtx.state !== "suspended") return;
    var pending = audioCtx.resume();
    if (pending && pending.catch) pending.catch(function () {});
  }

  function attachAnalyser() {
    // createMediaElementSource disconnects the element from the speakers.
    // A suspended context then plays silence for the rest of the session, so
    // the meter may only tap a context that is already running. Cross-origin
    // bcbits redirects are left on the element output as well.
    if (analyser || !audio) return false;
    if (!mediaOriginSafe()) return false;
    if (!audioCtx || audioCtx.state !== "running") {
      resumeAudioContext();
      return false;
    }
    try {
      var src = audioCtx.createMediaElementSource(audio);
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.84;
      src.connect(analyser);
      analyser.connect(audioCtx.destination);
      analyserBins = new Uint8Array(analyser.frequencyBinCount);
      return true;
    } catch (err) {
      analyser = null;
      return false;
    }
  }

  function startEnergy() {
    if (!audio) return;
    if (audio.readyState < 2) {
      if (energyArmed) return;
      energyArmed = true;
      var arm = function () {
        energyArmed = false;
        audio.removeEventListener("canplay", arm);
        startEnergy();
      };
      audio.addEventListener("canplay", arm);
      return;
    }
    if (!mediaOriginSafe()) {
      hideMeter();
      return;
    }
    if (!attachAnalyser()) {
      hideMeter();
      return;
    }
    if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
    if (reduceMotion()) {
      var held = levelFromBins();
      if (held > 0.02) paintMeter(held);
      return;
    }
    if (!energyRaf) energyRaf = requestAnimationFrame(pumpEnergy);
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
      var track = queue[index];
      if (!track) return;
      var prev = readPersist();
      var intent = restoreLock && prev && typeof prev.intent === "boolean" ? prev.intent : !!playIntent;
      var time = 0;
      if (isScTrack(track)) time = scPosition || 0;
      else if (audio && isFinite(audio.currentTime)) time = audio.currentTime || 0;
      if (restoreLock && prev && time < 0.35 && Number(prev.time) > 0.5) time = Number(prev.time);
      var payload = {
        v: 2,
        releaseId: track.releaseId,
        trackId: track.id,
        time: time,
        intent: !!intent,
        kind: isScTrack(track) ? "mix" : "release",
        title: track.title || "",
        artist: track.artist || "",
        releaseTitle: track.releaseTitle || "",
        cover: track.cover || "",
        catalogue: track.catalogue || "",
        trackNum: track.trackNum || 1,
        tracksCount: track.tracksCount || 0,
        permalink: track.permalink || "",
        page: track.page || "",
        year: track.year || "",
      };
      if (isScTrack(track)) {
        payload.queue = queue.filter(isScTrack).map(function (item) {
          return {
            id: item.id,
            title: item.title,
            artist: item.artist,
            cover: item.cover,
            permalink: item.permalink,
            year: item.year || "",
            page: item.page || "/tapes",
          };
        });
      }
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {}
  }

  function readPersist() {
    try {
      return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "null");
    } catch (e) {
      return null;
    }
  }

  function trackPlayable(t, release) {
    return !!(
      t &&
      (t.bandcampTrackId ||
        t.soundcloud ||
        (release && (release.bandcampUrl || release.bandcamp)) ||
        t.preview)
    );
  }

  function filePreviewSrc(preview) {
    if (!preview) return "";
    return preview.charAt(0) === "/" ? preview : "/" + preview;
  }

  function directStreamSrc(releaseId, trackId) {
    if (!releaseId || !trackId) return "";
    return (
      "/api/bandcamp-stream?r=" +
      encodeURIComponent(releaseId) +
      "&t=" +
      encodeURIComponent(trackId) +
      "&pipe=1"
    );
  }

  function primePlayback(releaseId, trackId) {
    var src = directStreamSrc(releaseId, trackId);
    if (!src) return;
    ensureAudio();
    try {
      var abs = new URL(src, window.location.origin).href;
      if (!audio.error && audio.src === abs) return;
      audio.src = src;
    } catch (e) {
      audio.src = src;
    }
    var pending = audio.play();
    if (pending && pending.catch) pending.catch(function () {});
  }

  function streamSrc(release, t) {
    var file = filePreviewSrc(t.preview);
    var host = "";
    try {
      host = window.location.hostname || "";
    } catch (e) {}
    var localDev = host === "127.0.0.1" || host === "localhost";
    if (localDev && file) return file;
    if (t.bandcampTrackId || (release && (release.bandcampUrl || release.bandcamp))) {
      return (
        "/api/bandcamp-stream?r=" +
        encodeURIComponent(release.id) +
        "&t=" +
        encodeURIComponent(t.id) +
        "&pipe=1"
      );
    }
    return file;
  }

  function buildQueueFromRelease(release) {
    var vinyl = (release.formats && release.formats.vinyl) || null;
    var cassette = (release.formats && release.formats.cassette) || null;
    var digital = (release.formats && release.formats.digital) || null;
    return (release.tracks || [])
      .filter(function (t) {
        return trackPlayable(t, release);
      })
      .map(function (t, i) {
        var src = streamSrc(release, t);
        var fromBandcamp = /bandcamp-stream/.test(src);
        var scPermalink = String((t && t.soundcloud) || "");
        var viaSoundcloud = !!(scPermalink && !t.preview && !t.bandcampTrackId && !fromBandcamp);
        var filePreview = filePreviewSrc(t.preview);
        /* Full Bandcamp streams are not previews. A bumper belongs only on a real 90s file preview. */
        var truePreview = !!(filePreview && !fromBandcamp && !viaSoundcloud);
        var cover = absoluteAsset(release.cover);
        var coverThumb = absoluteAsset(release.coverThumb || release.cover);
        return {
          id: t.id,
          title: t.title,
          src: viaSoundcloud ? "" : src,
          filePreview: filePreview,
          fromBandcamp: fromBandcamp,
          bandcampTrackId: t.bandcampTrackId || null,
          bandcampUrl: release.bandcampUrl || release.bandcamp || "",
          permalink: viaSoundcloud ? scPermalink : "",
          isSoundcloud: viaSoundcloud,
          isPreview: truePreview,
          previewDuration: truePreview ? t.previewDuration || 90 : 0,
          releaseId: release.id,
          releaseTitle: release.title,
          artist: artistLabel(release.artist),
          cover: cover,
          coverThumb: coverThumb,
          page: release.page,
          catalogue: release.catalogue || "",
          trackNum: t.trackNum || (i + 1),
          durationSec: Number(t.duration) || 0,
          year: release.year || "",
          kind: release.kind || "",
          genre: release.genre || "",
          tracksCount: release.tracksCount || (release.tracks && release.tracks.length) || 0,
          vinylSku: vinyl && vinyl.sku ? vinyl.sku : null,
          vinylPrice: vinyl && vinyl.price != null ? Number(vinyl.price) : null,
          vinylNote: vinyl && vinyl.note ? vinyl.note : null,
          vinylImage: absoluteAsset((vinyl && vinyl.image) || release.cover),
          vinylStock: vinyl && vinyl.stock != null ? Number(vinyl.stock) : null,
          cassetteSku: cassette && cassette.sku ? cassette.sku : null,
          cassettePrice: cassette && cassette.price != null ? Number(cassette.price) : null,
          cassetteImage: absoluteAsset((cassette && cassette.image) || release.cover),
          cassetteStock: cassette && cassette.stock != null ? Number(cassette.stock) : null,
          cassetteBackorder: !!(cassette && cassette.backorder),
          digitalPrice: digital && digital.price != null ? Number(digital.price) : null,
          digitalSku: digital && digital.sku ? digital.sku : null,
          digitalStock: digital && digital.stock != null ? Number(digital.stock) : null,
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
    if (format === "digital") {
      if (!track.digitalSku) return false;
      if (Number(track.digitalPrice) === 0) return false;
      window.VCRCart.add({
        sku: track.digitalSku,
        name: track.releaseTitle + " — Digital",
        price: track.digitalPrice,
        image: track.cover,
        qty: 1,
        id: track.digitalSku,
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

  function markFormatAdded(format) {
    if (!format) return;
    formatFlash = format;
    clearTimeout(formatFlashTimer);
    if (current()) renderStageFormats(current());
    formatFlashTimer = setTimeout(function () {
      formatFlash = null;
      if (current()) renderStageFormats(current());
    }, 1800);
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
    audio = document.createElement("audio");
    audio.preload = "auto";
    audio.volume = 0.8;
    audio.playsInline = true;
    audio.setAttribute("playsinline", "");
    audio.setAttribute("webkit-playsinline", "");
    audio.setAttribute("aria-hidden", "true");
    audio.style.cssText = "position:fixed;width:0;height:0;opacity:0;pointer-events:none";
    try {
      audio.referrerPolicy = "no-referrer";
    } catch (e) {}
    if (document.body) document.body.appendChild(audio);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("play", onPlayState);
    audio.addEventListener("pause", onPlayState);
    audio.addEventListener("loadedmetadata", onTime);
    audio.addEventListener("error", onAudioError);
    audio.addEventListener("stalled", onAudioStall);
    return audio;
  }

  function unlockAudioFromGesture() {
    ensureAudio();
    // Open the context on the tap, before play(). Creating it later, from the
    // play event, leaves Safari and Firefox suspended — and MediaElementSource
    // then mutes every Bandcamp stream for the rest of the session.
    ensureAudioContext();
    resumeAudioContext();
    audioUnlocked = true;
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
    var attempt = function () {
      return audio.play().then(function () {
        pendingRestorePlay = false;
        hidePlayGate();
        hidePreviewError();
        tapResume = false;
        if (ui && ui.dock) ui.dock.classList.remove("is-tap-resume", "is-tap-pulse");
      });
    };
    return attempt().catch(function (err) {
      var name = err && err.name;
      if (name === "NotSupportedError" || name === "NotFoundError") {
        onAudioError();
        return;
      }
      if (name === "AbortError") {
        if (audio.readyState >= 2) {
          return attempt().catch(function (err2) {
            if (err2 && err2.name === "NotAllowedError") showPlayGate();
          });
        }
        return new Promise(function (resolve) {
          var timer = 0;
          var done = function () {
            audio.removeEventListener("canplay", done);
            clearTimeout(timer);
            resolve(attempt().catch(function (err2) {
              if (err2 && err2.name === "NotAllowedError") showPlayGate();
            }));
          };
          timer = setTimeout(done, 1200);
          audio.addEventListener("canplay", done);
        });
      }
      if (name === "NotAllowedError") {
        if (pendingRestorePlay) {
          pendingRestorePlay = false;
          showTapResume();
        } else showPlayGate();
      }
    });
  }

  function showTapResume() {
    tapResume = true;
    ensureUI();
    if (!ui.dock) return;
    ui.dock.classList.add("is-tap-resume");
    ui.dock.classList.remove("is-tap-pulse");
    void ui.dock.offsetWidth;
    ui.dock.classList.add("is-tap-pulse");
    updateDockLcd(current(), false);
    setTogglePlaying(ui.dock.querySelector('[data-act="toggle"]'), false);
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
      '<button type="button" class="vcr-player__stage-hit" aria-label="Open Now Playing"></button>' +
      '<div class="vcr-player__jewel jewel">' +
      '<img class="vcr-player__art" alt="" width="56" height="56" />' +
      "</div>" +
      '<div class="vcr-player__lcd">' +
      '<p class="vcr-player__bug"><span data-lcd-meta>01</span><span class="vcr-player__led" data-lcd-led>STANDBY</span><span class="vcr-meter" data-lcd-meter hidden aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span></p>' +
      '<p class="vcr-player__title"></p>' +
      '<p class="vcr-player__sub"></p>' +
      '<p class="vcr-player__err" data-player-err hidden></p>' +
      '<p class="vcr-player__upnext" data-upnext hidden></p>' +
      '<div class="vcr-player__eq" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>' +
      '<div class="vcr-player__progress-wrap">' +
      '<canvas class="vcr-player__wave" aria-hidden="true"></canvas>' +
      '<input type="range" class="vcr-player__scrub" min="0" max="1000" value="0" aria-label="Seek" aria-valuetext="0:00 of 0:00" />' +
      '<div class="vcr-player__times"><span data-cur>0:00</span><span data-dur>0:00</span></div>' +
      "</div>" +
      "</div>" +
      '<div class="vcr-player__controls">' +
      '<button type="button" class="vcr-player__btn" data-act="prev" aria-label="Previous"><svg class="vcr-ico vcr-ico--prev" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6h2.2v12H6zm3.4 6 8.6 6.2V5.8z"/></svg></button>' +
      '<button type="button" class="vcr-player__btn vcr-player__btn--play" data-act="toggle" aria-label="Play"><svg class="vcr-ico vcr-ico--play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.2v13.6L19.2 12z"/></svg><svg class="vcr-ico vcr-ico--pause" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.4v14H7zm6.6 0H17v14h-3.4z"/></svg></button>' +
      '<button type="button" class="vcr-player__btn" data-act="next" aria-label="Next"><svg class="vcr-ico vcr-ico--next" viewBox="0 0 24 24" aria-hidden="true"><path d="M15.8 6H18v12h-2.2zm-1.2 6L6 5.8v12.4z"/></svg></button>' +
      "</div>" +
      '<button type="button" class="vcr-player__buy" data-act="buy-vinyl" data-label="Add vinyl">Add vinyl</button>' +
      '<button type="button" class="vcr-player__btn vcr-player__close" data-act="close" aria-label="Close player"><svg class="vcr-ico vcr-ico--close" viewBox="0 0 24 24" aria-hidden="true"><path d="M7.1 6.2 8.2 5.1 12 8.9l3.8-3.8 1.1 1.1-3.8 3.8 3.8 3.8-1.1 1.1L12 11.1l-3.8 3.8-1.1-1.1 3.8-3.8z"/></svg></button>' +
      '<p class="vcr-sr" data-player-live aria-live="polite"></p>';

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
    stage.setAttribute("role", "dialog");
    stage.setAttribute("aria-modal", "true");
    stage.setAttribute("aria-labelledby", "vcr-stage-title");
    stage.innerHTML =
      '<div class="vcr-stage__bg" aria-hidden="true"></div>' +
      '<div class="vcr-stage__sheet">' +
      '<button type="button" class="vcr-stage__close" data-act="stage-close" aria-label="Close Now Playing">' +
      '<span class="vcr-stage__handle" aria-hidden="true"></span>' +
      "</button>" +
      '<div class="vcr-stage__platter">' +
      '<img class="vcr-stage__art" alt="" />' +
      '<span class="chip-acetate vcr-stage__cat" data-stage-cat hidden></span>' +
      "</div>" +
      '<div class="vcr-stage__copy">' +
      '<p class="vcr-stage__led"><span class="status-chip status-chip--standby" data-stage-led>Stand by</span></p>' +
      '<h2 class="vcr-stage__title" id="vcr-stage-title"></h2>' +
      '<p class="vcr-stage__artist"></p>' +
      '<p class="vcr-stage__credits" data-stage-credits></p>' +
      '<p class="vcr-stage__upnext" data-stage-upnext hidden></p>' +
      "</div>" +
      '<div class="vcr-stage__controls">' +
      '<button type="button" class="vcr-stage__btn" data-act="prev" aria-label="Previous"><svg class="vcr-ico vcr-ico--prev" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6h2.2v12H6zm3.4 6 8.6 6.2V5.8z"/></svg></button>' +
      '<button type="button" class="vcr-stage__btn vcr-stage__btn--play" data-act="toggle" aria-label="Play"><svg class="vcr-ico vcr-ico--play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.2v13.6L19.2 12z"/></svg><svg class="vcr-ico vcr-ico--pause" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.4v14H7zm6.6 0H17v14h-3.4z"/></svg></button>' +
      '<button type="button" class="vcr-stage__btn" data-act="next" aria-label="Next"><svg class="vcr-ico vcr-ico--next" viewBox="0 0 24 24" aria-hidden="true"><path d="M15.8 6H18v12h-2.2zm-1.2 6L6 5.8v12.4z"/></svg></button>' +
      "</div>" +
      '<input type="range" class="vcr-stage__scrub" min="0" max="1000" value="0" aria-label="Seek" aria-valuetext="0:00 of 0:00" />' +
      '<div class="vcr-stage__times"><span data-stage-cur>0:00</span><span data-stage-dur>0:00</span></div>' +
      '<div class="vcr-stage__formats" data-stage-formats></div>' +
      '<a class="vcr-stage__notes" data-page href="#">Sleeve notes</a>' +
      "</div>";

    var toast = document.createElement("div");
    toast.className = "vcr-toast";
    toast.id = "vcr-toast";
    toast.hidden = true;
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");

    document.body.appendChild(dock);
    document.body.appendChild(stage);
    document.body.appendChild(bumper);
    document.body.appendChild(toast);

    dock.addEventListener("click", onDockClick);
    stage.addEventListener("click", onStageClick);
    bumper.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-act]");
      if (btn) handleAct(btn.getAttribute("data-act"), btn);
    });
    dock.querySelector(".vcr-player__scrub").addEventListener("input", onScrub);
    stage.querySelector(".vcr-stage__scrub").addEventListener("input", onScrub);
    stage.querySelector("[data-stage-formats]").addEventListener("click", function (e) {
      var fmt = e.target.closest("[data-act=\"buy-format\"]");
      if (!fmt) return;
      e.preventDefault();
      e.stopPropagation();
      handleAct("buy-format", fmt);
    });
    document.addEventListener("keydown", onKey);

    ui = { dock: dock, stage: stage, bumper: bumper, toast: toast };
    return ui;
  }

  function pad2(n) {
    n = Math.floor(Number(n) || 0);
    if (n < 0) n = 0;
    return n < 10 ? "0" + n : String(n);
  }

  function dockLcdMeta(track) {
    var no = pad2(track && track.trackNum ? track.trackNum : 1);
    var of = track && track.tracksCount ? pad2(track.tracksCount) : "";
    var idx = of ? no + " / " + of : no;
    /* Catalogue number leads so a narrow dock truncates the track count, not the CC number. */
    if (track && track.catalogue) return track.catalogue + "  ·  " + idx;
    return idx;
  }

  function dockLcdSub(track) {
    if (!track) return "";
    if (track.artist && track.releaseTitle && track.releaseTitle !== track.title) {
      return track.artist + " — " + track.releaseTitle;
    }
    return track.artist || track.releaseTitle || "";
  }

  function setScrubUi(ratio) {
    var pct = Math.max(0, Math.min(100, (Number(ratio) || 0) / 10)) + "%";
    if (!ui) return;
    if (ui.dock) ui.dock.style.setProperty("--scrub", pct);
    if (ui.stage) ui.stage.style.setProperty("--scrub", pct);
  }

  function updateDockLcd(track, playing) {
    if (!ui || !ui.dock) return;
    var meta = ui.dock.querySelector("[data-lcd-meta]");
    var led = ui.dock.querySelector("[data-lcd-led]");
    var bug = ui.dock.querySelector(".vcr-player__bug");
    if (meta) meta.textContent = dockLcdMeta(track);
    else if (bug) bug.textContent = dockLcdMeta(track);
    if (led) {
      if (signalLost) led.textContent = "NO SIGNAL";
      else if (tapResume && !playing) led.textContent = "PAUSED · TAP";
      else led.textContent = playing ? "ON AIR" : "STANDBY";
    }
  }

  function measureDock() {
    if (!ui || !ui.dock) return;
    var h = ui.dock.offsetHeight;
    if (h > 8) document.documentElement.style.setProperty("--dock-h", Math.ceil(h) + "px");
  }

  var peakCache = {};
  var peakWant = "";

  function clearDockPeaks() {
    if (!ui || !ui.dock) return;
    ui.dock.classList.remove("is-waved");
    var canvas = ui.dock.querySelector(".vcr-player__wave");
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function drawDockPeaks(peaks, ratio) {
    if (!ui || !ui.dock || !peaks || !peaks.length) {
      clearDockPeaks();
      return;
    }
    var canvas = ui.dock.querySelector(".vcr-player__wave");
    if (!canvas) return;
    var wrap = canvas.parentElement;
    var w = (wrap && wrap.clientWidth) || 0;
    var h = 12;
    if (!w) return;
    ui.dock.classList.add("is-waved");
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    var ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    var n = peaks.length;
    var bw = w / n;
    var played = Math.max(0, Math.min(1, Number(ratio) || 0));
    var i;
    for (i = 0; i < n; i++) {
      var amp = Number(peaks[i]);
      if (!isFinite(amp)) amp = 0;
      amp = Math.max(0.05, Math.min(1, amp));
      var bh = Math.max(1, amp * (h - 1));
      ctx.globalAlpha = i / Math.max(1, n - 1) <= played ? 1 : 0.3;
      ctx.fillStyle = "#1a1a1a";
      ctx.fillRect(i * bw, (h - bh) / 2, Math.max(1, bw - 0.35), bh);
    }
    ctx.globalAlpha = 1;
  }

  function loadPeaks(track) {
    if (!track || !track.id || track.isSoundcloud) {
      peakWant = "";
      clearDockPeaks();
      return;
    }
    if (peakCache[track.id]) {
      peakWant = track.id;
      var ratio = audio && audio.duration ? (audio.currentTime || 0) / audio.duration : 0;
      drawDockPeaks(peakCache[track.id], ratio);
      return;
    }
    if (peakWant === track.id) return;
    peakWant = track.id;
    clearDockPeaks();
    fetch("/data/peaks/" + encodeURIComponent(track.id) + ".json")
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        var peaks = data && data.peaks;
        if (!Array.isArray(peaks) || !peaks.length) return;
        peakCache[track.id] = peaks;
        var now = current();
        if (now && now.id === track.id) drawDockPeaks(peaks, 0);
      })
      .catch(function () {});
  }

  function notify(msg, isError) {
    if (!msg) return;
    ensureUI();
    var toast = ui.toast;
    if (!toast) return;
    toast.textContent = msg;
    toast.hidden = false;
    toast.classList.toggle("is-error", !!isError);
    toast.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.classList.remove("is-on");
      toast.hidden = true;
    }, 4200);
    var led = ui.dock && ui.dock.querySelector("[data-lcd-led]");
    if (led && isError) led.textContent = "Error";
    else if (!led) {
      var bug = ui.dock && ui.dock.querySelector(".vcr-player__bug");
      if (bug && isError) bug.textContent = "Error";
    }
  }

  function fmt(sec) {
    if (!isFinite(sec) || sec < 0) return "0:00";
    sec = Math.floor(sec);
    var h = Math.floor(sec / 3600);
    var m = Math.floor((sec % 3600) / 60);
    var s = sec % 60;
    var ss = (s < 10 ? "0" : "") + s;
    if (h) return h + ":" + (m < 10 ? "0" : "") + m + ":" + ss;
    return m + ":" + ss;
  }

  function buyOffer(track) {
    if (!track || track.isSoundcloud) return null;
    if (track.cassetteSku && stockOk(track.cassetteStock)) {
      return {
        act: "buy-cassette",
        label: track.cassettePrice != null ? "Add cassette · $" + track.cassettePrice : "Add cassette",
      };
    }
    if (track.vinylSku && stockOk(track.vinylStock)) {
      return {
        act: "buy-vinyl",
        label: track.vinylPrice != null ? "Add vinyl · $" + track.vinylPrice : "Add vinyl",
      };
    }
    if (track.digitalSku && stockOk(track.digitalStock)) {
      if (Number(track.digitalPrice) === 0) {
        return { act: "free-download", label: "Free download" };
      }
      return {
        act: "buy-digital",
        label: track.digitalPrice != null ? "Buy · $" + track.digitalPrice : "Buy",
      };
    }
    if (track.page) return { act: "buy-page", label: "Shop" };
    return null;
  }

  function applyBuyButton(el, track) {
    if (!el) return;
    var offer = signalLost ? null : buyOffer(track);
    if (!offer) {
      el.hidden = true;
      return;
    }
    el.hidden = false;
    el.setAttribute("data-act", offer.act);
    if (el.textContent.indexOf("Added") < 0) {
      el.textContent = offer.label;
      el.setAttribute("data-label", offer.label);
    }
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
          : "End of preview · Add to cart";
      }
      var buy = ui.bumper.querySelector("[data-act]");
      if (buy && buy.classList.contains("vcr-bumper__btn") && !buy.classList.contains("vcr-bumper__btn--ghost")) {
        var offer = buyOffer(track);
        if (offer && offer.act !== "buy-page") {
          buy.setAttribute("data-act", offer.act);
          buy.textContent = offer.label;
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

  /** Hide the floating dock only while the full Now Playing stage is open. */
  function syncDockAway() {
    document.body.classList.toggle("vcr-dock-away", !!stageOpen);
  }

  function ensureRoomObserver() {
    if (roomObserver || !("IntersectionObserver" in window)) return;
    roomObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en) {
          // Top ~35% of viewport: if the listening room still overlaps it, keep the dock away.
          roomInView = !!en.isIntersecting;
          syncDockAway();
        });
      },
      { root: null, rootMargin: "0px 0px -65% 0px", threshold: [0, 0.01, 0.1] }
    );
  }

  function observeListeningRoom() {
    ensureRoomObserver();
    var room = getRoom();
    if (!roomObserver || !room) return;
    roomObserver.observe(room);
    // Seed immediately so first paint doesn't flash the dock over the hero.
    var rect = room.getBoundingClientRect();
    var vh = window.innerHeight || 1;
    roomInView = rect.bottom > vh * 0.35 && rect.top < vh * 0.6;
    syncDockAway();
  }

  function unobserveListeningRoom() {
    var room = getRoom();
    if (roomObserver && room) roomObserver.unobserve(room);
    roomInView = false;
    syncDockAway();
  }

  function bindRoom(room) {
    if (!room || roomBound) return;
    roomBound = true;
    if (room.hasAttribute("data-ipod")) return;
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
    if (room.hasAttribute("data-ipod")) {
      room.classList.toggle("is-live", roomOpen);
      room.setAttribute("aria-live", roomOpen ? "polite" : "off");
      return;
    }

    var art = room.querySelector("[data-room-art]");
    var bg = room.querySelector("[data-room-bg]");
    var title = room.querySelector("[data-room-title]");
    var artist = room.querySelector("[data-room-artist]");
    var album = room.querySelector("[data-room-album]");
    var page = room.querySelector("[data-room-page]");
    var disc = room.querySelector("[data-room-disc]");
    var toggleBtn = room.querySelector('[data-act="toggle"]');

    if (art && track) art.src = track.cover;
    var label = room.querySelector("[data-room-label]");
    if (label && track) label.src = track.cover;
    if (bg && track) bg.style.backgroundImage = 'url("' + track.cover + '")';
    if (track && track.cover) sampleCover(track.cover);
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
        var cassOutBtn = !!(track && track.cassetteSku && track.cassetteStock != null && track.cassetteStock <= 0);
        btn.textContent = cassOutBtn
          ? "Cassette · Sold out"
          : track && track.cassetteBackorder
          ? (track.cassettePrice != null ? "Cassette backorder · $" + track.cassettePrice : "Cassette backorder")
          : (track && track.cassettePrice != null ? "Cassette · $" + track.cassettePrice : "Cassette");
        btn.disabled = !!(track && track.cassetteSku && track.cassetteStock != null && track.cassetteStock <= 0);
      } else if (format === "digital") {
        btn.hidden = false;
        btn.textContent = track && Number(track.digitalPrice) === 0
          ? "Free download"
          : (track && track.digitalPrice != null ? "Digital · $" + track.digitalPrice : "Digital");
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
    room.classList.toggle("is-live", roomOpen);
    if (!room.hasAttribute("data-ipod")) {
      room.classList.toggle("is-playing", !!playing);
      room.classList.toggle("is-now-playing", roomOpen);
      var ipodHeader = room.querySelector("[data-ipod-header]");
      if (ipodHeader) ipodHeader.textContent = roomOpen ? "Now Playing" : "Club Copy";
    }
    room.setAttribute("aria-live", roomOpen ? "polite" : "off");
  }

  function render() {
    ensureUI();
    var track = current();
    var dock = ui.dock;
    var stage = ui.stage;
    var playing = isPlayingNow();

    if (!track) {
      dock.classList.remove("is-visible");
      document.body.classList.remove("has-vcr-player");
      document.body.classList.remove("vcr-dock-away");
      setAirState(false);
      closeStage();
      closeRoom();
      renderRoom(null, false);
      return;
    }

    dock.classList.add("is-visible");
    document.body.classList.add("has-vcr-player");
    dock.classList.toggle("is-playing", !!playing && !signalLost);
    dock.classList.toggle("is-signal", !!signalLost);
    setAirState(playing && !signalLost);
    if (playing && !signalLost) startEnergy();
    var roomNow = getRoom();
    if (track && track.cover && !(roomNow && roomNow.hasAttribute("data-ipod"))) sampleCover(track.cover);
    syncDockAway();
    updateDockLcd(track, playing);

    dock.querySelector(".vcr-player__art").src = track.cover;
    dock.querySelector(".vcr-player__title").textContent = track.title;
    dock.querySelector(".vcr-player__sub").textContent = dockLcdSub(track);
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
    applyBuyButton(dock.querySelector(".vcr-player__buy"), track);
    paintSignal(track);

    stage.querySelector(".vcr-stage__art").src = track.cover;
    stage.querySelector(".vcr-stage__art").alt = track.releaseTitle + " — " + track.artist;
    stage.querySelector(".vcr-stage__bg").style.backgroundImage =
      'url("' + track.cover + '")';
    stage.querySelector(".vcr-stage__title").textContent = track.releaseTitle || track.title;
    stage.querySelector(".vcr-stage__artist").textContent = track.artist || "";
    var catEl = stage.querySelector("[data-stage-cat]");
    if (catEl) {
      catEl.hidden = true;
      catEl.textContent = "";
    }
    var credits = stage.querySelector("[data-stage-credits]");
    if (credits) {
      var cred = [];
      if (track.kind) cred.push(track.kind);
      if (track.year) cred.push(String(track.year));
      if (track.genre) cred.push(track.genre);
      if (track.tracksCount) cred.push(track.tracksCount === 1 ? "1 track" : track.tracksCount + " tracks");
      if (track.title && track.title !== track.releaseTitle) cred.push(track.title);
      credits.textContent = cred.join(" · ");
    }
    var led = stage.querySelector("[data-stage-led]");
    if (led) {
      led.textContent = playing ? "On air" : "Stand by";
      led.classList.toggle("status-chip--air", !!playing);
      led.classList.toggle("status-chip--standby", !playing);
    }
    var pageLink = stage.querySelector("[data-page]");
    if (pageLink) {
      pageLink.href = track.page || "/library";
      pageLink.hidden = !track.page;
    }
    renderStageFormats(track);
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

    setTogglePlaying(dock.querySelector('[data-act="toggle"]'), playing && !signalLost);
    setTogglePlaying(stage.querySelector('[data-act="toggle"]'), playing && !signalLost);

    renderRoom(track, playing && !signalLost);
    updateMediaSession(track, playing && !signalLost);
    announceTrack(track);
    loadPeaks(track);
    measureDock();
  }

  function paintSignal(track) {
    if (!ui || !ui.dock) return;
    var errEl = ui.dock.querySelector("[data-player-err]");
    var sub = ui.dock.querySelector(".vcr-player__sub");
    if (!signalLost) {
      if (errEl) {
        errEl.hidden = true;
        errEl.textContent = "";
      }
      if (sub) sub.hidden = false;
      return;
    }
    if (sub) sub.hidden = true;
    if (errEl) {
      var href = track && track.bandcampUrl ? track.bandcampUrl : "";
      errEl.hidden = false;
      errEl.innerHTML =
        'Stream unavailable · <button type="button" data-act="retry">Retry</button>' +
        (href
          ? ' · <a href="' + escAttr(href) + '" target="_blank" rel="noopener noreferrer">Bandcamp ↗</a>'
          : "");
    }
    setTogglePlaying(ui.dock.querySelector('[data-act="toggle"]'), false);
    var led = ui.dock.querySelector("[data-lcd-led]");
    if (led) led.textContent = "NO SIGNAL";
  }

  function onTime() {
    if (!audio || !ui) return;
    if (isScTrack(current())) return;
    var track = current();
    var cap = track && track.isPreview ? Number(track.previewDuration) || 0 : 0;
    if (cap && audio.currentTime >= cap) {
      audio.pause();
      showBumperThenNext();
      return;
    }
    var dur = cap || audio.duration || (track && track.durationSec) || 0;
    if (!isFinite(dur) || dur < 0) dur = 0;
    var cur = audio.currentTime || 0;
    var ratio = dur ? Math.round((cur / dur) * 1000) : 0;
    setScrubUi(ratio);
    ui.dock.querySelector(".vcr-player__scrub").value = String(ratio);
    ui.stage.querySelector(".vcr-stage__scrub").value = String(ratio);
    ui.dock.querySelector("[data-cur]").textContent = fmt(cur);
    ui.dock.querySelector("[data-dur]").textContent = fmt(dur);
    var stageCur = ui.stage.querySelector("[data-stage-cur]");
    var stageDur = ui.stage.querySelector("[data-stage-dur]");
    if (stageCur) stageCur.textContent = fmt(cur);
    if (stageDur) stageDur.textContent = fmt(dur);
    var room = getRoom();
    if (room && !room.hasAttribute("data-ipod")) {
      var roomScrub = room.querySelector("[data-room-scrub]");
      if (roomScrub) roomScrub.value = String(ratio);
      var curEl = room.querySelector("[data-room-cur]");
      var durEl = room.querySelector("[data-room-dur]");
      if (curEl) curEl.textContent = fmt(cur);
      if (durEl) durEl.textContent = fmt(dur);
    }
    paintScrubA11y(cur, dur);
    publishPosition(cur, dur);
    if (track && peakCache[track.id]) drawDockPeaks(peakCache[track.id], dur ? cur / dur : 0);
    if (reduceMotion() && analyser && !meterHeld) {
      var held = levelFromBins();
      if (held > 0.02) {
        meterHeld = true;
        paintMeter(held);
      }
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
            playing: isPlayingNow(),
            currentTime: isScTrack(track) ? scPosition : audio ? audio.currentTime : 0,
            duration: isScTrack(track) ? scDuration : audio ? audio.duration || 0 : 0,
            stageOpen: stageOpen,
            roomOpen: roomOpen,
            bumperOpen: bumperOpen,
            error: !!lastPreviewError,
            errorMessage: lastPreviewError || "",
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

  function previewErrorMessage() {
    return "Preview isn’t up yet.";
  }

  function isScTrack(track) {
    return !!(track && track.isSoundcloud && track.permalink);
  }

  function isPlayingNow() {
    if (isScTrack(current())) return scPlaying;
    return !!(audio && !audio.paused);
  }

  function pauseSoundCloud() {
    scPlaying = false;
    scSeq += 1;
    scPauseFromUs = true;
    clearTimeout(scTapTimer);
    if (scWidget) {
      try {
        scWidget.pause();
      } catch (e) {}
    }
  }

  function loadScApi() {
    if (window.SC && window.SC.Widget) return Promise.resolve();
    if (scApi) return scApi;
    scApi = new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = "https://w.soundcloud.com/player/api.js";
      s.async = true;
      s.onload = function () {
        resolve();
      };
      s.onerror = function () {
        scApi = null;
        reject(new Error("soundcloud"));
      };
      document.head.appendChild(s);
    });
    return scApi;
  }

  function scEmbedSrc(permalink, autoplay) {
    return (
      "https://w.soundcloud.com/player/?url=" +
      encodeURIComponent(permalink) +
      "&color=%23C8C8C4&auto_play=" +
      (autoplay ? "true" : "false") +
      "&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false&visual=false&show_artwork=false"
    );
  }

  // The SoundCloud embed lives in a wrapper that is 1px and invisible while playback works,
  // and becomes a visible "tap play" card when a phone refuses programmatic autoplay.
  function ensureScFrame() {
    ensureUI();
    if (ui.scFrame) return ui.scFrame;
    var wrap = document.createElement("div");
    wrap.className = "vcr-sc-wrap";
    wrap.setAttribute("data-sc-wrap", "");
    wrap.setAttribute("aria-hidden", "true");
    wrap.setAttribute("inert", "");
    wrap.innerHTML =
      '<div class="vcr-sc-bar">' +
      '<span class="vcr-sc-msg">Tap play to start this mix</span>' +
      '<a class="vcr-sc-open" target="_blank" rel="noopener noreferrer">SoundCloud</a>' +
      '<button type="button" class="vcr-sc-close" aria-label="Close">&times;</button>' +
      "</div>";
    wrap.querySelector(".vcr-sc-close").addEventListener("click", hideScTap);
    var frame = document.createElement("iframe");
    frame.className = "vcr-sc-frame";
    frame.setAttribute("allow", "autoplay; encrypted-media");
    frame.setAttribute("scrolling", "no");
    frame.setAttribute("title", "SoundCloud player");
    wrap.appendChild(frame);
    document.body.appendChild(wrap);
    ui.scWrap = wrap;
    ui.scFrame = frame;
    return frame;
  }

  function showScTap(track) {
    ensureScFrame();
    if (!ui.scWrap) return;
    var link = ui.scWrap.querySelector(".vcr-sc-open");
    if (link && track && track.permalink) link.href = track.permalink;
    ui.scWrap.classList.add("is-open");
    ui.scWrap.removeAttribute("aria-hidden");
    ui.scWrap.removeAttribute("inert");
  }

  function hideScTap() {
    clearTimeout(scTapTimer);
    if (ui && ui.scWrap) {
      ui.scWrap.classList.remove("is-open");
      ui.scWrap.setAttribute("aria-hidden", "true");
      ui.scWrap.setAttribute("inert", "");
    }
  }

  // Phones only start audio from a tap that lands on the player itself. If nothing is playing
  // shortly after we asked, show the embed so one tap on its own play button works.
  function armScTap(track, seq) {
    clearTimeout(scTapTimer);
    scTapTimer = setTimeout(function () {
      if (seq === scSeq && !scPlaying) showScTap(track);
    }, 1800);
  }

  function bindScWidget(widget) {
    widget.bind(SC.Widget.Events.READY, function () {
      scReady = true;
    });
    widget.bind(SC.Widget.Events.PLAY, function () {
      scPlaying = true;
      playIntent = true;
      tapResume = false;
      hideScTap();
      hidePreviewError();
      widget.getDuration(function (ms) {
        scDuration = (ms || 0) / 1000;
      });
      render();
      persist();
      emit();
    });
    widget.bind(SC.Widget.Events.PAUSE, function () {
      scPlaying = false;
      if (scPauseFromUs) scPauseFromUs = false;
      else if (!restoreLock) playIntent = false;
      render();
      persist();
      emit();
    });
    widget.bind(SC.Widget.Events.FINISH, function () {
      scPlaying = false;
      next(true);
    });
    widget.bind(SC.Widget.Events.PLAY_PROGRESS, function (data) {
      scPosition = ((data && data.currentPosition) || 0) / 1000;
      var dur = scDuration || 0;
      var cur = scPosition || 0;
      var ratio = dur ? Math.round((cur / dur) * 1000) : 0;
      setScrubUi(ratio);
      if (ui && ui.dock) {
        var scrub = ui.dock.querySelector(".vcr-player__scrub");
        if (scrub) scrub.value = String(ratio);
        var cEl = ui.dock.querySelector("[data-cur]");
        var dEl = ui.dock.querySelector("[data-dur]");
        if (cEl) cEl.textContent = fmt(cur);
        if (dEl) dEl.textContent = fmt(dur);
      }
    });
    widget.bind(SC.Widget.Events.ERROR, function () {
      scPlaying = false;
      showStreamFailure(current());
    });
    startScPoll();
  }

  function paintScClock() {
    if (!ui || !ui.dock) return;
    var dur = scDuration || 0;
    var cur = scPosition || 0;
    var ratio = dur ? Math.round((cur / dur) * 1000) : 0;
    setScrubUi(ratio);
    var scrub = ui.dock.querySelector(".vcr-player__scrub");
    if (scrub) scrub.value = String(ratio);
    var cEl = ui.dock.querySelector("[data-cur]");
    var dEl = ui.dock.querySelector("[data-dur]");
    if (cEl) cEl.textContent = fmt(cur);
    if (dEl) dEl.textContent = fmt(dur);
    paintScrubA11y(cur, dur);
    publishPosition(cur, dur);
  }

  function startScPoll() {
    if (scPoll) return;
    scPoll = setInterval(syncScFromWidget, 500);
  }

  function syncScFromWidget() {
    if (!scWidget || !isScTrack(current())) return;
    try {
      scWidget.getDuration(function (ms) {
        if (ms) scDuration = ms / 1000;
      });
      scWidget.getPosition(function (ms) {
        var nextPos = (ms || 0) / 1000;
        var moved = Math.abs(nextPos - scPosition) > 0.05;
        scPosition = nextPos;
        if (moved) paintScClock();
        if (nextPos > 0.35 && !scPlaying) {
          scPlaying = true;
          playIntent = true;
          hideScTap();
          hidePreviewError();
          render();
          persist();
          emit();
        }
      });
      scWidget.isPaused(function (paused) {
        var playing = !paused;
        if (playing === scPlaying) return;
        scPlaying = playing;
        if (playing) {
          hideScTap();
          hidePreviewError();
          playIntent = true;
          tapResume = false;
        }
        render();
        persist();
        emit();
      });
    } catch (e) {}
  }

  function createScWidget(permalink, autoplay) {
    var frame = ensureScFrame();
    frame.src = scEmbedSrc(permalink, autoplay);
    scLoaded = permalink;
    scReady = false;
    scWidget = SC.Widget(frame);
    bindScWidget(scWidget);
  }

  // Fetch the SoundCloud API and build the embed ahead of the first tap, so a phone can
  // start playback inside the tap instead of waiting on the network (which drops the gesture).
  function warmSoundCloud(permalink) {
    if (!permalink || scWidget) return Promise.resolve();
    return loadScApi()
      .then(function () {
        if (!scWidget) createScWidget(permalink, false);
      })
      .catch(function () {});
  }

  function artistLabel(name) {
    return String(name || "").replace(/L\.T\. Drifta/g, "LT Drifta");
  }

  function mixToTrack(item) {
    return {
      id: item.id,
      releaseId: "mixes",
      title: item.title,
      artist: artistLabel(item.dj) || "LT Drifta",
      releaseTitle: "Mixtapes",
      cover: absoluteAsset(item.cover || ""),
      permalink: item.permalink,
      isSoundcloud: true,
      page: "/tapes",
      year: item.year || "",
      durationSec: 0,
    };
  }

  function startScNow(track, autoplay, seq) {
    if (scWidget && scReady && scLoaded === track.permalink) {
      if (autoplay) {
        try { scWidget.play(); } catch (e) {}
        armScTap(track, seq);
      }
      return;
    }
    if (scWidget) {
      scLoaded = track.permalink;
      scReady = false;
      try {
        scWidget.load(track.permalink, { auto_play: !!autoplay });
      } catch (e) {
        createScWidget(track.permalink, !!autoplay);
      }
    } else {
      createScWidget(track.permalink, !!autoplay);
    }
    if (autoplay) armScTap(track, seq);
    render();
    emit();
  }

  function loadSoundCloud(track, autoplay) {
    if (!track || !track.permalink) {
      showPreviewError(previewErrorMessage(), track);
      return Promise.resolve(null);
    }
    if (audio) {
      audio.pause();
      try {
        audio.removeAttribute("src");
        audio.load();
      } catch (e) {}
    }
    hidePreviewError();
    hideScTap();
    scSeq += 1;
    var seq = scSeq;
    scPlaying = false;
    if (!restoreLock) {
      scPosition = 0;
      scDuration = 0;
    }
    if (ui && ui.dock && !restoreLock) {
      setScrubUi(0);
      var cEl = ui.dock.querySelector("[data-cur]");
      var dEl = ui.dock.querySelector("[data-dur]");
      if (cEl) cEl.textContent = "0:00";
      if (dEl) dEl.textContent = "0:00";
    }
    render();
    emit();
    // Stay inside the tap. A promise tick drops the gesture on iOS and forces a second tap.
    if (window.SC && window.SC.Widget) {
      startScNow(track, autoplay, seq);
      return Promise.resolve(current());
    }
    return loadScApi()
      .then(function () {
        if (seq !== scSeq) return current();
        startScNow(track, autoplay, seq);
        return current();
      })
      .catch(function () {
        // SoundCloud's script is blocked or offline: the plain embed may still load.
        if (seq !== scSeq) return null;
        try {
          var frame = ensureScFrame();
          frame.src = scEmbedSrc(track.permalink, false);
          showScTap(track);
        } catch (e) {
          showPreviewError(previewErrorMessage(), track);
        }
        return null;
      });
  }

  function playMix(item, list) {
    playIntent = true;
    unlockAudioFromGesture();
    pauseSoundCloud();
    if (audio) audio.pause();
    hidePreviewError();
    var tapes = Array.isArray(list) && list.length ? list : [item];
    queue = tapes.filter(function (t) {
      return t && t.permalink;
    }).map(mixToTrack);
    if (!queue.length) {
      showPreviewError(previewErrorMessage(), mixToTrack(item || {}));
      return Promise.resolve(null);
    }
    var want = item && item.id;
    index = 0;
    for (var i = 0; i < queue.length; i++) {
      if (queue[i].id === want) index = i;
    }
    return loadSoundCloud(queue[index], true);
  }

  function hidePreviewError() {
    lastPreviewError = "";
    signalLost = false;
    if (!ui || !ui.dock) return;
    ui.dock.classList.remove("is-error", "is-signal");
    var errEl = ui.dock.querySelector("[data-player-err]");
    if (errEl) {
      errEl.hidden = true;
      errEl.textContent = "";
    }
    var sub = ui.dock.querySelector(".vcr-player__sub");
    if (sub) sub.hidden = false;
  }

  function showStreamFailure(track) {
    track = track || current();
    signalLost = true;
    tapResume = false;
    lastPreviewError = "Stream unavailable";
    clearTimeout(stallTimer);
    if (audio && !audio.paused) {
      try { audio.pause(); } catch (e) {}
    }
    if (isScTrack(track)) {
      scPlaying = false;
      try { if (scWidget) scWidget.pause(); } catch (e) {}
    }
    ensureUI();
    if (ui.dock) ui.dock.classList.remove("is-tap-resume", "is-tap-pulse");
    render();
    emit();
  }

  function showPreviewError(msg, track) {
    if (msg && msg !== previewErrorMessage()) {
      lastPreviewError = msg;
      ensureUI();
      notify(msg, true);
      emit();
      return;
    }
    showStreamFailure(track);
  }

  function onAudioError() {
    var track = current();
    if (!track) return;
    var played = (audio && (audio.currentSrc || audio.src)) || "";
    if (track.fromBandcamp && /[?&]pipe=1(?:&|$)/.test(played) && (track._pipeTries || 0) < 2) {
      track._pipeTries = (track._pipeTries || 0) + 1;
      var again = String(track.src || played).replace(/([?&])retry=\d+/, "").replace(/\?$/, "");
      again += (again.indexOf("?") >= 0 ? "&" : "?") + "retry=" + track._pipeTries;
      track.src = again;
      hideMeter();
      ensureAudio();
      try { audio.referrerPolicy = "no-referrer"; } catch (e) {}
      audio.src = again;
      signalLost = false;
      render();
      safePlay();
      return;
    }
    if (track.fromBandcamp && !track._pipeFailed && /[?&]pipe=1(?:&|$)/.test(played)) {
      track._pipeFailed = true;
      track.src = String(track.src || played).replace(/([?&])retry=\d+/, "").replace(/[?&]pipe=1\b/, "").replace(/\?$/, "");
      hideMeter();
      ensureAudio();
      try { audio.referrerPolicy = "no-referrer"; } catch (e) {}
      audio.src = track.src;
      signalLost = false;
      render();
      safePlay();
      return;
    }
    if (track.fromBandcamp && track.filePreview && !track._fellBack) {
      track._fellBack = true;
      track.src = track.filePreview;
      track.fromBandcamp = false;
      track.isPreview = true;
      track.previewDuration = track.previewDuration || 90;
      ensureAudio();
      try {
        audio.referrerPolicy = "no-referrer";
      } catch (e) {}
      audio.src = track.filePreview;
      signalLost = false;
      render();
      safePlay();
      return;
    }
    showStreamFailure(track);
  }

  function onAudioStall() {
    if (!audio || signalLost || !current()) return;
    var mark = audio.currentTime || 0;
    clearTimeout(stallTimer);
    stallTimer = setTimeout(function () {
      if (!audio || signalLost || !current()) return;
      if (!audio.paused && audio.readyState >= 3) return;
      var stuck = Math.abs((audio.currentTime || 0) - mark) < 0.05;
      if (audio.error || audio.networkState === audio.NETWORK_NO_SOURCE || (stuck && audio.readyState < 2)) {
        onAudioError();
      }
    }, 2500);
  }

  function retryStream() {
    var track = current();
    if (!track) return;
    hidePreviewError();
    tapResume = false;
    playIntent = true;
    if (isScTrack(track)) {
      loadSoundCloud(track, true);
      return;
    }
    ensureAudio();
    var src = track._fellBack && track.filePreview ? track.filePreview : track.src;
    if (!src) {
      showStreamFailure(track);
      return;
    }
    track._fellBack = false;
    track._pipeTries = 0;
    track._pipeFailed = false;
    if (track.filePreview && track.src && track.src !== track.filePreview) {
      track.fromBandcamp = /bandcamp-stream/.test(track.src);
      track.isPreview = false;
    }
    try {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    } catch (e) {}
    var bust = src + (src.indexOf("?") >= 0 ? "&" : "?") + "retry=" + Date.now();
    audio.src = bust;
    render();
    safePlay();
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
    var track = current();
    var ratio = Number(e.target.value) / 1000;
    if (isScTrack(track) && scWidget && scDuration) {
      try {
        scWidget.seekTo(ratio * scDuration * 1000);
      } catch (err) {}
      setScrubUi(e.target.value);
      return;
    }
    if (!audio || !audio.duration) return;
    audio.currentTime = ratio * audio.duration;
    setScrubUi(e.target.value);
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
    if (e.target.closest(".vcr-player__scrub")) return;
  }

  function onStageClick(e) {
    if (e.target === e.currentTarget || e.target.classList.contains("vcr-stage__bg")) {
      closeStage();
      return;
    }
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
    } else     if (act === "close") {
      clearBumper();
      stop(true);
    } else if (act === "retry") {
      retryStream();
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
        if (Number(fmtTrack.digitalPrice) === 0) {
          window.location.href = "/api/bandcamp-stream?r=" + encodeURIComponent(fmtTrack.releaseId) + "&t=" + encodeURIComponent(fmtTrack.id || "") + "&download=1";
          return;
        }
        if (addFormatToBag(fmtTrack, "digital")) {
          setRoomFormatsOpen(false);
          markFormatAdded("digital");
          flashBuyLabel(el, true);
          var digitalCartBtn = getRoom() && getRoom().querySelector('[data-act="open-formats"], [data-ipod-buy]');
          if (digitalCartBtn && digitalCartBtn !== el) flashBuyLabel(digitalCartBtn, true);
        }
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
        markFormatAdded(format);
        flashBuyLabel(el, true);
        var cartBtn = getRoom() && getRoom().querySelector('[data-act="open-formats"]');
        if (cartBtn && cartBtn !== el) flashBuyLabel(cartBtn, true);
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
    } else if (act === "free-download") {
      var freeTrack = current();
      if (freeTrack && freeTrack.releaseId) {
        window.location.href = "/api/bandcamp-stream?r=" + encodeURIComponent(freeTrack.releaseId) + "&t=" + encodeURIComponent(freeTrack.id || "") + "&download=1";
      }
    } else if (act === "buy-digital") {
      var digTrack = current();
      if (digTrack && Number(digTrack.digitalPrice) === 0 && digTrack.releaseId) {
        window.location.href = "/api/bandcamp-stream?r=" + encodeURIComponent(digTrack.releaseId) + "&t=" + encodeURIComponent(digTrack.id || "") + "&download=1";
        return;
      }
      if (addFormatToBag(digTrack, "digital")) flashBuyLabel(el, true);
      else if (digTrack && digTrack.page) window.location.href = digTrack.page;
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
    var inDock = !!(e.target && e.target.closest && e.target.closest("#vcr-player"));

    if (e.code === "Space" && (immersive || inDock || document.body.classList.contains("has-vcr-player"))) {
      e.preventDefault();
      if (bumperOpen) {
        clearBumper();
        next(true);
      } else {
        toggle();
      }
    } else if ((e.code === "ArrowRight" || e.code === "ArrowLeft") && (immersive || inDock)) {
      e.preventDefault();
      seekBy(e.code === "ArrowRight" ? 5 : -5);
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

  function artType(url) {
    if (/\.png(\?|#|$)/i.test(url)) return "image/png";
    if (/\.jpe?g(\?|#|$)/i.test(url)) return "image/jpeg";
    return "image/webp";
  }

  function artworkFor(track) {
    var items = [];
    var seen = {};
    function push(url, sizes) {
      url = absoluteAsset(url);
      if (!url || seen[sizes + url]) return;
      seen[sizes + url] = true;
      items.push({ src: url, sizes: sizes, type: artType(url) });
    }
    if (!track) return items;
    push(track.coverThumb || track.cover, "480x480");
    push(track.cover, "1200x1200");
    push(track.coverPng, "1200x1200");
    push(track.coverJpeg || track.coverJpg, "1200x1200");
    return items;
  }

  function albumLine(track) {
    var title = (track && (track.releaseTitle || track.title)) || "";
    if (track && track.catalogue) return title + " · " + track.catalogue;
    return title;
  }

  function paintScrubA11y(cur, dur) {
    if (!ui) return;
    var text = fmt(cur) + " of " + fmt(dur);
    var nodes = [];
    if (ui.dock) nodes.push(ui.dock.querySelector(".vcr-player__scrub"));
    if (ui.stage) nodes.push(ui.stage.querySelector(".vcr-stage__scrub"));
    var room = getRoom();
    if (room) nodes.push(room.querySelector("[data-room-scrub]"));
    nodes.forEach(function (el) {
      if (!el) return;
      el.setAttribute("aria-valuetext", text);
    });
  }

  function announceTrack(track) {
    if (!ui || !ui.dock || !track) return;
    var live = ui.dock.querySelector("[data-player-live]");
    if (!live) return;
    var key = (track.releaseId || "") + ":" + (track.id || "");
    if (live.getAttribute("data-announced") === key) return;
    live.setAttribute("data-announced", key);
    var n = Number(track.trackNum) || 1;
    var of = Number(track.tracksCount) || 0;
    var line = "Now playing " + (track.title || "track");
    if (track.catalogue) line += " — " + track.catalogue;
    if (of) line += ", track " + n + " of " + of;
    live.textContent = line;
  }

  var mediaTrackKey = "";
  var mediaHandlersBound = false;
  var lastPositionAt = 0;

  function seekBy(delta) {
    var track = current();
    delta = Number(delta) || 0;
    if (isScTrack(track) && scWidget) {
      var next = Math.max(0, (scPosition || 0) + delta);
      if (scDuration) next = Math.min(scDuration, next);
      scPosition = next;
      try { scWidget.seekTo(next * 1000); } catch (e) {}
      paintScClock();
      return;
    }
    if (!audio) return;
    var dur = audio.duration;
    var cap = track && track.isPreview ? Number(track.previewDuration) || 0 : 0;
    if (cap) dur = cap;
    var t = (audio.currentTime || 0) + delta;
    if (t < 0) t = 0;
    if (isFinite(dur) && dur > 0 && t > dur) t = dur;
    try { audio.currentTime = t; } catch (e) {}
  }

  function seekToSec(t) {
    var track = current();
    t = Math.max(0, Number(t) || 0);
    if (isScTrack(track) && scWidget) {
      if (scDuration) t = Math.min(scDuration, t);
      scPosition = t;
      try { scWidget.seekTo(t * 1000); } catch (e) {}
      paintScClock();
      return;
    }
    if (!audio) return;
    var dur = audio.duration;
    if (isFinite(dur) && dur > 0) t = Math.min(dur, t);
    try { audio.currentTime = t; } catch (e) {}
  }

  function bindMediaSession() {
    if (mediaHandlersBound || !("mediaSession" in navigator)) return;
    mediaHandlersBound = true;
    var ms = navigator.mediaSession;
    function setHandler(name, fn) {
      try { ms.setActionHandler(name, fn); } catch (e) {}
    }
    setHandler("play", function () { play(); });
    setHandler("pause", function () { pause(); });
    setHandler("previoustrack", function () { prev(); });
    setHandler("nexttrack", function () { next(true); });
    setHandler("seekto", function (details) {
      if (details && details.seekTime != null) seekToSec(details.seekTime);
    });
    setHandler("seekbackward", function (details) {
      seekBy(-((details && details.seekOffset) || 10));
    });
    setHandler("seekforward", function (details) {
      seekBy((details && details.seekOffset) || 10);
    });
  }

  function publishPosition(cur, dur) {
    if (!("mediaSession" in navigator) || !navigator.mediaSession.setPositionState) return;
    if (!isFinite(dur) || dur <= 0 || !isFinite(cur) || cur < 0) return;
    var now = Date.now();
    if (now - lastPositionAt < 1000) return;
    lastPositionAt = now;
    var pos = Math.min(cur, dur);
    try {
      navigator.mediaSession.setPositionState({
        duration: dur,
        playbackRate: audio && isFinite(audio.playbackRate) ? audio.playbackRate || 1 : 1,
        position: pos,
      });
    } catch (e) {}
  }

  function updateMediaSession(track, playing) {
    if (!("mediaSession" in navigator) || !track) return;
    bindMediaSession();
    try {
      var key = (track.releaseId || "") + ":" + (track.id || "");
      if (key !== mediaTrackKey) {
        mediaTrackKey = key;
        lastPositionAt = 0;
        var art = artworkFor(track);
        var metaInit = {
          title: track.title || "",
          artist: track.artist || "",
          album: albumLine(track),
        };
        if (art.length) metaInit.artwork = art;
        navigator.mediaSession.metadata = new MediaMetadata(metaInit);
      }
      navigator.mediaSession.playbackState = playing ? "playing" : "paused";
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
    if (i < 0 || i >= queue.length) return Promise.resolve(null);
    clearBumper();
    hidePreviewError();
    index = i;
    meterHeld = false;
    var track = queue[index];
    if (isScTrack(track)) return loadSoundCloud(track, !!autoplay);
    pauseSoundCloud();
    ensureAudio();
    var playSrc = track.src;
    if (!playSrc) {
      showPreviewError(previewErrorMessage(track), track);
      return Promise.resolve(null);
    }
    try {
      var abs = new URL(playSrc, window.location.origin).href;
      if (audio.error || audio.src !== abs) audio.src = playSrc;
    } catch (e) {
      audio.src = playSrc;
    }
    render();
    emit();
    setDeepLink(track, true);
    if (autoplay) return safePlay().then(function () { return current(); });
    return Promise.resolve(current());
  }

  function applyRelease(catalog, releaseId, trackId, opts) {
    var release = (catalog.releases || []).find(function (r) {
      return r.id === releaseId;
    });
    if (!release) {
      showPreviewError("Release is not in the library.");
      return Promise.resolve(null);
    }
    var nextQueue = buildQueueFromRelease(release);
    if (!nextQueue.length) {
      showPreviewError(previewErrorMessage(), { releaseId: release.id, title: release.title });
      return Promise.resolve(null);
    }
    if (!trackId) {
      if (release.previewTrackId) trackId = release.previewTrackId;
      else {
        var flagged = (release.tracks || []).find(function (t) {
          return t && t.previewTrack;
        });
        if (flagged) trackId = flagged.id;
      }
    }
    var i = 0;
    if (trackId) {
      var found = nextQueue.findIndex(function (t) {
        return t.id === trackId;
      });
      if (found < 0) {
        var listed = (release.tracks || []).find(function (t) {
          return t.id === trackId;
        });
        showPreviewError(previewErrorMessage(), listed || { releaseId: release.id, title: release.title });
        return Promise.resolve(null);
      }
      i = found;
    }
    queue = nextQueue;
    index = i;
    if (opts.stage && getRoom()) openRoom({ scroll: opts.scroll !== false });
    return loadTrack(i, opts.autoplay !== false);
  }

  function playRelease(releaseId, trackId, opts) {
    opts = opts || {};
    if (!restoreLock) playIntent = opts.autoplay !== false;
    pauseSoundCloud();
    // Keep the user-gesture chain intact for iOS Safari by creating Audio now
    // and applying a cached catalog synchronously when available.
    unlockAudioFromGesture();
    if (opts.autoplay !== false) primePlayback(releaseId, trackId);
    if (catalogCache) {
      return applyRelease(catalogCache, releaseId, trackId, opts);
    }
    return loadCatalog()
      .then(function (catalog) {
        return applyRelease(catalog, releaseId, trackId, opts);
      })
      .catch(function () {
        notify("Could not load the catalog.", true);
        return null;
      });
  }

  function play() {
    var track = current();
    if (!track) return;
    playIntent = true;
    tapResume = false;
    if (ui && ui.dock) ui.dock.classList.remove("is-tap-resume", "is-tap-pulse");
    if (signalLost && !isScTrack(track)) {
      retryStream();
      return;
    }
    if (isScTrack(track)) {
      if (scWidget && scReady && scLoaded === track.permalink) {
        scWidget.play();
        armScTap(track, scSeq);
      } else loadSoundCloud(track, true);
      return;
    }
    ensureAudio();
    safePlay();
  }

  function pause() {
    pauseSoundCloud();
    if (!restoreLock) playIntent = false;
    tapResume = false;
    if (ui && ui.dock) ui.dock.classList.remove("is-tap-resume", "is-tap-pulse");
    if (audio) audio.pause();
    render();
    persist();
    emit();
  }

  function toggle() {
    if (!current()) {
      playRelease("j-adore", null, { autoplay: true, stage: false });
      return;
    }
    if (isScTrack(current())) {
      if (scPlaying) pause();
      else play();
      return;
    }
    if (!audio) return;
    if (audio.paused) play();
    else pause();
  }

  function next(autoplay) {
    if (index < queue.length - 1) {
      var nxt = queue[index + 1];
      if (isScTrack(nxt)) {
        index = index + 1;
        loadSoundCloud(nxt, autoplay !== false);
        return;
      }
      pauseSoundCloud();
      loadTrack(index + 1, autoplay !== false);
    } else pause();
  }

  function prev() {
    var track = current();
    if (isScTrack(track) && scPosition > 3) {
      if (scWidget) scWidget.seekTo(0);
      return;
    }
    if (audio && !isScTrack(track) && audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    if (index > 0) {
      var prv = queue[index - 1];
      if (isScTrack(prv)) {
        index = index - 1;
        loadSoundCloud(prv, true);
        return;
      }
      pauseSoundCloud();
      loadTrack(index - 1, true);
    }
  }

  function clearMediaSession() {
    mediaTrackKey = "";
    lastPositionAt = 0;
    if (!("mediaSession" in navigator)) return;
    try {
      navigator.mediaSession.metadata = null;
      navigator.mediaSession.playbackState = "none";
    } catch (e) {}
  }

  function stop(hide) {
    pauseSoundCloud();
    playIntent = false;
    tapResume = false;
    signalLost = false;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
    if (hide) {
      queue = [];
      index = -1;
      clearMediaSession();
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

  function formatPrice(n, sku) {
    if (n == null || !isFinite(Number(n))) return "";
    if (Number(n) === 0) return "";
    var v = Number(n);
    if (window.ClubMember && typeof window.ClubMember.displayPrice === "function") {
      v = window.ClubMember.displayPrice(v, sku);
    }
    return " · $" + Number(v).toFixed(2);
  }

  function renderStageFormats(track) {
    if (!ui || !ui.stage || !track) return;
    var wrap = ui.stage.querySelector("[data-stage-formats]");
    if (!wrap) return;
    var html = "";
    function label(format, base) {
      if (formatFlash === format) return "Added ✓";
      return base;
    }
    if (track.digitalSku) {
      var digitalLabel = Number(track.digitalPrice) === 0
        ? "Free download"
        : "Digital" + formatPrice(track.digitalPrice, track.digitalSku);
      html += '<button type="button" class="vcr-stage__fmt" data-act="buy-format" data-format="digital">' +
        label("digital", digitalLabel) + "</button>";
    }
    if (track.cassetteSku) {
      var cassOut = track.cassetteStock != null && track.cassetteStock <= 0;
      var cassLabel = cassOut
        ? "Cassette · Sold out"
        : (track.cassetteBackorder ? "Cassette backorder" : "Cassette") + formatPrice(track.cassettePrice, track.cassetteSku);
      html += '<button type="button" class="vcr-stage__fmt" data-act="buy-format" data-format="cassette"' +
        (cassOut ? " disabled" : "") + ">" +
        label("cassette", cassLabel) +
        "</button>";
    }
    if (track.vinylSku) {
      var vynOut = track.vinylStock != null && track.vinylStock <= 0;
      html += '<button type="button" class="vcr-stage__fmt" data-act="buy-format" data-format="vinyl"' +
        (vynOut ? " disabled" : "") + ">" +
        label("vinyl", vynOut ? "Vinyl · Sold out" : "Vinyl" + formatPrice(track.vinylPrice, track.vinylSku)) +
        "</button>";
    }
    wrap.innerHTML = html;
  }

  function openStage() {
    /* The aluminum dock is the only player. The sheet stays closed. */
    return;
  }

  function closeStage() {
    stageOpen = false;
    if (ui) ui.stage.hidden = true;
    document.body.classList.remove("vcr-stage-open");
    if (current()) setDeepLink(current(), true);
    syncDockAway();
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
    observeListeningRoom();
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
    syncDockAway();
    render();
    emit();
  }

  function closeRoom() {
    var room = getRoom();
    roomOpen = false;
    if (room) room.classList.remove("is-live");
    setRoomFormatsOpen(false);
    document.body.classList.remove("listening-room-live");
    unobserveListeningRoom();
    if (current()) setDeepLink(current(), true);
    syncDockAway();
    emit();
  }

  function bindListenUI(root) {
    root = root || document;
    if (listenBound && root === document) return;
    if (root === document) listenBound = true;
    root.addEventListener("click", function (e) {
      var el = e.target.closest("[data-play-release]");
      if (!el || !root.contains(el)) return;
      if (el.hasAttribute("data-desk-option") || el.closest("[data-desk-option]")) return;
      e.preventDefault();
      e.stopPropagation();
      unlockAudioFromGesture();
      var releaseId = el.getAttribute("data-play-release");
      var trackId = el.getAttribute("data-play-track");
      var wantStage = el.hasAttribute("data-play-stage");
      var cur = current();
      if (cur && cur.releaseId === releaseId && (!trackId || cur.id === trackId)) {
        if (wantStage && getRoom() && !roomOpen) openRoom({ scroll: true });
        else toggle();
        return;
      }
      playRelease(releaseId, trackId || null, {
        autoplay: true,
        stage: wantStage,
      });
    });
  }

  function paintSavedDock(saved) {
    if (!saved || !saved.releaseId) return;
    ensureUI();
    var dock = ui.dock;
    dock.classList.add("is-visible");
    document.body.classList.add("has-vcr-player");
    var art = dock.querySelector(".vcr-player__art");
    if (art && saved.cover) {
      art.src = absoluteAsset(saved.cover);
      art.alt = "";
    }
    var title = dock.querySelector(".vcr-player__title");
    if (title) title.textContent = saved.title || "";
    var sub = dock.querySelector(".vcr-player__sub");
    if (sub) {
      sub.hidden = false;
      sub.textContent = saved.artist && saved.releaseTitle
        ? saved.artist + " — " + saved.releaseTitle
        : (saved.artist || saved.releaseTitle || "");
    }
    var meta = dock.querySelector("[data-lcd-meta]");
    if (meta) {
      var fake = {
        catalogue: saved.catalogue,
        trackNum: saved.trackNum,
        tracksCount: saved.tracksCount,
      };
      meta.textContent = dockLcdMeta(fake);
    }
    var led = dock.querySelector("[data-lcd-led]");
    if (led) led.textContent = saved.intent ? "ON AIR" : "STANDBY";
    if (saved.time) {
      var cur = dock.querySelector("[data-cur]");
      if (cur) cur.textContent = fmt(saved.time);
    }
    measureDock();
  }

  function seekWhenReady(time) {
    if (!audio || !time) return Promise.resolve();
    return new Promise(function (resolve) {
      var done = false;
      var apply = function () {
        if (done) return;
        done = true;
        try {
          var dur = audio.duration;
          var t = Number(time) || 0;
          if (isFinite(dur) && dur > 0) t = Math.min(t, Math.max(0, dur - 0.25));
          audio.currentTime = t;
        } catch (e) {}
        resolve();
      };
      if (audio.readyState >= 1) apply();
      else {
        audio.addEventListener("loadedmetadata", apply, { once: true });
        setTimeout(apply, 1600);
      }
    });
  }

  function savedIntent(saved) {
    if (!saved) return false;
    if (typeof saved.intent === "boolean") return saved.intent;
    return !!saved.playing;
  }

  function finishRestore(saved) {
    restoreLock = false;
    if (!savedIntent(saved)) {
      playIntent = false;
      persist();
      render();
      return;
    }
    playIntent = true;
    pendingRestorePlay = true;
    var pending = safePlay();
    if (pending && pending.then) {
      pending.then(function () {
        if (audio && audio.paused && !isScTrack(current())) showTapResume();
        persist();
      });
    } else persist();
  }

  function restoreMix(saved) {
    var list = saved.queue && saved.queue.length ? saved.queue : [saved];
    queue = list.filter(function (item) {
      return item && (item.permalink || saved.permalink);
    }).map(function (item) {
      return mixToTrack({
        id: item.id || item.trackId || saved.trackId,
        title: item.title || saved.title,
        dj: item.artist || item.dj || saved.artist,
        cover: item.cover || saved.cover,
        permalink: item.permalink || saved.permalink,
        year: item.year || saved.year,
      });
    });
    if (!queue.length) {
      restoreLock = false;
      return Promise.resolve();
    }
    index = 0;
    var i;
    for (i = 0; i < queue.length; i++) {
      if (queue[i].id === saved.trackId) index = i;
    }
    scPosition = Number(saved.time) || 0;
    return loadSoundCloud(queue[index], false).then(function () {
      var seekMix = function () {
        if (!saved.time || !scWidget) return;
        try { scWidget.seekTo(Number(saved.time) * 1000); } catch (e) {}
      };
      if (scReady) seekMix();
      else setTimeout(seekMix, 700);
      restoreLock = false;
      if (savedIntent(saved)) {
        playIntent = true;
        play();
      } else {
        playIntent = false;
        render();
      }
      persist();
    });
  }

  function hydrateFromURL() {
    var params = new URLSearchParams(window.location.search);
    var playId = params.get("play");
    var trackId = params.get("t");
    var stage = params.get("stage") === "1";
    if (playId && playId !== "mixes") {
      playIntent = true;
      return playRelease(playId, trackId, { autoplay: true, stage: stage });
    }
    var saved = readPersist();
    if (!saved || !saved.releaseId) return Promise.resolve();
    if (playId === "mixes" && saved.releaseId !== "mixes" && saved.kind !== "mix") {
      return Promise.resolve();
    }
    playIntent = savedIntent(saved);
    restoreLock = true;
    paintSavedDock(saved);
    if (saved.kind === "mix" || saved.releaseId === "mixes" || playId === "mixes") {
      return restoreMix(saved);
    }
    return playRelease(saved.releaseId, saved.trackId, { autoplay: false, stage: false }).then(function () {
      return seekWhenReady(saved.time || 0);
    }).then(function () {
      finishRestore(saved);
    });
  }

  function getState() {
    var track = current();
    return {
      track: track,
      nextTrack: peekNext(),
      playing: isPlayingNow(),
      currentTime: isScTrack(track) ? scPosition : audio ? audio.currentTime : 0,
      duration: isScTrack(track) ? scDuration : audio ? audio.duration || 0 : 0,
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
    measureDock();
    window.addEventListener("resize", measureDock);
    hydrateFromURL();
    var room = document.getElementById("room");
    if (!room || !room.hasAttribute("data-ipod")) {
      var featured = document.querySelector("[data-room-art]");
      if (featured && featured.getAttribute("src")) sampleCover(featured.getAttribute("src"));
    }
  }

  window.VCRPlayer = {
    playRelease: playRelease,
    playMix: playMix,
    warmMix: warmSoundCloud,
    notify: notify,
    trackPlayable: trackPlayable,
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
      var track = current();
      if (isScTrack(track) && scWidget) {
        scWidget.seekTo(Number(t) * 1000);
        return;
      }
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
      return ensureAudio();
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
