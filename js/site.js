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

    function injectTabBar() {
    if (document.getElementById('tabBar')) return;
    var bar = document.createElement('nav');
    bar.className = 'tabbar';
    bar.id = 'tabBar';
    bar.setAttribute('aria-label', 'App');
    var home = document.body.classList.contains('home-zine');
    var mid = home
      ? (
          '<a href="#join" data-tab="join">' +
            '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4.5" y="6" width="15" height="12" rx="1.6"/><path d="M4.5 10h15M8 14h4"/></svg>' +
            '<span>Join</span></a>'
        )
      : (
          '<a href="/artists" data-tab="artists">' +
            '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="9" cy="8" r="2.4"/><circle cx="15.5" cy="8.6" r="2"/><path d="M4.6 18.2c.6-2.6 2.6-4 4.4-4s3.8 1.4 4.4 4M13.2 16.6c.5-1.6 1.8-2.6 3.2-2.6 1.2 0 2.4.7 3 2"/></svg>' +
            '<span>Artists</span></a>'
        );
    bar.innerHTML =
      '<a href="/library" data-tab="library">' +
        '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><rect x="4" y="5" width="7" height="7" rx="1.4"/><rect x="13" y="5" width="7" height="7" rx="1.4"/><rect x="4" y="14" width="7" height="7" rx="1.4"/><rect x="13" y="14" width="7" height="7" rx="1.4"/></svg>' +
        '<span>Library</span></a>' +
      mid +
      '<a href="/news" data-tab="zine">' +
        '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4.2" y="5" width="15.6" height="14" rx="1.6"/><path d="M7.4 9h9.2M7.4 12.2h6.6M7.4 15.4h8.2"/></svg>' +
        '<span>Zine</span></a>' +
      '<a href="/merch" data-tab="shop">' +
        '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 8h15l-1.4 8.4a2 2 0 0 1-2 1.6H9a2 2 0 0 1-2-1.6L5 4H2"/><circle cx="10" cy="20" r="1.2" fill="currentColor" stroke="none"/><circle cx="18" cy="20" r="1.2" fill="currentColor" stroke="none"/></svg>' +
        '<span>Shop</span></a>';
    document.body.appendChild(bar);

    function currentTab() {
      var p = (location.pathname || '/').replace(/\/index\.html$/, '/');
      if (p.indexOf('/library') === 0) return 'library';
      if (p.indexOf('/artists') === 0) return 'artists';
      if (p.indexOf('/merch') === 0 || p.indexOf('/cart') === 0 || p.indexOf('/checkout') === 0) return 'shop';
      if (p.indexOf('/news') === 0) return 'zine';
      return '';
    }

    function syncTabs() {
      var cur = currentTab();
      bar.querySelectorAll('[data-tab]').forEach(function (a) {
        var on = a.getAttribute('data-tab') === cur;
        a.classList.toggle('is-current', on);
        if (on) a.setAttribute('aria-current', 'page');
        else a.removeAttribute('aria-current');
      });
    }

    window.addEventListener('hashchange', syncTabs);
    syncTabs();

    if (drawer) {
      drawer.querySelectorAll('a').forEach(function (a) {
        var href = (a.getAttribute('href') || '').split('?')[0];
        var dup = href === '/library' || href === '/artists' ||
          href === '/merch' || href === '/news' || href === '#join';
        if (dup) a.classList.add('tabbar-dup');
      });
    }
  }
  injectTabBar();

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
