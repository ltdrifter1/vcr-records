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
assert.ok(!catalog.releases.some((r) => r.id === "l-t-drifta"));
assert.deepStrictEqual(
  catalog.releases.filter((r) => r.artistId === "lt-drifta").map((r) => r.id).sort(),
  ["champion-sound", "classic-jazz", "ep1", "summer-madness", "three-4-zone"]
);
assert.deepStrictEqual(
  catalog.releases.filter((r) => r.artistId === "lt-drifta").map((r) => r.id).sort(),
  ["champion-sound", "classic-jazz", "ep1", "summer-madness", "three-4-zone"]
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
assert.ok(/rainiershouse\.bandcamp\.com/.test(jadore.bandcampUrl));
assert.deepStrictEqual(
  catalog.releases.filter((r) => r.artistId === "forsberg").map((r) => r.id),
  ["pitch-black", "try-to-love-again", "run-it-back", "please-wait", "j-adore"]
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
assert.strictEqual(lakeshore.bandcampUrl, "https://ltdrifta.bandcamp.com/album/lakeshore-west-23-55");
assert.ok(!catalog.releases.some((r) => r.id === "any-jungle"));
assert.ok(!catalog.releases.some((r) => r.artistId === "rosco" || r.artist === "Rosco"));
assert.ok(!catalog.artists.some((a) => a.id === "rosco"));

console.log("bandcamp lib ok");
