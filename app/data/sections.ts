export type ListenLink = {
  label: string;
  href: string;
};

export type TrackItem = {
  title: string;
  duration?: string;
};

export type SectionItem = {
  label: string;
  meta?: string;
  detail?: string;
  /** Short CTA label (e.g. PLAY, BUY, EMAIL). */
  cta?: string;
  /** Outbound / mailto / hash link for the CTA. */
  href?: string;
  /** Accent letter / glyph fallback when no thumbSrc. */
  thumb?: string;
  /** Real cover / flyer art under /public/panel-thumbs. */
  thumbSrc?: string;
  /**
   * Local video URL played on the in-room CRT (Videos section).
   * When set, primary row click stays in the room instead of window.open.
   */
  videoSrc?: string;
  /** Music nest — track list shown in level-2 detail. */
  tracks?: TrackItem[];
  /** Music nest — streaming pills. */
  listenOn?: ListenLink[];
};

const T = {
  atHome: '/panel-thumbs/at-home.webp',
  summer: '/panel-thumbs/summer.webp',
  lions: '/panel-thumbs/lions.webp',
  rack: '/panel-thumbs/rack.webp',
  testpress: '/panel-thumbs/testpress.webp',
  classic: '/panel-thumbs/classic.webp',
  poetry: '/panel-thumbs/poetry.webp',
  future: '/panel-thumbs/future.webp',
  ltd: '/panel-thumbs/ltd.webp',
  vcr: '/panel-thumbs/vcr.webp',
  logo: '/panel-thumbs/logo.webp',
  email: '/panel-thumbs/email.webp',
  info: '/panel-thumbs/info.webp',
  ig: '/panel-thumbs/ig.webp',
  yt: '/panel-thumbs/yt.webp',
  shop: '/panel-thumbs/shop.webp',
  about: '/panel-thumbs/about.webp',
  bc: '/panel-thumbs/bc.webp',
  cover1: '/panel-thumbs/cover1.webp',
  cover2: '/panel-thumbs/cover2.webp',
} as const;

export type Section = {
  /** stable id / route slug */
  id: string;
  /** the object in the scene that holds this hotspot */
  object: string;
  /** the destination the hotspot maps to */
  nav: string;
  /** short label shown on hover */
  hint: string;
  /** panel heading */
  title: string;
  /** panel sub heading */
  kicker: string;
  /** intro copy, written to feel like stepping into a hidden room */
  intro: string;
  /** accent colour used across the hotspot + panel */
  accent: string;
  /**
   * Normalised hotspot position on the equirectangular store
   * (public/textures/store_pano_v3.webp, 2048×1024).
   * u: around full 360° yaw after BackSide U-flip (1 − texture_u) · v: top→bottom
   */
  u: number;
  v: number;
  /** Optional lookto aim point (defaults to hotspot u/v). */
  lookU?: number;
  lookV?: number;
  /** hotspot footprint in world units on the sphere wall */
  w: number;
  h: number;
  /**
   * MFOV used by lookto when focusing this feature
   * (balmingtiger zooms in: music 60, video 20, tour 80, contact 60).
   */
  lookFov: number;
  /** Object SFX key played on focus (see lib/audio.ts). */
  sfx: string;
  /**
   * When false, glow is hover-only (no focusedId latch). CRT / shop use this.
   * Default true — glow stays while the section is focused (lookto/panel).
   */
  glowLatches?: boolean;
  /** Flip glow map on X (plane UV vs BackSide wall parity). */
  glowFlipX?: boolean;
  /** list rendered inside the panel */
  items: SectionItem[];
};

const BANDCAMP = 'https://vcrrecordings.bandcamp.com';
const INSTAGRAM = 'https://www.instagram.com/vcr_recordings';
const CONTACT_EMAIL = 'mailto:charlie@vcrrecords.com';
const DEMOS_EMAIL = 'mailto:info@vcrrecords.com';
const YOUTUBE_ABOUT = 'https://www.youtube.com/watch?v=AUAqGMaGjk4';

