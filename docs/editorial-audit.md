# Night Shift — Editorial Audit (before rewrite)

**Role:** Senior zine editor  
**Scope:** All 85 `news/*.html` bodies, `data/news.json` deks/headlines, About page copy. No articles rewritten in this pass.  
**Date:** 19 September 2026  
**Question:** Do these pieces sound human, match the paper, and earn the night — or do they read like a prompt that learned the house?

---

## Verdict

The paper has a **real ear**. You can hear the kitchen, the stall, the Kingsway clipboard, the cassette in a coat. That is not generic CMS English. Prior design audits were right to say *do not flatten the voice*.

The problem is the opposite of flattening. The voice **hardened into a kit**. Once you have read four listening notes, you can write the fifth without hearing a record. Short-choppy is the main tell on release copy. The long-clause “listening” essays are the same tell wearing a trench coat: one breath, stacked appositions, a closing liturgy.

**Overall: 5.8 / 10**

Vision: present. Human: intermittent. Bomb: a handful of pieces. The rest is house cosplay of itself.

Night Shift should feel like an evening paper someone actually bought — Nylon back page, Face gossip, a desk that has opinions and receipts. Right now too much of it feels like the *idea* of that paper, generated until the nouns glow.

---

## Scorecard (/10)

| Lens | Score | What it means |
|---|---:|---|
| **Human** (a person in a room, not a generator) | **5.5** | Specific when it wants to be. Formulaic when it is tired. |
| **Craft** (rhythm, sentence variety, argument) | **5.0** | Two bad default lengths: telegram, or paragraph-as-sentence. |
| **Vision** (floor / fit / afters, PNW, objects, culture) | **7.5** | The paper knows what it is. Copy often recites the slogan instead of living it. |
| **Heat** (would you steal this issue) | **6.0** | Horoscope, stall, sticker, a few city pieces. The catalogue blurbs would not survive a xerox. |
| **Originality inside the house** | **4.5** | Same ending, same nouns, same “that is not X.” |
| **Combined (well written × human × vision)** | **5.8** | Keep the world. Kill the kit. |

Weighted for the actual ask (human + craft + vision): **5.8**.

---

## What the paper is (do not lose this)

Night Shift is the evening paper inside Club Copy: the floor, the fit, the afters. Vancouver weather. Objects you can hold. Gossip with a clipboard. Listening as a practice, not a review score. CJ Archer as a desk, not a brand voiceover.

**Preserve without apology**

- Masthead language used *as* masthead: desks, live slug, xerox energy.
- Horoscope as a real column (`stars-for-the-floor`) — short lines earned by form.
- City pieces that name addresses, dates, and operators (Birdhouse, Vantek, TYTB, DVBIA).
- Object essays that start from a body, not a thesis (`the-bathroom-line`, `the-sticker-on-the-lens`).
- Roster heat that is not Wikipedia (`riscape-on-club-copy` still has a pulse: stairwell opinions, Beatport as a shrug).
- The slogan *Music we want to keep* on About. That is six words. Leave it.

**Do not “clean up” into press-kit English.** The failure mode is not slang. The failure mode is **template**.

---

## The AI tell (this house, not ChatGPT bingo)

Classic slop (`delve`, `tapestry`, `in today’s world`) is almost absent. One `tapestry` in the whole stack. You already beat the intern prompt.

What you have instead is **Night Shift slop** — a local dialect of the same machine habits:

### 1. Telegram copy (the one you named)

Measured across 85 bodies: average sentence **13.5 words**; **28%** of sentences are six words or fewer. The worst runs are four short sentences in a row.

This is not “punchy.” This is a drum machine.

**Exhibit — `lions-gate.html`**

> Lions’ Gate is the bridge when Vancouver decides you’re not finished yet. Water under. Skyline doing its wet glitter thing. You were going to go home and answer email. You didn’t.

**Exhibit — `inlet-knight.html` closer**

> Start at the top. Leave it alone. … Don’t skip. Don’t DJ it. Just let the boat go.

**Exhibit — `need-you.html` closer**

> Play it when the house is yours. Play it when it isn’t. … Leave it. That’s what I did.

A human who loves a record will sometimes bark a command. A generator barks a **stack** of commands because it thinks that is voice. Voice is the sentence that *couldn’t* have been a button.

### 2. The liturgy closer (copy-paste across canon)

