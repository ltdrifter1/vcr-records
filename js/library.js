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
  var flowRoot = document.getElementById('libFlow');
  var flowTrack = document.getElementById('libFlowTrack');
  var inspect = document.querySelector('#libFlow [data-album-inspect]');

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
    if (artist.toLowerCase() === 'inlet-knight') artist = 'rosco';
    var genre = String(p.get('genre') || '').trim();
    var view = String(p.get('view') || '').trim().toLowerCase();
    if (view === 'covers' || view === 'list') viewMode = view;
    else if (window.matchMedia && window.matchMedia('(min-width: 720px)').matches) {
      viewMode = 'covers';
    }
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
    if (q === 'inlet-knight') q = 'rosco';
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

  /** Club 30% / Premium 50% off music. Guests see the Club teaser. */
  function musicMemberPrice(retail, sku) {
    var v = Number(retail);
    if (!isFinite(v)) return null;
    var skuKey = sku || 'dg-release';
    if (window.ClubMember && typeof ClubMember.musicUnitPrice === 'function') {
      var profile = ClubMember.readProfile && ClubMember.readProfile();
      if (profile && ClubMember.hasMemberPricing(profile)) {
        return ClubMember.musicUnitPrice(v, skuKey, profile);
      }
      return ClubMember.musicUnitPrice(v, skuKey, { level: 'club' });
    }
    return Math.round(v * 0.7 * 100) / 100;
  }

  function digitalMemberPrice(retail) {
    return musicMemberPrice(retail, 'dg-release');
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
      var showClub = isFinite(mem) && Math.abs(mem - retail) > 0.001;
      var clubLabel = 'club';
      if (yours) {
        clubLabel = (window.ClubMember && ClubMember.isPremium && ClubMember.isPremium())
          ? 'premium'
          : 'yours';
      }
      board =
        '<div class="cat-price' + (yours ? ' is-yours' : '') + '">' +
          '<p class="cat-price-line" aria-label="' +
            esc((rel.title || 'Release') + ' digital price') +
          '">' +
            '<span class="cat-price-amt">$' + esc(money(retail)) + '</span>' +
            (showClub
              ? '<span class="cat-price-club">$' + esc(money(mem)) + ' ' + clubLabel + '</span>'
              : '') +
          '</p>' +
        '</div>';
    }

    var note = '';
    if (other.length) {
      note = '<p class="cat-format-note">' + esc(other.join(' · ') + ' available') + '</p>';
    } else if (!hasDigital) {
      note = '<p class="cat-format-note">' + esc(formatSide(rel)) + '</p>';
    }

    if (!board && !note) {
      note = '<p class="cat-format-note">' + esc(formatSide(rel)) + '</p>';
    }

    return '<div class="cat-side-pricing">' + board + note + '</div>';
  }

  function digitalOffer(rel) {
    var d = rel && rel.formats && rel.formats.digital;
    if (!d || !d.sku || d.price == null) return null;
    return d;
  }

  function addBtnHtml(rel) {
    var d = digitalOffer(rel);
    if (!d) {
      return '<a class="cat-add cat-add--link" href="' + esc(rel.page || '#') + '">View release</a>';
    }
    return (
      '<button type="button" class="cat-add" data-add-release="' + esc(rel.id) + '"' +
        ' data-sku="' + esc(d.sku) + '"' +
        ' data-name="' + esc(rel.title + ' — Digital') + '"' +
        ' data-price="' + esc(d.price) + '"' +
        ' data-image="' + esc(rel.cover || rel.coverThumb || '') + '"' +
        ' aria-label="Add ' + esc(rel.title) + ' to cart">' +
        'Add to cart' +
      '</button>'
    );
  }

  function flashAddBtn(btn) {
    if (!btn) return;
    var orig = btn.getAttribute('data-label') || btn.textContent;
    btn.setAttribute('data-label', orig);
    btn.textContent = 'Added ✓';
    btn.classList.add('is-added');
    clearTimeout(btn._addFlash);
    btn._addFlash = setTimeout(function () {
      btn.textContent = orig;
      btn.classList.remove('is-added');
    }, 1800);
  }

  function addFromButton(btn) {
    if (!btn || !window.VCRCart) return false;
    var id = btn.getAttribute('data-add-release');
    var rel = null;
    for (var i = 0; i < allReleases.length; i++) {
      if (allReleases[i].id === id) {
        rel = allReleases[i];
        break;
      }
    }
    var offer = digitalOffer(rel);
    var sku = offer ? offer.sku : btn.getAttribute('data-sku');
    var name = offer
      ? (rel.title + ' — Digital')
      : btn.getAttribute('data-name');
    var price = offer ? offer.price : Number(btn.getAttribute('data-price'));
    var image = offer
      ? (rel.cover || rel.coverThumb || '')
      : btn.getAttribute('data-image');
    if (!sku || !isFinite(Number(price))) return false;
    VCRCart.add({
      sku: sku,
      name: name || sku,
      price: Number(price),
      image: image || '',
      qty: 1,
      id: sku
    });
    flashAddBtn(btn);
    return true;
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
        '<div class="cat-cover media-bezel fx-spec jewel">' +
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
          addBtnHtml(rel) +
        '</div>' +
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
    list.hidden = isCovers && !!(flowRoot && flowTrack);
    list.setAttribute('aria-hidden', isCovers ? 'true' : 'false');
    if (flowRoot) flowRoot.hidden = !isCovers;
    document.body.classList.toggle('lib-covers-on', isCovers);
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
        leadEl.innerHTML = ClubMember.isPremium(profile)
          ? "You're in. 50% off all music on this email. <a href=\"/#join\">Your club</a>"
          : "You're in. 30% off all music on this email. <a href=\"/#join\">Your club</a>";
      } else if (profile) {
        leadEl.innerHTML = "You're on the list. <a href=\"/#join\">Join the club</a> for 30% off music.";
      } else {
        leadEl.innerHTML = 'Every Club Copy release. Club is 30% off music. Premium is 50%. <a href="/#join">Join</a>.';
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

  function bindAddButtons() {
    document.querySelectorAll('[data-add-release]').forEach(function (el) {
      if (el.getAttribute('data-bound-add') === '1') return;
      el.setAttribute('data-bound-add', '1');
      el.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        addFromButton(el);
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

  function fmtDur(sec) {
    var s = Math.max(0, Math.round(Number(sec) || 0));
    if (!s) return '';
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  }

  function findRelease(id) {
    for (var i = 0; i < allReleases.length; i++) {
      if (allReleases[i].id === id) return allReleases[i];
    }
    return null;
  }

  function renderInspect(rel) {
    if (!inspect || !rel) return;
    var thumb = coverSrc(rel);
    var full = rel.cover || thumb;
    var kicker = [rel.catalogue, rel.kind, rel.year].filter(Boolean).join(' · ');
    var tracks = Array.isArray(rel.tracks) ? rel.tracks : [];
    var hasPrev = tracks.some(function (t) { return !!(t && t.preview); });
    var play = hasPrev
      ? '<button type="button" class="btn btn-chrome-on-dark" data-play-release="' + esc(rel.id) + '">Play</button>'
      : '';
    var trackHtml = tracks.length
      ? tracks.map(function (t, i) {
          var dur = fmtDur(t.duration);
          return (
            '<button type="button" class="inspect-track" data-play-release="' + esc(rel.id) + '"' +
              (t.id ? ' data-play-track="' + esc(t.id) + '"' : '') +
              ' aria-label="Play ' + esc(t.title || rel.title) + '">' +
              '<span class="inspect-track-n">' + String(i + 1).padStart(2, '0') + '</span>' +
              '<span class="inspect-track-t">' + esc(t.title || 'Track') + '</span>' +
              '<span class="inspect-track-d">' + esc(dur) + '</span>' +
            '</button>'
          );
        }).join('')
      : '<p class="inspect-empty">Open the sleeve for the full listing.</p>';

    inspect.hidden = false;
    inspect.innerHTML =
      '<figure class="album-inspect__art jewel">' +
        '<img src="' + esc(thumb) + '" alt="" width="400" height="400"/>' +
      '</figure>' +
      '<div class="album-inspect__copy">' +
        (kicker ? '<p class="album-inspect__cat">' + esc(kicker) + '</p>' : '') +
        '<h3 class="album-inspect__title"><a href="' + esc(rel.page || '#') + '">' + esc(rel.title) + '</a></h3>' +
        '<p class="album-inspect__artist">' + esc(rel.artist || '') + '</p>' +
        '<div class="album-inspect__actions">' +
          play +
          addBtnHtml(rel) +
          '<a class="btn btn-ghost-on-dark" href="' + esc(rel.page || '#') + '">Sleeve</a>' +
        '</div>' +
      '</div>' +
      '<div class="album-inspect__tracks">' + trackHtml + '</div>';
    bindAddButtons();
    if (window.ClubCopy && ClubCopy.bindFlowPlay) ClubCopy.bindFlowPlay(inspect);
  }

  function mountLibFlow() {
    if (!flowRoot) return;
    if (flowRoot._coverFlow) flowRoot._coverFlow.refresh();
    else if (window.ClubCopy && typeof ClubCopy.initCoverFlow === 'function') {
      ClubCopy.initCoverFlow();
    }
    if (window.ClubCopy && ClubCopy.bindFlowPlay) ClubCopy.bindFlowPlay(flowRoot);
    if (window.VCRPlayer && VCRPlayer.getState && window.ClubCopy && ClubCopy.syncFlowAir) {
      ClubCopy.syncFlowAir(flowRoot, VCRPlayer.getState());
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
      list.hidden = false;
      if (flowRoot) flowRoot.hidden = true;
      list.innerHTML = (filters.genre || filters.artist)
        ? '<p class="page-lead">No releases match these filters. <a href="/library">View full library</a></p>'
        : '<p class="page-lead">No releases yet.</p>';
      return;
    }

    if (viewMode === 'covers' && flowRoot && flowTrack && window.ClubCopy && ClubCopy.flowSleeveHtml) {
      list.hidden = true;
      flowRoot.hidden = false;
      flowTrack.innerHTML = releases.map(ClubCopy.flowSleeveHtml).join('');
      mountLibFlow();
      renderInspect(releases[0]);
      return;
    }

    list.hidden = false;
    if (flowRoot) flowRoot.hidden = true;
    list.innerHTML = releases.map(row).join('');
    bindPlayButtons();
    bindAddButtons();
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

  if (flowRoot) {
    flowRoot.addEventListener('coverflow:change', function (e) {
      var rel = findRelease(e.detail && e.detail.id);
      if (rel) renderInspect(rel);
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', function () {
      filters = { genre: '', artist: '' };
      render();
    });
  }

  window.addEventListener('vcr:player', function (e) {
    syncAir(e.detail);
    var d = e.detail || {};
    var trackId = d.track ? d.track.id : null;
    if (inspect) {
      inspect.querySelectorAll('.inspect-track').forEach(function (rowEl) {
        rowEl.classList.toggle('is-now', !!(trackId && rowEl.getAttribute('data-play-track') === trackId));
      });
    }
  });

  window.addEventListener('club:member', function () {
    if (allReleases.length) render();
  });

  readFiltersFromUrl();
  bindAddButtons();

  fetch('/data/catalog.json')
    .then(function (r) {
      if (!r.ok) throw new Error('catalog');
      return r.json();
    })
    .then(function (data) {
      allReleases = (data.releases || []).slice().sort(function (a, b) {
        var aDate = String(a.released || '');
        var bDate = String(b.released || '');
        if (aDate !== bDate) return bDate.localeCompare(aDate);
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
        bindAddButtons();
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
