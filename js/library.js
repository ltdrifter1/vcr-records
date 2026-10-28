/* Club Copy — library station: filters, list/covers, listening rows */
(function () {
  var list = document.getElementById('catList');
  if (!list) return;

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
  var catalogReady = false;

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
    var artistKey = artist.toLowerCase();
    if (artistKey === 'rainier' || artistKey === 'inlet-knight' || artistKey === 'rosco' || artistKey === 'roscoe') artist = 'forsberg';
    var genre = String(p.get('genre') || '').trim();
    var view = String(p.get('view') || '').trim().toLowerCase();
    if (view === 'covers' || view === 'sleeves' || view === 'grid') viewMode = 'covers';
    if (view === 'list') viewMode = 'list';
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
    if (q === 'rainier' || q === 'inlet-knight' || q === 'rosco' || q === 'roscoe') q = 'forsberg';
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

  function cassetteLabel(c) {
    if (c && c.stock != null && Number(c.stock) <= 0) return 'Cassette sold out';
    return c && c.backorder ? 'Cassette backorder' : 'Cassette';
  }

  function isFreeDownload(rel) {
    var d = rel && rel.formats && rel.formats.digital;
    return !!(d && (d.free || Number(d.price) === 0));
  }

  function downloadHref(rel) {
    var track = (rel && rel.previewTrackId) || ((rel && rel.tracks && rel.tracks[0] && rel.tracks[0].id) || "");
    return "/api/bandcamp-stream?r=" + encodeURIComponent(rel.id) + "&t=" + encodeURIComponent(track) + "&download=1";
  }

  function formatCue(rel) {
    var bits = [];
    var digital = rel.formats && rel.formats.digital;
    if (rel.kind && digital && digital.price != null) {
      bits.push(isFreeDownload(rel) ? rel.kind + ' · Free' : rel.kind + ' · $' + money(digital.price));
    } else if (rel.kind) bits.push(rel.kind);
    if (String(rel.status || '').toLowerCase() === 'pre-order') bits.push('Pre-order');
    if (rel.tracksCount) bits.push(rel.tracksCount + (rel.tracksCount === 1 ? ' track' : ' tracks'));
    if (rel.year) bits.push(String(rel.year));
    if (rel.genre) bits.push(rel.genre);
    var formats = [];
    if (rel.formats && rel.formats.cassette) {
      formats.push(cassetteLabel(rel.formats.cassette));
    }
    if (rel.formats && rel.formats.vinyl) formats.push('12″');
    if (rel.formats && rel.formats.digital) formats.push('Digital');
    if (formats.length) bits.push(formats.join(' · '));
    if (rel.legacyCatalogue) bits.push(String(rel.legacyCatalogue));
    else if (rel.catalogue && /^VCR/i.test(String(rel.catalogue))) bits.push(String(rel.catalogue));
    return bits.join(' · ');
  }

  function formatSide(rel) {
    var formats = [];
    if (rel.formats && rel.formats.cassette) {
      formats.push(cassetteLabel(rel.formats.cassette));
    }
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
    if (f.cassette) other.push(cassetteLabel(f.cassette));
    if (f.vinyl) other.push('Vinyl');
    return other;
  }

  function pricePanelHtml(rel) {
    var f = rel.formats || {};
    var hasDigital = !!(f.digital && f.digital.price != null);
    var yours = isMemberShopper();
    var other = otherFormatsLabel(rel);
    var board = '';

    if (hasDigital && isFreeDownload(rel)) {
      board =
        '<div class="cat-price">' +
          '<p class="cat-price-line" aria-label="' +
            esc((rel.title || 'Release') + ' free download') +
          '">' +
            '<span class="cat-price-amt">Free</span>' +
          '</p>' +
        '</div>';
    } else if (hasDigital) {
      var retail = Number(f.digital.price);
      var mem = digitalMemberPrice(retail);
      if (mem == null) mem = retail;
      var showClub = isFinite(mem) && Math.abs(mem - retail) > 0.001;
      var clubLabel = 'Club';
      if (yours) {
        clubLabel = (window.ClubMember && ClubMember.isPremium && ClubMember.isPremium())
          ? 'Premium'
          : 'Yours';
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
    } else if (f.cassette && f.cassette.price != null) {
      var cassRetail = Number(f.cassette.price);
      board =
        '<div class="cat-price">' +
          '<p class="cat-price-line" aria-label="' +
            esc((rel.title || 'Release') + ' cassette price') +
          '">' +
            '<span class="cat-price-amt">$' + esc(money(cassRetail)) + '</span>' +
          '</p>' +
        '</div>';
    }

    var note = '';
    if (other.length) {
      var avail = other.filter(function (o) { return o.indexOf('sold out') < 0; });
      var gone = other.filter(function (o) { return o.indexOf('sold out') > -1; });
      note = '<p class="cat-format-note">' + esc(gone.concat(avail.length ? [avail.join(' · ') + ' available'] : []).join(' · ')) + '</p>';
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

  function cassetteOffer(rel) {
    var c = rel && rel.formats && rel.formats.cassette;
    if (!c || !c.sku || c.price == null) return null;
    return c;
  }

  function cartOffer(rel) {
    return digitalOffer(rel) || cassetteOffer(rel);
  }

  function addBtnHtml(rel, extraClass) {
    var d = digitalOffer(rel);
    var c = cassetteOffer(rel);
    var preorder = String(rel.status || '').toLowerCase() === 'pre-order';
    var offer = d || c;
    var cls = 'cat-add' + (extraClass ? ' ' + extraClass : '');
    if (d && isFreeDownload(rel)) {
      return '<a class="' + cls + ' cat-add--link" href="' + esc(downloadHref(rel)) + '">Free download</a>';
    }
    if (!offer) {
      return '<a class="' + cls + ' cat-add--link" href="' + esc(rel.page || '#') + '">' +
        (preorder ? 'Pre-order' : 'View release') +
        '</a>';
    }
    var label = preorder && !d ? 'Pre-order' : 'Add to cart';
    var fmtName = d ? (rel.title + ' — Digital') : (rel.title + ' — Cassette');
    var image = d
      ? (rel.cover || rel.coverThumb || '')
      : (c.image || rel.cover || rel.coverThumb || '');
    return (
      '<button type="button" class="' + cls + '" data-add-release="' + esc(rel.id) + '"' +
        ' data-sku="' + esc(offer.sku) + '"' +
        ' data-name="' + esc(fmtName) + '"' +
        ' data-price="' + esc(offer.price) + '"' +
        ' data-image="' + esc(image) + '"' +
        ' aria-label="' + esc(label + ' ' + rel.title) + '">' +
        label +
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
    var offer = cartOffer(rel);
    var sku = btn.getAttribute('data-sku') || (offer ? offer.sku : null);
    var name = btn.getAttribute('data-name') ||
      (offer
        ? (digitalOffer(rel) && offer.sku === digitalOffer(rel).sku
            ? (rel.title + ' — Digital')
            : (rel.title + ' — Cassette'))
        : null);
    var price = btn.getAttribute('data-price') != null && btn.getAttribute('data-price') !== ''
      ? Number(btn.getAttribute('data-price'))
      : (offer ? offer.price : NaN);
    var image = btn.getAttribute('data-image') ||
      (offer ? (offer.image || (rel && (rel.cover || rel.coverThumb)) || '') : '');
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
    if (window.ClubSleeve) {
      return ClubSleeve.row(rel, {
        extraClass: "rv",
        attrs:
          ' data-artist-id="' + esc(rel.artistId || "") + '" data-genre="' + esc(slugify(rel.genre)) + '"' +
          (full ? ' style="--cover:' + cssUrl(full) + '"' : ""),
        sideHtml: pricePanelHtml(rel) + addBtnHtml(rel)
      });
    }
    var href = rel.page || '#';
    var alt = esc(rel.title + ' — ' + rel.artist);
    var cue = formatCue(rel);
    var catNo = "";
    if (rel.catalogue) {
      catNo = '<p class="cat-id">' + esc(rel.catalogue) + '</p>';
    }
    var hasPreview = Array.isArray(rel.tracks) && rel.tracks.some(function (t) {
      return !!(t && (t.preview || t.bandcampTrackId || t.previewTrack || t.soundcloud));
    });
    var playBtn = hasPreview
      ? (
          '<button type="button" class="cat-play" data-play-release="' + esc(rel.id) + '"' +
            (rel.previewTrackId ? ' data-play-track="' + esc(rel.previewTrackId) + '"' : "") +
            ' aria-label="Play ' + esc(rel.title) + '">' +
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
            '<img src="' + esc(thumb) + '" srcset="' + esc(thumb) + ' 480w, ' + esc(full) + ' 1200w" sizes="(min-width:860px) 80px, 72px" alt="' + alt + '" width="1200" height="1200" loading="lazy"/>' +
          '</a>' +
          playBtn +
          pill +
        '</div>' +
        '<div class="cat-main">' +
          catNo +
          '<a class="cat-title" href="' + esc(href) + '">' + esc(rel.title) + '</a>' +
          '<span class="cat-artist">' + esc(rel.artist) + '</span>' +
          '<div class="cat-tags">' +
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

  function sourceReleases() {
    if (allReleases.length) return allReleases;
    var out = [];
    list.querySelectorAll('.cat-row').forEach(function (row) {
      out.push({
        genre: row.getAttribute('data-genre') || '',
        artistId: row.getAttribute('data-artist-id') || '',
        artist: (row.querySelector('.cat-artist') || {}).textContent || ''
      });
    });
    return out;
  }

  function laneCount(kind, value) {
    var rows = sourceReleases();
    var n = 0;
    for (var i = 0; i < rows.length; i++) {
      var rel = rows[i];
      if (kind === 'genre') {
        if (matchesGenre(rel, value) && matchesArtist(rel, filters.artist)) n++;
      } else if (matchesArtist(rel, value) && matchesGenre(rel, filters.genre)) n++;
    }
    return n;
  }

  function syncLanes() {
    if (!window.ClubLanes) return;
    var root = document.querySelector('.library-index .filters') || document.querySelector('.filters');
    if (root) ClubLanes.sync(root, filters, laneCount);
  }

  function laneLabel(kind, value) {
    if (!value) return '';
    var seg = document.querySelector('.seg[data-filter="' + kind + '"]');
    if (seg) {
      var buttons = seg.querySelectorAll('button');
      for (var i = 0; i < buttons.length; i++) {
        if (String(buttons[i].getAttribute('data-value') || '').toLowerCase() === String(value).toLowerCase()) {
          return buttons[i].getAttribute('data-label') || value;
        }
      }
    }
    if (kind === 'artist') return displayNameForArtist(value);
    return String(value).replace(/-/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); });
  }

  function paintStatic() {
    writeUrl();
    syncViewButtons();
    syncLanes();
    var filtering = !!(filters.genre || filters.artist);
    var shown = 0;
    list.querySelectorAll('.cat-row').forEach(function (row) {
      var rel = {
        genre: row.getAttribute('data-genre') || '',
        artistId: row.getAttribute('data-artist-id') || ''
      };
      var ok = matchesGenre(rel, filters.genre) && matchesArtist(rel, filters.artist);
      row.hidden = filtering && !ok;
      if (!row.hidden) shown++;
    });
    list.querySelectorAll('.lib-split').forEach(function (split) { split.hidden = filtering; });
    if (resetBtn) resetBtn.hidden = !filtering;
    setCount(shown);
    if (filtering) setLead(new Array(shown));
  }

  function syncViewButtons() {
    var isCovers = viewMode === 'covers';
    list.classList.toggle('is-covers', isCovers);
    list.hidden = false;
    list.removeAttribute('hidden');
    list.setAttribute('aria-hidden', 'false');
    if (flowRoot) flowRoot.hidden = true;
    document.body.classList.toggle('lib-covers-on', isCovers);
    document.body.classList.toggle('lib-filtered', !!(filters.genre || filters.artist));
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
    if (filters.genre) bits.push(laneLabel('genre', filters.genre));
    if (filters.artist) bits.push(laneLabel('artist', filters.artist));

    if (!bits.length) {
      var profile = window.ClubMember && ClubMember.readProfile && ClubMember.readProfile();
      if (profile && ClubMember.hasMemberPricing(profile)) {
        leadEl.innerHTML = ClubMember.isPremium(profile)
          ? 'Your catalogue. Premium is on this email — 50% off music. <a href="/#join">Your club</a>'
          : 'Your catalogue. Club is on this email — 30% off music. <a href="/#join">Your club</a>';
      } else if (profile) {
        leadEl.innerHTML = 'You\'re on the list. Files and small-run formats — <a href="/#join">join</a> for 30% off music.';
      } else {
        leadEl.innerHTML = 'Pacific Northwest house, jungle, and instrumental hip-hop. Files you keep. Edits, remixes and bootlegs are free downloads. <a href="/#join">Club 30% off music</a>';
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
        var trackId = el.getAttribute('data-play-track');
        if (cur && cur.releaseId === id && (!trackId || cur.id === trackId)) {
          VCRPlayer.toggle();
        } else {
          VCRPlayer.playRelease(id, trackId || null, { autoplay: true });
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
    var catHtml = rel.catalogue
      ? '<p class="album-inspect__cat"><span class="chip-acetate">' + esc(rel.catalogue) + '</span></p>'
      : '';
    var meta = [rel.kind, rel.year, rel.genre, rel.legacyCatalogue || ''].filter(Boolean).join(' · ');
    var tracks = Array.isArray(rel.tracks) ? rel.tracks : [];
    var hasPrev = tracks.some(function (t) {
      return !!(t && (t.preview || t.bandcampTrackId || t.soundcloud));
    });
    var play =
      '<button type="button" class="btn btn-chrome-on-dark" data-play-release="' +
      esc(rel.id) +
      '"' +
      (rel.previewTrackId ? ' data-play-track="' + esc(rel.previewTrackId) + '"' : '') +
      (hasPrev ? '' : ' data-preview-unwired="1"') +
      '>Play</button>';
    var trackHtml = tracks.length
      ? tracks.map(function (t, i) {
          var dur = fmtDur(t.duration);
          var wired = !!(t && (t.preview || t.bandcampTrackId || t.bandcamp || t.soundcloud));
          return (
            '<button type="button" class="inspect-track' + (wired ? '' : ' is-unwired') + '" data-play-release="' + esc(rel.id) + '"' +
              (t.id ? ' data-play-track="' + esc(t.id) + '"' : '') +
              (wired ? '' : ' data-preview-unwired="1"') +
              ' aria-label="Play ' + esc(t.title || rel.title) + '">' +
              '<span class="inspect-track-n">' + String(i + 1).padStart(2, '0') + '</span>' +
              '<span class="inspect-track-t">' + esc(t.title || 'Track') + '</span>' +
              '<span class="inspect-track-d">' + esc(dur) + '</span>' +
            '</button>'
          );
        }).join('')
      : '<p class="inspect-empty">Open the release page for the full listing.</p>';

    inspect.hidden = false;
    inspect.innerHTML =
      '<figure class="album-inspect__art jewel">' +
        '<img src="' + esc(thumb) + '" alt="" width="400" height="400"/>' +
      '</figure>' +
      '<div class="album-inspect__copy">' +
        (catHtml) +
        (meta ? '<p class="album-inspect__meta">' + esc(meta) + '</p>' : '') +
        '<h3 class="album-inspect__title"><a href="' + esc(rel.page || '#') + '">' + esc(rel.title) + '</a></h3>' +
        '<p class="album-inspect__artist">' + esc(rel.artist || '') + '</p>' +
        '<p class="album-inspect__err" data-inspect-err hidden></p>' +
        '<div class="album-inspect__actions">' +
          play +
          addBtnHtml(rel) +
          '<a class="btn btn-ghost-on-dark" href="' + esc(rel.page || '#') + '">Details</a>' +
        '</div>' +
      '</div>' +
      '<div class="album-inspect__tracks">' + trackHtml + '</div>';
    bindAddButtons();
    if (window.ClubCopy && ClubCopy.bindFlowPlay) ClubCopy.bindFlowPlay(inspect);
  }

  function mountLibFlow() {
    if (!flowRoot) return;
    flowRoot.hidden = true;
  }

  function groupOf(rel) {
    if (/^CC\d+/i.test(String(rel.catalogue || ''))) return 0;
    if (rel.page && String(rel.page).charAt(0) === '/') return 1;
    return 2;
  }

  function renderRows(releases) {
    var titles = ['', 'On Club Copy', 'Elsewhere'];
    var notes = [
      '',
      'On the site. Not in the numbered series yet.',
      'Bandcamp and SoundCloud. Not sold here.'
    ];
    var html = [];
    var seen = -1;
    releases.forEach(function (rel) {
      var g = groupOf(rel);
      if (g !== seen) {
        if (seen !== -1 && titles[g]) {
          html.push(
            '<div class="lib-split">' +
              '<h2 class="lib-split-title">' + titles[g] + '</h2>' +
              '<p class="lib-split-note">' + notes[g] + '</p>' +
            '</div>'
          );
        }
        seen = g;
      }
      html.push(row(rel));
    });
    return html.join('');
  }

  function render() {
    writeUrl();
    syncLanes();
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

    list.hidden = false;
    if (flowRoot) flowRoot.hidden = true;
    list.innerHTML = renderRows(releases);
    bindPlayButtons();
    bindAddButtons();
    observeReveals();

    if (window.VCRPlayer && typeof VCRPlayer.getState === 'function') {
      syncAir(VCRPlayer.getState());
    }
  }

  function setView(mode) {
    viewMode = (mode === 'covers' || mode === 'sleeves' || mode === 'grid') ? 'covers' : 'list';
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
      if (catalogReady) render();
      else paintStatic();
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
      var errEl = inspect.querySelector('[data-inspect-err]');
      if (errEl) {
        if (d.error && d.errorMessage) {
          errEl.hidden = false;
          errEl.textContent = d.errorMessage;
        } else if (d.playing) {
          errEl.hidden = true;
          errEl.textContent = '';
        }
      }
    }
  });

  window.addEventListener('club:member', function () {
    if (allReleases.length) render();
  });

  function renderShelf() {
    var shelf = document.querySelector(".lib-shelf");
    var grid = shelf && shelf.querySelector(".lib-shelf__grid");
    if (!shelf || !grid || !window.ClubSleeve) return;
    var rel = ClubSleeve.newest(allReleases);
    if (!rel) return;
    var thumb = coverSrc(rel);
    var full = rel.cover || thumb;
    var meta = [ClubSleeve.spec(rel), ClubSleeve.durBpm(rel), rel.artist || ""].filter(Boolean).join(" · ");
    var add = addBtnHtml(rel, "btn btn-steel");
    grid.innerHTML =
      '<figure class="lib-shelf__art media-bezel">' +
        '<a href="' + esc(rel.page || "#") + '"><img src="' + esc(thumb) + '" alt="' + esc(rel.title) + ' artwork" width="1200" height="1200"/></a>' +
      "</figure>" +
      "<div>" +
        '<p class="lib-shelf__callsign">On the shelf</p>' +
        '<h2 class="lib-shelf__title"><a href="' + esc(rel.page || "#") + '">' + esc(rel.title) + "</a></h2>" +
        '<p class="lib-shelf__meta">' + esc(meta) + "</p>" +
        '<div class="lib-shelf__actions">' +
          '<button type="button" class="btn btn-steel btn-steel--play" data-play-release="' + esc(rel.id) + '"' +
            (rel.previewTrackId ? ' data-play-track="' + esc(rel.previewTrackId) + '"' : "") +
            ">Play</button>" +
          add +
          '<a class="btn btn-steel" href="' + esc(rel.page || "#") + '">Open</a>' +
        "</div>" +
      "</div>";
    if (shelf.querySelector(".lib-shelf__ambient")) {
      shelf.querySelector(".lib-shelf__ambient").style.backgroundImage = full ? cssUrl(full) : "";
    }
    bindAddButtons();
  }

  if (window.ClubLanes) {
    ClubLanes.bind(document.querySelector('.filters'), function (next) {
      filters.genre = next.genre || '';
      filters.artist = next.artist || '';
      if (catalogReady) render();
      else paintStatic();
    });
  }

  readFiltersFromUrl();
  paintStatic();
  bindAddButtons();

  fetch('/data/catalog.json')
    .then(function (r) {
      if (!r.ok) throw new Error('catalog');
      return r.json();
    })
    .then(function (data) {
      allReleases = (data.releases || []).slice().sort(function (a, b) {
        var ag = /^CC\d+/i.test(String(a.catalogue || '')) ? 0 : (a.page && String(a.page).charAt(0) === '/' ? 1 : 2);
        var bg = /^CC\d+/i.test(String(b.catalogue || '')) ? 0 : (b.page && String(b.page).charAt(0) === '/' ? 1 : 2);
        if (ag !== bg) return ag - bg;
        if (ag === 0) {
          return String(b.catalogue || '').localeCompare(String(a.catalogue || ''), undefined, { numeric: true });
        }
        var aDate = String(a.released || '');
        var bDate = String(b.released || '');
        if (aDate !== bDate) return bDate.localeCompare(aDate);
        return String(a.title || '').localeCompare(String(b.title || ''));
      });

      catalogReady = true;
      renderShelf();
      render();
    })
    .catch(function () {
      /* Keep statically embedded rows so release URLs stay crawlable. */
      if (list.querySelector('.cat-row')) {
        paintStatic();
        bindPlayButtons();
        bindAddButtons();
        observeReveals();
        return;
      }
      list.innerHTML = '<p class="page-lead">Could not load the library. <a href="/merch">Shop</a></p>';
      if (countEl) countEl.textContent = '—';
    });
})();
