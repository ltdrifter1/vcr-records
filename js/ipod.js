/* Club Copy — 4th-gen Click Wheel OS for the hero iPod. */
(function () {
  "use strict";

  var hero = document.getElementById("room");
  if (!hero) return;

  var FEATURED = {
    releaseId: "the-process",
    title: "The Process",
    artist: "Molly Haze",
    track: "Radio Edit",
    page: "/the-process",
    sku: "dg-the-process",
    price: 1.5,
    cover: "the-process-cover.webp",
    bandcampTrackId: "574430890",
  };

  var BANDCAMP_SRC =
    "https://bandcamp.com/EmbeddedPlayer/track=" +
    FEATURED.bandcampTrackId +
    "/size=small/bgcol=ffffff/linkcol=0687f5/tracklist=false/artwork=none/transparent=true/autoplay=true/";

  var TICK = Math.PI / 10;
  var WHEEL_LINE = 36;
  var ALERT_MS = 1400;

  var SCREENS = {
    main: {
      title: "iPod",
      items: [
        { id: "music", label: "Music", kind: "drill", screen: "music" },
        { id: "process", label: "The Process", kind: "play" },
        { id: "buy", label: "Buy Now", kind: "buy", price: "$1.50" },
        { id: "shop", label: "Shop", kind: "drill", screen: "shop" },
        { id: "now", label: "Now Playing", kind: "now" },
      ],
    },
    music: {
      title: "Music",
      items: [
        { id: "process-album", label: "The Process", kind: "play" },
        { id: "radio", label: "Radio Edit", kind: "play" },
      ],
    },
    shop: {
      title: "Shop",
      items: [
        { id: "buy-digital", label: "Buy Now", kind: "buy", price: "$1.50" },
        { id: "details", label: "Details", kind: "link", href: FEATURED.page },
      ],
    },
  };

  var listEl = hero.querySelector("[data-ipod-list]");
  var headerEl = hero.querySelector("[data-ipod-header]");
  var wheel = hero.querySelector("[data-ipod-wheel]");
  var hub = document.getElementById("ipodSelect");
  var playBtn = document.getElementById("heroPlayBtn");
  var buyBtn = hero.querySelector("[data-ipod-buy]");
  var bandcamp = document.getElementById("heroBandcamp");
  var alertEl = hero.querySelector("[data-ipod-alert]");
  var alertMsg = hero.querySelector("[data-ipod-alert-msg]");

  var stack = ["main"];
  var cursor = { main: 1, music: 0, shop: 0 };
  var view = "menu";
  var bcPlaying = false;
  var alertTimer = 0;
  var clickCtx = null;
  var wheelAcc = 0;
  var lineAcc = 0;
  var lastAngle = 0;
  var pointerId = null;
  var dragging = false;
  var startX = 0;
  var startY = 0;
  var suppressClick = false;

  function reduceMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function currentScreenId() {
    return stack[stack.length - 1];
  }

  function currentScreen() {
    return SCREENS[currentScreenId()] || SCREENS.main;
  }

  function items() {
    return currentScreen().items || [];
  }

  function selectedIndex() {
    var id = currentScreenId();
    var n = items().length;
    if (!n) return 0;
    var i = cursor[id] || 0;
    if (i < 0) i = 0;
    if (i >= n) i = n - 1;
    cursor[id] = i;
    return i;
  }

  function selectedItem() {
    return items()[selectedIndex()] || null;
  }

  function sitePlaying() {
    var state = window.VCRPlayer && VCRPlayer.getState && VCRPlayer.getState();
    return !!(state && state.playing);
  }

  function siteTrack() {
    var state = window.VCRPlayer && VCRPlayer.getState && VCRPlayer.getState();
    return state && state.track ? state.track : null;
  }

  function isAudible() {
    return bcPlaying || sitePlaying();
  }

  function money(n) {
    var v = Number(n);
    if (!isFinite(v)) return "";
    return Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/\.00$/, "");
  }

  function loadedOffer() {
    var track = siteTrack();
    if (track && track.digitalSku) {
      return {
        sku: track.digitalSku,
        name: (track.releaseTitle || track.title) + " — Digital",
        price: track.digitalPrice != null ? Number(track.digitalPrice) : FEATURED.price,
        image: track.cover || FEATURED.cover,
        page: track.page || FEATURED.page,
      };
    }
    return {
      sku: FEATURED.sku,
      name: FEATURED.title + " — Digital (Single)",
      price: FEATURED.price,
      image: FEATURED.cover,
      page: FEATURED.page,
    };
  }

  function setHeader(text) {
    if (headerEl) headerEl.textContent = text;
  }

  function setView(next) {
    view = next;
    hero.setAttribute("data-ipod-view", next);
    hero.classList.toggle("is-now-playing", next === "now");
    hero.classList.toggle("is-playing", isAudible());
    if (next === "now") setHeader("Now Playing");
    else if (next === "alert") setHeader(currentScreen().title || "iPod");
    else setHeader(currentScreen().title || "iPod");
  }

  function tickSound() {
    if (reduceMotion()) return;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      clickCtx = clickCtx || new AC();
      if (clickCtx.state === "suspended") clickCtx.resume();
      var o = clickCtx.createOscillator();
      var g = clickCtx.createGain();
      o.type = "square";
      o.frequency.value = 1850;
      g.gain.setValueAtTime(0.03, clickCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0008, clickCtx.currentTime + 0.028);
      o.connect(g);
      g.connect(clickCtx.destination);
      o.start();
      o.stop(clickCtx.currentTime + 0.03);
    } catch (e) {}
    if (navigator.vibrate) {
      try {
        navigator.vibrate(8);
      } catch (err) {}
    }
  }

  function renderList() {
    if (!listEl) return;
    var screen = currentScreen();
    var sel = selectedIndex();
    var html = "";
    screen.items.forEach(function (item, i) {
      var cls = "ipod-menu-item";
      if (item.kind === "play" || item.kind === "buy") cls += " ipod-menu-item--play";
      if (i === sel) cls += " is-selected";
      var price = item.price ? ' data-price="' + item.price + '"' : "";
      html +=
        '<button type="button" class="' +
        cls +
        '" role="option" aria-selected="' +
        (i === sel ? "true" : "false") +
        '" data-ipod-index="' +
        i +
        '"' +
        price +
        ">" +
        item.label +
        "</button>";
    });
    listEl.innerHTML = html;
    if (view === "menu") setHeader(screen.title);
    if (hero.matches(":focus-within")) {
      var selected = listEl.querySelector(".is-selected");
      if (selected) {
        try {
          selected.focus({ preventScroll: true });
        } catch (e) {
          selected.focus();
        }
      }
    }
  }

  function moveHighlight(delta) {
    if (view !== "menu") return;
    var n = items().length;
    if (!n) return;
    var id = currentScreenId();
    cursor[id] = (selectedIndex() + delta + n) % n;
    tickSound();
    renderList();
  }

  function pushScreen(id) {
    if (!SCREENS[id]) return;
    stack.push(id);
    if (cursor[id] == null) cursor[id] = 0;
    tickSound();
    renderList();
  }

  function goMenu() {
    if (alertTimer) {
      clearTimeout(alertTimer);
      alertTimer = 0;
      if (alertEl) alertEl.hidden = true;
    }
    if (view === "now" || view === "alert") {
      setView("menu");
      renderList();
      return;
    }
    if (stack.length > 1) {
      stack.pop();
      tickSound();
      renderList();
      setHeader(currentScreen().title);
      return;
    }
    renderList();
  }

  function showNowPlaying() {
    setView("now");
  }

  function showAlert(message) {
    if (alertMsg) alertMsg.textContent = message;
    if (alertEl) alertEl.hidden = false;
    setView("alert");
    clearTimeout(alertTimer);
    alertTimer = setTimeout(function () {
      alertTimer = 0;
      if (alertEl) alertEl.hidden = true;
      setView("menu");
      renderList();
    }, ALERT_MS);
  }

  function bcFrame() {
    return bandcamp && bandcamp.querySelector("iframe");
  }

  function bcCommand(cmd) {
    var frame = bcFrame();
    if (!frame || !frame.contentWindow) return;
    try {
      frame.contentWindow.postMessage(JSON.stringify({ command: cmd }), "https://bandcamp.com");
      frame.contentWindow.postMessage({ command: cmd }, "https://bandcamp.com");
    } catch (e) {}
  }

  function ensureBandcampPlayer() {
    if (!bandcamp) return null;
    var frame = bcFrame();
    if (!frame) {
      frame = document.createElement("iframe");
      frame.title = FEATURED.title;
      frame.setAttribute("allow", "autoplay; encrypted-media");
      frame.setAttribute("seamless", "");
      frame.src = BANDCAMP_SRC;
      bandcamp.appendChild(frame);
      frame.addEventListener("load", function () {
        if (bcPlaying) bcCommand("play");
      });
    }
    bandcamp.hidden = false;
    hero.classList.add("is-bandcamp");
    return frame;
  }

  function pauseBandcamp() {
    bcCommand("pause");
    bcPlaying = false;
    hero.classList.remove("is-bandcamp");
    if (!sitePlaying()) hero.classList.remove("is-playing");
    syncPlayUi();
  }

  function startBandcamp() {
    ensureBandcampPlayer();
    bcPlaying = true;
    hero.classList.add("is-bandcamp", "is-playing");
    bcCommand("play");
    showNowPlaying();
    syncPlayUi();
    syncTicker(true, FEATURED.artist + " — " + FEATURED.title);
  }

  function syncPlayUi() {
    var on = isAudible();
    hero.classList.toggle("is-playing", on);
    if (playBtn) {
      playBtn.setAttribute("aria-label", on ? "Pause " + FEATURED.title : "Play " + FEATURED.title);
      playBtn.classList.toggle("is-playing", on);
    }
    if (hub && view === "menu") hub.setAttribute("aria-label", "Select");
    else if (hub) hub.setAttribute("aria-label", on ? "Pause" : "Play " + FEATURED.title);
  }

  function syncTicker(playing, line) {
    var chip = document.querySelector("[data-ticker-chip]");
    var nowEl = document.querySelector("[data-ticker-now]");
    if (chip) {
      chip.textContent = playing ? "On air" : "Stand by";
      chip.classList.toggle("status-chip--air", !!playing);
      chip.classList.toggle("status-chip--standby", !playing);
    }
    if (!nowEl) return;
    if (playing && line) {
      nowEl.textContent = line;
      nowEl.hidden = false;
    } else if (!siteTrack()) {
      nowEl.textContent = "";
      nowEl.hidden = true;
    }
  }

  function playLoaded() {
    var track = siteTrack();
    if (track && window.VCRPlayer) {
      if (bcPlaying) pauseBandcamp();
      VCRPlayer.toggle();
      showNowPlaying();
      return;
    }
    if (bcPlaying) {
      pauseBandcamp();
      return;
    }
    if (window.VCRPlayer && VCRPlayer.playRelease) {
      Promise.resolve(
        VCRPlayer.playRelease(FEATURED.releaseId, null, { autoplay: true, stage: false })
      )
        .then(function (queued) {
          if (queued) {
            showNowPlaying();
            syncPlayUi();
            return;
          }
          startBandcamp();
        })
        .catch(function () {
          startBandcamp();
        });
      return;
    }
    startBandcamp();
  }

  function buyNow() {
    var offer = loadedOffer();
    if (!window.VCRCart) {
      window.location.href = offer.page + "#acquire";
      return;
    }
    VCRCart.add({
      sku: offer.sku,
      name: offer.name,
      price: offer.price,
      image: offer.image,
      qty: 1,
      id: offer.sku,
    });
    tickSound();
    if (buyBtn) {
      var orig = buyBtn.getAttribute("data-label") || buyBtn.textContent;
      buyBtn.setAttribute("data-label", orig);
      buyBtn.textContent = "Added ✓";
      clearTimeout(buyBtn._flash);
      buyBtn._flash = setTimeout(function () {
        buyBtn.textContent = orig;
      }, 1800);
    }
    showAlert("Added to Cart");
  }

  function activate(item) {
    if (!item) return;
    if (item.kind === "drill") {
      pushScreen(item.screen);
      return;
    }
    if (item.kind === "play") {
      playLoaded();
      return;
    }
    if (item.kind === "buy") {
      buyNow();
      return;
    }
    if (item.kind === "now") {
      showNowPlaying();
      return;
    }
    if (item.kind === "link" && item.href) {
      window.location.href = item.href;
    }
  }

  function selectCurrent() {
    if (view === "alert") {
      goMenu();
      return;
    }
    if (view === "now") {
      playLoaded();
      return;
    }
    activate(selectedItem());
  }

  function skip(dir) {
    if (view === "menu") {
      moveHighlight(dir);
      return;
    }
    var track = siteTrack();
    if (track && window.VCRPlayer) {
      if (dir < 0) VCRPlayer.prev();
      else VCRPlayer.next();
      return;
    }
    if (dir < 0 && bcPlaying) {
      var frame = bcFrame();
      if (frame) {
        frame.src = BANDCAMP_SRC;
        bcCommand("play");
      }
    }
  }

  function angleFromEvent(e) {
    var rect = wheel.getBoundingClientRect();
    return Math.atan2(
      e.clientY - (rect.top + rect.height / 2),
      e.clientX - (rect.left + rect.width / 2)
    );
  }

  function sectorAct(e) {
    if (!wheel) return;
    var rect = wheel.getBoundingClientRect();
    var dx = e.clientX - (rect.left + rect.width / 2);
    var dy = e.clientY - (rect.top + rect.height / 2);
    var r = Math.sqrt(dx * dx + dy * dy);
    var maxR = rect.width / 2;
    if (r < maxR * 0.31) {
      selectCurrent();
      return;
    }
    var a = Math.atan2(dy, dx);
    if (a >= -Math.PI * 0.75 && a < -Math.PI * 0.25) goMenu();
    else if (a >= -Math.PI * 0.25 && a < Math.PI * 0.25) skip(1);
    else if (a >= Math.PI * 0.25 && a < Math.PI * 0.75) playLoaded();
    else skip(-1);
  }

  var pointerActive = false;

  function onWheelPointerDown(e) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    pointerActive = true;
    pointerId = e.pointerId;
    dragging = false;
    suppressClick = false;
    wheelAcc = 0;
    startX = e.clientX;
    startY = e.clientY;
    lastAngle = angleFromEvent(e);
  }

  function onWindowPointerMove(e) {
    if (!pointerActive || e.pointerId !== pointerId) return;
    var dx = e.clientX - startX;
    var dy = e.clientY - startY;
    if (!dragging && dx * dx + dy * dy > 64) dragging = true;
    if (!dragging) return;
    var angle = angleFromEvent(e);
    var delta = angle - lastAngle;
    if (delta > Math.PI) delta -= Math.PI * 2;
    if (delta < -Math.PI) delta += Math.PI * 2;
    lastAngle = angle;
    wheelAcc += delta;
    while (wheelAcc > TICK) {
      wheelAcc -= TICK;
      if (view === "menu") moveHighlight(1);
    }
    while (wheelAcc < -TICK) {
      wheelAcc += TICK;
      if (view === "menu") moveHighlight(-1);
    }
  }

  function onWindowPointerUp(e) {
    if (!pointerActive || e.pointerId !== pointerId) return;
    pointerActive = false;
    pointerId = null;
    if (dragging) {
      suppressClick = true;
      dragging = false;
      setTimeout(function () {
        suppressClick = false;
      }, 80);
      return;
    }
    dragging = false;
  }

  function onWheelClickCapture(e) {
    if (suppressClick) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    if (e.target && e.target.closest("button")) return;
    e.preventDefault();
    e.stopPropagation();
    sectorAct(e);
  }

  function onWheelScroll(e) {
    e.preventDefault();
    lineAcc += e.deltaY;
    while (lineAcc > WHEEL_LINE) {
      lineAcc -= WHEEL_LINE;
      if (view === "menu") moveHighlight(1);
    }
    while (lineAcc < -WHEEL_LINE) {
      lineAcc += WHEEL_LINE;
      if (view === "menu") moveHighlight(-1);
    }
  }

  function onHeroClick(e) {
    if (suppressClick) return;
    var buy = e.target.closest("[data-ipod-buy]");
    if (buy) {
      e.preventDefault();
      e.stopPropagation();
      buyNow();
      return;
    }
    var row = e.target.closest("[data-ipod-index]");
    if (row && listEl && listEl.contains(row)) {
      e.preventDefault();
      e.stopPropagation();
      cursor[currentScreenId()] = Number(row.getAttribute("data-ipod-index")) || 0;
      renderList();
      activate(selectedItem());
      return;
    }
    var btn = e.target.closest("[data-act]");
    if (!btn || !hero.contains(btn)) return;
    var act = btn.getAttribute("data-act");
    if (act === "ipod-menu") {
      e.preventDefault();
      e.stopPropagation();
      goMenu();
    } else if (act === "ipod-prev") {
      e.preventDefault();
      e.stopPropagation();
      skip(-1);
    } else if (act === "ipod-next") {
      e.preventDefault();
      e.stopPropagation();
      skip(1);
    } else if (act === "ipod-select") {
      e.preventDefault();
      e.stopPropagation();
      selectCurrent();
    }
  }

  function onKey(e) {
    if (!hero.contains(document.activeElement) && document.activeElement !== document.body) {
      if (!wheel || !wheel.contains(document.activeElement)) return;
    }
    if (!hero.matches(":focus-within")) return;
    var tag = (e.target && e.target.tagName) || "";
    if (tag === "INPUT" || tag === "TEXTAREA" || (e.target && e.target.isContentEditable)) return;
    if (e.code === "ArrowDown" || e.code === "ArrowRight") {
      e.preventDefault();
      skip(1);
    } else if (e.code === "ArrowUp" || e.code === "ArrowLeft") {
      e.preventDefault();
      skip(-1);
    } else if (e.code === "Enter") {
      if (e.target && e.target.closest("[data-ipod-index], [data-ipod-buy], [data-act]")) return;
      e.preventDefault();
      selectCurrent();
    } else if (e.code === "Escape") {
      e.preventDefault();
      goMenu();
    } else if (e.code === "Space" && view === "menu") {
      if (e.target && e.target.closest("button, a")) return;
      e.preventDefault();
      playLoaded();
    }
  }

  function hydrateShopFromCatalog(catalog) {
    var release = (catalog.releases || []).find(function (r) {
      return r.id === FEATURED.releaseId;
    });
    if (!release || !release.formats) return;
    var digital = release.formats.digital;
    var cassette = release.formats.cassette;
    var vinyl = release.formats.vinyl;
    if (digital && digital.price != null) {
      FEATURED.price = Number(digital.price);
      FEATURED.sku = digital.sku || FEATURED.sku;
    }
    var priceLabel = FEATURED.price != null ? "$" + money(FEATURED.price) : "$1.50";
    SCREENS.main.items.forEach(function (item) {
      if (item.kind === "buy") item.price = priceLabel;
    });
    var shopItems = [{ id: "buy-digital", label: "Buy Now", kind: "buy", price: priceLabel }];
    if (cassette && cassette.sku) {
      shopItems.push({
        id: "buy-cassette",
        label: cassette.price != null ? "Cassette · $" + money(cassette.price) : "Cassette",
        kind: "buy",
      });
    }
    if (vinyl && vinyl.sku) {
      shopItems.push({
        id: "buy-vinyl",
        label: vinyl.price != null ? "Vinyl · $" + money(vinyl.price) : "Vinyl",
        kind: "buy",
      });
    }
    shopItems.push({ id: "details", label: "Details", kind: "link", href: FEATURED.page });
    SCREENS.shop.items = shopItems;
    if (buyBtn) {
      buyBtn.textContent = "Buy Now";
      buyBtn.setAttribute("data-price", priceLabel);
      buyBtn.setAttribute("data-label", "Buy Now");
    }
    if (view === "menu") renderList();
  }

  if (wheel) {
    wheel.addEventListener("pointerdown", onWheelPointerDown);
    window.addEventListener("pointermove", onWindowPointerMove);
    window.addEventListener("pointerup", onWindowPointerUp);
    window.addEventListener("pointercancel", onWindowPointerUp);
    wheel.addEventListener("click", onWheelClickCapture, true);
    wheel.addEventListener("wheel", onWheelScroll, { passive: false });
  }

  hero.addEventListener("click", onHeroClick, true);
  document.addEventListener("keydown", onKey);

  if (playBtn) {
    playBtn.addEventListener("click", function (e) {
      if (suppressClick) return;
      e.preventDefault();
      e.stopPropagation();
      playLoaded();
    });
  }
  if (hub) {
    hub.setAttribute("data-act", "ipod-select");
    hub.setAttribute("aria-label", "Select");
  }

  window.addEventListener("vcr:player", function (e) {
    var d = e.detail || {};
    if (d.playing && bcPlaying) pauseBandcamp();
    if (d.track && d.playing && view !== "menu") showNowPlaying();
    syncPlayUi();
    if (d.track && (d.track.title || d.track.releaseTitle)) {
      var line = d.track.artist ? d.track.artist + " — " : "";
      line += d.track.title || d.track.releaseTitle;
      if (d.playing) syncTicker(true, line);
    } else if (!bcPlaying) {
      syncTicker(false);
    }
  });

  fetch("/data/catalog.json")
    .then(function (r) {
      return r.ok ? r.json() : null;
    })
    .then(function (data) {
      if (data) hydrateShopFromCatalog(data);
    })
    .catch(function () {});

  setView("menu");
  renderList();
  syncPlayUi();
})();
