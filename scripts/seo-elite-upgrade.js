#!/usr/bin/env node
/**
 * Elite SEO upgrade pass for Club Copy:
 * 1) Rewrite *.html internal links → clean root-absolute URLs
 * 2) Generate crawlable merch product pages + update shop grid
 * 3) Inject ItemList / BreadcrumbList / Product schema, News nav, alts, lastmod sitemap
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ORIGIN = 'https://www.clubcopy.ca';
const TODAY = '2026-08-10';

const PAGE_MAP = {
  'index.html': '/',
  'library.html': '/library',
  'artists.html': '/artists',
  'merch.html': '/merch',
  'news.html': '/news',
  'about.html': '/about',
  'contact.html': '/contact',
  'shipping.html': '/shipping',
  'planet.html': '/planet',
  'cart.html': '/cart',
  'checkout.html': '/checkout',
  'thank-you.html': '/thank-you',
  '404.html': '/404',
  'j-adore.html': '/j-adore',
  'enter.html': '/enter',
  'together.html': '/together',
  'letters-from-another-era.html': '/letters-from-another-era',
  'inlet-knight.html': '/inlet-knight',
  'artists/double-edge.html': '/artists/double-edge',
  'artists/inlet-knight.html': '/artists/inlet-knight',
  'news/j-adore.html': '/news/j-adore',
  'news/lookout.html': '/news/lookout',
  'news/any-jungle.html': '/news/any-jungle',
  'news/double-edge-on-club-copy.html': '/news/double-edge-on-club-copy',
  'news/inlet-knight-on-club-copy.html': '/news/inlet-knight-on-club-copy',
};

const MERCH_PRODUCTS = [
  {
    slug: 'micro-tee',
    sku: 'sm-simple-tee',
    name: 'Micro Tee',
    price: 40,
    type: 'clothing',
    category: 'Limited Collection',
    image: '/merch/club-copy/prod-simple-tee-black.jpg',
    images: {
      Black: '/merch/club-copy/prod-simple-tee-black.jpg',
      White: '/merch/club-copy/prod-simple-tee-white.jpg',
    },
    gallery: [
      { src: '/merch/club-copy/prod-simple-tee-black.jpg', alt: 'Micro Tee in black', colour: 'Black' },
      { src: '/merch/club-copy/prod-simple-tee-white.jpg', alt: 'Micro Tee in white', colour: 'White' },
      { src: '/merch/club-copy/prod-simple-tee-cream.jpg', alt: 'Micro Tee mark detail on cream', colour: null },
    ],
    colours: ['Black', 'White'],
    sizes: ['S', 'M', 'L', 'XL'],
    fit: 'Regular fit · heavyweight cotton',
    ships: 'Packed in BC · 2–4 business days',
    description:
      'Small chest mark on heavyweight cotton. The everyday Club Copy tee — cut clean, packed in BC.',
    related: { label: 'More from the collection', href: '/merch', text: 'Back to shop' },
  },
  {
    slug: 'long-sleeve',
    sku: 'sm-longsleeve',
    name: 'Long Sleeve',
    price: 53,
    type: 'clothing',
    category: 'Limited Collection',
    image: '/merch/club-copy/prod-longsleeve-white.jpg',
    gallery: [
      { src: '/merch/club-copy/prod-longsleeve-white.jpg', alt: 'Long Sleeve in white' },
      { src: '/merch/club-copy/prod-longsleeve.jpg', alt: 'Long Sleeve alternate view' },
    ],
    colours: [],
    sizes: ['S', 'M', 'L', 'XL'],
    fit: 'Regular fit · long sleeve',
    ships: 'Packed in BC · 2–4 business days',
    description:
      'Long sleeve cut with the label mark. Built for cooler nights and the walk home after the set.',
    related: { label: 'More from the collection', href: '/merch', text: 'Back to shop' },
  },
  {
    slug: 'sleeve-tee',
    sku: 'sm-sleeve-tee',
    name: 'Sleeve Tee',
    price: 55,
    type: 'clothing',
    category: 'Limited Collection',
    image: '/merch/club-copy/prod-sleeve-tee.webp',
    gallery: [{ src: '/merch/club-copy/prod-sleeve-tee.webp', alt: 'Sleeve Tee' }],
    colours: [],
    sizes: ['S', 'M', 'L', 'XL'],
    fit: 'Regular fit · sleeve print only',
    ships: 'Packed in BC · 2–4 business days',
    description:
      'Print lives on the sleeve only — quiet from the front, clear when you move.',
    related: { label: 'More from the collection', href: '/merch', text: 'Back to shop' },
  },
  {
    slug: 'hoodie',
    sku: 'sm-hoodie',
    name: 'Hoodie',
    price: 85,
    type: 'clothing',
    category: 'Limited Collection',
    image: '/merch/club-copy/prod-hoodie.webp',
    gallery: [
      { src: '/merch/club-copy/prod-hoodie.webp', alt: 'Hoodie front' },
      { src: '/merch/club-copy/prod-hoodie.jpg', alt: 'Hoodie alternate view' },
    ],
    colours: [],
    sizes: ['S', 'M', 'L', 'XL'],
    fit: 'Relaxed fit · midweight fleece',
    ships: 'Packed in BC · 2–4 business days',
    description:
      'Relaxed midweight fleece with a tonal Club Copy mark. Clean hood, no drawstrings — soft structure for late rooms.',
    related: { label: 'More from the collection', href: '/merch', text: 'Back to shop' },
  },
  {
    slug: 'crewneck',
    sku: 'sm-crewneck',
    name: 'Crewneck',
    price: 73,
    type: 'clothing',
    category: 'Limited Collection',
    image: '/merch/club-copy/prod-crewneck.jpg',
    gallery: [
      { src: '/merch/club-copy/prod-crewneck.jpg', alt: 'Crewneck' },
      { src: '/merch/club-copy/prod-crewneck.webp', alt: 'Crewneck alternate view' },
    ],
    colours: [],
    sizes: ['S', 'M', 'L', 'XL'],
    fit: 'Relaxed fit · midweight fleece',
    ships: 'Packed in BC · 2–4 business days',
    description:
      'Midweight fleece crew. Soft hand, quiet mark — a year-round label staple.',
    related: { label: 'More from the collection', href: '/merch', text: 'Back to shop' },
  },
  {
    slug: 'cap',
    sku: 'sm-cap',
    name: 'Cap',
    price: 45,
    type: 'clothing',
    category: 'Limited Collection',
    image: '/merch/club-copy/prod-cap.webp',
    gallery: [
      { src: '/merch/club-copy/prod-cap.webp', alt: 'Cap' },
      { src: '/merch/club-copy/prod-cap.jpg', alt: 'Cap alternate view' },
    ],
    colours: [],
    sizes: [],
    fit: 'One size · washed six-panel',
    ships: 'Packed in BC · 2–4 business days',
    description: 'Washed six-panel. One size. The mark sits low and close.',
    related: { label: 'More from the collection', href: '/merch', text: 'Back to shop' },
  },
  {
    slug: 'bikini',
    sku: 'sm-bikini',
    name: 'Bikini',
    price: 60,
    type: 'clothing',
    category: 'Limited Collection',
    image: '/merch/club-copy/prod-bikini.jpg',
    gallery: [
      { src: '/merch/club-copy/prod-bikini.jpg', alt: 'Bikini' },
      { src: '/merch/club-copy/prod-bikini.webp', alt: 'Bikini alternate view' },
    ],
    colours: [],
    sizes: ['XS', 'S', 'M', 'L'],
    fit: 'True to size · stretch jersey',
    ships: 'Packed in BC · 2–4 business days',
    description:
      'Stretch jersey two-piece with Club Copy detailing. True to size — made for heat, water, and weekend light.',
    related: { label: 'More from the collection', href: '/merch', text: 'Back to shop' },
  },
  {
    slug: 'slipmat',
    sku: 'sm-slipmat',
    name: 'Slipmat Pair',
    price: 22,
    type: 'goods',
    category: 'Goods',
    image: '/merch/club-copy/prod-slipmat.webp',
    gallery: [
      { src: '/merch/club-copy/prod-slipmat.webp', alt: 'Slipmat Pair' },
      { src: '/merch/club-copy/prod-slipmat.png', alt: 'Slipmat Pair detail' },
    ],
    colours: [],
    sizes: [],
    fit: 'One size · pair',
    ships: 'Packed in BC · 2–4 business days',
    description:
      'A pair for the decks. Label goods for the room that plays the records.',
    related: { label: 'Keep listening', href: '/library', text: 'Browse the library' },
  },
  {
    slug: 'poly-outer',
    sku: 'sm-poly-outer',
    name: 'Poly Outer',
    price: 5,
    type: 'goods',
    category: 'Goods',
    image: '/merch/club-copy/prod-poly-outer.webp',
    gallery: [
      { src: '/merch/club-copy/prod-poly-outer.webp', alt: 'Poly Outer' },
      { src: '/merch/club-copy/prod-poly-outer.png', alt: 'Poly Outer detail' },
    ],
    colours: [],
    sizes: [],
    fit: 'One size',
    ships: 'Packed in BC · 2–4 business days',
    description:
      'Clear protective outer for records and sleeves. Keep the archive clean.',
    related: { label: 'Keep listening', href: '/library', text: 'Browse the library' },
  },
  {
    slug: 'bundle-tee-enter',
    sku: 'bn-tee-enter',
    name: 'Bundle: Micro Tee + Enter Digital',
    price: 48,
    type: 'bundles',
    category: 'Bundle',
    image: '/merch/club-copy/bundle-tee-enter-black.webp',
    images: {
      Black: '/merch/club-copy/bundle-tee-enter-black.webp',
      White: '/merch/club-copy/bundle-tee-enter-white.webp',
    },
    gallery: [
      { src: '/merch/club-copy/bundle-tee-enter-black.webp', alt: 'Bundle tee black with Enter', colour: 'Black' },
      { src: '/merch/club-copy/bundle-tee-enter-white.webp', alt: 'Bundle tee white with Enter', colour: 'White' },
      { src: '/enter-cover.webp', alt: 'Enter, Double-Edge cover', cover: true },
    ],
    colours: ['Black', 'White'],
    sizes: ['S', 'M', 'L', 'XL'],
    fit: 'Regular fit · heavyweight cotton',
    ships: 'Tee packed in BC · digital files emailed after checkout',
    description:
      'Micro Tee plus Enter by Double-Edge as digital files. Wear the label, keep the release.',
    includes: ['Micro Tee', 'Enter, Double-Edge (digital)'],
    related: { label: 'Hear the release', href: '/enter', text: 'Enter, Double-Edge' },
  },
  {
    slug: 'bundle-tee-together',
    sku: 'bn-tee-together',
    name: 'Bundle: Micro Tee + Together Digital',
    price: 48,
    type: 'bundles',
    category: 'Bundle',
    image: '/merch/club-copy/bundle-tee-together-black.webp',
    images: {
      Black: '/merch/club-copy/bundle-tee-together-black.webp',
      White: '/merch/club-copy/bundle-tee-together-white.webp',
    },
    gallery: [
      { src: '/merch/club-copy/bundle-tee-together-black.webp', alt: 'Bundle tee black with Together', colour: 'Black' },
      { src: '/merch/club-copy/bundle-tee-together-white.webp', alt: 'Bundle tee white with Together', colour: 'White' },
      { src: '/together-cover.webp', alt: 'Together cover', cover: true },
    ],
    colours: ['Black', 'White'],
    sizes: ['S', 'M', 'L', 'XL'],
    fit: 'Regular fit · heavyweight cotton',
    ships: 'Tee packed in BC · digital files emailed after checkout',
    description:
      'Micro Tee plus Together by Inlet Knight as digital files. Soft mark, long listen.',
    includes: ['Micro Tee', 'Together (digital)'],
    related: { label: 'Hear the release', href: '/together', text: 'Together' },
  },
  {
    slug: 'bundle-tee-inlet-cassette',
    sku: 'bn-tee-inlet-cass',
    name: 'Bundle: Micro Tee + Inlet Knight Cassette',
    price: 60,
    type: 'bundles',
    category: 'Bundle',
    image: '/merch/club-copy/bundle-tee-inlet-cass-black.webp',
    images: {
      Black: '/merch/club-copy/bundle-tee-inlet-cass-black.webp',
      White: '/merch/club-copy/bundle-tee-inlet-cass-white.webp',
    },
    gallery: [
      { src: '/merch/club-copy/bundle-tee-inlet-cass-black.webp', alt: 'Bundle tee black with cassette', colour: 'Black' },
      { src: '/merch/club-copy/bundle-tee-inlet-cass-white.webp', alt: 'Bundle tee white with cassette', colour: 'White' },
      { src: '/inlet-knight-cover.webp', alt: 'Inlet Knight cassette cover', cover: true },
    ],
    colours: ['Black', 'White'],
    sizes: ['S', 'M', 'L', 'XL'],
    fit: 'Regular fit · heavyweight cotton',
    ships: 'Packed in BC · 2–4 business days',
    description:
      'Micro Tee plus the Inlet Knight cassette. Physical tape, label cotton — packed together in BC.',
    includes: ['Micro Tee', 'Inlet Knight (cassette)'],
    related: { label: 'Hear the release', href: '/inlet-knight', text: 'Inlet Knight' },
  },
];

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    if (name === 'node_modules' || name === '.git' || name === 'merch' || name === 'previews' || name === '.cursor') continue;
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

function toCleanUrl(raw) {
  let s = raw.trim();
  // strip leading ./ ../ sequences and resolve against known map
  const hashIdx = s.search(/[#?]/);
  let hash = '';
  let query = '';
  if (hashIdx !== -1) {
    const rest = s.slice(hashIdx);
    if (rest.startsWith('?')) {
      const h = rest.indexOf('#');
      if (h !== -1) {
        query = rest.slice(0, h);
        hash = rest.slice(h);
      } else query = rest;
    } else {
      hash = rest;
    }
    s = s.slice(0, hashIdx);
  }

  // normalize path separators
  s = s.replace(/^\.\//, '');
  while (s.startsWith('../')) s = s.slice(3);

  if (!s.endsWith('.html') && !PAGE_MAP[s]) {
    // already clean or not a page
    if (s.startsWith('/') || !s.includes('.html')) return null;
  }

  // try direct map
  if (PAGE_MAP[s]) return PAGE_MAP[s] + query + hash;

  // basename match for known pages
  const base = path.basename(s);
  for (const [k, v] of Object.entries(PAGE_MAP)) {
    if (path.basename(k) === base && !k.includes('/')) return v + query + hash;
    if (k.endsWith('/' + base)) return v + query + hash;
  }

  // generic: drop .html and root-absolutize
  if (s.endsWith('.html')) {
    let clean = '/' + s.replace(/\.html$/, '').replace(/^\/+/, '');
    if (clean === '/index') clean = '/';
    return clean + query + hash;
  }
  return null;
}

function rewriteHtmlLinks(content) {
  // href="...html..."
  content = content.replace(/\b(href|action)=(["'])([^"']+\.html[^"']*)\2/gi, (m, attr, q, url) => {
    // skip external
    if (/^(https?:|mailto:|tel:)/i.test(url)) return m;
    const next = toCleanUrl(url);
    if (!next) return m;
    return `${attr}=${q}${next}${q}`;
  });
  return content;
}

function rewriteJsStrings(content) {
  // "library.html" or 'merch.html' standalone page refs
  content = content.replace(/(["'])((?:\.\.\/)*(?:[\w.-]+\/)*[\w.-]+\.html)([?#][^"']*)?\1/g, (m, q, url, suffix) => {
    const next = toCleanUrl(url + (suffix || ''));
    if (!next) return m;
    return q + next + q;
  });
  return content;
}

function rewriteJsonPages(content) {
  // "page": "j-adore.html" and "slug": "news/j-adore.html"
  content = content.replace(/"(page|slug)"\s*:\s*"([^"]+\.html)"/g, (m, key, url) => {
    const next = toCleanUrl(url);
    if (!next) return m;
    return `"${key}": "${next}"`;
  });
  return content;
}

/* ---------- URL rewrite pass ---------- */
function rewriteAllLinks() {
  const files = walk(ROOT).filter((f) => /\.(html|js|json)$/.test(f));
  let changed = 0;
  for (const file of files) {
    if (file.includes('/scripts/seo-elite-upgrade.js')) continue;
    let src = fs.readFileSync(file, 'utf8');
    let next = src;
    if (file.endsWith('.html')) next = rewriteHtmlLinks(next);
    else if (file.endsWith('.js')) next = rewriteJsStrings(next);
    else if (file.endsWith('.json')) next = rewriteJsonPages(next);
    if (next !== src) {
      fs.writeFileSync(file, next);
      changed++;
      console.log('rewrote links:', path.relative(ROOT, file));
    }
  }
  console.log(`Link rewrite: ${changed} files`);
}

