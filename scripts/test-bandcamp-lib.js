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
const gorilla = catalog.releases.find((r) => r.id === "gorilla");
const mixtape = catalog.releases.find((r) => r.id === "mixtape");
assert.strictEqual(gorilla.previewTrackId, "gor-01");
assert.ok(/mollyhaze\.bandcamp\.com/.test(gorilla.bandcampUrl));
assert.strictEqual(mixtape.previewTrackId, "mix-02");
assert.strictEqual(bc.pickCueTrack(gorilla).id, "gor-01");
assert.strictEqual(bc.pickCueTrack(mixtape).id, "mix-02");
assert.strictEqual(bc.pickCueTrack(mixtape, "mix-01").id, "mix-01");

const yal = catalog.releases.find((r) => r.id === "you-are-love");
assert.ok(yal);
assert.strictEqual(yal.status, "Available");
assert.strictEqual(yal.previewTrackId, "yal-01");
assert.ok(/riscape\.bandcamp\.com/.test(yal.bandcampUrl));
assert.strictEqual(yal.formats.digital.sku, "dg-you-are-love");
assert.strictEqual(yal.formats.cassette.backorder, true);
assert.strictEqual(bc.pickCueTrack(yal).id, "yal-01");
assert.strictEqual(yal.tracks[3].title, "Day Like This");
assert.strictEqual(yal.tracks[3].bandcampTrackId, 1221909968);

console.log("bandcamp lib ok");
