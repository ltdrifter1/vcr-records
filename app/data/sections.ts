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
   * In-panel prose for nested detail (stays in-room — no /shop eject).
   */
  body?: string;
};

const T = {
  atHome: '/panel-thumbs/at-home.webp',
  inletKnight: '/panel-thumbs/inlet-knight.webp',
  inletKnightTall: '/panel-thumbs/inlet-knight-tall.webp',
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
  charlie: '/panel-thumbs/charlie.webp',
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
   * (public/textures/store_pano_v7.webp, 4096×2048).
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
   * Optional glow/edge-mask plane size when it must differ from the hit
   * footprint (CRT: w/h are tube-locked for the video overlay, the glow
   * covers the whole painted set).
   */
  glowW?: number;
  glowH?: number;
  /**
   * MFOV used by lookto when focusing this feature
   * (Music ~95 room view; Videos framed mid — not watch punch-in).
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
   * balmingtiger-style outer-edge glow: loads `*_edge.webp` silhouette rim
   * (not a filled glow slab). When false, falls back to `*_glow.webp`.
   */
  goldEdge?: boolean;
  /** Hide proximity / hover Html label over the hotspot glow. */
  hideHint?: boolean;
  /** list rendered inside the panel */
  items: SectionItem[];
};

const BANDCAMP = 'https://vcrrecordings.bandcamp.com';
const INSTAGRAM = 'https://www.instagram.com/vcr_recordings';
const CONTACT_EMAIL = 'mailto:charlie@vcrrecords.com';
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
  inletKnightAlbum: 'https://inletknight.bandcamp.com/album/inlet-knight',
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
    hint: '',
    title: '',
    kicker: 'Music',
    intro: '',
    accent: '#ffb347',
    // v9 pano: LISTEN shelving tower with turntable + headphones
    // (file x 262–445, y 248–625 of 1536×1024).
    u: 0.77,
    v: 0.426,
    lookU: 0.77,
    lookV: 0.44,
    w: 41,
    h: 68,
    lookFov: 88,
    sfx: 'music',
    goldEdge: true,
    hideHint: true,
    // Coming soon — no release rows / no glow labels.
    items: [],
  },
  {
    id: 'crt-tv',
    object: 'CRT Television',
    nav: 'Videos',
    hint: '',
    title: '',
    kicker: 'Videos',
    intro: '',
    accent: '#7ad7ff',
    // v9 pano: CRT on the low cabinet — u/v is the tube-glass center and
    // w/h are tube-locked so the CrtScreen video/frame overlays sit on the
    // painted set (set file x 138–252, tube x 162–240 / y 452–518 of 1536×1024).
    u: 0.8691,
    v: 0.4736,
    // Frame the set in the room — not watch-mode punch-in (was fov 22 / too close).
    lookU: 0.8691,
    lookV: 0.4736,
    w: 21.7,
    h: 16.5,
    // Glow / edge mask covers the whole painted set, not just the tube.
    glowW: 24.5,
    glowH: 14,
    lookFov: 48,
    sfx: 'video',
    // Coming soon: keep warm gold aura latched while focused (no watch overlay).
    glowLatches: true,
    goldEdge: true,
    hideHint: true,
    // Channels cleared — blank tube + panel copy only.
    items: [],
  },
  {
    id: 'record-bins',
    object: 'Record Bins',
    nav: 'Artists',
    hint: '',
    title: '',
    kicker: 'Artists',
    intro: '',
    accent: '#ff7a9c',
    // v9 pano: central record-bin island on the moss rug
    // (file x 688–882, y 462–645 of 1536×1024).
    u: 0.489,
    v: 0.54,
    // Zoomed out over the whole open room
    lookU: 0.5,
    lookV: 0.53,
    w: 46,
    h: 31,
    lookFov: 105,
    sfx: 'artists',
    goldEdge: true,
    hideHint: true,
    items: [
      {
        label: 'Inlet Knight',
        meta: 'Cumberland, BC',
        detail: 'Bandcamp',
        cta: 'Listen',
        thumb: 'IK',
        thumbSrc: T.inletKnight,
        href: BUY.inletBc,
      },
    ],
  },
  {
    id: 'cash-register',
    object: 'Cash Register',
    nav: 'Shop',
    hint: '',
    title: '',
    kicker: 'New Releases',
    intro: '',
    accent: '#9dff8a',
    // v9 pano: register + display pole on the clean wood counter
    // (file x 1003–1090, y 413–490 of 1536×1024).
    // Spherical u = 1 − file_u after BackSide flip.
    u: 0.319,
    v: 0.44,
    lookU: 0.3,
    lookV: 0.49,
    w: 22,
    h: 16,
    lookFov: 70,
    sfx: 'shop',
    goldEdge: true,
    hideHint: true,
    items: [
      {
        label: 'Inlet Knight',
        meta: 'Self-titled album · 16 tracks',
        detail: '$9 CAD or more',
        cta: 'Open',
        thumb: 'IK',
        thumbSrc: T.inletKnightTall,
        href: BUY.inletKnightAlbum,
        tracks: [
          { title: 'Revive Him', duration: '02:27' },
          { title: 'Whatever', duration: '03:27' },
          { title: 'Mad About You', duration: '03:58' },
          { title: 'All Falls Down', duration: '04:42' },
          { title: 'Les Miserables', duration: '02:16' },
          { title: 'Heartbreaker', duration: '03:52' },
          { title: 'Movin\'', duration: '03:26' },
          { title: 'Sunday Afternoon', duration: '02:55' },
          { title: 'Hard to Ignore', duration: '04:09' },
          { title: 'The Get Down', duration: '01:37' },
          { title: '3AM', duration: '02:59' },
          { title: 'Another Day', duration: '04:58' },
          { title: 'Is It Cool?', duration: '04:02' },
          { title: 'You Wanted Me', duration: '02:49' },
          { title: 'Next Year', duration: '04:07' },
          { title: 'Art of Losing', duration: '02:06' },
        ],
        listenOn: [
          { label: 'Listen on Bandcamp', href: BUY.inletKnightAlbum },
          { label: 'Buy album', href: BUY.inletKnightAlbum },
        ],
      },
      {
        label: 'Inlet Knight',
        meta: 'At Home',
        detail: 'From $3',
        cta: 'Open',
        thumb: 'IK',
        thumbSrc: T.inletKnight,
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
    ],
  },
  {
    id: 'phone-booth',
    object: 'Rotary Phone',
    nav: 'Contact',
    hint: '',
    title: '',
    kicker: 'Contact',
    intro: '',
    accent: '#e8c07a',
    // v9 pano: black rotary phone on the counter (file x 1130–1215, y 468–512).
    u: 0.237,
    v: 0.478,
    lookU: 0.245,
    lookV: 0.49,
    w: 17,
    h: 7.5,
    lookFov: 55,
    sfx: 'phone',
    goldEdge: true,
    hideHint: true,
    items: [
      {
        label: 'Charlie',
        meta: 'charlie@vcrrecords.com',
        detail: 'Email',
        cta: 'Email',
        thumb: 'CH',
        thumbSrc: T.charlie,
        href: CONTACT_EMAIL,
      },
      {
        label: '@vcr_recordings',
        meta: 'Instagram',
        detail: 'Follow',
        cta: 'Follow',
        thumb: '@',
        thumbSrc: T.ig,
        href: INSTAGRAM,
      },
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
  'phone-booth': 'contact',
};

export const SECTION_ID_BY_HASH: Record<string, string> = Object.fromEntries(
  Object.entries(HASH_BY_SECTION_ID).map(([id, hash]) => [hash, id]),
);
