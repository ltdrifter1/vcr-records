/* Club Copy — library station: filters, list/covers, listening rows */
(function () {
  var list = document.getElementById('catList');
  if (!list) return;

  var genreSelect = document.getElementById('libGenreSelect');
  var artistSelect = document.getElementById('libArtistSelect');
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

  function money(n) {
    var v = Number(n);
    if (!isFinite(v)) return '';
    return Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/\.00$/, '');
  }

  /** Map retail digital → club member price (CAD). Always returns a number when retail is valid. */
  function digitalMemberPrice(retail) {
    var v = Number(retail);
    if (!isFinite(v)) return null;
    if (window.ClubMember && typeof ClubMember.memberDigitalPrice === 'function') {
      var mapped = ClubMember.memberDigitalPrice(v);
      if (mapped != null && isFinite(Number(mapped))) return Number(mapped);
    }
    if (v === 6 || v === 2 || v === 1.5) return v;
    if (v >= 8) return 6;
    if (Math.abs(v - 3) < 0.001) return 2;
    if (Math.abs(v - 1.99) < 0.001) return 1.5;
    return v;
  }

  function isMemberShopper() {
    return !!(
      window.ClubMember &&
      ClubMember.hasMemberPricing &&
      ClubMember.hasMemberPricing()
    );
  }

  function otherFormatsLabel(rel) {
    var f = rel.formats || {};
    var other = [];
    if (f.cassette) other.push('Cassette');
    if (f.vinyl) other.push('Vinyl');
    return other;
  }

  function priceTileHtml(label, amount, opts) {
    var o = opts || {};
    var classes = ['cat-price-tile'];
    if (o.member) classes.push('cat-price-tile--member');
    if (o.active) classes.push('is-active');
    if (o.yours) classes.push('is-yours');
    return (
      '<div class="' + classes.join(' ') + '">' +
        '<span class="cat-price-tile-label">' + esc(label) + '</span>' +
        '<span class="cat-price-tile-amt">' +
          '<span class="cat-price-tile-currency" aria-hidden="true">$</span>' +
          esc(money(amount)) +
        '</span>' +
      '</div>'
    );
  }

  function pricePanelHtml(rel) {
    var f = rel.formats || {};
    var hasDigital = !!(f.digital && f.digital.price != null);
    var yours = isMemberShopper();
    var other = otherFormatsLabel(rel);
    var board = '';

    if (hasDigital) {
      var retail = Number(f.digital.price);
      var mem = digitalMemberPrice(retail);
      if (mem == null) mem = retail;
      board =
        '<div class="cat-priceboard">' +
          '<p class="cat-priceboard-kicker">Digital</p>' +
          '<div class="cat-price-panel" role="group" aria-label="' +
            esc((rel.title || 'Release') + ' digital pricing') +
          '">' +
            priceTileHtml('Regular', retail, { active: !yours }) +
            priceTileHtml('Member', mem, {
              member: true,
              active: yours,
              yours: yours
            }) +
          '</div>' +
        '</div>';
    }

    var note = '';
    if (other.length) {
      note =
        '<p class="cat-format-note">' +
          '<span class="cat-format-note-mark" aria-hidden="true"></span>' +
          '<span>' + esc(other.join(' · ') + ' available') + '</span>' +
        '</p>';
    } else if (!hasDigital) {
      note =
        '<p class="cat-format-note">' +
          '<span class="cat-format-note-mark" aria-hidden="true"></span>' +
          '<span>' + esc(formatSide(rel)) + '</span>' +
        '</p>';
    }

    if (!board && !note) {
      note =
        '<p class="cat-format-note">' +
          '<span class="cat-format-note-mark" aria-hidden="true"></span>' +
          '<span>' + esc(formatSide(rel)) + '</span>' +
        '</p>';
    }

    return '<div class="cat-side-pricing">' + board + note + '</div>';
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
          pricePanelHtml(rel) +
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

  function renderSelect(select, items, allLabel, activeValue) {
    if (!select) return;
    var html = '<option value="">' + esc(allLabel) + '</option>';
    items.forEach(function (item) {
      html += '<option value="' + esc(item.id) + '">' + esc(item.name) + '</option>';
    });
    select.innerHTML = html;
    syncSelectState(select, activeValue);
  }

  function syncSelectState(select, activeValue) {
    if (!select) return;
    var value = String(activeValue || '');
    var match = false;
    for (var i = 0; i < select.options.length; i++) {
      if (String(select.options[i].value).toLowerCase() === value.toLowerCase()) {
        select.selectedIndex = i;
        match = true;
        break;
      }
    }
    if (!match) select.value = '';
    select.classList.toggle('has-value', !!select.value);
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
      var profile = window.ClubMember && ClubMember.readProfile && ClubMember.readProfile();
      if (profile && ClubMember.hasMemberPricing(profile)) {
        leadEl.innerHTML = 'Club edition — Member ' + esc(profile.memberNumber) + '. Digital copies at your price. <a href="/#join">Your club</a>';
      } else if (profile) {
        leadEl.innerHTML = 'Member ' + esc(profile.memberNumber) + ' · on the list. <a href="/#join">Accept Club</a> for member pricing.';
      } else {
        leadEl.innerHTML = 'Catalogue by number — regular vs member digital price on every release. <a href="/#join">Accept invitation</a>';
      }
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
    syncSelectState(genreSelect, filters.genre);
    syncSelectState(artistSelect, filters.artist);
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

  function onSelectChange(e) {
    var select = e.target;
    if (select === genreSelect) filters.genre = select.value || '';
    if (select === artistSelect) filters.artist = select.value || '';
    render();
  }

  if (genreSelect) genreSelect.addEventListener('change', onSelectChange);
  if (artistSelect) artistSelect.addEventListener('change', onSelectChange);

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

  window.addEventListener('club:member', function () {
    if (allReleases.length) render();
  });

  readFiltersFromUrl();

  fetch('/data/catalog.json')
    .then(function (r) {
      if (!r.ok) throw new Error('catalog');
      return r.json();
    })
    .then(function (data) {
      allReleases = (data.releases || []).slice().sort(function (a, b) {
        var yearDiff = (Number(b.year) || 0) - (Number(a.year) || 0);
        if (yearDiff) return yearDiff;
        return String(b.catalogue || '').localeCompare(String(a.catalogue || ''));
      });

      renderSelect(genreSelect, uniqueGenres(allReleases), 'All', filters.genre);
      renderSelect(artistSelect, uniqueArtists(allReleases), 'All', filters.artist);
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