/* ---------- Product page generation ---------- */
function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function productSchema(p) {
  const url = `${ORIGIN}/merch/${p.slug}`;
  const offers = {
    '@type': 'Offer',
    url,
    priceCurrency: 'CAD',
    price: String(p.price),
    availability: 'https://schema.org/InStock',
    seller: { '@type': 'RecordLabel', name: 'Club Copy', url: ORIGIN + '/' },
  };
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': url + '#product',
    name: p.name,
    description: p.description,
    image: p.image.startsWith('http') ? p.image : ORIGIN + p.image,
    sku: p.sku,
    brand: { '@type': 'Brand', name: 'Club Copy' },
    category: p.category,
    offers,
  };
  if (p.colours.length || p.sizes.length) {
    schema.additionalProperty = [];
    if (p.colours.length) {
      schema.additionalProperty.push({
        '@type': 'PropertyValue',
        name: 'Colour',
        value: p.colours.join(', '),
      });
    }
    if (p.sizes.length) {
      schema.additionalProperty.push({
        '@type': 'PropertyValue',
        name: 'Size',
        value: p.sizes.join(', '),
      });
    }
  }
  return schema;
}

function breadcrumbSchema(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}

function productPageHtml(p) {
  const url = `${ORIGIN}/merch/${p.slug}`;
  const imgAbs = p.image.startsWith('http') ? p.image : ORIGIN + p.image;
  const crumbs = breadcrumbSchema([
    { name: 'Home', url: ORIGIN + '/' },
    { name: 'Shop', url: ORIGIN + '/merch' },
    { name: p.name, url },
  ]);
  const product = productSchema(p);
  const colourBtns = p.colours
    .map(
      (c, i) =>
        `<button type="button" class="pdp-opt${i === 0 ? ' is-active' : ''}" data-colour="${esc(c)}" aria-pressed="${i === 0 ? 'true' : 'false'}">${esc(c)}</button>`
    )
    .join('');
  const sizeBtns = p.sizes
    .map(
      (s, i) =>
        `<button type="button" class="pdp-opt${i === 0 ? ' is-active' : ''}" data-size="${esc(s)}" aria-pressed="${i === 0 ? 'true' : 'false'}">${esc(s)}</button>`
    )
    .join('');
  const imgMap = p.images
    ? `data-img-map='${JSON.stringify(p.images).replace(/'/g, '&#39;')}'`
    : '';
  const gallery = Array.isArray(p.gallery) && p.gallery.length ? p.gallery : [{ src: p.image, alt: p.name }];
  const first = gallery[0];
  const artClass = first.cover ? 'pdp-art pdp-art--cover media-bezel fx-spec' : 'pdp-art media-bezel fx-spec';
  const thumbs =
    gallery.length > 1
      ? `<div class="pdp-thumbs" id="pdpThumbs" role="group" aria-label="Product images">
        ${gallery
          .map(
            (g, i) =>
              `<button type="button" class="pdp-thumb${i === 0 ? ' is-active' : ''}" aria-pressed="${i === 0 ? 'true' : 'false'}" data-src="${esc(g.src)}" data-alt="${esc(g.alt || p.name)}"${g.colour ? ` data-colour="${esc(g.colour)}"` : ''}${g.cover ? ' data-cover="1"' : ''}><img src="${esc(g.src)}" alt="" loading="lazy"/></button>`
          )
          .join('')}
      </div>`
      : '';
  const related = p.related
    ? `<div class="pdp-related">
          <p class="pdp-related__label">${esc(p.related.label)}</p>
          <a href="${esc(p.related.href)}">${esc(p.related.text)}</a>
        </div>`
    : '';
  const includes =
    Array.isArray(p.includes) && p.includes.length
      ? `<p class="pdp-meta">Includes ${esc(p.includes.join(' · '))}</p>`
      : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"/>
  <title>${esc(p.name)} — Shop | Club Copy</title>
  <meta name="description" content="${esc(p.description)}"/>
  <meta name="theme-color" content="#FAF8F5"/>
  <link rel="canonical" href="${url}"/>
  <meta property="og:site_name" content="Club Copy"/>
  <meta property="og:type" content="product"/>
  <meta property="og:title" content="${esc(p.name)} — Club Copy"/>
  <meta property="og:description" content="${esc(p.description)}"/>
  <meta property="og:url" content="${url}"/>
  <meta property="og:image" content="${imgAbs}"/>
  <meta property="product:price:amount" content="${p.price}"/>
  <meta property="product:price:currency" content="CAD"/>
  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:title" content="${esc(p.name)} — Club Copy"/>
  <meta name="twitter:description" content="${esc(p.description)}"/>
  <meta name="twitter:image" content="${imgAbs}"/>
  <script type="application/ld+json">
${JSON.stringify(product, null, 2)}
  </script>
  <script type="application/ld+json">
${JSON.stringify(crumbs, null, 2)}
  </script>
  <link rel="icon" href="/favicon.png" type="image/png"/>
  <link rel="apple-touch-icon" href="/apple-touch-icon.png"/>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;600&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/css/site.css"/>
  <link rel="stylesheet" href="/css/shop.css"/>
</head>
<body id="top">
<a class="skip-link" href="#main">Skip to content</a>

<header class="nav" id="nav">
  <div class="nav-inner">
    <a href="/" class="nav-logo" aria-label="Club Copy home"><img src="/club-copy-nav-ink.webp" alt="Club Copy" width="901" height="418"/></a>
    <nav class="nav-links" aria-label="Primary">
      <a href="/#listen">Listen</a>
      <a href="/library">Library</a>
      <a href="/artists">Artists</a>
      <a href="/news">News</a>
      <a href="/merch" aria-current="page">Shop</a>
      <a href="/contact">Contact</a>
    </nav>
    <div class="nav-end">
      <a href="/cart" class="nav-cart" data-cart-link aria-label="Cart">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
          <path d="M6 8h15l-1.4 8.4a2 2 0 0 1-2 1.6H9a2 2 0 0 1-2-1.6L5 4H2"/>
          <circle cx="10" cy="20" r="1.2" fill="currentColor" stroke="none"/>
          <circle cx="18" cy="20" r="1.2" fill="currentColor" stroke="none"/>
        </svg>
        <span class="nav-cart-count" data-cart-count hidden>0</span>
      </a>
      <button class="nav-ham" id="navHam" aria-label="Menu" aria-expanded="false">
        <span></span><span></span><span></span>
      </button>
    </div>
  </div>
</header>

<div class="nav-drawer" id="navDrawer" aria-hidden="true">
  <a href="/#listen">Listen</a>
  <a href="/library">Library</a>
  <a href="/artists">Artists</a>
  <a href="/news">News</a>
  <a href="/merch">Shop</a>
  <a href="/contact">Contact</a>
  <a href="/cart">Cart</a>
</div>

<main id="main" class="pdp">
  <div class="band">
    <nav class="crumbs" aria-label="Breadcrumb">
      <a href="/">Home</a><span>/</span><a href="/merch">Shop</a><span>/</span>${esc(p.name)}
    </nav>
    <div class="pdp-grid">
      <div class="pdp-gallery">
        <div class="${artClass}" id="pdpArt">
          <img id="pdpImage" src="${esc(first.src)}" alt="${esc(first.alt || p.name)}" width="1200" height="1200" fetchpriority="high" ${imgMap}/>
        </div>
        ${thumbs}
      </div>
      <div>
        <p class="pdp-kicker">${esc(p.category)}</p>
        <h1 class="pdp-title">${esc(p.name)}</h1>
        <p class="pdp-price">$${p.price} CAD</p>
        <p class="pdp-desc">${esc(p.description)}</p>
        <p class="pdp-meta">${esc(p.fit)}</p>
        <p class="pdp-meta">${esc(p.ships)}</p>
        ${includes}
        ${
          p.colours.length
            ? `<div class="pdp-block"><span class="pdp-label">Colour</span><div class="pdp-opts" id="pdpColours" role="group">${colourBtns}</div></div>`
            : ''
        }
        ${
          p.sizes.length
            ? `<div class="pdp-block"><span class="pdp-label">Size</span><div class="pdp-opts" id="pdpSizes" role="group">${sizeBtns}</div><p class="pdp-error" id="pdpSizeError" hidden>Select a size to continue.</p></div>`
            : ''
        }
        <div class="pdp-actions">
          <button type="button" class="btn btn-dark" id="pdpAdd"
            data-sku="${esc(p.sku)}"
            data-name="${esc(p.name)}"
            data-price="${p.price}"
            data-image="${esc(p.image)}"
            data-needs-size="${p.sizes.length ? '1' : '0'}">Add to cart</button>
          <a class="btn btn-ghost" href="/merch">Back to shop</a>
        </div>
        <a class="pdp-back" href="/shipping">Shipping &amp; returns</a>
        ${related}
      </div>
    </div>
  </div>
</main>

<footer class="footer">
  <div class="band">
    <div class="footer-top">
      <div>
        <a class="footer-logo-link" href="/about"><img class="footer-logo" src="/copy-house-publishing-logo.webp" alt="Copy House Publishing" width="1448" height="399" loading="lazy"/></a>
        <p class="footer-manifesto">Copy House Publishing ©</p>
      </div>
      <div>
        <label for="footerEmail">Email updates</label>
        <form class="footer-form" action="https://formspree.io/f/xdkwjzzr" method="POST">
          <input type="email" id="footerEmail" name="email" placeholder="Email" required autocomplete="email"/>
          <input type="text" name="_gotcha" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px"/>
          <button type="submit">Join</button>
        </form>
        <p class="footer-note">Subscribe for updates.</p>
      </div>
    </div>
    <div class="footer-bottom">
      <p class="footer-copy">© 2026 Club Copy</p>
      <div class="footer-links">
        <a href="/#listen">Listen</a>
        <a href="/library">Library</a>
        <a href="/news">News</a>
        <a href="/artists">Artists</a>
        <a href="/merch">Shop</a>
        <a href="/shipping">Shipping</a>
        <a href="/planet">Planet MP3</a>
        <a href="/contact">Contact</a>
      </div>
    </div>
  </div>
</footer>

<script src="/js/site.js"></script>
<script src="/js/cart.js"></script>
<script>
(function () {
  var addBtn = document.getElementById('pdpAdd');
  var img = document.getElementById('pdpImage');
  var art = document.getElementById('pdpArt');
  var sizeError = document.getElementById('pdpSizeError');
  var thumbs = document.getElementById('pdpThumbs');

  function setActiveThumb(btn) {
    if (!thumbs || !btn) return;
    Array.prototype.forEach.call(thumbs.querySelectorAll('.pdp-thumb'), function (b) {
      var on = b === btn;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  function showSrc(src, alt, isCover) {
    if (!img) return;
    img.src = src;
    if (alt) img.alt = alt;
    if (art) art.classList.toggle('pdp-art--cover', !!isCover);
  }

  if (thumbs) {
    thumbs.addEventListener('click', function (e) {
      var btn = e.target.closest('.pdp-thumb');
      if (!btn) return;
      setActiveThumb(btn);
      showSrc(btn.getAttribute('data-src'), btn.getAttribute('data-alt'), btn.getAttribute('data-cover') === '1');
      var colour = btn.getAttribute('data-colour');
      if (colour) {
        var colourBtn = document.querySelector('#pdpColours .pdp-opt[data-colour="' + colour + '"]');
        if (colourBtn) {
          Array.prototype.forEach.call(document.querySelectorAll('#pdpColours .pdp-opt'), function (b) {
            var on = b === colourBtn;
            b.classList.toggle('is-active', on);
            b.setAttribute('aria-pressed', on ? 'true' : 'false');
          });
        }
      }
    });
  }

  function wireGroup(host, onPick) {
    if (!host) return;
    host.addEventListener('click', function (e) {
      var btn = e.target.closest('.pdp-opt');
      if (!btn) return;
      Array.prototype.forEach.call(host.querySelectorAll('.pdp-opt'), function (b) {
        var on = b === btn;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      if (onPick) onPick(btn);
    });
  }

  wireGroup(document.getElementById('pdpColours'), function (btn) {
    var colour = btn.getAttribute('data-colour');
    var mapRaw = img.getAttribute('data-img-map');
    if (mapRaw) {
      try {
        var map = JSON.parse(mapRaw);
        var next = map[colour];
        if (next) showSrc(next, img.alt, false);
      } catch (err) {}
    }
    if (thumbs) {
      var match = thumbs.querySelector('.pdp-thumb[data-colour="' + colour + '"]');
      if (match) setActiveThumb(match);
    }
  });
  wireGroup(document.getElementById('pdpSizes'));

  addBtn.addEventListener('click', function () {
    var needsSize = addBtn.getAttribute('data-needs-size') === '1';
    var sizeBtn = document.querySelector('#pdpSizes .pdp-opt.is-active');
    if (needsSize && !sizeBtn) {
      if (sizeError) sizeError.hidden = false;
      return;
    }
    if (sizeError) sizeError.hidden = true;
    var colourBtn = document.querySelector('#pdpColours .pdp-opt.is-active');
    var item = {
      sku: addBtn.getAttribute('data-sku'),
      name: addBtn.getAttribute('data-name'),
      price: Number(addBtn.getAttribute('data-price')),
      colour: colourBtn ? colourBtn.getAttribute('data-colour') : null,
      size: sizeBtn ? sizeBtn.getAttribute('data-size') : null,
      image: img ? img.getAttribute('src') : addBtn.getAttribute('data-image'),
      qty: 1
    };
    if (window.VCRCart) {
      item.id = VCRCart.lineId(item);
      VCRCart.add(item);
    }
    window.location.href = '/cart';
  });
})();
</script>
</body>
</html>
`;
}

function generateProductPages() {
  const dir = path.join(ROOT, 'merch');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  // merch/ is also images folder - products go as merch/slug.html alongside club-copy/
  for (const p of MERCH_PRODUCTS) {
    const file = path.join(dir, p.slug + '.html');
    fs.writeFileSync(file, productPageHtml(p));
    console.log('wrote', path.relative(ROOT, file));
  }
}

/* ---------- Update merch.html shop cards to link to PDPs ---------- */
function updateMerchShop() {
  const file = path.join(ROOT, 'merch.html');
  let html = fs.readFileSync(file, 'utf8');

  // Add H1 + schema after <main id="main">
  if (!html.includes('id="shop-title"')) {
    html = html.replace(
      /<main id="main">\s*<div class="store-bar"/,
      `<main id="main">
  <div class="band" style="padding-top:calc(var(--nav-h) + var(--safe-t) + 28px);padding-bottom:8px">
    <nav class="crumbs" aria-label="Breadcrumb">
      <a href="/">Home</a><span>/</span>Shop
    </nav>
    <h1 id="shop-title" style="font-family:var(--display);font-size:clamp(32px,5vw,48px);font-weight:600;letter-spacing:-.035em;line-height:1.05;margin:0 0 8px">Shop</h1>
    <p style="color:var(--muted);font-size:15px;max-width:36em;margin:0">Digital releases, cassettes, bundles, and clothing from Club Copy.</p>
  </div>
  <div class="store-bar"`
    );
  }

  // Inject CollectionPage + ItemList JSON-LD if missing
  if (!html.includes('ItemList')) {
    const musicItems = [
      { name: "j'adore", url: ORIGIN + '/j-adore' },
      { name: 'Letters From Another Era', url: ORIGIN + '/letters-from-another-era' },
      { name: 'Enter, Double-Edge', url: ORIGIN + '/enter' },
      { name: 'Together', url: ORIGIN + '/together' },
      { name: 'Inlet Knight', url: ORIGIN + '/inlet-knight' },
    ];
    const merchItems = MERCH_PRODUCTS.map((p) => ({
      name: p.name,
      url: ORIGIN + '/merch/' + p.slug,
    }));
    const all = [...musicItems, ...merchItems];
    const ld = {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      '@id': ORIGIN + '/merch#page',
      name: 'Shop — Club Copy',
      url: ORIGIN + '/merch',
      isPartOf: { '@id': ORIGIN + '/#website' },
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: all.length,
        itemListElement: all.map((it, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: it.name,
          url: it.url,
        })),
      },
    };
    const crumbs = breadcrumbSchema([
      { name: 'Home', url: ORIGIN + '/' },
      { name: 'Shop', url: ORIGIN + '/merch' },
    ]);
    html = html.replace(
      '</title>',
      `</title>\n  <script type="application/ld+json">\n${JSON.stringify(ld, null, 2)}\n  </script>\n  <script type="application/ld+json">\n${JSON.stringify(crumbs, null, 2)}\n  </script>`
    );
  }

  // Convert clothing/goods/bundles buttons → links to product pages
  const skuToSlug = Object.fromEntries(MERCH_PRODUCTS.map((p) => [p.sku, p.slug]));
  for (const [sku, slug] of Object.entries(skuToSlug)) {
    const href = `/merch/${slug}`;
    // Replace product-visual button with link (keep drawer as progressive enhancement via data-open still optional)
    // Change title button to link
    const reVisual = new RegExp(
      `(<li class="product merch-card[^>]*data-sku="${sku}"[^>]*>\\s*)<button type="button" class="product-visual([^"]*)" data-open-product aria-label="([^"]*)">`,
      'm'
    );
    html = html.replace(reVisual, `$1<a class="product-visual$2" href="${href}" aria-label="$3">`);

    // close visual tag: </button> after img → </a>  (only first occurrence after this sku - careful)
    // Better: replace title buttons for this product
    const reTitle = new RegExp(
      `(data-sku="${sku}"[\\s\\S]*?<h3 class="product-title">)<button type="button" data-open-product>([^<]*)</button>`
    );
    html = html.replace(reTitle, `$1<a href="${href}">$2</a>`);
  }

  // Fix orphaned </button> closers on converted visuals — match product-visual anchors
  // After replacement, opening is <a class="product-visual..."> but may still close with </button>
  html = html.replace(
    /(<a class="product-visual[^"]*"[^>]*>[\s\S]*?)<\/button>/g,
    '$1</a>'
  );

  fs.writeFileSync(file, html);
  console.log('updated merch.html');
}

/* ---------- Nav: insert News link ---------- */
function ensureNewsInNav(html) {
  // Primary nav: after Artists, before Shop — insert News if missing in that block
  // Pattern without News between Artists and Shop
  html = html.replace(
    /(<nav class="nav-links"[^>]*>[\s\S]*?<a href="[^"]*artists[^"]*"[^>]*>Artists<\/a>\s*)(<a href="[^"]*merch[^"]*"[^>]*>Shop<\/a>)/g,
    (m, a, b) => {
      if (m.includes('>News<')) return m;
      // detect prefix for news href from artists link
      const artistsHref = (a.match(/href="([^"]*artists[^"]*)"/) || [])[1] || '/artists';
      let newsHref = '/news';
      if (artistsHref.startsWith('../')) newsHref = '../news';
      else if (artistsHref.startsWith('/')) newsHref = '/news';
      else newsHref = 'news'; // won't happen after rewrite
      // after clean rewrite artists is /artists
      if (artistsHref === '/artists' || artistsHref.endsWith('/artists')) newsHref = '/news';
      return `${a}<a href="${newsHref}">News</a>\n      ${b}`;
    }
  );

  // Drawer: after Artists before Shop
  html = html.replace(
    /(<div class="nav-drawer"[^>]*>[\s\S]*?<a href="[^"]*artists[^"]*">Artists<\/a>\s*)(<a href="[^"]*merch[^"]*">Shop<\/a>)/g,
    (m, a, b) => {
      if (m.includes('>News<')) return m;
      return `${a}<a href="/news">News</a>\n  ${b}`;
    }
  );

  // Footer links: after Library insert News if missing
  html = html.replace(
    /(<div class="footer-links">[\s\S]*?<a href="[^"]*library[^"]*">Library<\/a>\s*)(<a href="[^"]*artists[^"]*">Artists<\/a>)/g,
    (m, a, b) => {
      if (m.includes('>News<')) return m;
      return `${a}<a href="/news">News</a>\n        ${b}`;
    }
  );

  return html;
}

function patchAllNavs() {
  const files = walk(ROOT).filter((f) => f.endsWith('.html'));
  for (const file of files) {
    let html = fs.readFileSync(file, 'utf8');
    const next = ensureNewsInNav(html);
    if (next !== html) {
      fs.writeFileSync(file, next);
      console.log('nav+news:', path.relative(ROOT, file));
    }
  }
}

/* ---------- Homepage / hub schema + alts ---------- */
function patchIndex() {
  const file = path.join(ROOT, 'index.html');
  let html = fs.readFileSync(file, 'utf8');

  // Enhance RecordLabel with sameAs (planet) + members
  html = html.replace(
    /"areaServed": "Pacific Northwest"\n      \}/,
    `"areaServed": "Pacific Northwest",
        "foundingLocation": {
          "@type": "Place",
          "name": "British Columbia, Canada"
        },
        "sameAs": [
          "https://planetmp3.net"
        ],
        "member": [
          { "@type": "MusicGroup", "@id": "https://www.clubcopy.ca/artists/inlet-knight", "name": "Inlet Knight", "url": "https://www.clubcopy.ca/artists/inlet-knight" },
          { "@type": "MusicGroup", "@id": "https://www.clubcopy.ca/artists/double-edge", "name": "Double-Edge", "url": "https://www.clubcopy.ca/artists/double-edge" }
        ]
      }`
  );

  // Fix empty news alts + place image
  const altMap = [
    ['news-jadore.webp', "Fisheye photo of a blue car at dusk — j'adore"],
    ['news-any-jungle.webp', 'Cassette rack with priced tapes — Any Jungle'],
    ['news-double.webp', 'Motion-blur silhouette at sunset — Double-Edge on Club Copy'],
    ['news-night.webp', 'Halftone face in negative — Welcome, Inlet Knight'],
  ];
  for (const [src, alt] of altMap) {
    html = html.replace(
      new RegExp(`(<img src="${src}" )alt=""`, 'g'),
      `$1alt="${alt}"`
    );
  }
  html = html.replace(
    /(<img class="place-img" src="artists\/inlet-knight\.webp" )alt=""/,
    '$1alt="Inlet Knight — Club Copy artist"'
  );

  // Twitter cards on homepage
  if (!html.includes('twitter:card')) {
    html = html.replace(
      /<meta property="og:image" content="([^"]+)"\/>/,
      `<meta property="og:image" content="$1"/>
  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:title" content="Club Copy"/>
  <meta name="twitter:description" content="Pacific Northwest electronic music — house and jungle on Club Copy."/>
  <meta name="twitter:image" content="$1"/>`
    );
  }

  fs.writeFileSync(file, html);
  console.log('patched index.html');
}

function patchNewsIndex() {
  const file = path.join(ROOT, 'news.html');
  let html = fs.readFileSync(file, 'utf8');
  const altMap = [
    ['news-jadore.webp', "Fisheye photo of a blue car at dusk — j'adore"],
    ['news-any-jungle.webp', 'Cassette rack with priced tapes — Any Jungle'],
    ['news-double.webp', 'Motion-blur silhouette at sunset — Double-Edge on Club Copy'],
    ['news-night.webp', 'Halftone face in negative — Welcome, Inlet Knight'],
  ];
  for (const [src, alt] of altMap) {
    html = html.replace(
      new RegExp(`(<img src="${src}" )alt=""`, 'g'),
      `$1alt="${alt}"`
    );
  }

  // Enrich CollectionPage ItemList if only CollectionPage
  if (!html.includes('ItemList')) {
    const items = [
      { name: "j'adore", url: ORIGIN + '/news/j-adore' },
      { name: 'Any Jungle', url: ORIGIN + '/news/any-jungle' },
      { name: 'Double-Edge on Club Copy', url: ORIGIN + '/news/double-edge-on-club-copy' },
      { name: 'Welcome, Inlet Knight', url: ORIGIN + '/news/inlet-knight-on-club-copy' },
    ];
    const ld = {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      '@id': ORIGIN + '/news#page',
      name: 'News — Club Copy',
      url: ORIGIN + '/news',
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: items.length,
        itemListElement: items.map((it, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: it.name,
          url: it.url,
        })),
      },
    };
    // replace existing CollectionPage script if present
    if (html.includes('application/ld+json')) {
      html = html.replace(
        /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
        `<script type="application/ld+json">\n${JSON.stringify(ld, null, 2)}\n  </script>`
      );
    } else {
      html = html.replace(
        '</title>',
        `</title>\n  <script type="application/ld+json">\n${JSON.stringify(ld, null, 2)}\n  </script>`
      );
    }
  }

  // crumbs
  if (!html.includes('class="crumbs"')) {
    html = html.replace(
      /(<main[^>]*>[\s\S]*?<header class="section-head">)/,
      `<main id="main" class="page">
  <div class="band">
    <nav class="crumbs" aria-label="Breadcrumb">
      <a href="/">Home</a><span>/</span>News
    </nav>
    <header class="section-head">`
    );
    // may have duplicated wrappers - check structure of news.html carefully after
  }

  fs.writeFileSync(file, html);
  console.log('patched news.html');
}

