const assert = require("assert");
const bc = require("../lib/bandcamp");

const html =
  '<div data-tralbum="{&quot;trackinfo&quot;:[{&quot;id&quot;:1,&quot;track_id&quot;:1,&quot;title&quot;:&quot;DESIRE&quot;,&quot;file&quot;:{&quot;mp3-128&quot;:&quot;//t4.bcbits.com/stream/abc/mp3-128/1&quot;}}]}"></div>';

const tralbum = bc.parseTralbum(html);
assert.ok(tralbum);
assert.strictEqual(tralbum.trackinfo[0].title, "DESIRE");

const abs = bc.absoluteUrl("//t4.bcbits.com/stream/abc/mp3-128/1");
assert.strictEqual(abs, "https://t4.bcbits.com/stream/abc/mp3-128/1");
assert.ok(bc.streamAllowed(abs));
assert.ok(bc.streamAllowed("//t4.bcbits.com/stream/abc/mp3-128/1"));
assert.ok(!bc.streamAllowed("https://evil.example/x.mp3"));
assert.strictEqual(
  bc.publicPage({ bandcampUrl: "https://forsberg.bandcamp.com/track/a-ap-forever" }),
  "https://forsberg.bandcamp.com/track/a-ap-forever"
);
assert.strictEqual(bc.publicPage({ bandcampUrl: "http://forsberg.bandcamp.com/track/x" }), null);
assert.strictEqual(bc.publicPage({ bandcampUrl: "https://evil.example/track/x" }), null);
assert.strictEqual(bc.publicPage({}), null);
assert.strictEqual(bc.isClientChallenge("<html><title>Client Challenge</title></html>"), true);
assert.strictEqual(bc.isClientChallenge("<html><title>Client Challenge</title>" + "x".repeat(9000) + "</html>"), false);
assert.strictEqual(bc.isClientChallenge("<html><title>A real release</title></html>"), false);

const picked = bc.pickStream(tralbum, { title: "Desire" });
assert.ok(picked);
assert.strictEqual(picked.src, abs);

const href = bc.findDiscographyHref(
  '<a href="/album/need-u"></a><a href="/track/desire"></a>',
  "Need U"
);
assert.strictEqual(href, "/album/need-u");

const desireHref = bc.findDiscographyHref('<a href="/track/desire"></a>', "DESIRE");
assert.strictEqual(desireHref, "/track/desire");

const gorillaHtml =
  '<div data-tralbum="{&quot;trackinfo&quot;:[{&quot;id&quot;:3833459465,&quot;track_id&quot;:3833459465,&quot;title&quot;:&quot;Little Simz - Gorilla (Molly\'s Hazy Edit)&quot;,&quot;file&quot;:{&quot;mp3-128&quot;:&quot;//t4.bcbits.com/stream/gor/mp3-128/1&quot;}}]}"></div>';
