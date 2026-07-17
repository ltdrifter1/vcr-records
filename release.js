/* VCR release page — shared player, variants, cart + remote media */
(function () {
  'use strict';

  function money(n) {
    return '$' + Number(n).toFixed(2);
  }

  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/"/g, '&quot;');
  }

  async function loadRelease(id) {
    const res = await fetch('data/releases.json', { cache: 'no-store' });
    const data = await res.json();
    return (data.releases || []).find((r) => r.id === id || r.slug === id);
  }

  function artistPage(release) {
    const map = {
      'lt-drifta': 'artist-lt-drifta.html',
      leftwave: 'artist-leftwave.html',
      'miles-hale': 'artist-miles-hale.html',
      'f-hastings': 'artist-f-hastings.html',
      'm-dot': 'artist-m-dot.html',
    };
    return map[release.artistId] || 'artists.html';
  }

  function render(release, mediaCfg) {
    const root = document.getElementById('releaseRoot');
    if (!root || !release) return;

    const M = window.VCRMedia;
    const preview = M.previewUrl(release, mediaCfg);
    const download = M.downloadUrl(release, mediaCfg);
    const folder = M.folderFor(release, mediaCfg);

    document.title = `${release.title} — ${release.artist} | VCR Recordings`;
    const desc = document.querySelector('meta[name="description"]');
    if (desc) {
      desc.content = `${release.title} by ${release.artist} — ${(release.formats || []).join(' + ')}. VCR Recordings.`;
    }

    const variants = release.variants || [];
    const active = variants[0] || { id: 'digital', label: 'Digital', price: 0, note: '' };
    const tracks = release.tracks || [];

    root.innerHTML = `
      <div class="crumbs">
        <a href="index.html">Home</a><span>/</span>
        <a href="index.html#releases">Releases</a><span>/</span>
        ${esc(release.title)}
      </div>

      <div class="release-layout" itemscope itemtype="https://schema.org/MusicAlbum">
        <meta itemprop="name" content="${esc(release.title)}"/>
        <div itemprop="byArtist" itemscope itemtype="https://schema.org/MusicGroup">
          <meta itemprop="name" content="${esc(release.artist)}"/>
        </div>

        <div class="release-art-col rv">
          <button type="button" class="release-art crt-frame" id="artZoom" aria-label="Zoom artwork">
            <img src="${esc(release.artwork)}" alt="${esc(release.title)} artwork" itemprop="image"/>
            <span class="release-badge">${esc((release.formats || []).join(' + '))}</span>
          </button>
          <div class="release-player glass-panel">
            <div class="rp-head">
              <span class="eyebrow">Preview</span>
              <span id="rpTrack">${esc((tracks[0] && tracks[0].title) || release.title)}</span>
            </div>
            <div class="rp-controls">
              <button type="button" class="rp-play" id="rpPlay" aria-label="Play preview">
                <svg class="i-play" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                <svg class="i-pause" viewBox="0 0 24 24"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>
              </button>
              <div class="rp-seek">
                <input type="range" id="rpSeek" min="0" max="100" value="0" step="0.1" aria-label="Seek"/>
                <div class="rp-times"><span id="rpEl">0:00</span><span id="rpRem">-0:00</span></div>
              </div>
            </div>
            <audio id="rpAudio" preload="metadata" crossorigin="anonymous" src="${esc(preview)}"></audio>
            <p class="small-note" id="mediaHint" style="margin-top:10px"></p>
          </div>
        </div>

        <div class="release-info-col rv d1">
          <div class="release-block">
            <a class="release-artist" href="${artistPage(release)}">${esc(release.artist)}</a>
            <h1 class="release-title">${esc(release.title)}</h1>
            <div class="release-meta-row">
              <div>
                <div class="release-price" id="priceDisplay">${money(active.price)}</div>
                <div class="release-price-note">USD · ${esc(release.year)}</div>
              </div>
              <div class="tag">In stock</div>
            </div>
            <div class="feat-tags" style="margin-top:14px">
              ${(release.tags || []).map((t) => `<span class="tag">${esc(t)}</span>`).join('')}
            </div>
          </div>

          <div class="release-block">
            <div class="opt-label">Format</div>
            <div class="merch-opts" id="variantOpts">
              ${variants
                .map(
                  (v, i) => `
                <button type="button" class="opt ${i === 0 ? 'selected' : ''}"
                  data-variant="${esc(v.id)}" data-price="${v.price}" data-label="${esc(v.label)}"
                  data-stripe="${esc(v.stripe || '')}" data-note="${esc(v.note || '')}"
                  aria-pressed="${i === 0 ? 'true' : 'false'}">${esc(v.label)} · ${money(v.price)}</button>
              `
                )
                .join('')}
            </div>
            <div class="opt-label" style="margin-top:16px">Qty</div>
            <div class="qty-wrap">
              <button type="button" class="qty-btn" id="qtyMinus" aria-label="Decrease">−</button>
              <input class="qty-input" id="qtyInput" type="number" min="1" value="1" inputmode="numeric" aria-label="Quantity"/>
              <button type="button" class="qty-btn" id="qtyPlus" aria-label="Increase">+</button>
            </div>
            <div class="buy-stack" style="margin-top:18px">
              <button type="button" class="btn btn-primary btn-block" id="addCart">Add to cart — ${money(active.price)}</button>
              <a class="btn btn-ghost btn-block" href="${esc(release.bandcamp || '#')}" target="_blank" rel="noopener">Bandcamp</a>
            </div>
            <p class="small-note" id="buyNote">${esc(active.note || '')}</p>
            <p class="small-note">Digital downloads use the same media folder as streaming${
              mediaCfg.baseUrl ? ` (<code>${esc(folder)}</code>)` : ''
            }.</p>
          </div>

          <div class="release-block">
            <div class="tab-bar" role="tablist">
              <button class="tab-btn on" type="button" data-tab="tracks" aria-selected="true">Tracklist</button>
              <button class="tab-btn" type="button" data-tab="details" aria-selected="false">Details</button>
            </div>
            <div class="tab-panel on" id="tab-tracks">
              <div class="release-tracks" id="trackList">
                ${tracks
                  .map((t, i) => {
                    const src = M.trackUrl(release, t, mediaCfg);
                    return `
                  <button type="button" class="rtrack ${i === 0 ? 'is-active' : ''}" data-track-idx="${i}" data-src="${esc(src)}" data-title="${esc(t.title)}">
                    <span class="rtrack-n">${String(i + 1).padStart(2, '0')}</span>
                    <span class="rtrack-t">${esc(t.title)}</span>
                    <span class="rtrack-d">${esc(t.duration || '—')}</span>
                  </button>`;
                  })
                  .join('')}
              </div>
            </div>
            <div class="tab-panel" id="tab-details">
              <p class="bio-text" style="font-size:1rem">${esc(release.details || '')}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="zoom" id="zoom" hidden>
        <button type="button" class="zoom-close" aria-label="Close">×</button>
        <img src="${esc(release.artwork)}" alt=""/>
      </div>
    `;

    wire(release, active, mediaCfg, { preview, download, folder });
  }

  function fmt(t) {
    if (!isFinite(t) || t < 0) return '0:00';
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return m + ':' + String(s).padStart(2, '0');
  }

  function wire(release, active, mediaCfg, urls) {
    let current = active;
    const audio = document.getElementById('rpAudio');
    const play = document.getElementById('rpPlay');
    const seek = document.getElementById('rpSeek');
    const el = document.getElementById('rpEl');
    const rem = document.getElementById('rpRem');
    const trackLabel = document.getElementById('rpTrack');
    const qty = document.getElementById('qtyInput');
    const priceEl = document.getElementById('priceDisplay');
    const addBtn = document.getElementById('addCart');
    const note = document.getElementById('buyNote');
    const hint = document.getElementById('mediaHint');

    if (!mediaCfg.baseUrl) {
      hint.textContent =
        'Media base URL not set — playing local/legacy files. Set data/media.json baseUrl to your synced public folder.';
    } else if (!urls.preview) {
      hint.textContent = 'No preview file configured for this release.';
    } else {
      hint.textContent = `Streaming from media folder · ${urls.folder}`;
    }

    function syncBuy() {
      const q = Math.max(1, parseInt(qty.value || '1', 10));
      qty.value = String(q);
      priceEl.textContent = money(current.price);
      addBtn.textContent = `Add to cart — ${money(current.price * q)}`;
      note.textContent = current.note || '';
    }

    function loadSrc(src, title) {
      if (!src) return;
      const playing = !audio.paused;
      audio.src = src;
      trackLabel.textContent = title || release.title;
      audio.load();
      if (playing) audio.play().catch(() => {});
    }

    document.getElementById('variantOpts').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-variant]');
      if (!btn) return;
      document.querySelectorAll('#variantOpts .opt').forEach((b) => {
        b.classList.remove('selected');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('selected');
      btn.setAttribute('aria-pressed', 'true');
      current = {
        id: btn.dataset.variant,
        label: btn.dataset.label,
        price: parseFloat(btn.dataset.price),
        stripe: btn.dataset.stripe,
        note: btn.dataset.note,
      };
      syncBuy();
    });

    document.getElementById('qtyMinus').onclick = () => {
      qty.value = Math.max(1, (+qty.value || 1) - 1);
      syncBuy();
    };
    document.getElementById('qtyPlus').onclick = () => {
      qty.value = (+qty.value || 1) + 1;
      syncBuy();
    };
    qty.addEventListener('change', syncBuy);

    addBtn.addEventListener('click', () => {
      const q = Math.max(1, parseInt(qty.value || '1', 10));
      window.VCR.addToCart({
        id: `${release.id}-${current.id}`,
        title: `${release.artist} — ${release.title}`,
        price: current.price,
        color: current.label,
        size: null,
        image: release.artwork,
        stripe: current.stripe || null,
        qty: q,
        releaseId: release.id,
        download: urls.download || '',
        mediaFolder: urls.folder || '',
      });
      // Remember downloads for thank-you page after Stripe
      try {
        const key = 'vcr_pending_downloads';
        const prev = JSON.parse(sessionStorage.getItem(key) || '[]');
        const entry = {
          releaseId: release.id,
          title: `${release.artist} — ${release.title}`,
          url: urls.download || '',
          folder: urls.folder || '',
        };
        const next = prev.filter((x) => x.releaseId !== release.id).concat(entry);
        sessionStorage.setItem(key, JSON.stringify(next));
      } catch (_) {}
      addBtn.textContent = 'Added';
      setTimeout(syncBuy, 900);
    });

    play.addEventListener('click', () => {
      if (!audio.src) {
        hint.textContent = 'No audio URL available for this release.';
        return;
      }
      if (audio.paused) {
        audio.play().catch((err) => {
          hint.textContent =
            'Could not play audio (check media baseUrl, CORS, and that the file exists in the public folder).';
          console.error(err);
        });
      } else audio.pause();
    });
    audio.addEventListener('play', () => play.classList.add('on'));
    audio.addEventListener('pause', () => play.classList.remove('on'));
    audio.addEventListener('timeupdate', () => {
      if (!audio.duration) return;
      seek.value = String((audio.currentTime / audio.duration) * 100);
      el.textContent = fmt(audio.currentTime);
      rem.textContent = '-' + fmt(audio.duration - audio.currentTime);
    });
    seek.addEventListener('input', () => {
      if (!audio.duration) return;
      audio.currentTime = (parseFloat(seek.value) / 100) * audio.duration;
    });

    document.getElementById('trackList')?.addEventListener('click', (e) => {
      const row = e.target.closest('[data-track-idx]');
      if (!row) return;
      document.querySelectorAll('#trackList .rtrack').forEach((r) => r.classList.remove('is-active'));
      row.classList.add('is-active');
      loadSrc(row.dataset.src, row.dataset.title);
      audio.play().catch(() => {});
    });

    document.querySelectorAll('.tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach((b) => {
          b.classList.remove('on');
          b.setAttribute('aria-selected', 'false');
        });
        document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('on'));
        btn.classList.add('on');
        btn.setAttribute('aria-selected', 'true');
        document.getElementById('tab-' + btn.dataset.tab).classList.add('on');
      });
    });

    const zoom = document.getElementById('zoom');
    document.getElementById('artZoom').onclick = () => {
      zoom.hidden = false;
    };
    zoom.querySelector('.zoom-close').onclick = () => {
      zoom.hidden = true;
    };
    zoom.onclick = (e) => {
      if (e.target === zoom) zoom.hidden = true;
    };

    // Style clickable tracks
    document.querySelectorAll('#trackList .rtrack').forEach((r) => {
      r.style.width = '100%';
      r.style.textAlign = 'left';
      r.style.background = 'transparent';
      r.style.cursor = 'pointer';
    });

    syncBuy();
    if (window.VCR && window.VCR.updateCartBadge) window.VCR.updateCartBadge();
    document.querySelectorAll('.rv').forEach((el) => el.classList.add('in'));
  }

  document.addEventListener('DOMContentLoaded', async () => {
    const id = document.body.dataset.release;
    if (!id) return;
    try {
      const mediaCfg = await window.VCRMedia.loadMediaConfig();
      const release = await loadRelease(id);
      if (!release) {
        document.getElementById('releaseRoot').innerHTML =
          '<p class="section-desc">Release not found.</p>';
        return;
      }
      render(release, mediaCfg);
    } catch (err) {
      console.error(err);
      document.getElementById('releaseRoot').innerHTML =
        '<p class="section-desc">Unable to load release.</p>';
    }
  });
})();
