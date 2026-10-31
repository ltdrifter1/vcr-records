/* Club Copy — shared chrome (nav, drawer, reveals) */
(function () {
  var nav = document.getElementById('nav');
  var ham = document.getElementById('navHam');
  var drawer = document.getElementById('navDrawer');
  var scrim = document.getElementById('navScrim');

  function ensureScrim() {
    if (scrim) return scrim;
    scrim = document.createElement('div');
    scrim.id = 'navScrim';
    scrim.className = 'nav-scrim';
    scrim.setAttribute('aria-hidden', 'true');
    document.body.appendChild(scrim);
    scrim.addEventListener('click', closeDrawer);
    return scrim;
  }

  function openDrawer() {
    if (!drawer || !ham) return;
    ensureScrim();
    drawer.classList.add('on');
    ham.classList.add('on');
    if (scrim) scrim.classList.add('on');
    ham.setAttribute('aria-expanded', 'true');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('nav-open');
  }

  function closeDrawer() {
    if (!drawer || !ham) return;
    drawer.classList.remove('on');
    ham.classList.remove('on');
    if (scrim) scrim.classList.remove('on');
    ham.setAttribute('aria-expanded', 'false');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('nav-open');
  }

  function toggleDrawer() {
    if (drawer && drawer.classList.contains('on')) closeDrawer();
    else openDrawer();
  }

  if (ham && drawer) {
    ensureScrim();
    ham.addEventListener('click', toggleDrawer);
    drawer.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', closeDrawer);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeDrawer();
    });
  }

  if (nav) {
    var ticking = false;
    function syncNav() {
      nav.classList.toggle('scrolled', window.scrollY > 24);
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(syncNav);
    }, { passive: true });
    syncNav();
  }

  /* Homepage zine posts — newest first. */
  var newsTrack = document.querySelector('[data-zine-posts], .news-rail-track, .newsprint-grid');
  if (newsTrack) {
    var newsCards = Array.prototype.slice.call(newsTrack.querySelectorAll('.news-card, .zine-post'));
    newsCards.sort(function (a, b) {
      return (b.getAttribute('data-date') || '').localeCompare(a.getAttribute('data-date') || '');
    });
    newsCards.forEach(function (card) { newsTrack.appendChild(card); });
  }

  var zineDate = document.querySelector('[data-zine-date], [data-newsprint-date]');
  if (zineDate) {
    try {
      zineDate.textContent = new Date().toLocaleDateString('en-GB', {
        weekday: 'short', day: '2-digit', month: 'short', year: '2-digit'
      }).toLowerCase().replace(/,/g, '');
    } catch (e) {}
  }

    function injectMixesNav() {
    var href = '/tapes';
    var label = 'Mixtapes';
    function hasMix(container) {
      return !!(container && container.querySelector('a[href="/tapes"], a[href="/mixtapes"]'));
    }
    function makeLink() {
      var a = document.createElement('a');
      a.href = href;
      a.textContent = label;
      var p = (location.pathname || '/').replace(/\/index\.html$/, '/');
      if (p === '/tapes' || p === '/mixtapes') a.setAttribute('aria-current', 'page');
      return a;
    }
    function insert(container) {
      if (!container || hasMix(container)) return;
      var a = makeLink();
      var artists = container.querySelector('a[href="/artists"]');
      var zine = container.querySelector('a[href="/news"]');
      var after = artists || container.querySelector('a[href="/library"]');
      if (after && after.nextSibling) container.insertBefore(a, after.nextSibling);
      else if (zine) container.insertBefore(a, zine);
      else container.appendChild(a);
    }
    document.querySelectorAll('.nav-links, .nav-drawer, .footer-links').forEach(insert);
  }
  injectMixesNav();

  function injectAccountNav() {
    var end = document.querySelector('.nav-end');
    if (end && !document.getElementById('navAccount')) {
      var a = document.createElement('a');
      a.id = 'navAccount';
      a.className = 'nav-account';
      a.href = '/account';
      a.setAttribute('aria-label', 'Account');
      a.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">' +
          '<circle cx="12" cy="8" r="3.15"/>' +
          '<path d="M5.4 19.1c1-3.1 3.5-4.8 6.6-4.8s5.6 1.7 6.6 4.8"/>' +
        '</svg>';
      var cart = end.querySelector('.nav-cart');
      if (cart) end.insertBefore(a, cart);
      else end.appendChild(a);
    }
    var drawer = document.getElementById('navDrawer');
    if (drawer && !drawer.querySelector('a[href="/account"]')) {
      var da = document.createElement('a');
      da.href = '/account';
      da.textContent = 'Account';
      var contact = drawer.querySelector('a[href="/contact"]');
      if (contact) drawer.insertBefore(da, contact);
      else drawer.appendChild(da);
    }
  }
  injectAccountNav();

  function ensureDrawerNow() {
    var drawer = document.getElementById("navDrawer");
    if (!drawer || document.getElementById("drawerNow")) return;
    var line = document.createElement("p");
    line.id = "drawerNow";
    line.className = "drawer-now";
    line.hidden = true;
    drawer.insertBefore(line, drawer.firstChild);
  }
  ensureDrawerNow();

  window.addEventListener("vcr:player", function (e) {
    var line = document.getElementById("drawerNow");
    if (!line) return;
    var d = e.detail || {};
    var track = d.track;
    if (d.playing && track && (track.title || track.releaseTitle)) {
      var no = Number(track.trackNum) || 1;
      var idx = (no < 10 ? "0" : "") + no;
      var title = track.title || track.releaseTitle;
      line.textContent = idx + "  ·  " + (track.artist ? track.artist + " — " : "") + title;
      line.hidden = false;
    } else {
      line.textContent = "";
      line.hidden = true;
    }
  });

  if ('IntersectionObserver' in window) {
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.rv').forEach(function (el) { obs.observe(el); });
  } else {
    document.querySelectorAll('.rv').forEach(function (el) { el.classList.add('in'); });
  }

  /* Conditions bar: Cumberland time, Long Beach surf, day or night.
     Long Beach is the Pacific Rim beach west of Tofino — swell from the
     marine API, wind from the forecast API, tide from the Tofino gauge
     via OpenWaters. Day or night stays in this browser. */
  var SKY_TZ = "America/Vancouver";
  var SURF_MARINE = "https://marine-api.open-meteo.com/v1/marine?latitude=49.059&longitude=-125.768&current=wave_height,wave_period,wave_direction,swell_wave_height,swell_wave_period,swell_wave_direction&hourly=swell_wave_height,swell_wave_period,wave_height,wave_period&timezone=America%2FVancouver&forecast_days=2&length_unit=imperial";
  var SURF_WIND = "https://api.open-meteo.com/v1/forecast?latitude=49.059&longitude=-125.768&current=wind_speed_10m,wind_direction_10m,wind_gusts_10m&wind_speed_unit=kn&timezone=America%2FVancouver&forecast_days=1";
  /* Tofino gauge, the table Long Beach uses. Not the CHS host — that certificate does not load in Chrome. */
  var TIDE_BASE = "https://api.openwaters.io/tides/";
  var TIDE_LAT = "49.154";
  var TIDE_LON = "-125.913";
  var COMPASS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

  function readTheme() {
    var t = document.documentElement.getAttribute("data-theme");
    if (t === "day" || t === "night") return t;
    return "night";
  }

  function applyTheme(theme, persist) {
    if (theme !== "day" && theme !== "night") theme = "night";
    document.documentElement.setAttribute("data-theme", theme);
    var color = document.querySelector('meta[name="theme-color"]');
    if (color) color.setAttribute("content", theme === "day" ? "#f3efe6" : "#cfc6b8");
    var scheme = document.querySelector('meta[name="color-scheme"]');
    if (scheme) scheme.setAttribute("content", "light");
    var btn = document.getElementById("themeToggle");
    if (btn) {
      var night = theme === "night";
      btn.setAttribute("aria-pressed", night ? "true" : "false");
      btn.setAttribute("aria-label", night ? "Switch to day" : "Switch to night");
    }
    if (persist) {
      try { localStorage.setItem("cc.theme", theme); } catch (e) {}
    }
  }

  function skyMarkup() {
    return (
      '<p class="sky-live">' +
        '<a class="sky-home" href="/">clubcopy.ca</a>' +
        '<span>Cumberland</span>' +
        '<time data-sky-time>··:·· PT</time>' +
        '<span class="sky-surf" data-sky-surf hidden><span data-sky-surf-now></span><span class="sky-surf-cast" data-sky-surf-cast></span></span>' +
      '</p>' +
      '<button type="button" class="sky-theme" id="themeToggle" aria-pressed="true" aria-label="Switch colour mode">' +
        '<span class="sky-knob" aria-hidden="true"></span>' +
        '<span class="sky-theme-lab" aria-hidden="true"><span class="sky-lab-day">Day</span><span class="sky-lab-night">Night</span></span>' +
      '</button>'
    );
  }

  function ensureSky() {
    var bar = document.getElementById("sky");
    if (bar) return bar;
    var header = document.getElementById("nav");
    if (!header || !header.parentNode) return null;
    bar = document.createElement("div");
    bar.id = "sky";
    bar.className = "sky";
    bar.setAttribute("role", "region");
    bar.setAttribute("aria-label", "Cumberland time and Long Beach surf");
    bar.innerHTML = skyMarkup();
    header.parentNode.insertBefore(bar, header);
    return bar;
  }

  function tickClock(el) {
    if (!el || !window.Intl || !Intl.DateTimeFormat) return;
    var fmt;
    try {
      fmt = new Intl.DateTimeFormat("en-GB", {
        timeZone: SKY_TZ, hour: "2-digit", minute: "2-digit", hourCycle: "h23"
      });
    } catch (e) { return; }
    function paint() {
      var h = "";
      var m = "";
      try {
        fmt.formatToParts(new Date()).forEach(function (p) {
          if (p.type === "hour") h = p.value;
          if (p.type === "minute") m = p.value;
        });
      } catch (err) { return; }
      el.textContent = h + ":" + m + " PT";
      el.setAttribute("datetime", new Date().toISOString());
    }
    paint();
    setInterval(paint, 15000);
  }

  function compass(deg) {
    var d = ((Number(deg) % 360) + 360) % 360;
    if (!isFinite(d)) return "";
    return COMPASS[Math.round(d / 45) % 8];
  }

  function oneDecimal(n) {
    var v = Math.round(Number(n) * 10) / 10;
    if (!isFinite(v)) return "";
    return Math.abs(v - Math.round(v)) < 0.05 ? String(Math.round(v)) : v.toFixed(1);
  }

  /* Long Beach faces the Pacific, roughly west. Wind from the island is offshore. */
  function windSide(deg, kn) {
    if (!(kn >= 8)) return "";
    var d = ((Number(deg) % 360) + 360) % 360;
    if (d >= 30 && d <= 150) return "offshore";
    if (d >= 210 && d <= 330) return "onshore";
    return "cross";
  }

  function clockPT(date) {
    try {
      var h = "";
      var m = "";
      new Intl.DateTimeFormat("en-GB", {
        timeZone: SKY_TZ, hour: "2-digit", minute: "2-digit", hourCycle: "h23"
      }).formatToParts(date).forEach(function (p) {
        if (p.type === "hour") h = p.value;
        if (p.type === "minute") m = p.value;
      });
      return h && m ? h + ":" + m : "";
    } catch (e) { return ""; }
  }

  function localStamp(date) {
    try {
      var parts = {};
      new Intl.DateTimeFormat("en-CA", {
        timeZone: SKY_TZ, year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", hourCycle: "h23"
      }).formatToParts(date).forEach(function (p) { parts[p.type] = p.value; });
      return parts.year + "-" + parts.month + "-" + parts.day + "T" + parts.hour + ":" + parts.minute;
    } catch (e) { return ""; }
  }

  function primarySea(swellFt, swellPeriod, waveFt, wavePeriod, waveDir, swellDir) {
    var swell = Number(swellFt);
    var wave = Number(waveFt);
    var useSwell = isFinite(swell) && (!isFinite(wave) || swell >= wave * 0.55);
    var ft = useSwell ? swell : wave;
    if (!isFinite(ft)) return null;
    return {
      ft: ft,
      period: Number(useSwell ? swellPeriod : wavePeriod),
      dir: Number(useSwell ? swellDir : waveDir),
      kind: useSwell ? "swell" : "seas"
    };
  }

  /* Hourly heights for the next day, in the same series as the reading
     on screen. Mixing swell and total sea makes the line jump. */
  function forecastSlots(hourly, currentTime, kind) {
    if (!hourly || !hourly.time || !currentTime) return [];
    var heights = kind === "seas" ? hourly.wave_height : hourly.swell_wave_height;
    if (!heights) return [];
    var out = [];
    var i;
    for (i = 0; i < hourly.time.length; i++) {
      if (hourly.time[i] <= currentTime) continue;
      var ft = Number(heights[i]);
      if (!isFinite(ft)) continue;
      out.push({
        hour: hourly.time[i].slice(11, 13),
        ft: ft
      });
      if (out.length === 24) break;
    }
    return out;
  }

  function aheadSummary(slots) {
    if (!slots || !slots.length) return "";
    var lo = slots[0].ft;
    var hi = slots[0].ft;
    var hiAt = slots[0];
    var i;
    for (i = 1; i < slots.length; i++) {
      if (slots[i].ft < lo) lo = slots[i].ft;
      if (slots[i].ft > hi) { hi = slots[i].ft; hiAt = slots[i]; }
    }
    var span = Math.abs(hi - lo) < 0.15 ? oneDecimal(hi) + " ft" : oneDecimal(lo) + "–" + oneDecimal(hi) + " ft";
    var text = "Next day " + span;
    if (hiAt.hour && hi > lo + 0.15) text += ", highest " + hiAt.hour + ":00 PT";
    return text;
  }

  function waveLinePoints(heights) {
    var vals = [];
    var i;
    for (i = 0; i < heights.length; i++) {
      var n = Number(heights[i]);
      if (isFinite(n)) vals.push(n);
    }
    if (vals.length < 2) return "";
    var min = vals[0];
    var max = vals[0];
    for (i = 1; i < vals.length; i++) {
      if (vals[i] < min) min = vals[i];
      if (vals[i] > max) max = vals[i];
    }
    var span = max - min;
    if (span < 0.25) {
      min -= (0.25 - span) / 2;
      span = 0.25;
    }
    var w = 64;
    var h = 16;
    var padX = 1.5;
    var padY = 2;
    var parts = [];
    for (i = 0; i < vals.length; i++) {
      var x = padX + (i / (vals.length - 1)) * (w - padX * 2);
      var y = padY + (1 - (vals[i] - min) / span) * (h - padY * 2);
      parts.push(x.toFixed(2) + "," + y.toFixed(2));
    }
    return parts.join(" ");
  }

  function waveLine(heights, label) {
    var points = waveLinePoints(heights);
    if (!points) return null;
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "sky-surf-line");
    svg.setAttribute("viewBox", "0 0 64 16");
    svg.setAttribute("width", "64");
    svg.setAttribute("height", "12");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", label || "Wave height over the next day");
    var poly = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    poly.setAttribute("points", points);
    poly.setAttribute("fill", "none");
    poly.setAttribute("stroke", "currentColor");
    poly.setAttribute("stroke-width", "1.25");
    poly.setAttribute("stroke-linejoin", "round");
    poly.setAttribute("stroke-linecap", "round");
    svg.appendChild(poly);
    return svg;
  }

  function tideQuery(start, end) {
    return "latitude=" + TIDE_LAT + "&longitude=" + TIDE_LON +
      "&start=" + encodeURIComponent(start.toISOString()) +
      "&end=" + encodeURIComponent(end.toISOString());
  }

  function readTide(timeline, extremes, now) {
    var points = timeline && timeline.timeline;
    if (!points || !points.length) return null;
    if (timeline.distance != null && Number(timeline.distance) > 30) return null;
    var nowMs = now.getTime();
    var best = points[0];
    var bestDt = Infinity;
    var i;
    for (i = 0; i < points.length; i++) {
      var dt = Math.abs(Date.parse(points[i].time) - nowMs);
      if (dt < bestDt) { bestDt = dt; best = points[i]; }
    }
    var level = Number(best.level);
    if (!isFinite(level)) return null;
    var list = (extremes && extremes.extremes) || [];
    var next = null;
    for (i = 0; i < list.length; i++) {
      if (Date.parse(list[i].time) > nowMs + 60 * 1000) { next = list[i]; break; }
    }
    var trend = "";
    var kind = "";
    var when = "";
    if (next && isFinite(Number(next.level))) {
      var nv = Number(next.level);
      if (nv + 0.05 < level) trend = "falling";
      else if (nv > level + 0.05) trend = "rising";
      kind = next.high ? "high" : (next.low ? "low" : "");
      when = clockPT(new Date(next.time));
    }
    var name = (timeline.station && timeline.station.name) || "Tofino";
    return { m: level, trend: trend, kind: kind, when: when, station: name };
  }

  function surfHost(sky) {
    var el = sky.querySelector("[data-sky-surf]");
    if (el) return el;
    var moon = sky.querySelector("[data-sky-moon]");
    el = document.createElement("span");
    el.className = "sky-surf";
    el.setAttribute("data-sky-surf", "");
    el.hidden = true;
    var nowSpan = document.createElement("span");
    nowSpan.setAttribute("data-sky-surf-now", "");
    var cast = document.createElement("span");
    cast.className = "sky-surf-cast";
    cast.setAttribute("data-sky-surf-cast", "");
    el.appendChild(nowSpan);
    el.appendChild(cast);
    if (moon && moon.parentNode) moon.replaceWith(el);
    else {
      var live = sky.querySelector(".sky-live");
      if (live) live.appendChild(el);
    }
    return el;
  }

  function paintSurf(host, pack) {
    if (!host) return;
    var nowEl = host.querySelector("[data-sky-surf-now]");
    var castEl = host.querySelector("[data-sky-surf-cast]");
    if (!pack || !pack.nowText) {
      host.hidden = true;
      return;
    }
    if (nowEl) nowEl.textContent = pack.nowText;
    if (castEl) {
      while (castEl.firstChild) castEl.removeChild(castEl.firstChild);
      var line = pack.line && waveLine(pack.line, pack.lineLabel);
      if (line) castEl.appendChild(line);
    }
    host.hidden = false;
    host.title = pack.title || pack.nowText;
  }

  function grabJSON(url) {
    return fetch(url).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
  }

  function loadSurf(host) {
    if (!host || !window.fetch) return;
    var cached = null;
    try { cached = JSON.parse(sessionStorage.getItem("cc.surf.v3") || "null"); } catch (e) {}
    if (cached && cached.at && Date.now() - cached.at < (cached.ttl || 20 * 60 * 1000) && cached.nowText) {
      paintSurf(host, cached);
      return;
    }
    var now = new Date();
    var soon = new Date(now.getTime() + 20 * 60 * 1000);
    var later = new Date(now.getTime() + 30 * 60 * 60 * 1000);
    Promise.all([
      grabJSON(SURF_MARINE),
      grabJSON(SURF_WIND),
      grabJSON(TIDE_BASE + "timeline?" + tideQuery(now, soon)),
      grabJSON(TIDE_BASE + "extremes?" + tideQuery(now, later))
    ]).then(function (all) {
      var marine = all[0];
      var wind = all[1];
      var cur = marine && marine.current;
      var sea = cur && primarySea(cur.swell_wave_height, cur.swell_wave_period, cur.wave_height, cur.wave_period, cur.wave_direction, cur.swell_wave_direction);
      if (!sea) { paintSurf(host, null); return; }
      var bits = ["Long Beach " + oneDecimal(sea.ft) + " ft " + Math.round(sea.period || 0) + "s " + compass(sea.dir)];
      var windPhrase = "";
      var windCur = wind && wind.current;
      if (windCur && windCur.wind_speed_10m != null) {
        var kn = Number(windCur.wind_speed_10m);
        windPhrase = Math.round(kn) + " kn " + compass(windCur.wind_direction_10m);
        var gust = Number(windCur.wind_gusts_10m);
        if (isFinite(gust) && gust >= kn + 8) windPhrase += " gust " + Math.round(gust);
        var side = windSide(windCur.wind_direction_10m, kn);
        if (side) windPhrase += " " + side;
        bits.push(windPhrase);
      }
      var tide = readTide(all[2], all[3], now);
      var tidePhrase = "";
      if (tide) {
        tidePhrase = "tide " + oneDecimal(tide.m) + " m";
        if (tide.trend) tidePhrase += " " + tide.trend;
        if (tide.kind && tide.when) tidePhrase += " · " + tide.kind + " " + tide.when;
        bits.push(tidePhrase);
      }
      var slots = forecastSlots(marine.hourly, (cur && cur.time) || localStamp(now), sea.kind);
      var line = [sea.ft];
      slots.forEach(function (slot) { line.push(slot.ft); });
      var summary = aheadSummary(slots);
      var title = "Long Beach, Pacific Rim. " + (sea.kind === "swell" ? "Swell " : "Seas ") +
        oneDecimal(sea.ft) + " ft at " + Math.round(sea.period || 0) + " seconds from the " + compass(sea.dir) + ".";
      if (windPhrase) title += " Wind " + windPhrase + ".";
      if (tide) {
        title += " Tide " + oneDecimal(tide.m) + " m at " + tide.station;
        if (tide.trend) title += ", " + tide.trend;
        if (tide.kind && tide.when) title += ", " + tide.kind + " at " + tide.when + " PT";
        title += ". Heights from the Tofino gauge, TICON-4 via Slackwater and OpenWaters, CC BY 4.0.";
      }
      if (summary) title += " " + summary + ".";
      var pack = {
        at: Date.now(),
        ttl: tide ? 20 * 60 * 1000 : 5 * 60 * 1000,
        nowText: bits.join(" · "),
        line: line.length >= 2 ? line : [],
        lineLabel: summary,
        title: title
      };
      try { sessionStorage.setItem("cc.surf.v3", JSON.stringify(pack)); } catch (e) {}
      paintSurf(host, pack);
    }).catch(function () { paintSurf(host, null); });
  }

  var sky = ensureSky();
  if (sky) {
    if (!sky.getAttribute("role")) sky.setAttribute("role", "region");
    sky.setAttribute("aria-label", "Cumberland time and Long Beach surf");
    applyTheme(readTheme(), false);
    var toggle = document.getElementById("themeToggle");
    if (toggle) {
      toggle.addEventListener("click", function () {
        applyTheme(readTheme() === "night" ? "day" : "night", true);
      });
    }
    tickClock(sky.querySelector("[data-sky-time]"));
    loadSurf(surfHost(sky));
  }

  window.ClubCopy = window.ClubCopy || {};
  window.ClubCopy.closeDrawer = closeDrawer;
  window.ClubCopy.openDrawer = openDrawer;
  window.ClubCopy.applyTheme = applyTheme;
})();
