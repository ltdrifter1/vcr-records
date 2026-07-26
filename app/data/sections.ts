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
  /**
   * Short in-room audio preview (Listening Booth / Shop).
   * Plays through the shared preview bus; ducks BGM.
   */
  previewSrc?: string;
  /** Music / Shop nest — track list shown in level-2 detail. */
  tracks?: TrackItem[];
  /** Music / Shop nest — streaming + buy pills. */
  listenOn?: ListenLink[];
  /**
   * In-panel prose for Archive nests (stays in-room — no /shop eject).
   */
  body?: string;
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
   * (Music ~95 room view; Videos ~22 watch punch-in like BT).
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
  /**
   * balmingtiger-style dual hover layers: gold fill (`*_glow`) +
   * gold edge rim (`*_edge`). Cash / CRT / listening booth.
   */
  goldEdge?: boolean;
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

/** Short booth previews under /public/audio/previews. */
const PREVIEW = {
  atHome: '/audio/previews/at-home.mp3',
  summer: '/audio/previews/summer.mp3',
  lions: '/audio/previews/lions-gate.mp3',
  rack: '/audio/previews/rack-em.mp3',
} as const;

/** Stripe + Bandcamp buy destinations (checkout only — browse stays in-room). */
const BUY = {
  atHomeDigital: 'https://buy.stripe.com/cNidRa6DB7o463KdshfrW0r',
  summerDigital: 'https://buy.stripe.com/00w14o5zxdMs2Ry73TfrW0s',
  lionsDigital: 'https://buy.stripe.com/bJe7sM4vt9wc63K9c1frW0i',
  rackDigital: 'https://buy.stripe.com/bJe8wQd1ZbEk77O87XfrW0t',
  tee: 'https://buy.stripe.com/3cI00k6DB8s877O1JzfrW0o',
  hat: 'https://buy.stripe.com/6oU14o2nl23KgIoewlfrW0n',
  bikini: 'https://buy.stripe.com/eVq7sMfa70ZG77O2NDfrW0m',
  inletBc: 'https://inletknight.bandcamp.com',
  ltdBc: 'https://ltdrifta.bandcamp.com',
  driftaBc: 'https://drifta.bandcamp.com',
  rackBc: 'https://ltdrifta.bandcamp.com/album/rack-em',
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
    intro: '',
    accent: '#ffb347',
    // Hit / glow on the headphone alcove (LISTENING STATION doorway).
    u: 0.2,
    v: 0.4,
    // Lookto frames the Listening Station room (file_u ≈ 1−lookU).
    // Slight left bias so the left glass panel doesn't cover the booth.
    lookU: 0.18,
    lookV: 0.42,
    w: 6,
    h: 9,
    lookFov: 95,
    sfx: 'music',
    goldEdge: true,
    items: [
      {
        label: 'At Home — Inlet Knight',
        meta: 'Featured release',
        detail: '3 tracks',
        cta: 'Open',
        thumb: 'AH',
        thumbSrc: T.atHome,
        href: BUY.inletBc,
        previewSrc: PREVIEW.atHome,
        tracks: [
          { title: '01. After All', duration: '2:22' },
          { title: '02. Will I See You Again?', duration: '3:58' },
          { title: '03. At Home', duration: '3:44' },
        ],
        listenOn: [
          { label: 'Bandcamp', href: BUY.inletBc },
          { label: 'Buy Digital', href: BUY.atHomeDigital },
          { label: 'Label BC', href: BANDCAMP },
        ],
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
      'Static rolls until it doesn’t. Hand-dubbed VHS sets, pirate TV idents and grainy warehouse footage nobody was supposed to keep. Pick a channel — it plays on this set.',
    accent: '#7ad7ff',
    // Hit / glow / video plane stay on the tube face.
    u: 0.3,
    v: 0.42,
    // Watch mode (BT video lookto fov 20 desktop / ~40 phone).
    // Aim the tube glass; portrait adapt widens so it doesn't over-crop.
    lookU: 0.3,
    lookV: 0.415,
    w: 4.5,
    h: 4.2,
    lookFov: 22,
    sfx: 'video',
    // balmingtiger: TV glow extinguishes while watching (no active latch)
    glowLatches: false,
    goldEdge: true,
    items: [
      {
        label: 'Store Loop',
        meta: 'Default channel',
        detail: 'Ambient',
        cta: 'Play',
        thumb: 'A',
        thumbSrc: T.yt,
        videoSrc: '/videos/channel_a.mp4',
        href: YOUTUBE_ABOUT,
      },
      {
        label: 'Banter Tape',
        meta: 'Warehouse cut',
        detail: 'In-room',
        cta: 'Play',
        thumb: 'B',
        thumbSrc: T.testpress,
        videoSrc: '/videos/channel_b.mp4',
        href: BANDCAMP,
      },
      {
        label: 'Classic Cuts',
        meta: 'Archive reel',
        detail: 'In-room',
        cta: 'Play',
        thumb: 'CL',
        thumbSrc: T.classic,
        videoSrc: '/videos/channel_classic.mp4',
        href: BANDCAMP,
      },
      {
        label: 'Future Boy',
        meta: 'Promo reel',
        detail: 'In-room',
        cta: 'Play',
        thumb: 'FB',
        thumbSrc: T.future,
        videoSrc: '/videos/channel_future.mp4',
        href: BANDCAMP,
      },
      {
        label: 'Lions Gate',
        meta: 'Drifta',
        detail: 'In-room',
        cta: 'Play',
        thumb: 'LG',
        thumbSrc: T.lions,
        videoSrc: '/videos/channel_lions.mp4',
        href: BUY.driftaBc,
      },
      {
        label: 'At Home',
        meta: 'Inlet Knight',
        detail: 'In-room',
        cta: 'Play',
        thumb: 'AH',
        thumbSrc: T.atHome,
        videoSrc: '/videos/channel_athome.mp4',
        href: BUY.inletBc,
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
      'The drawer sticks unless you hit it just right. Fresh pressings, dusty repress, and a tin of badges by the till — browse here, checkout only leaves for Stripe or Bandcamp.',
    accent: '#9dff8a',
    // Register body on store_pano_v3 (file≈1655–1845, 995–1175).
    // Spherical u = 1 − file_u after BackSide flip.
    u: 0.573,
    v: 0.53,
    lookU: 0.57,
    lookV: 0.52,
    w: 15.4,
    h: 14.7,
    lookFov: 58,
    sfx: 'shop',
    glowFlipX: true,
    goldEdge: true,
    items: [
      {
        label: 'At Home — Inlet Knight',
        meta: 'Digital + Cassette',
        detail: 'From $3',
        cta: 'Open',
        thumb: 'AH',
        thumbSrc: T.atHome,
        href: BUY.atHomeDigital,
        previewSrc: PREVIEW.atHome,
        tracks: [
          { title: 'Digital MP3 — $3 CAD', duration: '' },
          { title: 'Cassette available via Stripe', duration: '' },
        ],
        listenOn: [
          { label: 'Buy Digital', href: BUY.atHomeDigital },
          { label: 'Bandcamp', href: BUY.inletBc },
          { label: 'Preview', href: '#preview' },
        ],
      },
      {
        label: 'Summer Madness — LT Drifta',
        meta: 'Digital + Cassette',
        detail: 'From $7.98',
        cta: 'Open',
        thumb: 'SM',
        thumbSrc: T.summer,
        href: BUY.summerDigital,
        previewSrc: PREVIEW.summer,
        tracks: [
          { title: 'Digital mix — $7.98', duration: '' },
          { title: 'Cassette via Stripe', duration: '' },
        ],
        listenOn: [
          { label: 'Buy Digital', href: BUY.summerDigital },
          { label: 'Bandcamp', href: BUY.ltdBc },
          { label: 'Preview', href: '#preview' },
        ],
      },
      {
        label: "Lions' Gate — Charlie Archer",
        meta: 'Digital single',
        detail: '$0.98',
        cta: 'Open',
        thumb: 'LG',
        thumbSrc: T.lions,
        href: BUY.lionsDigital,
        previewSrc: PREVIEW.lions,
        tracks: [
          { title: 'Digital single — $0.98', duration: '' },
        ],
        listenOn: [
          { label: 'Buy Digital', href: BUY.lionsDigital },
          { label: 'Bandcamp', href: BUY.driftaBc },
          { label: 'Preview', href: '#preview' },
        ],
      },
      {
        label: "Rack Em — LT Drifta",
        meta: 'Album',
        detail: '$4.98',
        cta: 'Open',
        thumb: 'RK',
        thumbSrc: T.rack,
        href: BUY.rackDigital,
        previewSrc: PREVIEW.rack,
        tracks: [
          { title: 'Digital album — $4.98 CAD', duration: '' },
          { title: '6 tracks', duration: '' },
        ],
        listenOn: [
          { label: 'Buy Digital', href: BUY.rackDigital },
          { label: 'Bandcamp', href: BUY.rackBc },
          { label: 'Preview', href: '#preview' },
        ],
      },
      {
        label: 'T-Shirt',
        meta: 'Merch',
        detail: 'From $30',
        cta: 'Buy',
        thumb: 'TS',
        thumbSrc: T.shop,
        href: BUY.tee,
      },
      {
        label: 'Hat',
        meta: 'Merch',
        detail: '$25',
        cta: 'Buy',
        thumb: 'HT',
        thumbSrc: T.logo,
        href: BUY.hat,
      },
      {
        label: 'Bikini',
        meta: 'Merch',
        detail: 'From $35',
        cta: 'Buy',
        thumb: 'BK',
        thumbSrc: T.vcr,
        href: BUY.bikini,
      },
      {
        label: 'Full catalog — Bandcamp',
        meta: 'Everything',
        detail: 'Browse',
        cta: 'Open',
        thumb: 'BC',
        thumbSrc: T.bc,
        href: BANDCAMP,
      },
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
      {
        label: 'About the label',
        meta: 'Story',
        detail: 'Read',
        cta: 'Open',
        thumb: 'AB',
        thumbSrc: T.about,
        body:
          'VCR Recordings is an independent electronic label from the Pacific Northwest — jungle, house, and experimental cuts pressed for the people who still linger in the shop after closing.',
        listenOn: [
          { label: 'Bandcamp', href: BANDCAMP },
          { label: 'Instagram', href: INSTAGRAM },
          { label: 'Email', href: CONTACT_EMAIL },
        ],
      },
      {
        label: 'Poetry / Drum Poetry',
        meta: 'Release',
        detail: 'Open',
        cta: 'Open',
        thumb: 'PO',
        thumbSrc: T.poetry,
        body:
          'Drum Poetry lives on the flyer wall — clipped tempos, spoken edges, and the kind of night that stains the carpet. Stream it on Bandcamp; the paper copy never left this room.',
        listenOn: [{ label: 'Bandcamp', href: BANDCAMP }],
      },
      {
        label: 'Classic archive',
        meta: 'Cuts',
        detail: 'Open',
        cta: 'Open',
        thumb: 'CL',
        thumbSrc: T.classic,
        body:
          'Classic Cuts is the cold-storage reel: edits and leftovers that never made the window display. Flip through on Bandcamp, or play the archive channel on the CRT.',
        listenOn: [{ label: 'Bandcamp', href: BANDCAMP }],
      },
      { label: 'Bandcamp catalog', meta: 'Everything', detail: 'Browse', cta: 'View', thumb: 'BC', thumbSrc: T.bc, href: BANDCAMP },
      { label: 'Instagram board', meta: '@vcr_recordings', detail: 'Follow', cta: 'View', thumb: 'IG', thumbSrc: T.ig, href: INSTAGRAM },
    ],
  },
  {
    id: 'phone-booth',
    object: 'Rotary Phone',
    nav: 'Contact',
    hint: '',
    title: 'The Phone',
    kicker: 'Contact',
    intro: 'Email the label, send a demo, or find us on Instagram.',
    accent: '#e8c07a',
    // Wall phone spot (file u≈0.514 → spherical 1−file_u)
    u: 0.486,
    v: 0.42,
    w: 5.4,
    h: 5.6,
    lookFov: 60,
    sfx: 'phone',
    goldEdge: true,
    items: [
      { label: 'charlie@vcrrecords.com', meta: 'General', detail: 'Email', cta: 'Email', thumb: 'CH', thumbSrc: T.email, href: CONTACT_EMAIL },
      { label: 'info@vcrrecords.com', meta: 'Demos / info', detail: 'Email', cta: 'Email', thumb: 'IN', thumbSrc: T.info, href: DEMOS_EMAIL },
      { label: '@vcr_recordings', meta: 'Instagram', detail: 'Follow', cta: 'Follow', thumb: '@', thumbSrc: T.ig, href: INSTAGRAM },
      { label: 'Booking / demos', meta: 'Write us', detail: 'Email', cta: 'Email', thumb: 'CT', thumbSrc: T.shop, href: CONTACT_EMAIL },
    ],
  },
];

export const SECTION_BY_ID = Object.fromEntries(
  SECTIONS.map((s) => [s.id, s]),
) as Record<string, Section>;

/**
 * Legacy static catalog — kept for deep links / SEO, but Shop nav stays in-room.
 */
export const SHOP_URL = '/shop/index.html';

/** Primary conveyor nav order. */
export const NAV_ORDER = [
  'listening-booth',
  'crt-tv',
  'record-bins',
  'cash-register',
  'flyer-wall',
  'phone-booth',
] as const;

/**
 * URL hash slugs ↔ section ids (shareable deep links).
 * Example: https://vcrrecords.com/#shop
 */
export const HASH_BY_SECTION_ID: Record<string, string> = {
  'listening-booth': 'music',
  'crt-tv': 'videos',
  'record-bins': 'artists',
  'cash-register': 'shop',
  'flyer-wall': 'archive',
  'phone-booth': 'contact',
};

export const SECTION_ID_BY_HASH: Record<string, string> = Object.fromEntries(
  Object.entries(HASH_BY_SECTION_ID).map(([id, hash]) => [hash, id]),
);