These endings are the same piece of software:

| File | Closing kit |
|---|---|
| `donuts.html` | Leave it running. That’s the listening. That’s the homework you actually want. |
| `untrue.html` | Leave it running. Don’t skip. If you start moving the room around (…), that’s the listening. That’s the homework… |
| `love-deluxe.html` | Play “No Ordinary Love” once without performing it. Then leave the album running. If you start moving the room around (a candle, a jacket…), that’s the listening |
| `homogenic.html` | Play “Unravel” once without performing it. Then leave the album running. If you start moving the lights… that’s the listening |
| `the-velvet-rope.html` | If you start moving the room around (a candle…), that’s the listening. If you refill a glass… that’s the listening too |
| `mezzanine.html` | Play it through. Don’t skip… If you start the dishes… that’s the listening. If you leave a coat… that’s the listening too |

Once is style. Six times is a **macro**. Readers who live in the paper will clock it by issue three. That is worse than bland. It is *recognizable as generated*.

### 3. Negation engine

The model’s favourite personality is **contrast**.

- `This isn’t a bio paragraph.` (`inlet-knight-on-club-copy`)
- `That is not tourism.` (`crystal-tears`)
- `That is not a vibe.` (`no-fun-city`)
- `Halloween is a costume. Mezzanine is not.`
- `That is not a compromise.` (appears in more than one city/gossip piece)

A zine can refuse. It should not **announce the refuse** every graf. Say the true thing. Let the false thing die of neglect.

### 4. Sacred nouns on a loop

Counts in bodies (not exhaustive of the idea, just the phrase):

- `the room` — 58
- `the floor` — 31
- `the afters` — 27
- `the booth` — 16

Fine as a kicker. Fatal as the subject of every sentence. When every object is *the room*, nothing is a room. Swap in: stall, Kingsway box, radiator, glue on a camera, kettle, DVBIA spreadsheet, Fisticuffs, Lions Gate crossing. **Proper nouns beat theology.**

### 5. Sentence-start drum

Most common openers: **The** (307), **You** (97), **If** (79), **I** (61), **It** (58), **That’s** (39), **Not** (24), **Play** (20), **Keep / Leave** (29 combined).

The `You` / `If you` / `Play` / `Keep` / `Leave` cluster is the paper talking like a wellness app with a smoke machine.

### 6. The other slop: one-breath paragraphs

The listening essays overcorrected the telegram. `the-velvet-rope`, `mezzanine`, `the-bathroom-line` pack a whole column into four sentences that run 60–90 words with comma-chains: *where…, where…, which is…, the kind that…*

That also reads as AI: the model was told “no short sentences,” so it never lands. **The bomb mixes lengths.** A 28-word sentence, then a 9, then a 41 that earns the 9.

### 7. Thin catalogue notes

Fifteen-odd pieces sit at **~95–170 words** and do not contain a fact you could not get off the sleeve. `inlet-knight-on-club-copy` (107 words), `champion-sound`, `lt-drifta-on-club-copy`, `donuts`, `summer-madness`, `working-for-the-knife`, `caprisongs`.

A signing notice can be short. It cannot be **only temperature**. If we signed Rainier, we owe a when, a what, a why that is not “the room wouldn’t leave.”

### 8. Desk hygiene (not voice, still slop)

- `news.json` image alts: **“Placeholder. Photo to come.”** on majors / mouse / Sweeney pieces that are on the home rail.
- Datelines in the **future** relative to the paper’s “today” (e.g. Mezzanine 31 Oct 2026, The Mini, The Sticker 3 Oct 2026, The Shoes 12 Dec 2026) sitting next to Sep 12, 2026 city files. An evening paper that time-travels looks generated.
- `crystal-tears` nav points at `/news/the-last-exclusive` — a dead door.
- About FAQ is allowed to be short. Zine copy is not About FAQ.

---

## Desk-by-desk scores

### A. Release / signing notes — **3.5 / 10**

`please`, `inlet-knight`, `need-you`, `lions-gate`, `inlet-knight-on-club-copy`, `lt-drifta-on-club-copy`, most CC catalogue blurbs.

**What’s wrong:** Telegram stack + no reporting. The Riscape release (`please`) is the best of a weak set because it still has kitchen piano and conservatory-as-blood. `We Signed Rainier` is the worst: three grafs of vibe, then “this isn’t a bio.” If it isn’t a bio, it still has to *be* something.

