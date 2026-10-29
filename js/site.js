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

  /* Conditions bar: Cumberland time and weather, Long Beach surf, day or night.
     Cumberland weather stays on Open-Meteo. Long Beach is the Pacific Rim
     beach west of Tofino — swell from the marine API, wind from the forecast
     API, tide from the Tofino gauge via OpenWaters. Day or night stays in this browser. */
  var SKY_TZ = "America/Vancouver";
  var SKY_WX = "https://api.open-meteo.com/v1/forecast?latitude=49.6186&longitude=-125.0285&current=temperature_2m,weather_code&timezone=America%2FVancouver&forecast_days=1";
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
    if (color) color.setAttribute("content", theme === "day" ? "#efefed" : "#c5c7c3");
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
        '<span data-sky-wx hidden>··</span>' +
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
    bar.setAttribute("aria-label", "Cumberland weather and Long Beach surf");
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

  function weatherWords(code) {
    var c = Number(code);
    if (c === 0) return "Clear";
    if (c === 1) return "Mainly clear";
    if (c === 2) return "Partly cloudy";
    if (c === 3) return "Overcast";
    if (c === 45 || c === 48) return "Fog";
    if (c >= 51 && c <= 57) return "Drizzle";
    if (c >= 61 && c <= 67) return "Rain";
    if (c >= 71 && c <= 77) return "Snow";
    if (c >= 80 && c <= 82) return "Showers";
    if (c === 85 || c === 86) return "Snow";
    if (c >= 95) return "Thunder";
    return "";
  }

  function paintWeather(el, data) {
    if (!el || !data || data.temp == null) {
      if (el) el.hidden = true;
      return;
    }
    var words = weatherWords(data.code);
    var text = Math.round(Number(data.temp)) + "°" + (words ? " " + words : "");
    el.hidden = false;
    el.textContent = text;
    el.title = text + " in Cumberland, British Columbia";
  }

  function loadWeather(el) {
    var cached = null;
    try { cached = JSON.parse(sessionStorage.getItem("cc.wx") || "null"); } catch (e) {}
    if (cached && cached.at && Date.now() - cached.at < 20 * 60 * 1000) {
      paintWeather(el, cached);
      return;
    }
    fetch(SKY_WX)
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        var cur = data && data.current;
        if (!cur || cur.temperature_2m == null) { paintWeather(el, null); return; }
        var next = { temp: cur.temperature_2m, code: cur.weather_code, at: Date.now() };
        try { sessionStorage.setItem("cc.wx", JSON.stringify(next)); } catch (e) {}
        paintWeather(el, next);
      })
      .catch(function () { paintWeather(el, null); });
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

  function forecastSlots(hourly, currentTime) {
    if (!hourly || !hourly.time || !currentTime) return [];
    var out = [];
    var i;
    for (i = 0; i < hourly.time.length; i++) {
      if (hourly.time[i] <= currentTime) continue;
      var hh = Number(hourly.time[i].slice(11, 13));
      if (hh % 6 !== 0) continue;
      var sea = primarySea(
        hourly.swell_wave_height && hourly.swell_wave_height[i],
        hourly.swell_wave_period && hourly.swell_wave_period[i],
        hourly.wave_height && hourly.wave_height[i],
        hourly.wave_period && hourly.wave_period[i],
        null,
        null
      );
      if (!sea) continue;
      var hour = hourly.time[i].slice(11, 13);
      out.push({
        hour: hour,
        ft: sea.ft,
        period: sea.period,
        label: hour + "h " + oneDecimal(sea.ft) + "ft"
      });
      if (out.length === 4) break;
    }
    return out;
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
      if (pack.cast && pack.cast.length) {
        var lead = document.createElement("span");
        lead.className = "sky-surf-next";
        lead.textContent = "next";
        castEl.appendChild(lead);
        pack.cast.forEach(function (slot) {
          var s = document.createElement("span");
          if (slot.high) s.className = "is-high";
          s.textContent = slot.label;
          if (slot.title) s.title = slot.title;
          castEl.appendChild(s);
        });
      }
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
    try { cached = JSON.parse(sessionStorage.getItem("cc.surf.v2") || "null"); } catch (e) {}
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
      var slots = forecastSlots(marine.hourly, (cur && cur.time) || localStamp(now));
      var maxFt = -1;
      var maxI = -1;
      slots.forEach(function (slot, idx) {
        if (slot.ft > maxFt) { maxFt = slot.ft; maxI = idx; }
      });
      var cast = slots.map(function (slot, idx) {
        return {
          label: slot.label,
          high: idx === maxI && slot.ft >= sea.ft + 0.4,
          title: slot.hour + ":00 PT, " + oneDecimal(slot.ft) + " ft at " + Math.round(slot.period || 0) + "s"
        };
      });
      var title = "Long Beach, Pacific Rim. " + (sea.kind === "swell" ? "Swell " : "Seas ") +
        oneDecimal(sea.ft) + " ft at " + Math.round(sea.period || 0) + " seconds from the " + compass(sea.dir) + ".";
      if (windPhrase) title += " Wind " + windPhrase + ".";
      if (tide) {
        title += " Tide " + oneDecimal(tide.m) + " m at " + tide.station;
        if (tide.trend) title += ", " + tide.trend;
        if (tide.kind && tide.when) title += ", " + tide.kind + " at " + tide.when + " PT";
        title += ". Heights from the Tofino gauge, TICON-4 via Slackwater and OpenWaters, CC BY 4.0.";
      }
      if (cast.length) title += " Next: " + cast.map(function (s) { return s.title; }).join("; ") + ".";
      var pack = { at: Date.now(), ttl: tide ? 20 * 60 * 1000 : 5 * 60 * 1000, nowText: bits.join(" · "), cast: cast, title: title };
      try { sessionStorage.setItem("cc.surf.v2", JSON.stringify(pack)); } catch (e) {}
      paintSurf(host, pack);
    }).catch(function () { paintSurf(host, null); });
  }

  var sky = ensureSky();
  if (sky) {
    if (!sky.getAttribute("role")) sky.setAttribute("role", "region");
    sky.setAttribute("aria-label", "Cumberland weather and Long Beach surf");
    applyTheme(readTheme(), false);
    var toggle = document.getElementById("themeToggle");
    if (toggle) {
      toggle.addEventListener("click", function () {
        applyTheme(readTheme() === "night" ? "day" : "night", true);
      });
    }
    tickClock(sky.querySelector("[data-sky-time]"));
    loadWeather(sky.querySelector("[data-sky-wx]"));
    loadSurf(surfHost(sky));
  }

  window.ClubCopy = window.ClubCopy || {};
  window.ClubCopy.closeDrawer = closeDrawer;
  window.ClubCopy.openDrawer = openDrawer;
  window.ClubCopy.applyTheme = applyTheme;
})();
