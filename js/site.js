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
