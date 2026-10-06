const assert = require("assert");
const sc = require("../lib/soundcloud");

const xml = `<?xml version="1.0"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <atom:link href="https://feeds.soundcloud.com/users/soundcloud:users:1733974502/sounds.rss?before=1" rel="next" type="application/rss+xml"/>
    <item>
      <guid isPermaLink="false">tag:soundcloud,2010:tracks/2408664969</guid>
      <title>Volume 6</title>
      <pubDate>Sun, 27 Sep 2026 16:25:37 +0000</pubDate>
      <link>https://soundcloud.com/ltdrifta/volume-6-6</link>
      <itunes:duration>02:26:06</itunes:duration>
      <itunes:author>L.T. Drifta</itunes:author>
      <itunes:summary>Volumes 1-6</itunes:summary>
      <description>Volumes 1-6</description>
      <enclosure type="audio/mpeg" url="https://feeds.soundcloud.com/stream/2408664969-ltdrifta-volume-6-6.mp3" length="1"/>
      <itunes:image href="https://i1.sndcdn.com/artworks-Ax2gzzE8JzZLx4XL-zCk7Yw-t3000x3000.jpg"/>
    </item>
  </channel>
</rss>`;

const parsed = sc.parseRss(xml);
assert.strictEqual(parsed.items.length, 1);
assert.strictEqual(parsed.items[0].title, "Volume 6");
assert.strictEqual(parsed.items[0].id, "sc-2408664969");
assert.strictEqual(parsed.items[0].soundcloudId, "2408664969");
assert.strictEqual(parsed.items[0].dj, "L.T. Drifta");
assert.strictEqual(parsed.items[0].year, "2026");
assert.strictEqual(parsed.items[0].runtime, "2:26:06");
assert.strictEqual(sc.formatRuntime("00:59:50"), "59:50");
assert.strictEqual(sc.formatRuntime("01:00:20"), "1:00:20");
assert.strictEqual(parsed.items[0].dek, "Volumes 1-6");
assert.strictEqual(
  parsed.items[0].permalink,
  "https://soundcloud.com/ltdrifta/volume-6-6"
);
assert.ok(parsed.items[0].cover.indexOf("t500x500") !== -1);
assert.ok(/before=1/.test(parsed.next));
assert.strictEqual(sc.HANDLE, "ltdrifta");
assert.ok(sc.PROFILE_URL.indexOf("ltdrifta") !== -1);

// Track-page tags. SYNTHETIC fixture built from SoundCloud's documented `tag_list` format
// (space separated, multi-word tags in double quotes) and the `__sc_hydration` block the site
// embeds. It proves the parsing, not that live pages still look like this.
assert.deepStrictEqual(sc.splitTagList('house "deep house" chill  "uk garage"'), ["house", "deep house", "chill", "uk garage"]);
assert.deepStrictEqual(sc.splitTagList(""), []);
const page = (data) =>
  "<html><script>window.__sc_hydration = " +
  JSON.stringify([{ hydratable: "anonymousId", data: "x" }, { hydratable: "sound", data }]) +
  ";</script></html>";
assert.deepStrictEqual(
  sc.parseTrackPage(page({ id: 2408664969, genre: "House", tag_list: 'deep "Deep House" chill house' }), "2408664969"),
  ["House", "deep", "Deep House", "chill"]
);
assert.deepStrictEqual(sc.parseTrackPage(page({ id: 1, genre: "", tag_list: "" }), "1"), []);
assert.deepStrictEqual(sc.parseTrackPage(page({ id: 5, genre: "House", tag_list: "x" }), "6"), [], "wrong track gives no tags");
assert.deepStrictEqual(sc.parseTrackPage("<html>consent wall</html>", "1"), [], "no hydration block gives no tags");
assert.deepStrictEqual(sc.parseTrackPage("window.__sc_hydration = [nope</script>", "1"), [], "bad JSON gives no tags");
assert.ok(
  sc.parseTrackPage(page({ id: 1, genre: "x", tag_list: "a".repeat(40) + " ok" }), "1").indexOf("ok") !== -1 &&
    sc.parseTrackPage(page({ id: 1, genre: "x", tag_list: "a".repeat(40) + " ok" }), "1").length === 2,
  "over-long tags (sentences) are dropped"
);

console.log("ok");