function patchLibrary() {
  const file = path.join(ROOT, 'library.html');
  let html = fs.readFileSync(file, 'utf8');
  if (!html.includes('ItemList')) {
    const items = [
      { name: "j'adore", url: ORIGIN + '/j-adore' },
      { name: 'Letters From Another Era', url: ORIGIN + '/letters-from-another-era' },
      { name: 'Enter, Double-Edge', url: ORIGIN + '/enter' },
      { name: 'Together', url: ORIGIN + '/together' },
      { name: 'Inlet Knight', url: ORIGIN + '/inlet-knight' },
    ];
    const ld = {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Library — Club Copy',
      url: ORIGIN + '/library',
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: items.length,
        itemListElement: items.map((it, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: it.name,
          url: it.url,
        })),
      },
    };
    const crumbs = breadcrumbSchema([
      { name: 'Home', url: ORIGIN + '/' },
      { name: 'Library', url: ORIGIN + '/library' },
    ]);
    html = html.replace(
      '</title>',
      `</title>\n  <script type="application/ld+json">\n${JSON.stringify(ld, null, 2)}\n  </script>\n  <script type="application/ld+json">\n${JSON.stringify(crumbs, null, 2)}\n  </script>`
    );
  }
  if (!html.includes('class="crumbs"')) {
    html = html.replace(
      /(<main[^>]*>[\s\S]*?)(<h1>Library<\/h1>)/,
      `$1<nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span>Library</nav>\n        $2`
    );
  }
  fs.writeFileSync(file, html);
  console.log('patched library.html');
}

