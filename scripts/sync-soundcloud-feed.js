#!/usr/bin/env node
/**
 * Snapshot SoundCloud mixtapes into data/mixtapes.json
 * Usage: node scripts/sync-soundcloud-feed.js
 */
const fs = require("fs");
const path = require("path");
const sc = require("../lib/soundcloud");

async function main() {
  const body = await sc.fetchFeed();
  body.desk = "mixtapes";
  const dest = path.join(process.cwd(), "data", "mixtapes.json");
  fs.writeFileSync(dest, JSON.stringify(body, null, 2) + "\n");
  process.stdout.write("Wrote " + body.tapes.length + " mixes to " + dest + "\n");
}

main().catch(function (err) {
  process.stderr.write(String(err && err.stack ? err.stack : err) + "\n");
  process.exit(1);
});
