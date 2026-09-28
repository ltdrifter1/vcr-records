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
    var label = 'Mixes';
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

  window.ClubCopy = window.ClubCopy || {};
  window.ClubCopy.closeDrawer = closeDrawer;
  window.ClubCopy.openDrawer = openDrawer;
})();
