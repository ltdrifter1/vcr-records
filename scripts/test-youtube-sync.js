const assert = require("assert");
const { mergeVideos } = require("./sync-youtube-videos");

function v(id, published, extra) {
  return Object.assign({ id, published, title: id, url: "https://www.youtube.com/watch?v=" + id, thumbnail: "t", description: "d", views: 1 }, extra);
}

// The channel is under 15 uploads: the feed is the whole public list.
const short = mergeVideos(
  [v("gone", "2026-10-24", { title: "Gone" }), v("stay", "2026-10-24", { title: "Stay", views: 9 })],
  [v("stay", "2026-10-24", { title: "Stay", views: 1 })]
);
assert.deepStrictEqual(short.map((x) => x.id), ["stay"]);
assert.strictEqual(short[0].views, 1);
assert.strictEqual(short[0].title, "Stay");

// A full page keeps videos older than the window, and drops a newer one that left the feed.
const fresh = [];
for (let i = 0; i < 15; i++) fresh.push(v("f" + i, "2026-10-" + String(i + 1).padStart(2, "0"), { title: "F" + i }));
const full = mergeVideos(
  [
    v("archive", "2024-07-09", { title: "Archive" }),
    v("same-day", "2026-10-01", { title: "Same day, just outside" }),
    v("deleted", "2026-10-20", { title: "Deleted" }),
  ].concat(fresh),
  fresh
);
const ids = full.map((x) => x.id);
assert.ok(ids.includes("archive"));
assert.ok(ids.includes("same-day"));
assert.ok(!ids.includes("deleted"));
assert.strictEqual(ids[0], "f14");
assert.strictEqual(full.length, 17);

// Fresh fields win, and the list stays newest-first.
const updated = mergeVideos([v("a", "2026-01-01", { title: "Old title", views: 4 })], [v("a", "2026-02-02", { title: "New title", views: 8 })]);
assert.strictEqual(updated[0].title, "New title");
assert.strictEqual(updated[0].views, 8);
assert.strictEqual(updated[0].published, "2026-02-02");

console.log("youtube sync ok");
