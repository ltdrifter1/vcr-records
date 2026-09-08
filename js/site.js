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
    var path = (location.pathname || '/').replace(/\/index\.html$/, '/');
    var isHome = path === '/' || path === '';
    var bar = document.createElement('nav');
    bar.className = 'tabbar';
    bar.id = 'tabBar';
    bar.setAttribute('aria-label', 'App');
    bar.innerHTML =
      '<a href="/" data-tab="listen">' +
        '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.2" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="2.4"/><path d="M12 5.6v2.2M12 16.2v2.2M5.6 12h2.2M16.2 12h2.2" stroke="currentColor" stroke-width="1.6" fill="none"/></svg>' +
        '<span>Listen</span></a>' +
      '<a href="/library" data-tab="library">' +
        '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><rect x="4" y="5" width="7" height="7" rx="1.4"/><rect x="13" y="5" width="7" height="7" rx="1.4"/><rect x="4" y="14" width="7" height="7" rx="1.4"/><rect x="13" y="14" width="7" height="7" rx="1.4"/></svg>' +
        '<span>Library</span></a>' +
      '<a href="/merch" data-tab="shop">' +
        '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 8h15l-1.4 8.4a2 2 0 0 1-2 1.6H9a2 2 0 0 1-2-1.6L5 4H2"/><circle cx="10" cy="20" r="1.2" fill="currentColor" stroke="none"/><circle cx="18" cy="20" r="1.2" fill="currentColor" stroke="none"/></svg>' +
        '<span>Shop</span></a>' +
      '<a href="' + (isHome ? '#join' : '/#join') + '" data-tab="club">' +
        '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="6" width="17" height="12" rx="2.2" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="9" cy="12" r="2.1"/><path d="M13.2 10.4h5.2M13.2 13.6h3.6" stroke="currentColor" stroke-width="1.6" fill="none"/></svg>' +
        '<span>Club</span></a>';
    document.body.appendChild(bar);

    function currentTab() {
      var p = (location.pathname || '/').replace(/\/index\.html$/, '/');
      var hash = location.hash || '';
      if (p.indexOf('/library') === 0) return 'library';
      if (p.indexOf('/merch') === 0 || p.indexOf('/cart') === 0 || p.indexOf('/checkout') === 0) return 'shop';
      if (p.indexOf('/account') === 0 || hash === '#join') return 'club';
      if (p === '/' || p === '') return 'listen';
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

    bar.querySelector('[data-tab="listen"]').addEventListener('click', function (e) {
      if (!isHome) return;
      e.preventDefault();
      closeDrawer();
      if (location.hash) {
        try { history.replaceState({}, '', location.pathname + location.search); }
        catch (err) {}
      }
      try { window.scrollTo({ top: 0, behavior: 'smooth' }); }
      catch (err) { window.scrollTo(0, 0); }
      syncTabs();
    });

    bar.querySelector('[data-tab="club"]').addEventListener('click', function (e) {
      var href = this.getAttribute('href') || '';
      if (href.indexOf('#join') === -1) return;
      if (!isHome) return;
      e.preventDefault();
      closeDrawer();
      var join = document.getElementById('join');
      if (join) {
        try { join.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
        catch (err) { join.scrollIntoView(true); }
      }
      try { history.replaceState({}, '', '#join'); }
      catch (err) { location.hash = 'join'; }
      syncTabs();
    });

    window.addEventListener('hashchange', syncTabs);
    syncTabs();

    if (drawer) {
      drawer.querySelectorAll('a').forEach(function (a) {
        var href = (a.getAttribute('href') || '').split('?')[0];
        var dup = href === '/' || href === '/index.html' ||
          href === '#listen' || href === '/#listen' ||
          href === '/library' || href === '/merch' ||
          href === '#join' || href === '/#join' || href === '/account';
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