function patchArtists() {
  const file = path.join(ROOT, 'artists.html');
  let html = fs.readFileSync(file, 'utf8');
  if (!html.includes('ItemList')) {
    const items = [
      { name: 'Inlet Knight', url: ORIGIN + '/artists/inlet-knight' },
      { name: 'Double-Edge', url: ORIGIN + '/artists/double-edge' },
    ];
    const ld = {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Artists — Club Copy',
      url: ORIGIN + '/artists',
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: items.length,
        itemListElement: items.map((it, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: it.name,
          url: it.url,
        })),
      },
    };
    const crumbs = breadcrumbSchema([
      { name: 'Home', url: ORIGIN + '/' },
      { name: 'Artists', url: ORIGIN + '/artists' },
    ]);
    html = html.replace(
      '</title>',
      `</title>\n  <script type="application/ld+json">\n${JSON.stringify(ld, null, 2)}\n  </script>\n  <script type="application/ld+json">\n${JSON.stringify(crumbs, null, 2)}\n  </script>`
    );
  }
  if (!html.includes('class="crumbs"')) {
    html = html.replace(
      /(<h1>Artists<\/h1>)/,
      `<nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span>Artists</nav>\n        $1`
    );
  }
  fs.writeFileSync(file, html);
  console.log('patched artists.html');
}

