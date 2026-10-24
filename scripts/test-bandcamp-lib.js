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
assert.ok(!catalog.releases.some((r) => r.id === "l-t-drifta"));
assert.deepStrictEqual(
  catalog.releases.filter((r) => r.artistId === "lt-drifta").map((r) => r.id).sort(),
  ["champion-sound", "classic-jazz", "ep1", "get-me-down", "if-ya-want", "links", "renegade-snares", "shaolin-style", "summer-madness", "three-4-zone"]
);
assert.deepStrictEqual(
  catalog.releases.filter((r) => r.artistId === "lt-drifta").map((r) => r.id).sort(),
  ["champion-sound", "classic-jazz", "ep1", "get-me-down", "if-ya-want", "links", "renegade-snares", "shaolin-style", "summer-madness", "three-4-zone"]
);
assert.deepStrictEqual(
  ["renegade-snares", "if-ya-want", "get-me-down"].map((id) => {
    const r = catalog.releases.find((x) => x.id === id);
    const t = r.tracks[0];
    return [r.catalogue, r.title, r.artist, r.released, r.formats.digital.sku, r.bandcampUrl, t.id, t.duration, t.bandcampTrackId, products[r.formats.digital.sku].unitAmount];
  }),
  [
    ["CC023", "Omni Trio - Renegade Snares (L.T.'s VIP Mix)", "L.T. Drifta", "2026-10-23", "dg-renegade-snares", "https://ltdrifta.bandcamp.com/track/omni-trio-renegade-snares-l-t-s-vip-mix", "rns-01", 288, 1492829470, 150],
    ["CC021", "If Ya Want", "L.T. Drifta", "2026-10-21", "dg-if-ya-want", "https://ltdrifta.bandcamp.com/track/if-ya-want", "iyw-01", 501, 3952714305, 150],
    ["CC020", "Nia Archives - Get Me Down (Molly's Hazy Jungle Edit)", "L.T. Drifta", "2026-10-19", "dg-get-me-down", "https://ltdrifta.bandcamp.com/track/nia-archives-get-me-down-mollys-hazy-jungle-edit", "gmd-01", 324, 2636373644, 150],
  ]
);
assert.deepStrictEqual(
  ["freed-from", "shaolin-style", "whats-luv", "lifetime", "call-anytime", "links"].map((id) => {
    const r = catalog.releases.find((x) => x.id === id);
    const t = r.tracks[0];
    return [r.catalogue, r.title, r.artistId, r.kind, r.released, r.page, r.previewTrackId, r.formats.digital.price, r.formats.digital.sku, r.bandcampUrl, t.id, t.duration, t.bandcampTrackId, products[r.formats.digital.sku].unitAmount];
  }),
  [
    ["CC029", "Freed From (Nanana)", "forsberg", "Single", "2026-10-24", "/freed-from", "ffn-01", 1.5, "dg-freed-from", "https://forsberg.bandcamp.com/track/freed-from-nanana", "ffn-01", 185, 3202179835, 150],
    ["CC028", "Lavery - Shaolin Style (L.T.'s VIP Mix)", "lt-drifta", "Single", "2026-10-24", "/shaolin-style", "ssl-01", 1.5, "dg-shaolin-style", "https://ltdrifta.bandcamp.com/track/lavery-shaolin-style-l-t-s-vip-mix", "ssl-01", 278, 717888588, 150],
    ["CC027", "w h a t ' s   l u v", "forsberg", "Single", "2026-10-24", "/whats-luv", "wlv-01", 1.5, "dg-whats-luv", "https://forsberg.bandcamp.com/track/w-h-a-t-s-l-u-v", "wlv-01", 218, 314453665, 150],
    ["CC026", "l i f e t i m e", "forsberg", "Single", "2026-10-24", "/lifetime", "lft-01", 1.5, "dg-lifetime", "https://forsberg.bandcamp.com/track/l-i-f-e-t-i-m-e", "lft-01", 288, 2823529420, 150],
    ["CC025", "call anytime", "forsberg", "Single", "2026-10-23", "/call-anytime", "cal-01", 1.5, "dg-call-anytime", "https://forsberg.bandcamp.com/track/call-anytime", "cal-01", 237, 3110656434, 150],
    ["CC024", "The Chameleon - Links (L.T.'s VIP Mix)", "lt-drifta", "Single", "2026-10-23", "/links", "lnk-01", 1.5, "dg-links", "https://ltdrifta.bandcamp.com/track/the-chameleon-links-l-t-s-vip-mix", "lnk-01", 297, 414441591, 150],
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
assert.strictEqual(pleaseWait.title, "Please Wait");
assert.strictEqual(pleaseWait.kind, "Single");
assert.strictEqual(pleaseWait.released, "2026-10-17");
assert.strictEqual(pleaseWait.page, "/please-wait");
assert.strictEqual(pleaseWait.previewTrackId, "pw-01");
assert.strictEqual(pleaseWait.formats.digital.sku, "dg-please-wait");
assert.strictEqual(pleaseWait.formats.digital.price, 1.5);
assert.ok(/forsberg\.bandcamp\.com\/track\/please-wait/.test(pleaseWait.bandcampUrl));
assert.deepStrictEqual(
  pleaseWait.tracks.map((t) => [t.title, t.duration, t.bandcampTrackId]),
  [["Please Wait", 330, 1737504659]]
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
    "freed-from",
    "whats-luv",
    "lifetime",
    "call-anytime",
    "i-give-everything",
    "safe-as",
    "deeper",
    "outta-this-mess",
    "rose-rouge-edit",
    "pitch-black",
    "try-to-love-again",
    "run-it-back",
    "please-wait",
    "j-adore",
  ]
);
assert.deepStrictEqual(
  ["i-give-everything", "safe-as", "deeper", "outta-this-mess", "rose-rouge-edit"].map((id) => {
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
    ["CC022", "The Avalanches - I Give Everything I Have 2 U (ft. Loaded Honey) (Forsberg Refix)", "forsberg", "Single", "2026-10-23", "/i-give-everything", "ige-01", 1.5, "dg-i-give-everything", "https://forsberg.bandcamp.com/track/the-avalanches-i-give-everything-i-have-2-u-ft-loaded-honey-forsberg-refix", "ige-01", 165, 911399412, 150],
    ["CC018", "Safe As", "forsberg", "Single", "2026-10-20", "/safe-as", "sa-01", 1.5, "dg-safe-as", "https://forsberg.bandcamp.com/track/safe-as", "sa-01", 308, 2065763897, 150],
    ["CC017", "Deeper", "forsberg", "Single", "2026-10-19", "/deeper", "dee-01", 1.5, "dg-deeper", "https://forsberg.bandcamp.com/track/deeper", "dee-01", 330, 1922921065, 150],
    ["CC016", "Outta This Mess", "forsberg", "Single", "2026-10-18", "/outta-this-mess", "otm-01", 1.5, "dg-outta-this-mess", "https://forsberg.bandcamp.com/track/outta-this-mess", "otm-01", 300, 675523114, 150],
    ["CC015", "Rose Rouge - St Germain (Molly's Hazy Edit) Jorja Smith Version", "forsberg", "Single", "2026-10-18", "/rose-rouge-edit", "rre-01", 1.5, "dg-rose-rouge-edit", "https://forsberg.bandcamp.com/track/rose-rouge-st-germain-mollys-hazy-edit-jorja-smith-version", "rre-01", 237, 4069133099, 150],
  ]
);

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
assert.strictEqual(tryToLoveAgain.title, "Try To Love Again");
assert.strictEqual(tryToLoveAgain.kind, "Single");
assert.strictEqual(tryToLoveAgain.released, "2026-10-18");
assert.strictEqual(tryToLoveAgain.page, "/try-to-love-again");
assert.strictEqual(tryToLoveAgain.previewTrackId, "ttla-01");
assert.strictEqual(tryToLoveAgain.formats.digital.sku, "dg-try-to-love-again");
assert.strictEqual(tryToLoveAgain.formats.digital.price, 1.5);
assert.strictEqual(tryToLoveAgain.bandcampUrl, "https://forsberg.bandcamp.com/track/try-to-love-again");
assert.deepStrictEqual(
  tryToLoveAgain.tracks.map((t) => [t.id, t.title, t.duration, t.bandcampTrackId]),
  [["ttla-01", "Try To Love Again", 360, 898873433]]
);
assert.strictEqual(products["dg-try-to-love-again"].unitAmount, 150);
assert.strictEqual(bc.pickCueTrack(tryToLoveAgain).id, "ttla-01");

const runItBack = catalog.releases.find((r) => r.id === "run-it-back");
assert.ok(runItBack);
assert.strictEqual(runItBack.artist, "Forsberg");
assert.strictEqual(runItBack.artistId, "forsberg");
assert.strictEqual(runItBack.catalogue, "CC011");
assert.strictEqual(runItBack.title, "Run It Back");
assert.strictEqual(runItBack.kind, "Single");
assert.strictEqual(runItBack.released, "2026-10-18");
assert.strictEqual(runItBack.page, "/run-it-back");
assert.strictEqual(runItBack.previewTrackId, "rib-01");
assert.strictEqual(runItBack.formats.digital.sku, "dg-run-it-back");
assert.strictEqual(runItBack.formats.digital.price, 1.5);
assert.strictEqual(runItBack.bandcampUrl, "https://forsberg.bandcamp.com/track/run-it-back");
assert.deepStrictEqual(
  runItBack.tracks.map((t) => [t.id, t.title, t.duration, t.bandcampTrackId]),
  [["rib-01", "Run It Back", 150, 2830265795]]
);
assert.strictEqual(products["dg-run-it-back"].unitAmount, 150);
assert.strictEqual(bc.pickCueTrack(runItBack).id, "rib-01");

const three4Zone = catalog.releases.find((r) => r.id === "three-4-zone");
assert.ok(three4Zone);
assert.strictEqual(three4Zone.artist, "L.T. Drifta");
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
const lakeshore = catalog.releases.find((r) => r.id === "ep1");
assert.ok(!lakeshore.bandcampUrl);
assert.ok(!catalog.releases.some((r) => r.id === "any-jungle"));
assert.ok(!catalog.releases.some((r) => r.artistId === "rosco" || r.artist === "Rosco"));
assert.ok(!catalog.artists.some((a) => a.id === "rosco"));

console.log("bandcamp lib ok");