/** Real listen destinations — VCR Recordings Bandcamp is the catalog home. */
const STREAM = [
  { label: 'Bandcamp', href: BANDCAMP },
  { label: 'Instagram', href: INSTAGRAM },
];

/** Deep links into the existing /shop catalog (same-origin). */
const SHOP = {
  home: '/shop/index.html',
  atHome: '/shop/home.html',
  summer: '/shop/summer.html',
  lion: '/shop/lion.html',
  rack: '/shop/rack.html',
  testpress: '/shop/testpress.html',
  classic: '/shop/classic.html',
  future: '/shop/future.html',
  poetry: '/shop/poetry.html',
  contact: '/shop/contact.html',
  about: '/shop/about.html',
} as const;

/**
 * Discoverable hotspots around the 360° store.
 * Click-and-drag to look, then click a feature to open its room.
 * Append ?debug=1 to tint hit areas while tuning (u,v).
 */
export const SECTIONS: Section[] = [
  {
    id: 'listening-booth',
    object: 'Listening Booth',
    nav: 'Music',
    hint: 'Slip on the headphones',
    title: 'The Listening Booth',
    kicker: 'Music',
    intro:
      'The foam ear-cups still smell of cigarettes and rain. Drop the needle and the room disappears — just you, a stool, and 174 beats per minute.',
    accent: '#ffb347',
    u: 0.2,
    v: 0.4,
    // Aim slightly into the booth glass for a composed focus frame
    lookU: 0.205,
    lookV: 0.38,
    w: 6,
    h: 9,
    lookFov: 60,
    sfx: 'music',
    items: [
      {
        label: 'At Home — Inlet Knight',
        meta: 'Featured release',
        detail: '3 tracks',
        cta: 'Open',
        thumb: 'AH',
        thumbSrc: T.atHome,
        href: SHOP.atHome,
        tracks: [
          { title: '01. After All', duration: '2:22' },
          { title: '02. Will I See You Again?', duration: '3:58' },
          { title: '03. At Home', duration: '3:44' },
        ],
        listenOn: [
          { label: 'Bandcamp', href: 'https://inletknight.bandcamp.com' },
          { label: 'Shop page', href: SHOP.atHome },
          { label: 'Label BC', href: BANDCAMP },
        ],
      },
      {
        label: 'Summer Mix — LT Drifta',
        meta: 'Continuous mix',
        detail: '11 cuts',
        cta: 'Open',
        thumb: 'SM',
        thumbSrc: T.summer,
        href: SHOP.summer,
        tracks: [
          { title: '01. Summer Madness', duration: '3:20' },
          { title: '02. Too Far', duration: '2:55' },
          { title: '03. Naima', duration: '7:54' },
          { title: '04. Space and Time', duration: '2:07' },
          { title: '05. Go!', duration: '3:37' },
          { title: '06. Next Up', duration: '2:52' },
          { title: '07. Colours of You', duration: '3:32' },
          { title: '08. Nu Saigon', duration: '1:04' },
          { title: '09. You\'re My', duration: '2:51' },
          { title: '10. So What', duration: '1:43' },
          { title: '11. Mood Indigo', duration: '3:02' },
        ],
        listenOn: [
          { label: 'Bandcamp', href: 'https://ltdrifta.bandcamp.com' },
          { label: 'Shop page', href: SHOP.summer },
          { label: 'Label BC', href: BANDCAMP },
        ],
      },
      {
        label: 'Lions Gate — Drifta',
        meta: 'Single',
        detail: '3:09',
        cta: 'Open',
        thumb: 'LG',
        thumbSrc: T.lions,
        href: SHOP.lion,
        tracks: [
          { title: '01. Lions Gate', duration: '3:09' },
        ],
        listenOn: [
          { label: 'Bandcamp', href: 'https://drifta.bandcamp.com' },
          { label: 'Shop page', href: SHOP.lion },
          { label: 'Label BC', href: BANDCAMP },
        ],
      },
      {
        label: 'Rack Em — LT Drifta',
        meta: 'Album',
        detail: '6 tracks',
        cta: 'Open',
        thumb: 'RK',
        thumbSrc: T.rack,
        href: SHOP.rack,
        tracks: [
          { title: '01. Rack\'em', duration: '2:57' },
          { title: '02. Since I Left You', duration: '6:45' },
          { title: '03. Unlucky', duration: '3:19' },
          { title: '04. Kiss of Life (Calm Acid Mix)', duration: '9:01' },
          { title: '05. Hold On To It', duration: '3:30' },
          { title: '06. Same Time', duration: '3:57' },
        ],
        listenOn: [
          { label: 'Bandcamp', href: 'https://ltdrifta.bandcamp.com/album/rack-em' },
          { label: 'Shop page', href: SHOP.rack },
          { label: 'Label BC', href: BANDCAMP },
        ],
      },
      {
        label: 'VCR Recordings — Full Catalog',
        meta: 'Label Bandcamp',
        detail: 'Browse',
        cta: 'Open',
        thumb: 'VC',
        thumbSrc: T.vcr,
        href: BANDCAMP,
        tracks: [
          { title: 'Everything on the label Bandcamp', duration: '' },
          { title: 'Singles, mixes, and deep cuts', duration: '' },
        ],
        listenOn: STREAM,
      },
    ],
  },
  {
    id: 'crt-tv',
    object: 'CRT Television',
    nav: 'Videos',
    hint: 'Adjust the antenna',
    title: 'The CRT',
    kicker: 'Videos',
    intro:
      'Static rolls until it doesn’t. Hand-dubbed VHS sets, pirate TV idents and grainy warehouse footage nobody was supposed to keep.',
    accent: '#7ad7ff',
    u: 0.3,
    v: 0.42,
    w: 4.5,
    h: 4.2,
    lookFov: 20,
    sfx: 'video',
    // balmingtiger: TV glow extinguishes while watching (no active latch)
    glowLatches: false,
    items: [
      {
        label: 'Store Loop',
        meta: 'In-CRT',
        detail: 'Ambient',
        cta: 'Play',
        thumb: 'A',
        thumbSrc: T.yt,
        videoSrc: '/videos/channel_a.mp4',
        href: YOUTUBE_ABOUT,
      },
      {
        label: 'Banter Tape',
        meta: 'In-CRT',
        detail: 'Warehouse',
        cta: 'Play',
        thumb: 'B',
        thumbSrc: T.testpress,
        videoSrc: '/videos/channel_b.mp4',
        href: SHOP.testpress,
      },
      {
        label: 'Classic Cuts',
        meta: 'In-CRT + page',
        detail: 'Watch',
        cta: 'Play',
        thumb: 'CL',
        thumbSrc: T.classic,
        videoSrc: '/videos/channel_classic.mp4',
        href: SHOP.classic,
      },
      {
        label: 'Future Boy',
        meta: 'In-CRT + page',
        detail: 'Watch',
        cta: 'Play',
        thumb: 'FB',
        thumbSrc: T.future,
        videoSrc: '/videos/channel_future.mp4',
        href: SHOP.future,
      },
      {
        label: 'Lions Gate',
        meta: 'In-CRT + page',
        detail: 'Watch',
        cta: 'Play',
        thumb: 'LG',
        thumbSrc: T.lions,
        videoSrc: '/videos/channel_lions.mp4',
        href: SHOP.lion,
      },
      {
        label: 'At Home',
        meta: 'In-CRT + page',
        detail: 'Watch',
        cta: 'Play',
        thumb: 'AH',
        thumbSrc: T.atHome,
        videoSrc: '/videos/channel_athome.mp4',
        href: SHOP.atHome,
      },
    ],
  },
  {
    id: 'record-bins',
    object: 'Record Bins',
    nav: 'Artists',
    hint: 'Flick through the crates',
    title: 'The Bins',
    kicker: 'Artists',
    intro:
      'Cardboard sleeves softened by a thousand thumbs. Every divider is a name; every name kept this place breathing after dark.',
    accent: '#ff7a9c',
    u: 0.34,
    v: 0.78,
    // Hit rect is wide — lookto centers on the primary crate face
    lookU: 0.33,
    lookV: 0.7,
    w: 16,
    h: 7,
    lookFov: 85,
    sfx: 'artists',
    items: [
      { label: 'LT Drifta', meta: 'Jungle / Steppa', detail: 'Bandcamp', cta: 'Listen', thumb: 'LD', thumbSrc: T.ltd, href: 'https://ltdrifta.bandcamp.com' },
      { label: 'Inlet Knight', meta: 'At Home', detail: 'Bandcamp', cta: 'Listen', thumb: 'IK', thumbSrc: T.atHome, href: 'https://inletknight.bandcamp.com' },
      { label: 'Drifta', meta: 'Lions Gate', detail: 'Bandcamp', cta: 'Listen', thumb: 'DR', thumbSrc: T.lions, href: 'https://drifta.bandcamp.com' },
      { label: 'Felix Hastings', meta: 'Edits / singles', detail: 'Bandcamp', cta: 'Listen', thumb: 'FH', thumbSrc: T.cover1, href: 'https://fhastings.bandcamp.com' },
      { label: 'VCR Recordings', meta: 'Full label', detail: 'Bandcamp', cta: 'Browse', thumb: 'VC', thumbSrc: T.vcr, href: BANDCAMP },
      { label: 'All releases', meta: 'In the shop', detail: 'Catalog', cta: 'Shop', thumb: 'SH', thumbSrc: T.shop, href: SHOP.home },
    ],
  },
  {
    id: 'cash-register',
    object: 'Cash Register',
    nav: 'Shop',
    hint: 'Ring it up',
    title: 'The Counter',
    kicker: 'Shop',
    intro:
      'The drawer sticks unless you hit it just right. Fresh pressings, dusty repress, and a tin of badges by the till.',
    accent: '#9dff8a',
    // Register body on store_pano_v3 (file≈1655–1845, 995–1175).
    // Spherical u = 1 − file_u after BackSide flip.
    u: 0.573,
    v: 0.53,
    w: 15.4,
    h: 14.7,
    lookFov: 58,
    sfx: 'shop',
    // shopbag: hover glow only — click navigates to /shop/index.html
    glowLatches: false,
    glowFlipX: true,
    items: [
      { label: 'At Home — Inlet Knight', meta: 'Featured', detail: 'Buy / stream', cta: 'Buy', thumb: 'AH', thumbSrc: T.atHome, href: SHOP.atHome },
      { label: 'Summer Mix — LT Drifta', meta: 'Mix', detail: 'Buy / stream', cta: 'Buy', thumb: 'SM', thumbSrc: T.summer, href: SHOP.summer },
      { label: 'Lions Gate — Drifta', meta: 'Single', detail: 'Buy / stream', cta: 'Buy', thumb: 'LG', thumbSrc: T.lions, href: SHOP.lion },
      { label: 'Rack Em — LT Drifta', meta: 'Album', detail: 'Buy / stream', cta: 'Buy', thumb: 'RK', thumbSrc: T.rack, href: SHOP.rack },
      { label: 'Full shop', meta: 'All releases', detail: 'Browse', cta: 'Shop', thumb: 'SH', thumbSrc: T.shop, href: SHOP.home },
    ],
  },
  {
    id: 'flyer-wall',
    object: 'Flyer Wall',
    nav: 'Archive',
    hint: 'Read between the staples',
    title: 'The Wall',
    kicker: 'Archive',
    intro:
      'Layer over layer over layer. Pull one flyer and three come with it. Every party that ever mattered is buried in here somewhere.',
    accent: '#ffe66d',
    u: 0.44,
    v: 0.36,
    lookU: 0.43,
    lookV: 0.34,
    w: 12,
    h: 6,
    lookFov: 80,
    sfx: 'archive',
    items: [
      { label: 'About the label', meta: 'Story', detail: 'Read', cta: 'View', thumb: 'AB', thumbSrc: T.about, href: SHOP.about },
      { label: 'Poetry / Drum Poetry', meta: 'Release', detail: 'Open', cta: 'View', thumb: 'PO', thumbSrc: T.poetry, href: SHOP.poetry },
      { label: 'Classic archive', meta: 'Cuts', detail: 'Open', cta: 'View', thumb: 'CL', thumbSrc: T.classic, href: SHOP.classic },
      { label: 'Bandcamp catalog', meta: 'Everything', detail: 'Browse', cta: 'View', thumb: 'BC', thumbSrc: T.bc, href: BANDCAMP },
      { label: 'Instagram board', meta: '@vcr_recordings', detail: 'Follow', cta: 'View', thumb: 'IG', thumbSrc: T.ig, href: INSTAGRAM },
    ],
  },
  {
    id: 'phone-booth',
    object: 'Phone Booth',
    nav: 'Contact',
    hint: 'Pick up the receiver',
    title: 'The Payphone',
    kicker: 'Contact',
    intro:
      'Still takes 10p. The number on the card behind the glass hasn’t changed since ’93 — ring it and somebody actually answers.',
    accent: '#ff5e5e',
    // Red payphone in pano (file u≈0.514 → spherical 1−file_u)
    u: 0.486,
    v: 0.406,
    w: 4.2,
    h: 7.5,
    lookFov: 60,
    sfx: 'phone',
    items: [
      { label: 'charlie@vcrrecords.com', meta: 'General', detail: 'Email', cta: 'Email', thumb: 'CH', thumbSrc: T.email, href: CONTACT_EMAIL },
      { label: 'info@vcrrecords.com', meta: 'Demos / info', detail: 'Email', cta: 'Email', thumb: 'IN', thumbSrc: T.info, href: DEMOS_EMAIL },
      { label: '@vcr_recordings', meta: 'Instagram', detail: 'Follow', cta: 'Follow', thumb: '@', thumbSrc: T.ig, href: INSTAGRAM },
      { label: 'Contact page', meta: 'In the shop', detail: 'Open', cta: 'Open', thumb: 'CT', thumbSrc: T.shop, href: SHOP.contact },
    ],
  },
  {
    id: 'back-room-door',
    object: 'Back Room Door',
    nav: 'Label Lore',
    hint: 'Staff only — push anyway',
    title: 'Back Room',
    kicker: 'Label Lore',
    intro:
      'Past the EXIT sign and the beaded curtain. This is where the label started: one borrowed sampler, two decks, and a fridge full of nothing.',
    accent: '#c9a6ff',
    u: 0.4,
    v: 0.48,
    w: 3.8,
    h: 8,
    lookFov: 70,
    sfx: 'door',
    items: [
      { label: 'About VCR Recordings', meta: 'Origin story', detail: 'Read', cta: 'Read', thumb: 'AB', thumbSrc: T.about, href: SHOP.about },
      { label: 'Label Bandcamp', meta: 'The catalog', detail: 'Browse', cta: 'Open', thumb: 'BC', thumbSrc: T.bc, href: BANDCAMP },
      { label: 'Watch the intro', meta: 'YouTube', detail: 'Watch', cta: 'Play', thumb: 'YT', thumbSrc: T.yt, href: YOUTUBE_ABOUT },
      { label: 'Instagram', meta: '@vcr_recordings', detail: 'Follow', cta: 'Follow', thumb: 'IG', thumbSrc: T.ig, href: INSTAGRAM },
    ],
  },
];

export const SECTION_BY_ID = Object.fromEntries(
  SECTIONS.map((s) => [s.id, s]),
) as Record<string, Section>;

/**
 * Outbound shop catalog — public/shop/index.html beside this 360 homepage.
 */
export const SHOP_URL = '/shop/index.html';

/** Primary conveyor nav order (balmingtiger: music / video / …). */
export const NAV_ORDER = [
  'listening-booth',
  'crt-tv',
  'record-bins',
  'cash-register',
  'flyer-wall',
  'phone-booth',
] as const;