function patchArtistPages() {
  const pages = [
    {
      file: 'artists/inlet-knight.html',
      name: 'Inlet Knight',
      crumbs: [
        { name: 'Home', url: ORIGIN + '/' },
        { name: 'Artists', url: ORIGIN + '/artists' },
        { name: 'Inlet Knight', url: ORIGIN + '/artists/inlet-knight' },
      ],
      alts: [
        ['j-adore-cover.webp', "j'adore — artwork"],
        ['together-cover.webp', 'Together — artwork'],
        ['inlet-knight-cover.webp', 'Inlet Knight — artwork'],
        ['letters-from-another-era-cover.webp', 'Letters From Another Era — artwork'],
      ],
    },
    {
      file: 'artists/double-edge.html',
      name: 'Double-Edge',
      crumbs: [
        { name: 'Home', url: ORIGIN + '/' },
        { name: 'Artists', url: ORIGIN + '/artists' },
        { name: 'Double-Edge', url: ORIGIN + '/artists/double-edge' },
      ],
      alts: [['enter-cover.webp', 'Enter, Double-Edge — artwork']],
    },
  ];
  for (const p of pages) {
    const file = path.join(ROOT, p.file);
    let html = fs.readFileSync(file, 'utf8');
    for (const [src, alt] of p.alts) {
      html = html.replace(
        new RegExp(`(src="[^"]*${src}" )alt=""`, 'g'),
        `$1alt="${alt}"`
      );
    }
    if (!html.includes('BreadcrumbList')) {
      const crumbs = breadcrumbSchema(p.crumbs);
      html = html.replace(
        '</title>',
        `</title>\n  <script type="application/ld+json">\n${JSON.stringify(crumbs, null, 2)}\n  </script>`
      );
    }
    if (!html.includes('class="crumbs"')) {
      html = html.replace(
        new RegExp(`(<h1>${p.name}<\\/h1>)`),
        `<nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><a href="/artists">Artists</a><span>/</span>${p.name}</nav>\n        $1`
      );
    }
    // sameAs placeholder via planet for artists - skip inventing socials
    fs.writeFileSync(file, html);
    console.log('patched', p.file);
  }
}