**Must change before rewrite:** Every owned-catalogue piece needs **one unfakeable detail** (who mixed it, what the tape shell is, which night you first played it, what the neighbour said). Then **one** command, not five. No “this isn’t a press kit.”

### B. Canon listening (Dummy, Untrue, Donuts, Love Deluxe, Homogenic, Mezzanine, Velvet Rope) — **5.0 / 10**

Dummy is the human one: Cumberland, radiator, “I also got tired of it being the only door.” That is a person.

Donuts / Untrue / Homogenic / Love Deluxe / Velvet Rope / Mezzanine share the **macro**. Mezzanine and Velvet Rope have heat in the middle (towel, wet hair, kitchen light) then blow it on the liturgy. Stretch the middle. Burn the last paragraph and write a new last paragraph that could not fit another album.

**Must change:** Unique last graf per record. Ban the phrase *that’s the listening* except maybe once in the whole paper, ever. Ban “Play [single] once without performing it.”

### C. Object / ritual / fit — **7.5 / 10**

`the-bathroom-line`, `the-sticker-on-the-lens`, `stars-for-the-floor`, `hello-kitty-pants` (when it stays in the stall and the petition).

This is the actual magazine. Body Shop glitter, glue residue at brunch, Eisenhower dollar, flashlight in the stall. Horoscope is allowed to be choppy because it is a **column form**.

**Must change:** Break the 80-word sentences. Cut one theological noun per graf. Sticker already has an argument; don’t restate “presence isn’t a sticker” after you’ve shown the glue.

### D. City / gossip with a ledger — **7.0 / 10**

`fifa-vs-the-underground`, `no-fun-city-still-raids-the-rooms`, `portland-finally-got-an-all-ages-temple`, `madame-lous…`, `cobalt…`.

These are the closest to a real desk: numbers, dates, two nightlives. FIFA still over-explains its own fairness (“Do not flatten this into FIFA-ordered-the-raids. That is fanfic”). A human editor would let the ledger sit and take one swing. Also: too many `That is not` hedges, `file them that way`, `Keep both framings`. That is LLM-as-responsible-journalist.

**Must change:** One frame in the last graf, not a both-sides shrine. Fewer meta-instructions to the reader.

### E. Long culture features — **6.5 / 10**

`crystal-tears-on-the-westside` has reporting (Chilombo → Westside, Fisticuffs, fires, track-by-track). It also has “That is not press-kit poetry / tourism,” “the underground asked her to finish the sentence,” and a closer that sounds like a trailer. Cut the thesis sentences. Keep the booth and the ash.

`just-sports-means-equity`, `majors-monetized-the-booth`, `mouse-hired-an-empire`: gossip energy, placeholder art, slightly too pleased with the headline. Fine if they read like a column; they currently read like a thread.

### F. Artist cover stories — **6.5 / 10**

`riscape-on-club-copy` still has dirt (Grey Studios, Mystery Freedom, radio, “If you wanted the Wikipedia page you could have googled”). Then it sprints: “We signed him in ’26. Play it. See who sits down.” The sprint is the slop. Let the last graf be a night, not a CTA.

### G. Label notes / About — **6.0 / 10**

`no-prompt-can-touch` is on-theme and a little proud of itself (Miyazaki, “insult to life”). Ironic, given this audit. About page: allowed to be spec sheet. Don’t let zine copy imitate it.

---

## Piece scores (selected; /10)

Human × craft × whether it matches Night Shift. 10 = steal this xerox. 3 = delete and start from the tape.

| Piece | Score | Note |
|---|---:|---|
| Stars for the Floor | **8.5** | Form earns the short line. Don’t rewrite into essays. |
| The Bathroom Line | **8.0** | Human. Break the run-on. |
| The Sticker on the Lens | **8.0** | Argument + glue. Trim the sermon. |
| Dummy | **7.5** | Cumberland rain. Best canon note. |
| FIFA vs the Underground | **7.0** | Ledger is the bomb. Kill the fairness lecture. |
| Riscape: Heads Down | **7.0** | Almost a cover story. Last graf is a button. |
| Crystal Tears on the Westside | **6.5** | Reported. Thesis-y. |
| You Are (Love) | **6.0** | Kitchen piano is real. Rest is catalogue. |
| Mezzanine / Velvet Rope | **6.0** | Heat, then macro. |
| Untrue / Love Deluxe / Homogenic | **4.5** | Same ending with different proper nouns. |
| Donuts | **4.0** | Tragedy disclaimer + liturgy. Dilla deserves dirt. |
| Need U | **3.5** | Caption. |
| Inlet Knight | **3.5** | Boat, rain, commands. |
| Lions’ Gate | **3.0** | Pure telegram. |
| We Signed Rainier | **3.0** | Temperature check that refuses to be a story. |