const gorillaTr = bc.parseTralbum(gorillaHtml);
const gorillaCue = bc.pickStream(gorillaTr, { title: "Gorilla (Molly’s Hazy Edit)" });
assert.ok(gorillaCue);
assert.ok(/\/gor\//.test(gorillaCue.src));

const mixHtml =
  '<div data-tralbum="{&quot;trackinfo&quot;:[{&quot;id&quot;:1,&quot;track_num&quot;:1,&quot;title&quot;:&quot;intro&quot;,&quot;file&quot;:{&quot;mp3-128&quot;:&quot;//t4.bcbits.com/stream/a/mp3-128/1&quot;}},{&quot;id&quot;:2666317723,&quot;track_num&quot;:2,&quot;title&quot;:&quot;soul bounce&quot;,&quot;file&quot;:{&quot;mp3-128&quot;:&quot;//t4.bcbits.com/stream/b/mp3-128/2&quot;}}]}"></div>';
const mixTr = bc.parseTralbum(mixHtml);
const mixByNum = bc.pickStream(mixTr, { title: "weekend girl", trackNum: 2 });
assert.ok(mixByNum);
assert.strictEqual(mixByNum.title, "soul bounce");

const catalog = require("../data/catalog.json");
const products = require("../lib/catalog").PRODUCTS;
assert.ok(!catalog.releases.some((r) => r.id === "gorilla" || r.id === "m-a-s-s-i-v-e"));
assert.ok(!catalog.releases.some((r) => r.artistId === "molly-haze" || r.artist === "Molly Haze"));
assert.ok(!products["dg-gorilla"]);
assert.ok(!products["dg-cherry-coloured-funk"]);
assert.ok(!catalog.releases.some((r) => r.id === "anything-you-can-do" || r.catalogue === "CC019"));
assert.ok(!products["dg-anything-you-can-do"]);
assert.ok(!catalog.releases.some((r) => r.id === "if-ya-want" || r.catalogue === "CC021"));
assert.ok(!products["dg-if-ya-want"]);
assert.ok(!catalog.releases.some((r) => ["CC023", "CC024", "CC026", "CC027", "CC028"].includes(r.catalogue)));
assert.ok(!catalog.releases.some((r) => r.id === "l-t-drifta"));
assert.ok(!catalog.releases.some((r) => r.id === "freed-from" || r.id === "call-anytime" || r.catalogue === "CC029"));
assert.ok(!products["dg-freed-from"]);
assert.ok(!products["dg-call-anytime"]);
assert.ok(!catalog.releases.some((r) => r.id === "i-give-everything" || r.catalogue === "CC022"));
assert.ok(!products["dg-i-give-everything"]);
assert.deepStrictEqual(
  catalog.releases.filter((r) => r.artistId === "lt-drifta").map((r) => r.id).sort(),
  ["02-just-cant-take", "artificial-intelligence", "carry-me-home", "champion-sound", "classic-jazz", "ep1", "for-my-sins", "get-me-down", "high-low", "links", "lt-invades-blue-note", "shades-of-blue", "shaolin-style", "slims-return", "summer-madness", "three-4-zone", "why-is-my-heart-so-heavy"]
);
assert.deepStrictEqual(
  ["get-me-down", "three-4-zone"].map((id) => {
    const r = catalog.releases.find((x) => x.id === id);
    const t = r.tracks[0];
    return [r.catalogue, r.title, r.artist, r.released, r.formats.digital.sku, r.bandcampUrl, t.id, t.duration, t.bandcampTrackId, products[r.formats.digital.sku].unitAmount];
  }),
  [
    ["CC020", "Nia Archives - Get Me Down (Molly's Hazy Jungle Edit)", "LT Drifta", "2026-10-19", "dg-get-me-down", "https://ltdrifta.bandcamp.com/track/nia-archives-get-me-down-mollys-hazy-jungle-edit", "gmd-01", 324, 2636373644, 0],
    ["CC014", "Three 4 Zone", "LT Drifta", "2026-10-18", "dg-three-4-zone", "https://ltdrifta.bandcamp.com/track/three-4-zone", "t4z-01", 401, 3048030883, 150],
  ]
);
assert.ok(!catalog.releases.some((r) => r.id === "whats-luv" || r.id === "everyday" || r.catalogue === "CC033" || r.catalogue === "CC025"));
assert.ok(!products["dg-whats-luv"]);
assert.ok(!products["dg-everyday"]);
assert.deepStrictEqual(
  ["high-low", "lifetime", "shaolin-style", "links"].map((id) => {
    const r = catalog.releases.find((x) => x.id === id);
    const t = r.tracks[0];
    return [r.catalogue, r.title, r.artistId, r.kind, r.released, r.page, r.previewTrackId, r.formats.digital.price, r.formats.digital.sku, r.bandcampUrl, t.id, t.duration, t.bandcampTrackId, products[r.formats.digital.sku].unitAmount];
  }),
  [
    ["CC037", "Lenzman, Redeyes - High & Low (Remix)", "lt-drifta", "Single", "2026-10-25", "/high-low", "hl-01", 0, "dg-high-low", "https://ltdrifta.bandcamp.com/track/lenzman-redeyes-high-low-remix", "hl-01", 267, 1473938968, 0],
    ["CC032", "l i f e t i m e", "forsberg", "Single", "2026-10-24", "/lifetime", "lft-01", 1.5, "dg-lifetime", "https://forsberg.bandcamp.com/track/l-i-f-e-t-i-m-e", "lft-01", 288, 2823529420, 150],
    ["CC034", "Lavery - Shaolin Style (L.T.'s VIP Mix)", "lt-drifta", "Single", "2026-10-24", "/shaolin-style", "sha-01", 0, "dg-shaolin-style", "https://ltdrifta.bandcamp.com/track/lavery-shaolin-style-l-t-s-vip-mix", "sha-01", 278, 717888588, 0],
    ["CC031", "The Chameleon - Links (L.T.'s VIP Mix)", "lt-drifta", "Single", "2026-10-23", "/links", "lnk-01", 0, "dg-links", "https://ltdrifta.bandcamp.com/track/the-chameleon-links-l-t-s-vip-mix", "lnk-01", 297, 414441591, 0],
  ]
);

const tellMe = catalog.releases.find((r) => r.id === "tell-me");
assert.ok(tellMe);
assert.strictEqual(tellMe.artist, "Riscape");
assert.strictEqual(tellMe.artistId, "riscape");
assert.strictEqual(tellMe.catalogue, "CC009");
assert.strictEqual(tellMe.title, "Tell Me");
assert.strictEqual(tellMe.kind, "EP");
assert.strictEqual(tellMe.released, "2026-10-10");
assert.strictEqual(tellMe.page, "/tell-me");
assert.strictEqual(tellMe.previewTrackId, "tm-01");
assert.strictEqual(tellMe.formats.digital.sku, "dg-tell-me");
assert.strictEqual(tellMe.formats.digital.price, 4.99);
assert.ok(/riscape\.bandcamp\.com\/album\/tell-me-ep/.test(tellMe.bandcampUrl));
assert.deepStrictEqual(
  tellMe.tracks.map((t) => [t.title, t.duration, t.bandcampTrackId]),
  [
    ["My Whole Life", 125, 682747105],
    ["Tell Me Something", 112, 2146358393],
    ["Tell Me Nothing", 239, 3789541219],
  ]
);
assert.strictEqual(products["dg-tell-me"].unitAmount, 499);
assert.strictEqual(bc.pickCueTrack(tellMe).id, "tm-01");

const yal = catalog.releases.find((r) => r.id === "you-are-love");
assert.ok(yal);
assert.strictEqual(yal.status, "Available");
assert.strictEqual(yal.previewTrackId, "yal-01");
assert.ok(/riscape\.bandcamp\.com/.test(yal.bandcampUrl));
assert.strictEqual(yal.formats.digital.sku, "dg-you-are-love");
assert.strictEqual(yal.formats.cassette.stock, 0);
assert.strictEqual(bc.pickCueTrack(yal).id, "yal-01");
assert.strictEqual(bc.pickCueTrack(yal, "yal-02").id, "yal-02");
assert.strictEqual(yal.tracks[3].title, "Day Like This");
assert.strictEqual(yal.tracks[3].bandcampTrackId, 1221909968);

const forsberg = catalog.artists.find((a) => a.id === "forsberg");
assert.ok(forsberg);
assert.strictEqual(forsberg.name, "Forsberg");
assert.strictEqual(forsberg.slug, "/artists/forsberg");
const pleaseWait = catalog.releases.find((r) => r.id === "please-wait");
assert.ok(pleaseWait);
assert.strictEqual(pleaseWait.artist, "Forsberg");
assert.strictEqual(pleaseWait.artistId, "forsberg");
assert.strictEqual(pleaseWait.catalogue, "CC010");
assert.strictEqual(pleaseWait.title, "please wait");
assert.strictEqual(pleaseWait.kind, "Single");
assert.strictEqual(pleaseWait.released, "2026-10-17");
assert.strictEqual(pleaseWait.page, "/please-wait");
assert.strictEqual(pleaseWait.previewTrackId, "pw-01");
assert.strictEqual(pleaseWait.formats.digital.sku, "dg-please-wait");
assert.strictEqual(pleaseWait.formats.digital.price, 1.5);
assert.ok(/forsberg\.bandcamp\.com\/track\/please-wait/.test(pleaseWait.bandcampUrl));
assert.deepStrictEqual(
  pleaseWait.tracks.map((t) => [t.title, t.duration, t.bandcampTrackId]),
  [["please wait", 330, 1737504659]]
);
assert.strictEqual(products["dg-please-wait"].unitAmount, 150);
assert.strictEqual(bc.pickCueTrack(pleaseWait).id, "pw-01");
const jadore = catalog.releases.find((r) => r.id === "j-adore");
assert.strictEqual(jadore.artist, "Forsberg");
assert.strictEqual(jadore.artistId, "forsberg");
assert.strictEqual(jadore.title, "j'adore");
assert.strictEqual(jadore.bandcampUrl, "https://forsberg.bandcamp.com/album/jadore");
assert.deepStrictEqual(
  catalog.releases.filter((r) => r.artistId === "forsberg").map((r) => r.id),
  [
    "a-ap-forever",
    "lifetime",
    "outta-this-mess",
    "pitch-black",
    "try-to-love-again",
    "run-it-back",
    "please-wait",
    "j-adore",
  ]
);
assert.ok(!catalog.releases.some((r) => r.id === "safe-as" || r.catalogue === "CC018"));
assert.ok(!products["dg-safe-as"]);
assert.deepStrictEqual(
  ["outta-this-mess"].map((id) => {
    const r = catalog.releases.find((x) => x.id === id);
    const t = r.tracks[0];
    return [
      r.catalogue,
      r.title,
      r.artistId,
      r.kind,
      r.released,
      r.page,
      r.previewTrackId,
      r.formats.digital.price,
      r.formats.digital.sku,
      r.bandcampUrl,
      t.id,
      t.duration,
      t.bandcampTrackId,
      products[r.formats.digital.sku].unitAmount,
    ];
  }),
  [
    ["CC016", "outta this mess", "forsberg", "Single", "2026-10-18", "/outta-this-mess", "otm-01", 1.5, "dg-outta-this-mess", "https://forsberg.bandcamp.com/track/outta-this-mess", "otm-01", 300, 675523114, 150],
  ]
);
assert.ok(!catalog.releases.some((r) => r.id === "deeper" || r.catalogue === "CC017"));
assert.ok(!products["dg-deeper"]);
assert.ok(!catalog.releases.some((r) => r.id === "rose-rouge-edit" || r.catalogue === "CC015"));
assert.ok(!products["dg-rose-rouge-edit"]);

const pitchBlack = catalog.releases.find((r) => r.id === "pitch-black");
assert.ok(pitchBlack);
assert.strictEqual(pitchBlack.catalogue, "CC013");
assert.strictEqual(pitchBlack.title, "Pitch Black");
assert.strictEqual(pitchBlack.kind, "Album");
assert.strictEqual(pitchBlack.released, "2026-10-18");
assert.strictEqual(pitchBlack.page, "/pitch-black");
assert.strictEqual(pitchBlack.previewTrackId, "pb-01");
assert.strictEqual(pitchBlack.formats.digital.sku, "dg-pitch-black");
assert.strictEqual(pitchBlack.formats.digital.price, 4);
assert.strictEqual(pitchBlack.bandcampUrl, "https://forsberg.bandcamp.com/album/pitch-black");
assert.deepStrictEqual(
  pitchBlack.tracks.map((t) => [t.id, t.title, t.duration, t.bandcampTrackId]),
  [
    ["pb-01", "Neighbourhood Spy", 185, 3106180149],
    ["pb-02", "Primo", 134, 440450174],
    ["pb-03", "Pitch Black", 360, 2277520901],
  ]
);
assert.strictEqual(products["dg-pitch-black"].unitAmount, 400);
assert.strictEqual(bc.pickCueTrack(pitchBlack).id, "pb-01");
assert.strictEqual(bc.pickCueTrack(pitchBlack, "pb-03").id, "pb-03");

const tryToLoveAgain = catalog.releases.find((r) => r.id === "try-to-love-again");
assert.ok(tryToLoveAgain);
assert.strictEqual(tryToLoveAgain.catalogue, "CC012");
assert.strictEqual(tryToLoveAgain.title, "try to love again");
assert.strictEqual(tryToLoveAgain.kind, "Single");
assert.strictEqual(tryToLoveAgain.released, "2026-10-18");
assert.strictEqual(tryToLoveAgain.page, "/try-to-love-again");
assert.strictEqual(tryToLoveAgain.previewTrackId, "ttla-01");
assert.strictEqual(tryToLoveAgain.formats.digital.sku, "dg-try-to-love-again");
assert.strictEqual(tryToLoveAgain.formats.digital.price, 1.5);
assert.strictEqual(tryToLoveAgain.bandcampUrl, "https://forsberg.bandcamp.com/track/try-to-love-again");
assert.deepStrictEqual(
  tryToLoveAgain.tracks.map((t) => [t.id, t.title, t.duration, t.bandcampTrackId]),
  [["ttla-01", "try to love again", 360, 898873433]]
);
assert.strictEqual(products["dg-try-to-love-again"].unitAmount, 150);
assert.strictEqual(bc.pickCueTrack(tryToLoveAgain).id, "ttla-01");

const runItBack = catalog.releases.find((r) => r.id === "run-it-back");
assert.ok(runItBack);
assert.strictEqual(runItBack.artist, "Forsberg");
assert.strictEqual(runItBack.artistId, "forsberg");
assert.strictEqual(runItBack.catalogue, "CC011");
assert.strictEqual(runItBack.title, "run it back");
assert.strictEqual(runItBack.kind, "Single");
assert.strictEqual(runItBack.released, "2026-10-18");
assert.strictEqual(runItBack.page, "/run-it-back");
assert.strictEqual(runItBack.previewTrackId, "rib-01");
assert.strictEqual(runItBack.formats.digital.sku, "dg-run-it-back");
assert.strictEqual(runItBack.formats.digital.price, 1.5);
assert.strictEqual(runItBack.bandcampUrl, "https://forsberg.bandcamp.com/track/run-it-back");
assert.deepStrictEqual(
  runItBack.tracks.map((t) => [t.id, t.title, t.duration, t.bandcampTrackId]),
  [["rib-01", "run it back", 150, 2830265795]]
);
assert.strictEqual(products["dg-run-it-back"].unitAmount, 150);
assert.strictEqual(bc.pickCueTrack(runItBack).id, "rib-01");

const three4Zone = catalog.releases.find((r) => r.id === "three-4-zone");
assert.ok(three4Zone);
assert.strictEqual(three4Zone.artist, "LT Drifta");
assert.strictEqual(three4Zone.artistId, "lt-drifta");
assert.strictEqual(three4Zone.catalogue, "CC014");
assert.strictEqual(three4Zone.title, "Three 4 Zone");
assert.strictEqual(three4Zone.kind, "Single");
assert.strictEqual(three4Zone.released, "2026-10-18");
assert.strictEqual(three4Zone.page, "/three-4-zone");
assert.strictEqual(three4Zone.previewTrackId, "t4z-01");
assert.strictEqual(three4Zone.formats.digital.sku, "dg-three-4-zone");
assert.strictEqual(three4Zone.formats.digital.price, 1.5);
assert.strictEqual(three4Zone.bandcampUrl, "https://ltdrifta.bandcamp.com/track/three-4-zone");
assert.deepStrictEqual(
  three4Zone.tracks.map((t) => [t.id, t.title, t.duration, t.bandcampTrackId]),
  [["t4z-01", "Three 4 Zone", 401, 3048030883]]
);
assert.strictEqual(products["dg-three-4-zone"].unitAmount, 150);
assert.strictEqual(bc.pickCueTrack(three4Zone).id, "t4z-01");

const { isFreeDownloadTitle } = require("../lib/catalog");
assert.strictEqual(
  bc.freeDownloadUrl({ freeDownloadPage: "https://bandcamp.com/download?id=1&type=track" }),
  "https://bandcamp.com/download?id=1&type=track"
);
assert.strictEqual(bc.freeDownloadUrl({ freeDownloadPage: "https://evil.example/x" }), null);
assert.strictEqual(bc.freeDownloadUrl({}), null);

for (const rel of catalog.releases) {
  const digital = rel.formats && rel.formats.digital;
  if (!digital) continue;
  // Bandcamp name-your-price at $0 stays free. A bootleg title is not enough
  // once Bandcamp sets a minimum (iPod Touch, So Good, the Archie Rose Rouge edit).
  const pricedDespiteTitle = rel.id === "ipod-touch" || rel.id === "so-good" || rel.id === "st-germain-rose-rouge";
  if ((isFreeDownloadTitle(rel.title) && !pricedDespiteTitle) || digital.free) {
    assert.strictEqual(digital.price, 0, rel.title);
    assert.strictEqual(digital.free, true, rel.title);
    assert.strictEqual(products[digital.sku].unitAmount, 0, rel.title);
  } else {
    assert.ok(digital.price > 0, rel.title);
    assert.ok(!digital.free, rel.title);
    assert.ok(products[digital.sku].unitAmount > 0, rel.title);
  }
}

assert.deepStrictEqual(
  ["ipod-touch", "so-good", "for-my-sins"].map((id) => {
    const r = catalog.releases.find((x) => x.id === id);
    const t = r.tracks[0];
    return [r.catalogue, r.title, r.artistId, r.released, r.page, r.formats.digital.price, r.formats.digital.sku, r.bandcampUrl, t.id, t.duration, t.bandcampTrackId, products[r.formats.digital.sku].unitAmount];
  }),
  [
    ["CC040", "Ninajirachi - iPod Touch (Archie's Garage Bootleg)", "archie", "2026-11-09", "/ipod-touch", 1.5, "dg-ipod-touch", "https://archie4ever.bandcamp.com/track/ninajirachi-ipod-touch-archies-garage-bootleg", "ipt-01", 233, 3733824340, 150],
    ["CC039", "Jhené Aiko - So Good (Archie Bootleg)", "archie", "2026-11-09", "/so-good", 1.5, "dg-so-good", "https://archie4ever.bandcamp.com/track/jhen-aiko-so-good-archie-bootleg", "sgd-01", 218, 2796235860, 150],
    ["CC038", "For My Sins", "lt-drifta", "2026-10-25", "/for-my-sins", 1.5, "dg-for-my-sins", "https://ltdrifta.bandcamp.com/track/for-my-sins", "fms-01", 240, 3491237466, 150],
  ]
);

assert.ok(!catalog.releases.some((r) => r.id === "renegade-snares" || r.catalogue === "CC030"));
assert.ok(!products["dg-renegade-snares"]);
assert.deepStrictEqual(
  ["artificial-intelligence", "a-ap-forever", "slims-return"].map((id) => {
    const r = catalog.releases.find((x) => x.id === id);
    const t = r.tracks[0];
    return [r.catalogue, r.title, r.artistId, r.released, r.page, r.formats.digital.price, r.formats.digital.sku, r.bandcampUrl, t.id, t.duration, t.bandcampTrackId, products[r.formats.digital.sku].unitAmount];
  }),
  [
    ["CC043", "Artificial Intelligence", "lt-drifta", "2026-10-30", "/artificial-intelligence", 1.5, "dg-artificial-intelligence", "https://ltdrifta.bandcamp.com/track/artificial-intelligence", "ari-01", 243, 1927802715, 150],
    ["CC042", "A$AP FOREVER", "forsberg", "2026-10-30", "/a-ap-forever", 0, "dg-a-ap-forever", "https://forsberg.bandcamp.com/track/a-ap-forever", "aaf-01", 233, 2534897252, 0],
    ["CC041", "Slims' Return (LT's Jungle Edit)", "lt-drifta", "2026-10-29", "/slims-return", 0, "dg-slims-return", "https://ltdrifta.bandcamp.com/track/slims-return-lts-jungle-edit", "slr-01", 268, 1601527236, 0],
  ]
);
const classicJazz = catalog.releases.find((r) => r.id === "classic-jazz");
assert.deepStrictEqual(
  classicJazz.tracks.map((t) => [t.trackNum, t.id, t.title, t.duration, t.bandcampTrackId]),
  [
    [1, "cjz-01", "Naima", 280, 1160879306],
    [2, "cjz-02", "My One and Only Love", 335, 1354942851],
    [3, "cjz-03", "Sentimental Mood", 313, 968788690],
    [4, "cjz-04", "Four", 232, 3543321373],
    [5, "cjz-05", "Colors of You", 249, 2495793093],
    [6, "cjz-07", "Variations In Fall", 305, 2845806792],
    [7, "cjz-06", "Taste Honey", 254, 1897886972],
  ]
);
const champion = catalog.releases.find((r) => r.id === "champion-sound");
assert.strictEqual(champion.released, "2025-12-15");
assert.strictEqual(catalog.releases.find((r) => r.id === "j-adore").formats.digital.price, 3);
assert.strictEqual(products["dg-j-adore"].unitAmount, 300);

const lakeshore = catalog.releases.find((r) => r.id === "ep1");
assert.ok(!lakeshore.bandcampUrl);
assert.deepStrictEqual(
  ["st-germain-rose-rouge", "give-everything", "were-all-mad-here", "02-just-cant-take", "wake-up-mr-mac", "lt-invades-blue-note", "outta-tha-woods", "why-is-my-heart-so-heavy", "carry-me-home"].map((id) => {
    const r = catalog.releases.find((x) => x.id === id);
    const t = r.tracks[0];
    return [r.catalogue, r.title, r.artistId, r.kind, r.released, r.page, r.formats.digital.price, r.formats.digital.sku, r.bandcampUrl, t.id, t.duration, t.bandcampTrackId, products[r.formats.digital.sku].unitAmount];
  }),
  [
    ["CC053", "St Germain - Rose Rouge (Molly's Hazy Edit: Jorja Smith Version)", "archie", "Single", "2026-11-10", "/st-germain-rose-rouge", 1.5, "dg-st-germain-rose-rouge", "https://archie4ever.bandcamp.com/track/st-germain-rose-rouge-mollys-hazy-edit-jorja-smith-version", "srr-01", 238, 3125623343, 150],
    ["CC052", "Give Everything", "archie", "Single", "2026-11-09", "/give-everything", 1.5, "dg-give-everything", "https://archie4ever.bandcamp.com/track/give-everything", "gev-01", 223, 2354268309, 150],
    ["CC051", "We're All Mad Here", "archie", "Single", "2026-11-09", "/were-all-mad-here", 1.5, "dg-were-all-mad-here", "https://archie4ever.bandcamp.com/track/were-all-mad-here", "wamh-01", 282, 63309943, 150],
    ["CC050", "02. Just Can't Take", "lt-drifta", "Single", "2026-11-09", "/02-just-cant-take", 1.5, "dg-02-just-cant-take", "https://ltdrifta.bandcamp.com/track/02-just-cant-take", "jct-01", 209, 1699937414, 150],
    ["CC049", "Wake Up Mr. Mac", "archie", "Single", "2026-11-06", "/wake-up-mr-mac", 1.5, "dg-wake-up-mr-mac", "https://archie4ever.bandcamp.com/track/wake-up-mr-mac", "wum-01", 188, 4002056174, 150],
    ["CC048", "LT Invades Blue Note: Tracks From Shades of Blue", "lt-drifta", "Album", "2026-11-06", "/lt-invades-blue-note", 3, "dg-lt-invades-blue-note", "https://ltdrifta.bandcamp.com/album/lt-invades-blue-note-tracks-from-shades-of-blue", "lbn-01", 292, 108853771, 300],
    ["CC047", "Outta Tha Woods", "archie", "Single", "2026-11-09", "/outta-tha-woods", 1.5, "dg-outta-tha-woods", "https://archie4ever.bandcamp.com/track/outta-tha-woods", "otw-01", 287, 1458289628, 150],
    ["CC046", "Why Is My Heart So Heavy", "lt-drifta", "Single", "2026-11-03", "/why-is-my-heart-so-heavy", 1.5, "dg-why-is-my-heart-so-heavy", "https://ltdrifta.bandcamp.com/track/why-is-my-heart-so-heavy", "wih-01", 257, 2291011584, 150],
    ["CC045", "Anile - Carry Me Home (LT's Bootleg)", "lt-drifta", "Single", "2026-10-31", "/carry-me-home", 0, "dg-carry-me-home", "https://ltdrifta.bandcamp.com/track/anile-carry-me-home-lts-bootleg", "cmh-01", 243, 2056516668, 0],
  ]
);
assert.ok(!catalog.releases.some((r) => r.id === "skin-to-skin" || r.catalogue === "CC044"));
assert.ok(!catalog.releases.some((r) => r.id === "dont-cry" || r.catalogue === "CC036"));
assert.ok(!catalog.releases.some((r) => r.id === "some-kinda-heaven" || r.catalogue === "CC035"));
assert.ok(!products["dg-skin-to-skin"]);
assert.ok(!products["dg-dont-cry"]);
assert.ok(!products["dg-some-kinda-heaven"]);
const madHere = catalog.releases.find((r) => r.id === "were-all-mad-here");
assert.deepStrictEqual(
  [madHere.catalogue, madHere.title, madHere.artistId, madHere.kind, madHere.genre, madHere.released, madHere.page, madHere.formats.digital.price, madHere.formats.digital.sku, madHere.bandcampUrl, madHere.tracks[0].id, madHere.tracks[0].duration, madHere.tracks[0].bandcampTrackId, products[madHere.formats.digital.sku].unitAmount],
  ["CC051", "We're All Mad Here", "archie", "Single", "UK Garage", "2026-11-09", "/were-all-mad-here", 1.5, "dg-were-all-mad-here", "https://archie4ever.bandcamp.com/track/were-all-mad-here", "wamh-01", 282, 63309943, 150]
);
assert.ok(!catalog.releases.some((r) => r.id === "say-it" || r.catalogue === "CC054"));
assert.ok(!products["dg-say-it"]);
assert.deepStrictEqual(
  catalog.releases.filter((r) => r.artistId === "archie").map((r) => r.id),
  ["get-u-now-album", "the-jamz", "call-ur-name-girl", "get-u-now", "st-germain-rose-rouge", "give-everything", "were-all-mad-here", "wake-up-mr-mac", "outta-tha-woods", "ipod-touch", "so-good"]
);
assert.ok(!catalog.releases.some((r) => r.id === "w-h-a-t-s-l-u-v" || r.catalogue === "CC055"));
assert.ok(!products["dg-w-h-a-t-s-l-u-v"]);
const callUrName = catalog.releases.find((r) => r.id === "call-ur-name-girl");
assert.deepStrictEqual(
  [callUrName.catalogue, callUrName.title, callUrName.artistId, callUrName.kind, callUrName.genre, callUrName.released, callUrName.page, callUrName.formats.digital.price, callUrName.formats.digital.sku, callUrName.bandcampUrl, callUrName.tracks[0].id, callUrName.tracks[0].duration, callUrName.tracks[0].bandcampTrackId, products[callUrName.formats.digital.sku].unitAmount],
  ["CC058", "call ur name, girl", "archie", "Single", "UK Garage", "2026-11-13", "/call-ur-name-girl", 1.5, "dg-call-ur-name-girl", "https://archie4ever.bandcamp.com/track/call-ur-name-girl", "cun-01", 219, 2583621297, 150]
);
const getUNow = catalog.releases.find((r) => r.id === "get-u-now");
assert.deepStrictEqual(
  [getUNow.catalogue, getUNow.title, getUNow.artistId, getUNow.kind, getUNow.genre, getUNow.released, getUNow.page, getUNow.formats.digital.price, getUNow.formats.digital.sku, getUNow.bandcampUrl, getUNow.tracks[0].id, getUNow.tracks[0].duration, getUNow.tracks[0].bandcampTrackId, products[getUNow.formats.digital.sku].unitAmount],
  ["CC057", "Get-U-Now", "archie", "Single", "UK Garage", "2026-11-13", "/get-u-now", 1.5, "dg-get-u-now", "https://archie4ever.bandcamp.com/track/get-u-now", "gun-01", 398, 2370203316, 150]
);
const getUNowAlbum = catalog.releases.find((r) => r.id === "get-u-now-album");
assert.deepStrictEqual(
  [getUNowAlbum.catalogue, getUNowAlbum.title, getUNowAlbum.artistId, getUNowAlbum.kind, getUNowAlbum.genre, getUNowAlbum.released, getUNowAlbum.page, getUNowAlbum.formats.digital.price, getUNowAlbum.formats.digital.sku, getUNowAlbum.bandcampUrl, getUNowAlbum.previewTrackId, products[getUNowAlbum.formats.digital.sku].unitAmount],
  ["CC060", "Get-U-Now", "archie", "Album", "UK Garage", "2026-11-14", "/get-u-now-album", 9, "dg-get-u-now-album", "https://archie4ever.bandcamp.com/album/get-u-now", "gua-01", 900]
);
assert.strictEqual(getUNowAlbum.tracksCount, 18);
assert.deepStrictEqual(
  getUNowAlbum.tracks.map((t) => [t.trackNum, t.id, t.title, t.duration, t.bandcampTrackId]),
  [
    [1, "gua-01", "Magic Wand (3AM VIP)", 300, 672118745],
    [2, "gua-02", "give it away", 258, 2946641705],
    [3, "gua-03", "let me love you", 240, 3479914388],
    [4, "gua-04", "say it", 258, 119520965],
    [5, "gua-06", "star-six-nine", 293, 1362201849],
    [6, "gua-07", "Left You", 310, 2865574975],
    [7, "gua-05", "We've Lost", 252, 3325066115],
    [8, "gua-08", "Want You", 291, 2551205977],
    [9, "gua-09", "Together (3AM VIP)", 295, 364822117],
    [10, "gua-10", "Jazz As Weapon", 226, 2115138511],
    [11, "gua-11", "False Teeth", 310, 1637811835],
    [12, "gua-12", "Beatback (3AM VIP)", 346, 1237940034],
    [13, "gua-13", "Get-U-Now", 398, 224979061],
    [14, "gua-14", "The Jamz", 395, 476289388],
    [15, "gua-15", "Far Away", 296, 1981812356],
    [16, "gua-16", "Losing You", 282, 2224722272],
    [17, "gua-17", "call ur name", 219, 3781195589],
    [18, "gua-18", "Interstellar Love", 323, 1589272641],
  ]
);
const lionsGate = catalog.releases.find((r) => r.id === "lions-gate");
assert.deepStrictEqual(
  [lionsGate.catalogue, lionsGate.title, lionsGate.artistId, lionsGate.kind, lionsGate.genre, lionsGate.released, lionsGate.page, lionsGate.formats.digital.price, lionsGate.formats.digital.sku, lionsGate.bandcampUrl, lionsGate.tracks[0].id, lionsGate.tracks[0].duration, lionsGate.tracks[0].bandcampTrackId, products[lionsGate.formats.digital.sku].unitAmount],
  ["CC061", "Lions' Gate", "dw", "Single", "Downtempo", "2026-11-14", "/lions-gate", 1.5, "dg-lions-gate", "https://dw1990.bandcamp.com/track/lions-gate", "lgt-01", 189, 3483021454, 150]
);
const theJamz = catalog.releases.find((r) => r.id === "the-jamz");
assert.deepStrictEqual(
  [theJamz.catalogue, theJamz.title, theJamz.artistId, theJamz.kind, theJamz.genre, theJamz.released, theJamz.page, theJamz.formats.digital.price, theJamz.formats.digital.sku, theJamz.bandcampUrl, theJamz.tracks[0].id, theJamz.tracks[0].duration, theJamz.tracks[0].bandcampTrackId, products[theJamz.formats.digital.sku].unitAmount],
  ["CC059", "The Jamz", "archie", "Single", "UK Garage", "2026-11-13", "/the-jamz", 1.5, "dg-the-jamz", "https://archie4ever.bandcamp.com/track/the-jamz", "jam-01", 395, 970818772, 150]
);
const shades = catalog.releases.find((r) => r.id === "shades-of-blue");
assert.deepStrictEqual(
  [shades.catalogue, shades.title, shades.artistId, shades.kind, shades.genre, shades.released, shades.page, shades.formats.digital.price, shades.formats.digital.sku, shades.bandcampUrl, shades.previewTrackId, products[shades.formats.digital.sku].unitAmount],
  ["CC056", "Shades of Blue", "lt-drifta", "Album", "Drum & Bass", "2026-11-13", "/shades-of-blue", 9, "dg-shades-of-blue", "https://ltdrifta.bandcamp.com/album/shades-of-blue", "sob-01", 900]
);
assert.deepStrictEqual(
  shades.tracks.map((t) => [t.trackNum, t.id, t.title, t.duration, t.bandcampTrackId]),
  [
    [1, "sob-01", "Introduction", 68, 4158361770],
    [2, "sob-02", "Slims' Return", 267, 523244321],
    [3, "sob-03", "Distant Land", 290, 2731681939],
    [4, "sob-04", "Mystic Bounce", 186, 1051335188],
    [5, "sob-05", "Blue Note Interlude", 64, 1922312765],
    [6, "sob-06", "Stormy", 244, 585971643],
    [7, "sob-07", "Please Set Me At Ease", 292, 959348495],
    [8, "sob-08", "Funky Blue Note", 278, 3318419397],
    [9, "sob-09", "Alfred Lion Interlude", 67, 2793477097],
    [10, "sob-10", "Stepping Into Tomorrow", 353, 758632864],
    [11, "sob-11", "Andrew Hill Break", 55, 4013719070],
    [12, "sob-12", "Montara", 312, 95455418],
    [13, "sob-13", "Song For My Father", 286, 346916250],
    [14, "sob-14", "Footprints", 320, 3232317431],
    [15, "sob-15", "Peace/Dolphin Dance", 285, 3784424316],
    [16, "sob-16", "Outro", 60, 2619882535],
  ]
);
const blueNote = catalog.releases.find((r) => r.id === "lt-invades-blue-note");
assert.deepStrictEqual(
  blueNote.tracks.map((t) => [t.trackNum, t.id, t.title, t.duration, t.bandcampTrackId]),
  [
    [1, "lbn-01", "Please Set Me At Ease", 292, 108853771],
    [2, "lbn-02", "Mystic Bounce", 186, 266144003],
  ]
);
assert.ok(!catalog.releases.some((r) => r.id === "any-jungle"));
assert.ok(!catalog.releases.some((r) => r.artistId === "rosco" || r.artist === "Rosco"));
assert.ok(!catalog.artists.some((a) => a.id === "rosco"));

console.log("bandcamp lib ok");
