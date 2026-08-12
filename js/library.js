/* Club Copy — library station: filters, list/covers, listening rows */
(function () {
  var list = document.getElementById('catList');
  if (!list) return;

  var genreChips = document.getElementById('libGenreChips');
  var artistChips = document.getElementById('libArtistChips');
  var resetBtn = document.getElementById('libFilterReset');
  var countEl = document.getElementById('libCount');
  var leadEl = document.getElementById('libLead');
  var viewListBtn = document.getElementById('libViewList');
  var viewCoversBtn = document.getElementById('libViewCovers');

  var allReleases = [];
  var viewMode = 'list';
  var filters = { genre: '', artist: '' };

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function cssUrl(src) {
    return "url('" + String(src || '').replace(/'/g, "\\'") + "')";
  }

  function params() {
    try {
      return new URLSearchParams(window.location.search || '');
    } catch (e) {
      return new URLSearchParams();
    }
  }

  function readFiltersFromUrl() {
    var p = params();
    var artist = String(p.get('artist') || p.get('artistId') || '').trim();
    var genre = String(p.get('genre') || '').trim();
    var view = String(p.get('view') || '').trim().toLowerCase();
    if (view === 'covers' || view === 'list') viewMode = view;
    filters = { genre: genre, artist: artist };
  }

  function writeUrl() {
    try {
      var url = new URL(window.location.href);
      if (filters.artist) url.searchParams.set('artist', filters.artist);
      else {
        url.searchParams.delete('artist');
        url.searchParams.delete('artistId');
      }
      if (filters.genre) url.searchParams.set('genre', filters.genre);
      else url.searchParams.delete('genre');
      url.searchParams.delete('year');
      if (viewMode === 'covers') url.searchParams.set('view', 'covers');
      else url.searchParams.delete('view');
      var next = url.pathname + (url.searchParams.toString() ? '?' + url.searchParams.toString() : '') + url.hash;
      window.history.replaceState({}, '', next);
    } catch (e) {}
  }

  function slugify(s) {
    return String(s || '')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-');
  }

  function matchesArtist(rel, filter) {
    if (!filter) return true;
    var q = filter.toLowerCase();
    var id = String(rel.artistId || '').toLowerCase();
    var name = String(rel.artist || '').toLowerCase();
    return id === q || name === q || slugify(name) === q;
  }

  function matchesGenre(rel, filter) {
    if (!filter) return true;
    return slugify(rel.genre) === slugify(filter);
  }

  function displayNameForArtist(filter) {
    if (!filter) return '';
    for (var i = 0; i < allReleases.length; i++) {
      var rel = allReleases[i];
      if (matchesArtist(rel, filter)) return rel.artist || filter;
    }
    return filter.replace(/-/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); });
  }

  function formatCue(rel) {
    var bits = [];
    if (rel.kind) bits.push(rel.kind);
    if (String(rel.status || '').toLowerCase() === 'pre-order') bits.push('Pre-order');
    if (rel.tracksCount) bits.push(rel.tracksCount + (rel.tracksCount === 1 ? ' track' : ' tracks'));
    var formats = [];
    if (rel.formats && rel.formats.cassette) formats.push('Cassette');
    if (rel.formats && rel.formats.vinyl) formats.push('12″');
    if (rel.formats && rel.formats.digital) formats.push('Digital');
    if (formats.length) bits.push(formats.join(' · '));
    return bits.join(' · ');
  }

  function formatSide(rel) {
    var formats = [];
    if (rel.formats && rel.formats.cassette) formats.push('Cassette');
    if (rel.formats && rel.formats.vinyl) formats.push('12″');
    if (rel.formats && rel.formats.digital) formats.push('Digital');
    if (!formats.length) return rel.kind || 'Release';
    return formats.join(' · ');
  }

  function coverSrc(rel) {
    return rel.coverThumb || rel.cover || '';
  }

  function row(rel) {
    var thumb = coverSrc(rel);
    var full = rel.cover || thumb;
    var href = rel.page || '#';
    var alt = esc(rel.title + ' — ' + rel.artist);
    var cue = formatCue(rel);
    var genre = rel.genre ? '<span class="cat-genre">' + esc(rel.genre) + '</span>' : '';
    var hasPreview = Array.isArray(rel.tracks) && rel.tracks.some(function (t) {
      return !!(t && t.preview);
    });
    var playBtn = hasPreview
      ? (
          '<button type="button" class="cat-play" data-play-release="' + esc(rel.id) + '" aria-label="Play ' + esc(rel.title) + '">' +
            '<svg class="cp-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>' +
            '<svg class="cp-pause" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.4v14H7zM13.6 5H17v14h-3.4z"/></svg>' +
          '</button>' +
          '<span class="cat-air status-chip status-chip--air" aria-hidden="true">On air</span>'
        )
      : '';
    var preorder = String(rel.status || '').toLowerCase() === 'pre-order';
    var pill = preorder
      ? '<span class="release-pill release-pill--preorder">Pre-order</span>'
      : '';

    return (
      '<article class="cat-row rv" style="--cover:' + cssUrl(full || thumb) + '" data-release="' + esc(rel.id) + '" data-artist-id="' + esc(rel.artistId || '') + '" data-genre="' + esc(slugify(rel.genre)) + '">' +
        '<div class="cat-cover media-bezel fx-spec">' +
          '<a href="' + esc(href) + '" tabindex="-1" aria-hidden="true">' +
            '<img src="' + esc(thumb) + '" srcset="' + esc(thumb) + ' 480w, ' + esc(full) + ' 1200w" sizes="(min-width:860px) 108px, 88px" alt="' + alt + '" width="1200" height="1200" loading="lazy"/>' +
          '</a>' +
          '<span class="cat-cc">' + esc(rel.catalogue || '') + '</span>' +
          playBtn +
          pill +
        '</div>' +
        '<div class="cat-main">' +
          '<a class="cat-title" href="' + esc(href) + '">' + esc(rel.title) + '</a>' +
          '<span class="cat-artist">' + esc(rel.artist) + '</span>' +
          '<div class="cat-tags">' +
            genre +
            (cue ? '<span class="cat-cue">' + esc(cue) + '</span>' : '') +
          '</div>' +
        '</div>' +
        '<div class="cat-side">' +
          '<p class="cat-side-label">Format</p>' +
          '<p class="cat-side-value">' + esc(formatSide(rel)) + '</p>' +
        '</div>' +
        '<a class="cat-go" href="' + esc(href) + '" aria-label="Open ' + esc(rel.title) + '">' +
          '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>' +
        '</a>' +
      '</article>'
    );
  }

  function uniqueGenres(releases) {
    var seen = {};
    var out = [];
    releases.forEach(function (rel) {
      var g = String(rel.genre || '').trim();
      var id = slugify(g);
      if (!id || seen[id]) return;
      seen[id] = true;
      out.push({ id: id, name: g });
    });
    out.sort(function (a, b) { return a.name.localeCompare(b.name); });
    return out;
  }

  function uniqueArtists(releases) {
    var seen = {};
    var out = [];
    releases.forEach(function (rel) {
      var id = String(rel.artistId || '').trim() || slugify(rel.artist);
      if (!id || seen[id]) return;
      seen[id] = true;
      out.push({ id: id, name: rel.artist || id });
    });
    out.sort(function (a, b) { return a.name.localeCompare(b.name); });
    return out;
  }

  function renderChips(container, items, allLabel, activeValue, groupName) {
    if (!container) return;
    var html = '';
    html +=
      '<button type="button" class="lib-chip' + (!activeValue ? ' is-active' : '') + '" data-filter-group="' + esc(groupName) + '" data-filter-value="" aria-pressed="' + (!activeValue ? 'true' : 'false') + '">' +
        esc(allLabel) +
      '</button>';
    items.forEach(function (item) {
      var active = String(activeValue || '').toLowerCase() === String(item.id).toLowerCase();
      html +=
        '<button type="button" class="lib-chip' + (active ? ' is-active' : '') + '" data-filter-group="' + esc(groupName) + '" data-filter-value="' + esc(item.id) + '" aria-pressed="' + (active ? 'true' : 'false') + '">' +
          esc(item.name) +
        '</button>';
    });
    container.innerHTML = html;
  }

  function syncChipState(container, activeValue) {
    if (!container) return;
    container.querySelectorAll('.lib-chip').forEach(function (btn) {
      var value = btn.getAttribute('data-filter-value') || '';
      var active = String(activeValue || '') === String(value);
      if (!activeValue && !value) active = true;
      if (activeValue && String(activeValue).toLowerCase() === String(value).toLowerCase()) active = true;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function syncViewButtons() {
    var isCovers = viewMode === 'covers';
    list.classList.toggle('is-covers', isCovers);
    if (viewListBtn) {
      viewListBtn.classList.toggle('is-active', !isCovers);
      viewListBtn.setAttribute('aria-pressed', !isCovers ? 'true' : 'false');
    }
    if (viewCoversBtn) {
      viewCoversBtn.classList.toggle('is-active', isCovers);
      viewCoversBtn.setAttribute('aria-pressed', isCovers ? 'true' : 'false');
    }
  }

  function setLead(releases) {
    if (!leadEl) return;
    var bits = [];
    if (filters.genre) {
      var genreLabel = filters.genre.replace(/-/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); });
      bits.push(genreLabel);
    }
    if (filters.artist) bits.push(displayNameForArtist(filters.artist));

    if (!bits.length) {
      leadEl.textContent = 'Every release on Club Copy.';
      return;
    }

    if (!releases.length) {
      leadEl.innerHTML = 'No releases for ' + esc(bits.join(' · ')) + ' · <a href="/library">All releases</a>';
      return;
    }

    var count = releases.length === 1 ? '1 release' : releases.length + ' releases';
    leadEl.innerHTML = 'Showing ' + esc(bits.join(' · ')) + ' — ' + esc(count) + ' · <a href="/library">All releases</a>';
  }

  function setCount(n) {
    if (!countEl) return;
    countEl.textContent = n === 1 ? '1 release' : n + ' releases';
  }

  function syncAir(detail) {
    var d = detail || {};
    var nowId = d.track ? d.track.releaseId : null;
    var nextId = d.nextTrack ? d.nextTrack.releaseId : null;
    var playing = !!d.playing;
    list.querySelectorAll('.cat-row').forEach(function (rowEl) {
      var id = rowEl.getAttribute('data-release');
      var mine = nowId && id === nowId;
      var up = nextId && id === nextId && !mine;
      rowEl.classList.toggle('is-now-playing', !!mine);
      rowEl.classList.toggle('is-audible', !!(mine && playing));
      rowEl.classList.toggle('is-up-next', !!up);
      var air = rowEl.querySelector('.cat-air');
      if (air) {
        air.textContent = mine ? 'On air' : 'Standby';
        air.classList.toggle('status-chip--air', !!mine);
        air.classList.toggle('status-chip--standby', !!up && !mine);
      }
      var btn = rowEl.querySelector('.cat-play');
      if (btn) {
        var titleEl = rowEl.querySelector('.cat-title');
        var name = titleEl ? titleEl.textContent.trim() : 'release';
        btn.setAttribute('aria-label', (mine && playing ? 'Pause ' : 'Play ') + name);
      }
    });
  }

  function bindPlayButtons() {
    list.querySelectorAll('[data-play-release]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (!window.VCRPlayer) return;
        var id = el.getAttribute('data-play-release');
        var cur = VCRPlayer.current && VCRPlayer.current();
        if (cur && cur.releaseId === id) {
          VCRPlayer.toggle();
        } else {
          VCRPlayer.playRelease(id, null, { autoplay: true });
        }
      });
    });
  }

  function observeReveals() {
    if (window.ClubCopy && typeof window.ClubCopy.observeReveals === 'function') {
      window.ClubCopy.observeReveals(list);
      return;
    }
    if ('IntersectionObserver' in window) {
      var obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            obs.unobserve(e.target);
          }
        });
      }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
      list.querySelectorAll('.rv').forEach(function (el) { obs.observe(el); });
    } else {
      list.querySelectorAll('.rv').forEach(function (el) { el.classList.add('in'); });
    }
  }

  function render() {
    writeUrl();
    syncChipState(genreChips, filters.genre);
    syncChipState(artistChips, filters.artist);
    syncViewButtons();

    var releases = allReleases.filter(function (r) {
      return matchesGenre(r, filters.genre) && matchesArtist(r, filters.artist);
    });

    if (resetBtn) resetBtn.hidden = !(filters.genre || filters.artist);
    setLead(releases);
    setCount(releases.length);

    if (!releases.length) {
      list.innerHTML = (filters.genre || filters.artist)
        ? '<p class="page-lead">No releases match these filters. <a href="/library">View full library</a></p>'
        : '<p class="page-lead">No releases yet.</p>';
      return;
    }

    list.innerHTML = releases.map(row).join('');
    bindPlayButtons();
    observeReveals();

    if (window.VCRPlayer && typeof VCRPlayer.getState === 'function') {
      syncAir(VCRPlayer.getState());
    }
  }

  function onChipClick(e) {
    var btn = e.target.closest('.lib-chip');
    if (!btn) return;
    var group = btn.getAttribute('data-filter-group');
    var value = btn.getAttribute('data-filter-value') || '';
    if (group === 'genre') filters.genre = value;
    if (group === 'artist') filters.artist = value;
    render();
  }

  if (genreChips) genreChips.addEventListener('click', onChipClick);
  if (artistChips) artistChips.addEventListener('click', onChipClick);

  function setView(mode) {
    viewMode = mode === 'covers' ? 'covers' : 'list';
    render();
  }

  if (viewListBtn) viewListBtn.addEventListener('click', function () { setView('list'); });
  if (viewCoversBtn) viewCoversBtn.addEventListener('click', function () { setView('covers'); });

  if (resetBtn) {
    resetBtn.addEventListener('click', function () {
      filters = { genre: '', artist: '' };
      render();
    });
  }

  window.addEventListener('vcr:player', function (e) {
    syncAir(e.detail);
  });

  readFiltersFromUrl();

  fetch('/data/catalog.json')
    .then(function (r) {
      if (!r.ok) throw new Error('catalog');
      return r.json();
    })
    .then(function (data) {
      allReleases = (data.releases || []).slice().sort(function (a, b) {
        return String(b.catalogue || '').localeCompare(String(a.catalogue || ''));
      });

      renderChips(genreChips, uniqueGenres(allReleases), 'All', filters.genre, 'genre');
      renderChips(artistChips, uniqueArtists(allReleases), 'All', filters.artist, 'artist');
      render();
    })
    .catch(function () {
      /* Keep statically embedded rows so release URLs stay crawlable. */
      if (list.querySelector('.cat-row')) {
        bindPlayButtons();
        observeReveals();
        if (countEl && !filters.genre && !filters.artist) {
          var n = list.querySelectorAll('.cat-row').length;
          countEl.textContent = n === 1 ? '1 release' : n + ' releases';
        }
        return;
      }
      list.innerHTML = '<p class="page-lead">Could not load the library. <a href="/merch">Shop</a></p>';
      if (countEl) countEl.textContent = '—';
    });
})();
