/* Club Copy — render library from data/catalog.json */
(function () {
  var list = document.getElementById('catList');
  if (!list) return;

  var artistSelect = document.getElementById('libArtist');
  var yearSelect = document.getElementById('libYear');
  var resetBtn = document.getElementById('libFilterReset');
  var allReleases = [];

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function params() {
    try {
      return new URLSearchParams(window.location.search || '');
    } catch (e) {
      return new URLSearchParams();
    }
  }

  function currentFilters() {
    var p = params();
    var artist = '';
    var year = '';
    if (artistSelect) artist = String(artistSelect.value || '').trim();
    if (yearSelect) year = String(yearSelect.value || '').trim();
    if (!artist) artist = String(p.get('artist') || p.get('artistId') || '').trim();
    if (!year) year = String(p.get('year') || '').trim();
    return { artist: artist, year: year };
  }

  function matchesArtist(rel, filter) {
    if (!filter) return true;
    var q = filter.toLowerCase();
    var id = String(rel.artistId || '').toLowerCase();
    var name = String(rel.artist || '').toLowerCase();
    return id === q || name === q || name.replace(/\s+/g, '-') === q;
  }

  function matchesYear(rel, filter) {
    if (!filter) return true;
    return String(rel.year || '') === String(filter);
  }

  function displayNameForFilter(releases, filter) {
    if (!filter) return '';
    for (var i = 0; i < releases.length; i++) {
      var rel = releases[i];
      if (matchesArtist(rel, filter)) return rel.artist || filter;
    }
    return filter.replace(/-/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); });
  }

  function setLead(text, clearHref) {
    var lead = document.querySelector('.page-lead');
    if (!lead) return;
    if (!text) {
      lead.textContent = ' ';
      return;
    }
    if (clearHref) {
      lead.innerHTML = esc(text) + ' · <a href="library.html">All releases</a>';
    } else {
      lead.textContent = text;
    }
  }

  function formatMeta(rel) {
    var bits = [];
    if (rel.kind) bits.push(rel.kind);
    var formats = [];
    if (rel.formats && rel.formats.cassette) formats.push('Cassette');
    if (rel.formats && rel.formats.vinyl) formats.push('12″');
    if (rel.formats && rel.formats.digital) formats.push('Digital');
    if (formats.length) bits.push(formats.join(' · '));
    if (rel.tracksCount) bits.push(rel.tracksCount + (rel.tracksCount === 1 ? ' track' : ' tracks'));
    return bits.join(' · ');
  }

  function mobileMeta(rel) {
    return [rel.kind || 'Release', (rel.tracksCount || 0) + (rel.tracksCount === 1 ? ' track' : ' tracks'), rel.year]
      .filter(Boolean)
      .join(' · ');
  }

  function coverSrc(rel) {
    return rel.coverThumb || rel.cover || '';
  }

  function row(rel) {
    var thumb = coverSrc(rel);
    var full = rel.cover || thumb;
    var href = rel.page || '#';
    var alt = esc(rel.title + ' — ' + rel.artist);
    var hasTracks = Array.isArray(rel.tracks) && rel.tracks.length > 0;
    var playBtn = hasTracks
      ? (
          '<button type="button" class="cat-play" data-play-release="' + esc(rel.id) + '" aria-label="Play ' + esc(rel.title) + '">' +
            '<svg class="cp-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>' +
            '<svg class="cp-pause" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.4v14H7zM13.6 5H17v14h-3.4z"/></svg>' +
          '</button>' +
          '<span class="cat-air status-chip status-chip--air" aria-hidden="true">On air</span>'
        )
      : '';
    return (
      '<div class="cat-row rv" data-release="' + esc(rel.id) + '" data-artist-id="' + esc(rel.artistId || '') + '" data-year="' + esc(rel.year || '') + '">' +
        '<div class="cat-cover media-bezel fx-spec">' +
          '<a href="' + esc(href) + '" tabindex="-1" aria-hidden="true">' +
            '<img src="' + esc(thumb) + '" srcset="' + esc(thumb) + ' 480w, ' + esc(full) + ' 1200w" sizes="88px" alt="' + alt + '" width="1200" height="1200" loading="lazy"/>' +
          '</a>' +
          playBtn +
        '</div>' +
        '<span class="cat-no cat-display cat-display--md">' + esc(rel.catalogue || '') + '</span>' +
        '<span>' +
          '<a class="cat-title" href="' + esc(href) + '">' + esc(rel.title) + '</a>' +
          '<span class="cat-artist">' + esc(rel.artist) + '</span>' +
          '<span class="cat-mobile-meta broadcast-meta">' + esc(mobileMeta(rel)) + '</span>' +
        '</span>' +
        '<span class="cat-meta broadcast-meta">' + formatMeta(rel) + '</span>' +
        '<span class="cat-year broadcast-meta">' + esc(rel.year || '') + '</span>' +
        '<span class="cat-avail">' + esc(rel.status || 'Available') + '</span>' +
      '</div>'
    );
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

  function uniqueArtists(releases) {
    var seen = {};
    var out = [];
    releases.forEach(function (rel) {
      var id = String(rel.artistId || rel.artist || '').trim();
      if (!id || seen[id]) return;
      seen[id] = true;
      out.push({ id: id, name: rel.artist || id });
    });
    out.sort(function (a, b) { return a.name.localeCompare(b.name); });
    return out;
  }

  function uniqueYears(releases) {
    var years = [];
    var seen = {};
    releases.forEach(function (rel) {
      var y = String(rel.year || '').trim();
      if (!y || seen[y]) return;
      seen[y] = true;
      years.push(y);
    });
    years.sort(function (a, b) { return Number(b) - Number(a); });
    return years;
  }

  function fillSelect(select, placeholder, items, getValue, getLabel, selected) {
    if (!select) return;
    var html = '<option value="">' + esc(placeholder) + '</option>';
    items.forEach(function (item) {
      var value = getValue(item);
      var label = getLabel(item);
      var sel = String(selected || '') === String(value) ? ' selected' : '';
      html += '<option value="' + esc(value) + '"' + sel + '>' + esc(label) + '</option>';
    });
    select.innerHTML = html;
  }

  function writeUrl(filters) {
    try {
      var url = new URL(window.location.href);
      if (filters.artist) url.searchParams.set('artist', filters.artist);
      else {
        url.searchParams.delete('artist');
        url.searchParams.delete('artistId');
      }
      if (filters.year) url.searchParams.set('year', filters.year);
      else url.searchParams.delete('year');
      var next = url.pathname + (url.searchParams.toString() ? '?' + url.searchParams.toString() : '') + url.hash;
      window.history.replaceState({}, '', next);
    } catch (e) {}
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

  function syncSelectToFilter(select, filter) {
    if (!select || !filter) return;
    var q = String(filter).toLowerCase();
    for (var i = 0; i < select.options.length; i++) {
      var opt = select.options[i];
      var value = String(opt.value || '').toLowerCase();
      var label = String(opt.textContent || '').toLowerCase();
      if (value === q || label === q || label.replace(/\s+/g, '-') === q) {
        select.value = opt.value;
        return;
      }
    }
  }

  function render() {
    var filters = currentFilters();
    syncSelectToFilter(artistSelect, filters.artist);
    syncSelectToFilter(yearSelect, filters.year);

    var artist = artistSelect ? artistSelect.value : filters.artist;
    var year = yearSelect ? yearSelect.value : filters.year;
    filters = { artist: artist, year: year };
    writeUrl(filters);

    var releases = allReleases.filter(function (r) {
      return matchesArtist(r, filters.artist) && matchesYear(r, filters.year);
    });

    if (resetBtn) resetBtn.hidden = !(filters.artist || filters.year);

    var bits = [];
    if (filters.artist) bits.push(displayNameForFilter(allReleases, filters.artist));
    if (filters.year) bits.push(String(filters.year));
    if (bits.length) {
      setLead(
        releases.length
          ? ('Showing ' + bits.join(' · ') + (releases.length === 1 ? ' — 1 release' : ' — ' + releases.length + ' releases'))
          : ('No releases for ' + bits.join(' · ')),
        true
      );
    } else {
      setLead('');
    }

    if (!releases.length) {
      list.innerHTML = (filters.artist || filters.year)
        ? '<p class="page-lead">No releases match these filters. <a href="library.html">View full library</a></p>'
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

  window.addEventListener('vcr:player', function (e) {
    syncAir(e.detail);
  });

  if (artistSelect) artistSelect.addEventListener('change', render);
  if (yearSelect) yearSelect.addEventListener('change', render);
  if (resetBtn) {
    resetBtn.addEventListener('click', function () {
      if (artistSelect) artistSelect.value = '';
      if (yearSelect) yearSelect.value = '';
      render();
    });
  }

  fetch('/data/catalog.json')
    .then(function (r) {
      if (!r.ok) throw new Error('catalog');
      return r.json();
    })
    .then(function (data) {
      allReleases = (data.releases || []).slice().sort(function (a, b) {
        return String(b.catalogue || '').localeCompare(String(a.catalogue || ''));
      });

      var filters = currentFilters();
      fillSelect(
        artistSelect,
        'All artists',
        uniqueArtists(allReleases),
        function (a) { return a.id; },
        function (a) { return a.name; },
        filters.artist
      );
      fillSelect(
        yearSelect,
        'All years',
        uniqueYears(allReleases),
        function (y) { return y; },
        function (y) { return y; },
        filters.year
      );

      render();
    })
    .catch(function () {
      list.innerHTML = '<p class="page-lead">Could not load the library. <a href="merch.html">Shop</a></p>';
    });
})();