function patchReleaseBreadcrumbs() {
  const releases = [
    { file: 'j-adore.html', name: "j'adore", artist: 'Inlet Knight', artistUrl: '/artists/inlet-knight', url: '/j-adore' },
    { file: 'enter.html', name: 'Enter, Double-Edge', artist: 'Double-Edge', artistUrl: '/artists/double-edge', url: '/enter' },
    { file: 'together.html', name: 'Together', artist: 'Inlet Knight', artistUrl: '/artists/inlet-knight', url: '/together' },
    { file: 'letters-from-another-era.html', name: 'Letters From Another Era', artist: 'Inlet Knight', artistUrl: '/artists/inlet-knight', url: '/letters-from-another-era' },
    { file: 'inlet-knight.html', name: 'Inlet Knight', artist: 'Inlet Knight', artistUrl: '/artists/inlet-knight', url: '/inlet-knight' },
  ];
  for (const r of releases) {
    const file = path.join(ROOT, r.file);
    let html = fs.readFileSync(file, 'utf8');
    if (!html.includes('BreadcrumbList')) {
      const crumbs = breadcrumbSchema([
        { name: 'Home', url: ORIGIN + '/' },
        { name: 'Library', url: ORIGIN + '/library' },
        { name: r.artist, url: ORIGIN + r.artistUrl },
        { name: r.name, url: ORIGIN + r.url },
      ]);
      html = html.replace(
        '</title>',
        `</title>\n  <script type="application/ld+json">\n${JSON.stringify(crumbs, null, 2)}\n  </script>`
      );
    }
    if (!html.includes('twitter:card')) {
      html = html.replace(
        /<meta property="og:image" content="([^"]+)"\/>/,
        `<meta property="og:image" content="$1"/>
  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:title" content="${esc(r.artist)} — ${esc(r.name)}"/>
  <meta name="twitter:image" content="$1"/>`
      );
    }
    // visible crumbs before hero title if missing
    if (!html.includes('class="crumbs"')) {
      html = html.replace(
        /(<h1 class="ra-hero-title">)/,
        `<nav class="crumbs" aria-label="Breadcrumb" style="padding:0 0 16px"><a href="/">Home</a><span>/</span><a href="/library">Library</a><span>/</span><a href="${r.artistUrl}">${esc(r.artist)}</a><span>/</span>${esc(r.name)}</nav>\n        $1`
      );
    }
    fs.writeFileSync(file, html);
    console.log('patched release', r.file);
  }
}

