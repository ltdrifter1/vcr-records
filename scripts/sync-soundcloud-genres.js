#!/usr/bin/env node
/**
 * Snapshot SoundCloud's own genre + tags for every mix into data/mix-genres.json.
 * The site shows them under each mix (js/tapes.js). The RSS feed does not carry them, so this
 * reads each track page; run it whenever mixes are added or retagged on SoundCloud.
 *
 * Usage: node scripts/sync-soundcloud-genres.js
 *
 * A mix whose page can't be read keeps its previous tags. The summary says how many mixes
 * came back with tags, so a blocked or changed page shows up as "0 tagged", not silence.
 */
const fs = require("fs");
const path = require("path");
const sc = require("../lib/soundcloud");

const DEST = path.join(process.cwd(), "data", "mix-genres.json");
const MAX_TAGS = 6;
const PAUSE_MS = 400;

function readPrevious() {
  try {
    return JSON.parse(fs.readFileSync(DEST, "utf8")).tags || {};
  } catch (e) {
    return {};
  }
}

function sleep(ms) {
  return new Promise(function (r) {
    setTimeout(r, ms);
  });
}

async function main() {
  const feed = await sc.fetchFeed();
  const previous = readPrevious();
  const tags = {};
  let tagged = 0;
  let empty = 0;
  let failed = 0;

  for (const tape of feed.tapes) {
    try {
      const found = (await sc.fetchTrackTags(tape.permalink, tape.soundcloudId)).slice(0, MAX_TAGS);
      if (found.length) {
        tags[tape.id] = found;
        tagged++;
      } else {
        empty++;
        if (previous[tape.id]) tags[tape.id] = previous[tape.id];
      }
    } catch (err) {
      failed++;
      if (previous[tape.id]) tags[tape.id] = previous[tape.id];
      process.stderr.write("  " + tape.title + ": " + err.message + "\n");
    }
    await sleep(PAUSE_MS);
  }

  const body = { source: "soundcloud-track-pages", handle: sc.HANDLE, fetchedAt: new Date().toISOString(), tags: tags };
  fs.writeFileSync(DEST, JSON.stringify(body, null, 2) + "\n");
  process.stdout.write(
    "Mixes: " + feed.tapes.length + " · with tags: " + tagged + " · no tags on SoundCloud (or page unreadable): " + empty + " · fetch errors: " + failed + "\n" +
    "Wrote " + DEST + "\n"
  );
  if (feed.tapes.length && !tagged) {
    process.stderr.write("No tags were read. Either none of the mixes are tagged on SoundCloud, or the page markup has changed.\n");
    process.exit(2);
  }
}

main().catch(function (err) {
  process.stderr.write(String(err && err.stack ? err.stack : err) + "\n");
  process.exit(1);
});