Median of the stack is about **5–6**. The home rail is currently overweight on 3s and 7s, not 8s.

---

## House rules for the rewrite (lock these before anyone types)

1. **Rhythm:** In any graf longer than two sentences, at least one sentence over 22 words and one under 12. No three consecutive sentences under 8 words unless the form is a list (horoscope, door policy, tracklist).
2. **One command per piece, max.** `Leave it on` is allowed once. Not Keep / Leave / Play / Don’t skip as a chord.
3. **Ban list (paper-wide, this pass):**
   - “that’s the listening” / “that’s the homework you actually want”
   - “Play [title] once without performing it”
   - “If you start moving the room around…”
   - “This isn’t a bio / press kit / vibe”
   - “That is not [noun]” as a graf punch
   - “the kind of [x] that [y]” more than once per issue
4. **Sacred nouns:** *floor / room / afters / booth / the listening* — at most **two** of these in a short piece, **five** in a long one. Replace with names and objects.
5. **Unfakeable detail:** If a piece is under 250 words, it must contain something you could not prompt: a street, a brand of glue, a neighbour, a receipt, a wrong note, a date that isn’t a vibe.
6. **Last graf:** Must not work if you swap the album title. Test it. If Homogenic’s closer still scans for Untrue, rewrite.
7. **You / If you:** Not illegal. Illegal as the first word of two consecutive sentences.
8. **Reporting pieces:** Pick a side in the last graf. Do not “keep both framings” as a personality.
9. **Length:** Release notes 280–450 words or they become a kicker on the object page, not a zine story. Canon listening 400–700. City files can stay long if the sentences vary.
10. **Desk:** Kill placeholder alts. Fix dead links. Pick a “today” for the paper and stop publishing October from September.

---

## What to rewrite first (order, not calendar)

**P0 — the kit is showing**

1. All canon listening that shares the liturgy closer (Untrue, Donuts, Love Deluxe, Homogenic, Mezzanine, Velvet Rope). Dummy stays closest to itself; still pass for rhythm.
2. Owned-catalogue blurbs: Inlet Knight, Need U, Lions’ Gate, We Signed Rainier, L.T. Drifta signing, Please / You Are (Love).
3. Strip banned phrases from the rest of the stack even where the piece is otherwise good.

**P1 — make the bomb bombier**

4. Bathroom Line, Sticker, Shoes, Coat, Jersey — break run-ons, cut theology.
5. FIFA / No Fun City / Portland / Madame Lou’s / Cobalt — last grafs, fewer hedges.
6. Crystal Tears — cut thesis sentences, keep Fisticuffs and ash.

**P2 — hygiene**

7. Placeholders, broken nav, impossible datelines.
8. Horoscope: **do not** lengthen. Protect it.
9. About / FAQ: out of scope unless a sentence leaked into the zine.

**Do not begin P1 until P0 closers are unique.** Otherwise you will restyle the macro and call it a pass.

---

## What “the bomb” sounds like (target, not a paste)

Not: *Play it. Leave it. That’s the listening.*

Not: *If you start moving the room around (a candle, a jacket off a chair, a window cracked because the night is still in your hair), that’s the listening we should have led with.*

Yes: a sentence that could only be about **this** night, **this** tape, **this** city, with a body in it, and a last line that does not appear in another file.

Dummy already points at it. The stall already points at it. FIFA’s east-side clipboard already points at it. The job is to make the catalogue and the canon catch up to those desks, without turning every piece into a 90-word sentence.

---

## Out of scope this editorial pass

Site chrome, steel OS, player dock, Cover Flow. Those have their own audits. This pass is **prose only**. Do not flatten Night Shift into a blog grid while rewriting. Do not replace voice with “clarity.” Replace **template** with **sentences that remember a room**.
