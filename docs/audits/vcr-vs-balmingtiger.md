# VCR Records × Balming Tiger — Comparative Experience Audit

**Benchmark:** [balmingtiger.com](https://balmingtiger.com)  
**Subject:** [vcrrecords.com](https://www.vcrrecords.com) (codebase: `main` as of 2026-07-24, includes in-room Shop / cursors / booth previews)  
**Scope:** Elevate VCR’s craft to BT-level polish **without** copying BT assets, logos, type, artwork, or room design. Preserve VCR identity, content, URLs, embeds, SEO, and commerce.

> **Framing rule:** Balming Tiger is a *quality* benchmark (interaction, clarity, immersion, intentionality). VCR already owns a distinct PNW / cel / record-store identity. The goal is craft parity, not visual twinning.

---

## Executive summary

VCR Records has the right *idea*: a brand-first gate, an immersive room, diegetic navigation, and a coherent PNW/cel voice. Balming Tiger still *feels* more premium because every interaction is authored end-to-end — conveyor, lookto, panels, toys, cursors, audio, and mobile fallbacks share one timing language and one information architecture.

VCR’s biggest gaps are no longer “missing features.” They are:

1. **Split worlds** — the 360 HUD and legacy `/shop` HTML (especially older product pages) still feel like two brands.
2. **Broken discovery loops** — Archive / Back Room rows that point at `/shop` are silently no-ops; Back Room is missing from the conveyor; no section deep links or history.
3. **Incomplete interaction authoring** — custom cursors ignore `data-cursor`; modal semantics without focus trap; reduced-motion gaps; mobile album nest weaker than BT’s dedicated `level-2-mobile`.
4. **Deploy / SEO / a11y debt** — ~264MB legacy `/shop` assets, CSR bailout for crawlers, `user-scalable=no`, missing OG image, no captions on CRT.

Lighthouse (lab, 2026-07-24, headless):

| | Performance | A11y | Best Practices | SEO | LCP | CLS | TBT |
|---|---:|---:|---:|---:|---:|---:|---:|
| **VCR** | 83 | 93 | 93 | 91 | 3.7s | 0 | 280ms |
| **BT** | 69 | 80 | 96 | 91 | 6.8s | 0 | 280ms |

Lab scores favor VCR; **felt quality still favors BT**. Immersive WebGL sites under-report experience quality in Lighthouse. Optimize for both.

**North star:** Keep the VCR store. Make every click, look, hover, and checkout path feel as intentional as BT — in VCR’s own language.

---

## PHASE 1 — Experience audit

### Scoring legend (subjective craft, 1–10)

| Dimension | VCR | BT | Delta |
|---|---:|---:|---:|
| First impression | 8 | 9 | −1 |
| Brand personality | 9 | 9 | 0 |
| Emotional impact | 7 | 9 | −2 |
| Visual hierarchy | 7 | 8 | −1 |
| Navigation clarity | 6 | 9 | −3 |
| Information architecture | 6 | 9 | −3 |
| User flow | 6 | 9 | −3 |
| Discoverability | 5 | 9 | −4 |
| Storytelling | 8 | 8 | 0 |
| Interaction quality | 7 | 9 | −2 |
| Overall immersion | 8 | 9 | −1 |

### Category comparisons

#### First impression
| | |
|---|---|
| **VCR** | Brand-first LoadingGate (Archivo Black `VCR` / `RECORDINGS`), mist/orbs, progress, CLICK TO ENTER → cinematic intro into illustrated store. |
| **BT** | Logo gate + stepped loading % + audio cue → little-planet → settle into room. Custom cursors appear immediately. |
| **Why BT feels stronger** | Loading *is* the brand moment; enter gesture unlocks a complete sensory contract (cursor + audio + camera) in one beat. |
| **Priority** | P1 |
| **Complexity** | Low–Medium — tighten gate choreography; show LQIP behind progress; sync cursor reveal with enter. |

#### Brand personality
| | |
|---|---|
| **VCR** | Underground PNW record shop: forest, mint/butter cel, cigarettes/rain copy, foam headphones, payphone. Distinct and strong. |
| **BT** | Playful multinational collective room: yellow/black, B1–B5 floors, toys, tour. |
| **Why BT feels stronger** | Personality is expressed through *systems* (toys, floors, tour panel), not only copy. |
| **Priority** | P2 — do not change brand; extend personality into IA (events, lore, toys density). |
| **Complexity** | Medium |

#### Emotional impact
| | |
|---|---|
| **VCR** | Strong atmosphere; emotion dips when Shop used to eject (fixed on `main`) or when Archive links silently fail. |
| **BT** | Continuous delight loop: look → glow → panel → nest → stream/tour. |
| **Priority** | P0 for silent failures; P1 for surprise density |
| **Complexity** | Low (dead links) / Medium (toys + lore) |

#### Visual hierarchy / Navigation / IA / Flows
See Phases 2–3. Headline: conveyor is clear; **Back Room absent from nav**; **no hash/history**; **three visual systems** (360 / light shop index / dark pink legacy product pages).

#### Discoverability
| | |
|---|---|
| **VCR** | Hotspot glows + drag hint (once) + conveyor. Ambient toys invisible. Wonder globe random-links. |
| **BT** | Glows + floating labels + B1–B5 hit zones + dense diegetic toys with unique SFX. |
| **Why BT stronger** | Multiple redundant discovery channels; surprises reward lingering. |
| **Priority** | P1 |
| **Complexity** | Medium |

#### Storytelling
VCR copy is excellent (vignette voice). BT tells story through *space* (floors, tour dates, management/booking). **Action:** promote Label Lore into nav; treat Back Room as a first-class chapter.

#### Interaction quality / Immersion
VCR is close after in-room Shop + previews + cursors. Remaining polish: cursor ↔ `data-cursor`, focus traps, mobile nest, CRT captions, reduced-motion completeness.

---

## PHASE 2 — Navigation audit

### Inventory of interactions

| Interaction | Desktop | Mobile | Status |
|---|---|---|---|
| Conveyor TopNav | Top, 5 slides | Bottom, 3.2 slides | Works; Shop now in-room |
| Hotspot click | Lookto + panel | Same | Works; Back Room nav-missing |
| Panel × / Esc / BACK | Soft close | Soft close | Works |
| Panel nest (Music/Shop) | Level-2 fade | Same panel (cramped) | Mobile nest weaker than BT |
| CRT channel play | In-room video | Same | Works |
| Preview play | Ducks BGM | Same | Works |
| Buy / Bandcamp / Stripe | New tab | New tab | Expected |
| Shop eject to `/shop` | Removed on `main` | Removed | ✅ |
| Archive `/shop/*.html` rows | **Silent no-op** | Same | ❌ Broken |
| Browser Back | Does nothing to panels | Same | ❌ Missing history |
| Deep link `/#music` | Unsupported | Unsupported | ❌ |
| Custom cursor | Fine pointer | Off | Partial (`data-cursor` unused) |
| Gyro | Hidden | Optional | Works |
| Drag / inertia / wheel / keys | Yes | Touch + pinch | Works |
| Instagram in-app | Untested special case | BT has dedicated fallback | Gap |

### Broken / confusing / dead ends

1. **Silent `/shop` hrefs** — `SectionPanel.openItem` returns early for `/shop*` → Archive “About”, Poetry, Classic, Back Room “About” appear clickable but do nothing.  
2. **Back Room not in `NAV_ORDER`** — pointer-only discovery.  
3. **No History API** — Back button cannot close panels or restore sections; cannot share focused state.  
4. **`aria-modal` without inert/focus trap** — Tab escapes; arrow keys still drive camera.  
5. **Wonder ambient** — random outbound with no confirm / label.  
6. **Viewport `user-scalable=no`** — blocks pinch-zoom for low vision (BT shares this anti-pattern; do not copy).  
7. **Legacy `/shop` dual IA** — users who land on `/shop` from Google never enter the 360 world; no “Enter the store” CTA bridging worlds.  
8. **Videos “Open page”** filtered when href is `/shop` — secondary CTA gone.  
9. **Soft close vs CRT reset asymmetry** — only CRT drag-end resets camera; other sections leave aim parked (intentional BT parity, but underexplained).  
10. **Loading / enter** — full pano wait; LQIP unused (`store_pano_lqip_v3.webp` exists).

### Concrete navigation improvements (preserve content)

| Fix | Effort | Impact | Priority |
|---|---|---|---|
| Replace dead `/shop` panel rows with in-panel prose / Bandcamp / mailto | Low | High | P0 |
| Add Back Room to conveyor (or Lore) | Low | High | P0 |
| Hash deep links + `popstate` (`#music`, `#shop`, …) | Medium | High | P0 |
| Focus trap + `inert` on stage while panel open | Medium | High | P0 |
| Mobile dedicated nest sheet (BT `level-2-mobile` principle, VCR styling) | Medium | High | P1 |
| Bridge CTA on `/shop/index.html` → “Enter the 360 store” | Low | High | P1 |
| Instagram WebView detection + simplified chrome | Medium | Medium | P2 |
| Keyboard hotspot list / skip-to-sections | Medium | Medium | P1 |

---

## PHASE 3 — Visual design comparison

### Typography
| | VCR | BT | Verdict |
|---|---|---|---|
| Display | Archivo Black | Custom NM Bold | VCR display is distinctive — keep |
| Body/UI | Outfit | NM Medium | Good; avoid Inter/system on legacy pages |
| Failure | Legacy `/shop/*.html` uses system / pink era fonts | One type family everywhere | **Unify legacy product pages onto Outfit + PNW tokens** |

### Grid / spacing / rhythm
- **360 HUD:** Left dock ~1/4 width (BT pattern). Mobile bottom sheet. Hard-coded px more than tokenized `--gap`.  
- **Shop index:** Soft cards, 18px radius, light `#f2f5f3` — competent marketing site, **different brand temperature**.  
- **Legacy product pages:** Dark `#0d0d0d` + `#ff2d55` — third language. Highest visual debt.

### Color / contrast / depth
- VCR PNW forest + mint/butter is strong and on-brand.  
- Glass `rgba(121,121,121,0.1) + blur(20)` matches BT technically; over busy pano, text contrast fluctuates — add scrim gradient behind type.  
- Section accents (amber, cyan, pink) work as diegetic cues; keep.

### Glass / blur / lighting / layer hierarchy
| Layer | VCR | Notes |
|---|---|---|
| Pano | Dual on/off spheres | Good physicality |
| Hotspot glow | Gold fill + edge | Solid |
| FilmFX / dust / beams | Present | Respect reduce-motion more completely |
| HUD | Nav → panel → mute/gyro | z-index coherent; cursor z=80 |
| Failure | Custom cursor hides system cursor globally | Can feel “dead” over empty chrome |

### Image / artwork presentation
- Panel thumbs are good.  
- CRT videos 480×360 — soft when punched to FOV 22.  
- Shop folder ships huge PNG/MP3 archives — visual + perf debt.

### Consistency score
**360 experience: 8/10.** **Site-wide (incl. `/shop`): 4/10.** Fix the dual/triple systems before new ornament.

---

## PHASE 4 — Motion audit

| Motion | VCR | BT | Score VCR | Score BT | Recommendation |
|---|---|---|---:|---:|---|
| Gate / enter | GSAP fade 0.4s | Stepped % + enter | 8 | 9 | Use LQIP; stagger brand mark |
| Intro camera | Ceiling→pan→settle | Little-planet→settle | 8 | 9 | Keep; optional short path for return visits |
| Lookto | 2s easeInOutQuart (rAF) | krpano tween ~2s | 9 | 9 | Keep |
| Panel open | CSS height/opacity 0.4s | Same language | 8 | 9 | Respect reduce-motion |
| Nest fade | GSAP 0.35–0.4s | Same | 8 | 9 | Add mobile sheet motion |
| Hotspot glow | 0.4s alpha | PNG glow tweens | 8 | 9 | Keep |
| Custom cursor | rAF rotate | Velocity rotate ~70° | 7 | 9 | Honor `data-cursor`; press scale |
| Drag hint | CSS nudge | — | 7 | — | Show once per device; stronger first 3s |
| CRT punch-in | FOV 22 / mobile adapt | FOV ~20/40 | 9 | 9 | Keep |
| Lights crossfade | GSAP | Lamp hotspot | 8 | 8 | Announce state for a11y |
| Ambient toys | SFX only | SFX + visible delight | 6 | 9 | Add 2–3 visible micro-reactions |
| Scroll-active rows | Scale + glow | Opacity dim siblings | 7 | 8 | Keep; reduce-motion already kills scale |
| Swiper conveyor | 800ms | 800ms-ish | 8 | 9 | Keep |
| Page transitions | N/A (SPA room) | Scene swaps B1–B5 | — | 9 | Do **not** copy multi-floor; deepen *one* VCR room |
| Reduced motion | Partial | Partial | 5 | 5 | Complete coverage (P0) |

**Tooling guidance:** Keep **GSAP** for camera-adjacent and audio ducks; CSS for panel chrome; avoid adding Framer Motion unless building a separate marketing route — one motion system is enough.

---

## PHASE 5 — Component audit

| Component | Purpose | Visual | Consistency | A11y | RWD | Perf | Motion | Verdict |
|---|---|---|---|---|---|---|---|---|
| LoadingGate | Brand enter | Strong | High | Medium | High | Medium | High | **Refine** (LQIP, progressbar role) |
| Experience | Shell | — | — | Medium | High | Medium | — | **Refine** (history, a11y wiring) |
| Scene / Rig | 360 room | Strong | High | Low (WebGL) | High | Medium | High | **Refine** (LQIP, FBO budget) |
| Hotspot | Section targets | Good | High | Low | High | Medium | High | **Refine** (keyboard path) |
| LampHotspot | Lights | Good | High | Low | High | High | High | **Refine** (announce) |
| AmbientHits | Toys / wonder | Invisible | Medium | Low | High | High | Low | **Rebuild** visibility strategy |
| CrtScreen | In-room video | Soft res | High | Low | High | Medium | High | **Refine** (captions, higher-res hero loop) |
| SectionPanel | Menus + nest | Good | High | Medium | Medium | High | High | **Refine** (trap, mobile nest, dead links) |
| TopNav | Conveyor | Good | High | High | High | High | High | **Refine** (add Lore) |
| CustomCursor | Brand pointer | Good | Medium | Medium | High | High | Medium | **Refine** (`data-cursor`) |
| DragHint | Onboarding | OK | High | High | High | High | Medium | **Refine** |
| MuteControl | Audio bus | Good | High | High | High | High | High | Keep |
| GyroButton | Mobile look | Good | High | High | High | High | — | Keep |
| FilmFX / Dust / Beams / Fisheye | Atmosphere | Good | High | — | High | Medium–Low | Medium | **Refine** (budget + reduce-motion) |
| Flicker / LightsToggle | — | — | — | — | — | — | — | **Delete** (dead) |
| `/shop/index.html` | Catalog | OK | Low vs 360 | Medium | High | Low (assets) | Low | **Restyle bridge** + Enter CTA |
| Legacy product HTML | Releases | Dated | Low | Medium | Medium | Low | Low | **Restyle or redirect into panel** |

---

## PHASE 6 — Performance audit

### Lab (Lighthouse, 2026-07-24)

**VCR:** Perf 83 · LCP 3.7s · TBT 280ms · CLS 0 · FCP 1.2s  
**BT:** Perf 69 · LCP 6.8s · TBT 280ms · CLS 0 · FCP 1.4s  

VCR failures of note: console errors logged, unused JS, `user-scalable=no`, illegible font sizes (lab on gated CSR), invalid/missing robots.txt, missing source maps.

### Asset reality (repo)

| Bucket | Size | Notes |
|---|---:|---|
| Pano textures | 1.6MB | 4K on + 0.4MB off; LQIP 12KB **unused** |
| Videos | 2.2MB | OK total; resolution soft |
| Audio + previews | 1.8MB | Previews on demand — good |
| Hotspots + thumbs | ~0.3MB | Fine |
| **`/public/shop`** | **~264MB** | Dominant deploy weight |

### Client JS
Largest built chunk ~1.0MB (Three/R3F path). Experience is dynamically imported (`ssr:false`) — good. No further splitting of Scene/audio/panel.

### Prioritized performance fixes

| # | Fix | Effort | Impact | Priority |
|---|---|---|---|---|
| 1 | Stop shipping unused shop binaries / compress legacy media | High | High | P0 |
| 2 | Show LQIP during gate; progressive pano | Medium | High | P0 |
| 3 | Code-split Scene / CRT / AmbientHits | Medium | Medium | P1 |
| 4 | Cap anisotropy / sphere segments on mobile | Low | Medium | P1 |
| 5 | Disable FisheyePass under reduce-motion / low-end | Low | Medium | P1 |
| 6 | Prefetch preview only on nest open | Low | Low | P2 |
| 7 | Add `robots.txt` + `sitemap` including `/shop` | Low | Medium | P0 |
| 8 | OG image (1200×630) for shares | Low | High | P0 |
| 9 | Cache headers already OK for textures (1d + SWR) | — | — | Keep |
| 10 | Remove dead components/CSS | Low | Low | P2 |

---

## PHASE 7 — Technical audit

### Architecture (healthy core)
- Next.js 16 App Router + React 19 + R3F + GSAP + Swiper  
- Single experience route; navigation lib mirrors spherical camera model  
- Content in `app/data/sections.ts` — good single source for HUD  
- Tests: `scripts/test-nav-camera.ts` (incl. cash-register in-room)

### Debt
1. Triple visual systems (`globals.css` / `shop/index.html` / `shop/style.css`)  
2. Dead code: `Flicker.tsx`, `LightsToggle.tsx`, unused LQIP, unused thumbs, `.shutter` CSS  
3. Silent `/shop` guard in `SectionPanel` without UI fallback content  
4. No section routing/history  
5. `SHOP_URL` leftover export  
6. Comment drift (pano 2048 note vs 4096 reality)  
7. No Tailwind (fine — document CSS token strategy instead of introducing Tailwind just because)  
8. Accessibility incomplete for canvas targets  
9. CSR bailout → weak crawl of experience body (metadata exists; content not)  
10. Large static shop tree inflates every deploy

### Recommendations (no rewrite)
- Keep Next + R3F architecture.  
- Treat `/shop` as a **thin catalog bridge** or migrate release prose into panels / MDX later.  
- Add hash router for sections.  
- Expand nav tests + add a11y smoke.  
- Do **not** introduce a second animation library.

---

## PHASE 8 — Implementation roadmap

### Phase 1 — Critical UX (1–3 days)
- [ ] Fix silent `/shop` panel rows (inline About blurb / Bandcamp / email)  
- [ ] Add Back Room / Lore to conveyor  
- [ ] OG image + robots.txt + sitemap  
- [ ] Honor `data-cursor` in CustomCursor  
- [ ] Complete `prefers-reduced-motion` (panel CSS, nest GSAP, fisheye, CRT tweens)

### Phase 2 — Navigation overhaul (3–5 days)
- [ ] Hash deep links + `popstate` close/open  
- [ ] Focus trap + inert stage while panel open  
- [ ] Mobile level-2 nest sheet  
- [ ] `/shop` “Enter the store” bridge CTA  
- [ ] Keyboard section list

### Phase 3 — Visual polish (3–5 days)
- [ ] Restyle legacy product pages to Outfit + PNW tokens (keep URLs)  
- [ ] Panel text scrim for contrast  
- [ ] Delete dead components/CSS  
- [ ] Unify focus-visible / spacing tokens

### Phase 4 — Motion system (2–4 days)
- [ ] Gate LQIP + brand stagger  
- [ ] Cursor press scale + hot state  
- [ ] 2–3 visible ambient micro-reactions (VCR objects, not BT copies)  
- [ ] Document motion tokens (durations/eases) in CSS variables

### Phase 5 — Component refinement (3–5 days)
- [ ] CRT higher-res hero loop + captions track  
- [ ] LoadingGate `role="progressbar"`  
- [ ] Shop panel merch option chips (size/color) without leaving room  
- [ ] Preview scrub / progress ring

### Phase 6 — Responsive (2–3 days)
- [ ] Tablet landscape panel width  
- [ ] Instagram/WebView chrome detection  
- [ ] Safe-area audit for mute/gyro/nav collisions

### Phase 7 — Performance (3–5 days)
- [ ] Purge/compress `/public/shop` media  
- [ ] Progressive pano + mobile segment/anisotropy caps  
- [ ] Dynamic import AmbientHits / FilmFX / Fisheye  
- [ ] Re-run Lighthouse + Web Vitals RUM

### Phase 8 — Accessibility (2–4 days)
- [ ] Remove or relax `user-scalable=no`  
- [ ] Focus trap, live regions for now-playing / lights  
- [ ] Visible skip control: “Open Music” etc.  
- [ ] Contrast pass on panel meta text

### Quick wins (< half day each)
1. Dead `/shop` link content swap  
2. Lore in nav  
3. OG image  
4. robots.txt  
5. Delete Flicker/LightsToggle  
6. CustomCursor reads `data-cursor`  
7. Enter-the-store CTA on shop index  
8. Panel intro scrim

---

## PHASE 9 — Design principles (adapt, don’t copy)

| BT principle | What it means | VCR reinterpretation |
|---|---|---|
| Intentional navigation | Every click aims the world | Keep lookto; add hash IA so intent is shareable |
| Playfulness | Toys reward curiosity | Visible stool/crate/poster reactions in VCR objects |
| Surprise | Non-nav discoveries | Wonder globe stays; add labeled “staff picks” flyer peels |
| Discovery | Multiple paths to same content | Conveyor + hotspots + Lore; never one orphan hotspot |
| Physicality | UI feels in the room | Previews already duck BGM; extend to merch “drawer” SFX |
| Depth | Layers of light / FX | Keep FilmFX; budget for mobile |
| Layering | HUD over world without fighting it | Scrim for type; keep panorama drag with panel open |
| Motion hierarchy | Big moves rare, micro moves constant | Document durations: lookto 2s, panel 0.4s, hover 0.15s |
| Minimal cognitive load | Few labels, clear verbs | Short CTAs already; kill silent failures |
| Strong visual identity | One system | Finish killing pink/cream legacy shop skins |

**Explicit non-goals:** Do not add BT B1–B5 floors, yellow/black palette, NM type, BT cursors/art, or tour copy. Multi-room copying is off-limits; deepen the single VCR store.

---

## PHASE 10 — Actionable output

### Top 25 UX issues
1. Silent `/shop` panel links (Archive/Back Room) — P0  
2. No section history / Back button — P0  
3. No deep links — P0  
4. Back Room missing from conveyor — P0  
5. Modal without focus trap — P0  
6. Reduced-motion incomplete — P0  
7. `/shop` index doesn’t invite users into 360 — P1  
8. Triple design systems confuse brand — P1  
9. Custom cursor ignores `data-cursor` — P1  
10. Ambient toys invisible → feel empty vs BT — P1  
11. Mobile nest cramped — P1  
12. Wonder opens random URLs unannounced — P1  
13. CRT no captions / now-playing — P1  
14. Viewport blocks pinch zoom — P1  
15. Hotspots keyboard-inaccessible — P1  
16. Gate waits on full pano (LQIP unused) — P1  
17. Soft-close camera asymmetry unexplained — P2  
18. Drag hint easy to miss — P2  
19. Merch lacks in-panel size/color — P2  
20. Instagram WebView unhandled — P2  
21. Preview has no progress UI — P2  
22. Lights state not announced — P2  
23. SEO body CSR-empty — P2  
24. Console errors in lab — P2  
25. Dead components add noise — P2  

### Top 25 visual improvements
1. Restyle legacy product pages to PNW/Outfit  
2. Panel text scrim / gradient  
3. Tokenize spacing (`--gap-*`)  
4. Unify focus ring styles  
5. Higher-res CRT hero loop  
6. Delete pink `#ff2d55` era CSS  
7. Compress shop PNG → WebP  
8. Stronger gate brand motion (keep Archivo)  
9. Cursor SVG polish / hotspot scale pop  
10. Consistent panel radius policy (0 desktop / 4 mobile — document)  
11. Scroll-active sibling dim (BT-like, VCR colors)  
12. Merch thumb photography in panel  
13. Remove unused shutter CSS  
14. Align shop index cards with “no hero cards” rule when linking back to store  
15. Better OG share image (store still)  
16. Mute/gyro hit area padding  
17. Hotspot hint type hierarchy  
18. Dust/beam intensity presets per device  
19. Lights-off grade fine-tune  
20. Panel kicker bar weight  
21. Track list typographic numbers  
22. Preview button as hard cel chip (already close)  
23. Nav active slot emphasis  
24. Safe-area padding consistency  
25. Favicon / theme-color already good — keep  

### Top 25 interaction improvements
1. Hash router for sections  
2. Focus trap  
3. `data-cursor` wiring  
4. Mobile nest sheet  
5. Visible ambient feedback  
6. Keyboard section menu  
7. Preview progress + spacebar toggle  
8. Confirm before wonder outbound  
9. Enter-store bridge on `/shop`  
10. Return-visit skip long intro  
11. Panel swipe-to-dismiss mobile  
12. Double-tap hotspot help  
13. Gyro onboarding tooltip  
14. Lights toggle announce  
15. CRT channel next/prev  
16. Shop merch option chips  
17. Esc always trusted (already) — extend to nest  
18. Prevent camera keys while typing in future forms  
19. Prefetch preview on nest  
20. Soft haptic on mobile SFX (where supported)  
21. Conveyor close × affordance on mobile  
22. Scroll-snap for mobile panel tray  
23. Long-press mute menu (volume)  
24. Reduced-motion instant lookto (partial) — finish  
25. Analytics events for funnel (enter → section → buy)  

### Top 25 performance improvements
1. Purge unused shop media  
2. Progressive pano + LQIP  
3. Mobile sphere segment / anisotropy caps  
4. Dynamic import FX passes  
5. Disable fisheye on low-end  
6. Compress remaining shop images  
7. Audio preload strategy (`metadata`)  
8. Split three.js chunk further  
9. Preconnect only what is needed  
10. Fix console errors  
11. Source maps for prod debug optional  
12. robots.txt  
13. Cache immutable hashes for `/audio/previews`  
14. Lazy CRT until Videos focus  
15. Don’t dual-load Outfit (shop CDN vs next/font)  
16. Remove dead JS in shop/app.js if unused  
17. HTTP/2 already — keep  
18. Prefer WebP/AVIF for thumbs  
19. Cap concurrent SFX decodes  
20. Service worker only if measured need  
21. RUM (web-vitals)  
22. Reduce glow canvas prep cost  
23. Avoid loading lights-off texture until first toggle  
24. Tree-shake GSAP plugins if any unused  
25. Re-test INP on mid-tier Android  

### Top 25 accessibility improvements
1. Relax `user-scalable=no`  
2. Focus trap + inert  
3. `role="progressbar"` on gate  
4. Live region: now playing preview/CRT  
5. Live region: lights on/off  
6. Keyboard hotspot / section list  
7. Contrast pass panel meta  
8. Captions for CRT  
9. Don’t rely on cursor-only affordances  
10. Announce panel open (already title) — ensure  
11. Wonder link confirmation  
12. Hit targets ≥ 44px mobile nav  
13. Prefers-reduced-motion complete  
14. Visible focus always (even with custom cursor)  
15. Skip link “Open Music”  
16. Form labels on future newsletter in-panel  
17. `lang` already set — keep  
18. Alt text for panel art (decorative OK if aria-hidden — ensure)  
19. Error text when preview fails  
20. Don’t remove focus rings under cursor:none without replacement  
21. Document keyboard map (arrows/Esc/Enter)  
22. Screen reader tree for TopNav order  
23. Avoid auto-opening outbound  
24. Test VoiceOver + TalkBack on panel nest  
25. Prefer buttons over clickable articles where possible  

---

## Claude Code implementation checklist

Copy/paste this into an agent session. Preserve brand, URLs, embeds, SEO, commerce.

```text
CONTEXT
- Repo: vcr-records. Primary UX is the 360 store at `/` (Next.js + R3F).
- Benchmark craft: balmingtiger.com — DO NOT copy assets, type, palette, floors, or room art.
- Preserve VCR PNW/cel identity, sections content, Bandcamp/Stripe checkout, `/shop` URLs.

P0 — DO FIRST
1. Fix SectionPanel silent `/shop` links: replace with in-panel content or Bandcamp/mailto; never no-op a visible row.
2. Add `back-room-door` (Label Lore) to NAV_ORDER / TopNav.
3. Implement hash deep links (`#music|#videos|#artists|#shop|#archive|#contact|#lore`) + popstate.
4. Focus trap + inert on `.stage` while `.panel-root.open`.
5. Complete prefers-reduced-motion (panel CSS, nest GSAP, fisheye, CRT, lights).
6. Add public/og image + layout openGraph.images; add robots.txt + sitemap.
7. Wire CustomCursor to `[data-cursor=click]:hover` and `cursor-hot`.

P1
8. Mobile level-2 nest bottom sheet for Music/Shop detail.
9. `/shop/index.html` sticky CTA: Enter the 360 store → `/`.
10. Restyle legacy `/shop/*.html` to Outfit + PNW tokens (keep paths).
11. Progressive pano: show LQIP in gate; upgrade to full texture.
12. Keyboard “Sections” control listing NAV_ORDER.
13. Visible ambient micro-feedback on 2–3 AmbientHits (scale/glow, VCR-specific).
14. CRT captions + aria-live now-playing.
15. Purge or compress heaviest `/public/shop` media; stop shipping unused MP3/PNG.

P2
16. Delete Flicker.tsx, LightsToggle.tsx, dead CSS.
17. Code-split AmbientHits / FisheyePass / FilmFX.
18. Mobile anisotropy/segment caps; optional disable fisheye.
19. Merch size/color chips in Shop panel before Stripe.
20. Preview progress UI; Instagram WebView chrome fallback.
21. Analytics: enter, section_open, preview_play, buy_click.
22. Expand test:nav for hash router + shop nest; add a11y smoke.

ACCEPTANCE
- No visible control is a dead click.
- Browser Back closes panel / restores prior section.
- Reduced-motion users get instant lookto and no FX thrash.
- `/shop` visitors can enter the store in one tap.
- Lighthouse a11y ≥ 95; no user-scalable ban (or documented exception).
- Brand still reads as VCR Recordings, not Balming Tiger.
```

---

## Appendix A — Evidence snapshot

- Live VCR HTML is CSR-bailed (`BAILOUT_TO_CLIENT_SIDE_RENDERING`); metadata present; OG image absent.  
- Live BT: conveyor MUSIC/VIDEO/TOUR/CONTACT/SHOP, B1–B5 hit menu, custom cursors, DatoCMS content, shop `window.open`.  
- Code: `app/components/*`, `lib/navigation/*`, `lib/audio.ts`, `app/data/sections.ts`, `public/shop/**` (~264MB).  
- `main` includes in-room Shop, booth previews, branded cursors (PR #33).  
- Lighthouse lab 2026-07-24 as tabled above (Chrome headless; VCR tab crash noted once — re-run in CI).

## Appendix B — Motion token proposal (implement later)

```css
:root {
  --motion-lookto: 2s;
  --motion-panel: 0.4s;
  --motion-nest: 0.35s;
  --motion-hover: 0.15s;
  --motion-glow: 0.4s;
  --ease-lookto: cubic-bezier(0.76, 0, 0.24, 1); /* ~easeInOutQuart */
  --ease-ui: cubic-bezier(0.25, 0.1, 0.25, 1);
}
```

---

*End of audit. Next recommended engineering PR: P0 checklist items 1–7.*