function patchNewsArticles() {
  const articles = [
    { file: 'news/j-adore.html', name: "j'adore", url: '/news/j-adore' },
    { file: 'news/any-jungle.html', name: 'Any Jungle', url: '/news/any-jungle' },
    { file: 'news/double-edge-on-club-copy.html', name: 'Double-Edge on Club Copy', url: '/news/double-edge-on-club-copy' },
    { file: 'news/inlet-knight-on-club-copy.html', name: 'Welcome, Inlet Knight', url: '/news/inlet-knight-on-club-copy' },
  ];
  for (const a of articles) {
    const file = path.join(ROOT, a.file);
    let html = fs.readFileSync(file, 'utf8');
    if (!html.includes('BreadcrumbList')) {
      const crumbs = breadcrumbSchema([
        { name: 'Home', url: ORIGIN + '/' },
        { name: 'News', url: ORIGIN + '/news' },
        { name: a.name, url: ORIGIN + a.url },
      ]);
      html = html.replace(
        '</title>',
        `</title>\n  <script type="application/ld+json">\n${JSON.stringify(crumbs, null, 2)}\n  </script>`
      );
    }
    if (!html.includes('class="crumbs"')) {
      html = html.replace(
        /(<h1>)/,
        `<nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><a href="/news">News</a><span>/</span>${esc(a.name)}</nav>\n      $1`
      );
    }
    if (!html.includes('twitter:card')) {
      html = html.replace(
        /<meta property="og:image" content="([^"]+)"\/>/,
        `<meta property="og:image" content="$1"/>
  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:title" content="${esc(a.name)} — Club Copy"/>
  <meta name="twitter:image" content="$1"/>`
      );
    }
    fs.writeFileSync(file, html);
    console.log('patched article', a.file);
  }
}

