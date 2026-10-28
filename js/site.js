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

  /* Conditions bar: Cumberland time, weather, moon, and day or night.
     Weather is Open-Meteo for Cumberland, BC. The moon is calculated here.
     The choice of day or night is kept in this browser only. */
  var SKY_TZ = "America/Vancouver";
  var SKY_WX = "https://api.open-meteo.com/v1/forecast?latitude=49.6186&longitude=-125.0285&current=temperature_2m,weather_code&timezone=America%2FVancouver&forecast_days=1";

  function readTheme() {
    var t = document.documentElement.getAttribute("data-theme");
    if (t === "day" || t === "night") return t;
    try {
      if (window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches) return "night";
    } catch (e) {}
    return "day";
  }

  function applyTheme(theme, persist) {
    if (theme !== "day" && theme !== "night") theme = "night";
    document.documentElement.setAttribute("data-theme", theme);
    var color = document.querySelector('meta[name="theme-color"]');
    if (color) color.setAttribute("content", theme === "day" ? "#f4f1ea" : "#0a0a0a");
    var scheme = document.querySelector('meta[name="color-scheme"]');
    if (scheme) scheme.setAttribute("content", theme === "day" ? "light" : "dark");
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
        '<span data-sky-moon>··</span>' +
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
    bar.setAttribute("aria-label", "Cumberland conditions");
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

  function moonName(date) {
    var synodic = 29.530588853;
    var known = Date.UTC(2000, 0, 6, 18, 14, 0);
    var days = (date.getTime() - known) / 86400000;
    var age = ((days % synodic) + synodic) % synodic;
    var phase = age / synodic;
    var bands = [
      [0.033, "New moon"],
      [0.216, "Waxing crescent"],
      [0.283, "First quarter"],
      [0.466, "Waxing gibbous"],
      [0.533, "Full moon"],
      [0.716, "Waning gibbous"],
      [0.783, "Last quarter"],
      [0.966, "Waning crescent"],
      [1, "New moon"]
    ];
    var i;
    for (i = 0; i < bands.length; i++) {
      if (phase <= bands[i][0]) return bands[i][1];
    }
    return "New moon";
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

  var sky = ensureSky();
  if (sky) {
    if (!sky.getAttribute("role")) {
      sky.setAttribute("role", "region");
      sky.setAttribute("aria-label", "Cumberland conditions");
    }
    applyTheme(readTheme(), false);
    var toggle = document.getElementById("themeToggle");
    if (toggle) {
      toggle.addEventListener("click", function () {
        applyTheme(readTheme() === "night" ? "day" : "night", true);
      });
    }
    try {
      if (window.matchMedia) {
        matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function (ev) {
          var stored = null;
          try { stored = localStorage.getItem("cc.theme"); } catch (e) {}
          if (stored === "day" || stored === "night") return;
          applyTheme(ev.matches ? "night" : "day", false);
        });
      }
    } catch (e) {}
    tickClock(sky.querySelector("[data-sky-time]"));
    var moon = sky.querySelector("[data-sky-moon]");
    if (moon) {
      var name = moonName(new Date());
      moon.textContent = name;
      moon.title = name;
    }
    loadWeather(sky.querySelector("[data-sky-wx]"));
  }

  window.ClubCopy = window.ClubCopy || {};
  window.ClubCopy.closeDrawer = closeDrawer;
  window.ClubCopy.openDrawer = openDrawer;
  window.ClubCopy.applyTheme = applyTheme;
})();
