# Club Copy — UX / UI / Brand Audit

**Site:** [clubcopy.ca](https://clubcopy.ca)  
**Date:** 8 August 2026  
**Scope:** Full site (Home, Library, Artists, release pages, artist pages, Shop, Cart, About, Contact, Planet MP3, nav, footer, desktop + mobile)  
**Method:** Live site + codebase review (`css/site.css`, release archive, player, catalog), desktop & mobile screenshots  
**Comparables:** Mood Hut, Kalahari Oyster Cult, L.I.E.S., Ninja Tune, Warp, Balmat, Ghostly, XL, Bandcamp editorial  

**Principle:** Do not rebuild. Preserve the chrome / Y2K / listening-room identity. Raise perceived quality, engagement, and clarity.

---

## 1. Executive Summary

Club Copy already has a **real identity** — liquid-metal logo, dark listening room, CC Deck, Oswald callsigns, Space Grotesk display, warm paper interiors. That puts it ahead of most small-label Shopify templates. The gap versus Warp / Ghostly / Balmat is not “needs a new look.” It is **thin storytelling, underpowered artist surfaces, and a homepage that stops after listen + email**.

**Verdict:** Strong brand object, incomplete label world. Premium polish is already ~60% there on release pages; the catalog/roster/home narrative is where quality leaks.

| Area | Grade | Notes |
|------|-------|-------|
| Brand / logo language | A− | Chrome lockup + On air callsigns feel distinctive |
| Release pages | B+ | Cinematic, buy/listen clear; still light on liner depth |
| Listening / player UX | B | Differentiated; dual desktop docks when room is live |
| Library | B | Archival list works; light pages feel quieter than dark brand |
| Artists | C | Photos small, bios one line, pages feel empty |
| Homepage as living label | C | Hero strong; wall good; no world beyond releases + signup |
| Shop | B− | Clean grid; Music vs Library overlap; weak Details CTA |
| Footer / IA | C+ | About buried; socials absent; footer varies by page |
| Accessibility foundations | B− | Skip links, focus-visible, reduced-motion exist; contrast & `[hidden]` bug |
| Performance / SEO residue | C | Legacy `vcr-records` OG URLs; empty homepage description |

**Highest-leverage direction:** Make the homepage and artist layer feel like a living PNW label — without touching the chrome mark or the dark release system.

---

## 2. Top 3 UI Upgrades (ranked)

### #1 — Artwork-forward featured release in the home hero (keep brand, show the record)

**Problem**  
Idle hero is almost entirely the chrome logo + tagline. Current music only appears as a blurred ambient wash. After Play, the platter appears — but first impression is “brand poster,” not “label with a release out now.”

**Why it matters**  
Mood Hut / Balmat / Ghostly lead with *what’s out*. Club Copy’s strongest asset after the logo is artwork. Hiding it until interaction costs discovery and conversion.

**Proposed solution**  
Keep the chrome lockup as the brand hero, but compose idle state as **brand + current release**: large square (or disc) of *Together* / current feature beside or behind a tighter lockup; meta line `CC008 · Inlet Knight · Together`; primary CTA still Play; secondary Buy / View release. Live mode can keep the existing platter console.

**Expected visual result**  
First viewport still reads Club Copy — but also “this is the record.” Instant living-label signal.

**Implementation effort**  
Medium (CSS/HTML composition on `index.html` hero; wire to catalog featured id).

**Expected user impact**  
Higher play rate, clearer path to the featured release page, stronger share/OG story when paired with fixed meta images.

---

### #2 — Scale artist photography + real bios (roster & artist pages)

**Problem**  
Artist photos max ~320px; bios are one sentence (“Jungle in the Pacific Northwest.”). Individual pages leave large empty fields; CTA “Artist page” on the roster is redundant when the block already is the artist.

**Why it matters**  
Underground labels sell *people and scenes*, not only SKUs. Ghostly / XL / Ninja Tune treat artists as destinations. Empty roster = catalog storefront.

**Proposed solution**  
- Full-bleed or 50–60% viewport portraits (edge-to-edge on mobile).  
- 80–150 word bios (scene, sound, place — stay terse, not corporate).  
- Discography with play + format chips on the artist page (data already in `catalog.json`).  
- Soften or remove redundant “Artist page” button; make name/photo the link.  
- Optional: one pull-quote or “based in Cumberland” fact row.

**Expected visual result**  
Roster feels like a label book, not two sparse cards on cream paper.

**Implementation effort**  
Medium–high (content write + layout in `artists.html` / artist templates).

**Expected user impact**  
Longer sessions, stronger artist follow-through into releases and shop.

---

### #3 — Unify light-page “station” chrome with the dark brand (without going full dark mode)

**Problem**  
Dark continuum (home hero, releases, Planet) feels Club Copy. Light pages (Library, Artists, About, Cart) feel like a competent but quieter archival template — warm paper `#F7F5F1`, chrome hairlines, little of the liquid-metal energy. Risk: light half reads generic indie; dark half reads branded.

**Why it matters**  
Perceived quality comes from *one* system. Warp/Ghostly keep recognizability across news, artist, and store.

**Proposed solution** (preserve cream — don’t force black everywhere):  
- Carry Oswald callsigns + catalogue numbers more boldly on light pages.  
- Use media-bezel / subtle specular on library thumbs and artist photos (tokens already exist).  
- Add a thin “station ID” strip under nav (`Catalog · Station` is a good start — give it weight).  
- One shared footer pattern (Club Copy wordmark or chrome mark, not only Copy House).  
- Slightly deepen section-head contrast; avoid flat “Inter-like” softness (you already use Space Grotesk — lean into display sizes).

**Expected visual result**  
Library/Artists feel like the same label as the listening room.

**Implementation effort**  
Medium (mostly `site.css` + shared footer partial).

**Expected user impact**  
Brand memory across the funnel; less “two websites” feeling.

---

## 3. Top 3 Homepage Additions (ranked)

Homepage today: **Hero (listen) → Releases wall → Newsletter → thin footer.** That is a listening booth, not a label HQ.

### #1 — Featured release strip (hero refinement + “Now on Club Copy”)

**Purpose**  
Signal *what’s new / what’s playing* without burying it below a 100vh brand card.

**Placement**  
In-hero (see UI Upgrade #1) **or** a single full-bleed band between hero and wall: large art left, title/artist/catalogue/price right, Play + Buy.

**Visual treatment**  
Dark continuum; artwork dominant; no card clutter; one CTA group.

**Desktop / mobile**  
Desktop: 2-col. Mobile: art full-bleed top, meta + CTAs stacked; Play sticky-friendly.

**Why engagement rises**  
Gives scrollers an immediate music object; improves buy path from home.

---

### #2 — Featured artist (roster spotlight)

**Purpose**  
Humanize the label; bridge music to place (PNW / Cumberland / jungle & house).

**Placement**  
After Releases wall, before newsletter.

**Visual treatment**  
One large portrait (full-bleed or asymmetric), short manifesto line, 2–3 linked releases with play, link to artist page. Not a card grid of two tiny photos.

**Desktop / mobile**  
Desktop: photo 55% / copy 45%. Mobile: photo edge-to-edge, copy below.

**Why engagement rises**  
Artists pages currently underperform; a home spotlight feeds them and Shop.

---

### #3 — Label philosophy micro-section (“Music we want to keep”)

**Purpose**  
About copy is excellent and currently **orphaned** (About is not in primary nav; only via Copy House footer logo).

**Placement**  
Between featured artist and newsletter — short, one job.

**Visual treatment**  
One headline (existing), one supporting sentence, one text link to Library or About. Optional small fact row (Based · Roster · CC00x). No card farm, no stats strip.

**Desktop / mobile**  
Centered or left-aligned narrow measure (~28–32em); generous padding; light ground bridging dark wall → cream footer (you already gradient the signup).

**Why engagement rises**  
Turns visitors into believers; makes newsletter feel like joining something with a POV, not a generic “get updates.”

**Not chosen (lower ROI for now):** Instagram feed (no social presence wired), journal (no content pipeline yet), events (none visible), press logos (empty looks worse), playlists beyond Planet (Planet already exists — link it harder instead of inventing another module).

---

## 4. Quick Wins (under ~1 hour)

| Fix | Why it hurts | Severity | Difficulty | Expected improvement |
|-----|--------------|----------|------------|----------------------|
| Fill homepage `<meta name="description" content=" ">` | Blank SEO/social snippet | High | Trivial | Discoverability |
| Point all `og:image` to `https://clubcopy.ca/...` (still `vcr-records.vercel.app`) | Broken brand/share cards; trust leak | High | Trivial | Shares look correct |
| Update `--site-origin` from `vcrrecords.com` | Legacy residue in design system | Medium | Trivial | Consistency |
| Add **About** to footer links (and optionally nav) | Best copy is undiscoverable | High | Easy | Brand understanding |
| Fix `.undo-bar { display:flex }` overriding `[hidden]` | Empty cart shows “Item removed / Undo” | High | Trivial | Trust / polish |
| Hide or don’t render unavailable format buttons in static HTML until JS runs | Cassette/Vinyl flash before JS | Low | Easy | Clarity |
| Add Instagram / Bandcamp / email to footer | Underground labels live off-site too | Medium | Easy | Community path |
| Align home footer with other pages (Library link, consistent newsletter) | Home footer is thinner / inconsistent | Medium | Easy | IA clarity |
| Rename leftover `vcr-player` user-facing strings if any remain as “VCR” | Brand drift post-rename | Low | Easy | Consistency |
| Ensure wall skeletons stay until catalog paint (avoid empty black gap) | Slow/failed fetch looks broken | Medium | Easy | Perceived quality |

---

## 5. Medium Improvements (1–4 hours)

| Improvement | Why | Severity | Difficulty | Expected improvement |
|-------------|-----|----------|------------|----------------------|
| Hero artwork-forward composition (#1 UI) | See above | High | Medium | Engagement / conversion |
| Artist layout: larger photos, richer bio, discog play rows | Empty roster | High | Medium | Engagement |
| Shared footer component (mark, manifesto, socials, links, newsletter once) | Inconsistent chrome | Medium | Medium | Brand consistency |
| Shop: stronger primary CTA (“Add to bag” visual weight); demote tiny “Details” | Weak commerce affordance | Medium | Easy–Med | Conversion |
| Reduce dual-player on desktop when listening room is live (match mobile hide) | Two docks = noise | Medium | Easy | UX clarity |
| Library row hover: larger thumb preview or soft expand (keep list, add life) | Table can feel sterile | Low–Med | Medium | Delight |
| Contrast pass on `--muted` / `--dim` vs cream and dark | Some meta may fail WCAG AA | Medium | Medium | A11y |
| Cart empty: recommend 1–2 releases instead of only “Shop” | Dead end | Medium | Easy | Recovery |
| Planet MP3: one-line home teaser + footer already links — add home “Stream” chip | Disconnected product | Low–Med | Easy | Cross-feature use |
| Release pages: “More from artist” row under About | Dead-end after buy/listen | Medium | Medium | Browse depth |

---

## 6. High-Impact Improvements (1–2 days)

| Improvement | Why | Severity | Difficulty | Expected improvement |
|-------------|-----|----------|------------|----------------------|
| Homepage narrative spine: Featured release + Featured artist + Philosophy | Home isn’t a living label | High | Medium–High | Brand + engagement |
| Content system for artist bios + liner notes (even static markdown/JSON) | Pages feel unfinished | High | Medium | Depth vs Ghostly/Balmat |
| Unify light/dark design tokens (Upgrade #3) across Library/Artists/Shop interiors | Split personality | High | Medium | Perceived premium |
| Merch photography pass (on-body / sleeve-in-hand) for Goods & Clothing | Flat product shots limit shop | Medium | High (assets) | Store quality |
| Lightweight editorial slot (“Notes” — 1 post per release) | Competitors use editorial for SEO & culture | Medium | High | Long-term growth |
| Performance: critical CSS / font subset; defer player on non-listen pages | Player CSS/JS on many pages | Medium | Medium | Speed on mobile |
| Full a11y pass on CC Deck + floating dock (ARIA live regions, scrubbers) | Custom players are risk zones | Medium | Medium–High | Inclusive UX |

---

## 7. Visual Design Audit

### What works (preserve)

- **Chrome logo as hero-level brand** — passes the brand test; not nav-only.  
- **Dark listening continuum** — ambient blur, VHS grain, grid floor, platter live mode.  
- **Oswald callsigns** (`ON AIR`, catalogue display) — station identity without costume neon.  
- **Release archive** — artwork stage, Buy / Listen, CC Deck, liner notes structure.  
- **Tokens** in `site.css` — radius, ease, chrome edges, reduced-motion, safe areas.  
- **Mobile hero care** — `svh`/`dvh`, landscape room layout, dock hide when room live.

### Where it feels empty

- Artist pages and roster (small photos, one-line bios, big cream voids).  
- Homepage after wall (newsletter only — no culture layer).  
- About not in IA — philosophy exists but is hidden.  
- Home footer vs other footers (asymmetric).

### Where it feels cluttered / noisy

- Desktop: listening-room console **and** floating `vcr-player` simultaneously.  
- Hero format panel listing Cassette / Vinyl / Digital in markup (JS hides N/A — still a smell).  
- Shop hero re-stages the chrome logo after the home already did (redundant brand billboard).

### Where it feels generic

- Light interior pages without enough station chrome.  
- Contact form panel — correct but corporate; needs one brand line or visual.  
- Newsletter copy (“No spam, no noise”) is fine but interchangeable.

### Where it feels dated / inconsistent

- Legacy VCR domain in OG tags and CSS `--site-origin`.  
- Classnames `vcr-player` (internal OK; user-facing “VCR” would not be).  
- Copy House logo as primary footer brand on Club Copy pages — publishing entity over label mark.  
- Pill-heavy UI is on-brand for chrome/Y2K; watch density of pills on light pages so it doesn’t read “generic SaaS.”

### Typography

- Display = Space Grotesk; callsign = Oswald — good, not Inter/Roboto.  
- Hierarchy is clear on dark pages; on light pages meta (`--dim` at 11px uppercase) can under-compete with body.  
- Scale: section heads are strong; artist H1s strong; release titles strong. Tighten vertical rhythm between section-head and first content (sometimes 40–56px margin feels floaty with little content below).

### White space / density

- Intentional gallery spacing — good when content is rich (release pages).  
- Same spacing with thin content = empty (artists, about-without-media).  
- **Fix content density or photo scale**, not by filling with cards.

### Cards

- Home wall / shop products are interaction containers — OK.  
- Avoid new card grids for philosophy/artist spotlight; prefer full-bleed image + type.

### Motion / hover

- Specular sweep, reveal (`.rv`), platter, EQ bars — already premium.  
- Ensure reveals don’t leave below-fold content at `opacity: 0` if IO fails; skeletons help on wall.  
- Prefer 2–3 strong motions (already have) over adding more noise.

### Color / contrast

- Dark: cream ink on `#050505` — generally strong.  
- Light: `#5F636B` / `#727780` on `#F7F5F1` — verify AA for small caps labels.  
- Status green on release pages (`--ra-green`) is a nice scarce accent — keep rare.

### Navigation

- Primary: Listen · Library · Artists · Shop · Contact — clear.  
- Missing: About (content exists).  
- Mobile drawer: solid; ensure dark-page drawer styles stay consistent (home already special-cases).

### Album presentation

- Square art, disc-centric covers, cassette object on Inlet Knight — strong.  
- Library thumbs 72–88px — readable; could grow slightly on desktop hover.  
- Wall art presentation is the best “label grid” moment — protect it.

### Store

- Jump tabs Music / Goods / Clothing work.  
- Music section overlaps Library — consider framing Shop Music as “buy formats” vs Library as “browse/listen.”  
- Price + Add to bag present; “Details” underweighted.

### Empty / loading

- Wall skeletons: good.  
- Cart empty: OK copy; undo bar bug undermines polish.  
- Artists “Loading releases…” — fine; ensure failure state if fetch fails.

---

## 8. Premium Polish Checklist (small details, big perceived quality)

1. **Grid:** One `--wrap` and shared section-head padding everywhere (some pages reinvent page top padding).  
2. **Vertical rhythm:** 8px base; section heads already large — match first module top gap.  
3. **Album presentation:** Soft shadow + 1px chrome bezel on light pages (classes exist: `.media-bezel`).  
4. **Hover:** Library row left chrome bar already; add 200–280ms image brightness only (don’t scale text).  
5. **Transitions:** Keep `--ease` / `--dur`; don’t add bounce.  
6. **Skeletons:** Mirror wall skeletons on Library fetch.  
7. **Type scaling:** Clamp display once; reuse on About/Cart titles (Cart “Bag” should match Library “Library” voice).  
8. **Cropping:** Artist photos — decide portrait crop consistently; avoid letterboxing.  
9. **CTAs:** One primary fill per viewport (Play / Buy); ghost secondary.  
10. **Footer:** Club Copy mark + short manifesto + socials + links + single newsletter.  
11. **Mobile nav:** Drawer already good; add About + social row at bottom of drawer.  
12. **Micro-interactions:** Keep On air chip + EQ; ensure pause/play icon sync (already mostly there).  
13. **Hierarchy:** Catalogue number as callsign, title as display, artist as muted — enforce on Shop cards too.  
14. **Listening room:** On desktop, single control surface when live (hide dock or minimize console).  

---

## 9. Issue Register (selected)

| Issue | Why it hurts | Severity | Difficulty | Expected improvement |
|-------|--------------|----------|------------|----------------------|
| Homepage has no cultural spine beyond releases + email | Feels like a player, not a label | High | Med | Engagement / brand |
| Artist bios & photo scale | No scene, no attachment | High | Med | Engagement |
| About orphaned from nav | Best positioning copy unused | High | Easy | Brand clarity |
| Legacy OG / `vcr-records` URLs | Broken shares, unprofessional | High | Easy | Trust / SEO |
| Empty homepage meta description | SEO blank | High | Easy | Discovery |
| Cart undo bar visible when `hidden` (CSS `display:flex` override) | Looks buggy | High | Easy | Trust |
| Dual players on desktop during room live | Cognitive noise | Medium | Easy | UX |
| Light vs dark system split | Inconsistent premium feel | Medium | Med | Brand |
| Shop “Details” weak; Music ≈ Library | Commerce friction / IA blur | Medium | Easy–Med | Conversion |
| No social links | Dead-end for underground audience | Medium | Easy | Community |
| Footer inconsistency (home vs others) | Unfinished | Medium | Easy | Polish |
| Custom player a11y depth | Risk for keyboard/SR users | Medium | Med | A11y |
| `--muted` contrast on cream | Hard to read meta | Medium | Easy | A11y |
| Planet MP3 disconnected | Feature unused | Low–Med | Easy | Engagement |
| Contact feels generic | Missed brand moment | Low | Easy | Personality |

---

## 10. Final Prioritized Roadmap (Impact × Effort)

```
Impact ↑
  │
  │  * Homepage meta + OG fix          * Featured release in hero
  │  * Undo [hidden] bug               * Artist photo/bio depth
  │  * About in footer/nav             * Home: artist + philosophy
  │  * Social links                    * Light/dark token unify
  │  * Dual-player desktop fix
  │  * Shop CTA weight
  │                      * Release “more from”
  │                      * Editorial Notes (later)
  │  * Contact brand line              * Merch photo shoot
  └────────────────────────────────────────────→ Effort
       Quick wins              1–4h              1–2 days
```

### Suggested sequence

1. **Ship Quick Wins** (meta, OG, undo bug, About link, socials, footer parity).  
2. **Hero artwork-forward + desktop dock discipline.**  
3. **Artist pages / roster density.**  
4. **Homepage: featured artist + philosophy.**  
5. **Light-page station chrome pass + shop CTA.**  
6. **Later:** editorial Notes, merch photography, deeper a11y/performance.

---

## 11. What not to do

- Full visual redesign or abandoning chrome / cream / Space Grotesk.  
- Purple glow / glassmorphism SaaS restyle.  
- Card-heavy dashboards on the homepage.  
- Stuffing stats, schedules, or promo chips into the hero.  
- Building a blog before there is one release note’s worth of content — start with the existing About line and liner notes.  
- Dark-moding the entire Library just to “match” — unify through callsigns and bezels instead.

---

## 12. Closing

Club Copy’s listening room and release pages already speak fluent underground electronic. The work that moves the needle is **showing the record in the first viewport, giving artists a real stage, and letting the homepage carry the label’s POV** — then cleaning residue (VCR URLs, undo bug, footer IA). That path raises perceived quality to peer level with Balmat / Ghostly / Mood Hut **without** rebuilding the identity you already have.