function patchCartNoindex() {
  const file = path.join(ROOT, 'cart.html');
  let html = fs.readFileSync(file, 'utf8');
  if (!html.includes('noindex')) {
    html = html.replace(
      /<meta name="description"[^>]*>/,
      `<meta name="robots" content="noindex,nofollow"/>\n  <meta name="description" content="Your Club Copy cart."/>`
    );
  }
  // fix checkout canonical
  const checkout = path.join(ROOT, 'checkout.html');
  let c = fs.readFileSync(checkout, 'utf8');
  c = c.replace(/href="[^"]*cart[^"]*"/, 'href="https://www.clubcopy.ca/cart"');
  fs.writeFileSync(checkout, c);
  fs.writeFileSync(file, html);
  console.log('cart noindex + checkout canonical');
}

function patchShippingOg() {
  const file = path.join(ROOT, 'shipping.html');
  let html = fs.readFileSync(file, 'utf8');
  if (!html.includes('og:image')) {
    html = html.replace(
      /<meta property="og:url"[^>]*>/,
      `<meta property="og:url" content="https://www.clubcopy.ca/shipping"/>
  <meta property="og:image" content="https://www.clubcopy.ca/together-cover.webp"/>`
    );
  }
  fs.writeFileSync(file, html);
}

function writeSitemap() {
  const urls = [
    ['/', 1.0, 'weekly'],
    ['/library', 0.9, 'weekly'],
    ['/artists', 0.8, 'monthly'],
    ['/artists/double-edge', 0.85, 'monthly'],
    ['/artists/inlet-knight', 0.85, 'monthly'],
    ['/merch', 0.85, 'weekly'],
    ...MERCH_PRODUCTS.map((p) => [`/merch/${p.slug}`, 0.7, 'weekly']),
    ['/news', 0.8, 'weekly'],
    ['/news/j-adore', 0.7, 'monthly'],
    ['/news/any-jungle', 0.7, 'monthly'],
    ['/news/double-edge-on-club-copy', 0.65, 'monthly'],
    ['/news/inlet-knight-on-club-copy', 0.65, 'monthly'],
    ['/j-adore', 0.9, 'monthly'],
    ['/enter', 0.9, 'monthly'],
    ['/together', 0.9, 'monthly'],
    ['/letters-from-another-era', 0.9, 'monthly'],
    ['/inlet-knight', 0.9, 'monthly'],
    ['/about', 0.5, 'yearly'],
    ['/contact', 0.5, 'yearly'],
    ['/shipping', 0.4, 'yearly'],
    ['/planet', 0.5, 'monthly'],
  ];
  const body = urls
    .map(
      ([loc, pri, freq]) => `  <url>
    <loc>${ORIGIN}${loc === '/' ? '/' : loc}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>${freq}</changefreq>
    <priority>${pri.toFixed(1)}</priority>
  </url>`
    )
    .join('\n');
  fs.writeFileSync(
    path.join(ROOT, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`
  );
  console.log('wrote sitemap.xml with', urls.length, 'urls');
}

function patchVercelRedirects() {
  const file = path.join(ROOT, 'vercel.json');
  const conf = JSON.parse(fs.readFileSync(file, 'utf8'));
  const needed = [
    { source: '/index.html', destination: '/', permanent: true },
    { source: '/:path*.html', destination: '/:path*', permanent: true },
  ];
  conf.redirects = conf.redirects || [];
  for (const r of needed) {
    if (!conf.redirects.some((x) => x.source === r.source)) {
      conf.redirects.unshift(r);
    }
  }
  fs.writeFileSync(file, JSON.stringify(conf, null, 2) + '\n');
  console.log('patched vercel.json redirects');
}

function addCrumbsCss() {
  const file = path.join(ROOT, 'css/site.css');
  let css = fs.readFileSync(file, 'utf8');
  if (!css.includes('.crumbs')) {
    css += `

/* Breadcrumbs — shared SEO / IA trail */
.crumbs {
  padding: 0 0 20px;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: .04em;
  color: var(--dim);
}
.crumbs a { color: var(--muted); transition: color var(--dur) var(--ease); }
@media (hover:hover) { .crumbs a:hover { color: var(--ink); } }
.crumbs span { margin: 0 10px; opacity: .4; }
`;
    fs.writeFileSync(file, css);
    console.log('added .crumbs to site.css');
  }
}

function patchAboutContactSchema() {
  for (const [file, name, urlPath] of [
    ['about.html', 'About — Club Copy', '/about'],
    ['contact.html', 'Contact — Club Copy', '/contact'],
  ]) {
    const p = path.join(ROOT, file);
    let html = fs.readFileSync(p, 'utf8');
    if (!html.includes('BreadcrumbList')) {
      const crumbs = breadcrumbSchema([
        { name: 'Home', url: ORIGIN + '/' },
        { name: name.split(' — ')[0], url: ORIGIN + urlPath },
      ]);
      html = html.replace(
        '</title>',
        `</title>\n  <script type="application/ld+json">\n${JSON.stringify(crumbs, null, 2)}\n  </script>`
      );
      fs.writeFileSync(p, html);
    }
  }
}

/* ---------- main ---------- */
if (require.main === module) {
  rewriteAllLinks();
  generateProductPages();
  updateMerchShop();
  addCrumbsCss();
  patchAllNavs();
  patchIndex();
  patchNewsIndex();
  patchLibrary();
  patchArtists();
  patchArtistPages();
  patchReleaseBreadcrumbs();
  patchNewsArticles();
  patchCartNoindex();
  patchShippingOg();
  patchAboutContactSchema();
  writeSitemap();
  patchVercelRedirects();
  console.log('Done.');
}

module.exports = { MERCH_PRODUCTS, generateProductPages, productPageHtml };