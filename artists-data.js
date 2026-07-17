/* Artists list + profile rendering from data/artists.json */
(function () {
  'use strict';

  async function loadArtists() {
    const res = await fetch('data/artists.json', { cache: 'no-store' });
    return (await res.json()).artists || [];
  }

  function card(a, i) {
    return `
      <a class="a-card rv ${i ? 'd' + Math.min(i, 2) : ''}" href="${a.slug}">
        <img src="${a.image}" alt="${a.name}" loading="lazy"/>
        <div class="a-card-shade"></div>
        <div class="a-card-body">
          <div class="a-name">${a.name}</div>
          <div class="a-role">${a.role || 'Artist'}</div>
        </div>
      </a>`;
  }

  async function renderList() {
    const grid = document.getElementById('artistsGrid');
    if (!grid || grid.dataset.fromJson !== 'true') return;
    const artists = await loadArtists();
    grid.innerHTML = artists.map(card).join('');
    grid.querySelectorAll('.rv').forEach((el) => el.classList.add('in'));
  }

  async function renderProfile() {
    const id = document.body.dataset.artist;
    const root = document.getElementById('artistRoot');
    if (!id || !root) return;
    const artists = await loadArtists();
    const a = artists.find((x) => x.id === id);
    if (!a) {
      root.innerHTML = '<p class="section-desc">Artist not found.</p>';
      return;
    }
    document.title = `${a.name} — VCR Recordings`;
    const social = Object.entries(a.social || {})
      .map(([k, href]) => `<a href="${href}" target="_blank" rel="noopener">${k}</a>`)
      .join('');
    const tags = (a.tags || []).map((t) => `<span class="tag">${t}</span>`).join('');
    const bio = (a.bio || []).map((p) => `<p>${p}</p>`).join('');
    const related = artists
      .filter((x) => x.id !== a.id)
      .slice(0, 2)
      .map(
        (x) => `
      <a class="a-card rv" href="${x.slug}" style="aspect-ratio:16/10">
        <img src="${x.image}" alt="${x.name}" loading="lazy"/>
        <div class="a-card-shade"></div>
        <div class="a-card-body">
          <div class="a-name">${x.name}</div>
          <div class="a-role">${x.role || 'Artist'}</div>
        </div>
      </a>`
      )
      .join('');

    // releases by artist
    let releasesHtml = '';
    try {
      const relRes = await fetch('data/releases.json', { cache: 'no-store' });
      const rels = ((await relRes.json()).releases || []).filter((r) => r.artistId === a.id);
      releasesHtml = rels
        .slice(0, 9)
        .map(
          (r) => `
        <a class="rel-card rv" href="${r.slug}">
          <div class="rel-art"><img src="${r.artwork}" alt="${r.title}" loading="lazy"/></div>
          <div class="rel-body">
            <div class="rel-artist">${r.artist}</div>
            <div class="rel-title">${r.title}</div>
            <div class="rel-meta">${r.year} · ${(r.formats || []).join(' + ')}</div>
          </div>
        </a>`
        )
        .join('');
    } catch (_) {}

    root.innerHTML = `
      <section class="artist-hero">
        <div class="artist-hero-media"><img src="${a.image}" alt="${a.name}" fetchpriority="high"/></div>
        <div class="artist-hero-shade" aria-hidden="true"></div>
        <div class="artist-hero-content">
          <div class="crumbs"><a href="index.html">Home</a><span>/</span><a href="artists.html">Artists</a><span>/</span>${a.name}</div>
          <h1>${a.name}</h1>
          <div class="artist-meta-row"><span class="tag">${a.role || 'Artist'}</span>${tags}</div>
          <div class="social-links">${social}</div>
        </div>
      </section>
      <section class="section">
        <div class="wrap bio-grid">
          <div class="bio-text rv">${bio}</div>
          <aside class="bio-aside glass-panel rv d1">
            <div class="label">Profile</div>
            <ul class="stat-list">
              <li><span>Label</span><strong>VCR Recordings</strong></li>
              <li><span>Role</span><strong>${a.role || 'Artist'}</strong></li>
            </ul>
          </aside>
        </div>
      </section>
      ${
        releasesHtml
          ? `<section class="section" style="padding-top:0"><div class="wrap">
        <div class="section-head rv"><div><div class="eyebrow">Discography</div><h2 class="section-title">Releases</h2></div></div>
        <div class="releases-grid">${releasesHtml}</div>
      </div></section>`
          : ''
      }
      <section class="section" style="padding-top:0"><div class="wrap">
        <div class="section-head rv"><div><div class="eyebrow">More from VCR</div><h2 class="section-title">Related Artists</h2></div></div>
        <div class="related-grid">${related}</div>
      </div></section>`;
    root.querySelectorAll('.rv').forEach((el) => el.classList.add('in'));
  }

  document.addEventListener('DOMContentLoaded', () => {
    renderList().catch(console.error);
    renderProfile().catch(console.error);
  });
})();
