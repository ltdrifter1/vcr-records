/**
 * Build data/peaks/<trackId>.json — ~200 normalised peaks — from the audio
 * the site already streams (Bandcamp mp3-128 via the same resolver as
 * /api/bandcamp-stream). A local preview file is the fallback when the
 * stream cannot be fetched. Tracks that yield neither are listed and skipped;
 * the player draws a plain groove when a file is missing.
 *
 *   node scripts/peaks.mjs
 *   node scripts/peaks.mjs ipt-01 sgd-01   # only these track ids
 */
import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const bc = require("../lib/bandcamp.js");

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const catalogPath = path.join(root, "data", "catalog.json");
const outDir = path.join(root, "data", "peaks");
const BARS = 200;
const CONCURRENCY = 3;

function peaksFromPcm(buf) {
  const samples = Math.floor(buf.length / 2);
  if (samples < BARS) return null;
  const per = Math.floor(samples / BARS);
  const peaks = new Array(BARS);
  let max = 0;
  for (let i = 0; i < BARS; i++) {
    let peak = 0;
    const start = i * per;
    for (let j = 0; j < per; j++) {
      const off = (start + j) * 2;
      const v = Math.abs(buf.readInt16LE(off));
      if (v > peak) peak = v;
    }
    peaks[i] = peak;
    if (peak > max) max = peak;
  }
  const norm = max || 1;
  return peaks.map(function (p) {
    return Math.round((p / norm) * 1000) / 1000;
  });
}

function decode(source) {
  return new Promise(function (resolve, reject) {
    const ff = spawn(
      "ffmpeg",
      ["-hide_banner", "-loglevel", "error", "-i", source, "-ac", "1", "-ar", "4000", "-f", "s16le", "pipe:1"],
      { stdio: ["ignore", "pipe", "pipe"] }
    );
    const chunks = [];
    let err = "";
    ff.stdout.on("data", function (c) { chunks.push(c); });
    ff.stderr.on("data", function (c) { err += c.toString(); });
    ff.on("error", reject);
    ff.on("close", function (code) {
      if (code !== 0) reject(new Error((err || "ffmpeg " + code).trim().slice(0, 240)));
      else resolve(Buffer.concat(chunks));
    });
  });
}

async function streamUrl(release, track, catalog) {
  const page = await bc.resolvePageUrl(release, catalog);
  if (!page) throw new Error("no bandcamp page");
  const stream = await bc.resolveStream(page, track);
  if (!stream || !stream.src) throw new Error("no stream");
  return stream.src;
}

async function peaksFor(release, track, catalog) {
  const errors = [];
  try {
    const src = await streamUrl(release, track, catalog);
    const pcm = await decode(src);
    const peaks = peaksFromPcm(pcm);
    if (peaks) return { peaks: peaks, via: "bandcamp" };
    errors.push("bandcamp decode too short");
  } catch (err) {
    errors.push(err && err.message ? err.message : "bandcamp");
  }
  if (track.preview) {
    const file = path.join(root, String(track.preview).replace(/^\//, ""));
    if (fs.existsSync(file)) {
      try {
        const pcm = await decode(file);
        const peaks = peaksFromPcm(pcm);
        if (peaks) return { peaks: peaks, via: "preview-file" };
        errors.push("preview decode too short");
      } catch (err) {
        errors.push(err && err.message ? err.message : "preview");
      }
    }
  }
  const error = new Error(errors.join(" | ") || "no audio");
  error.skipped = true;
  throw error;
}

async function mapPool(items, limit, fn) {
  const out = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const i = cursor++;
      out[i] = await fn(items[i], i);
    }
  }
  const n = Math.min(limit, items.length);
  await Promise.all(Array.from({ length: n }, worker));
  return out;
}

const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
const only = new Set(process.argv.slice(2));
const jobs = [];
(catalog.releases || []).forEach(function (release) {
  (release.tracks || []).forEach(function (track) {
    if (!track || !track.id) return;
    if (only.size && !only.has(track.id) && !only.has(release.id)) return;
    jobs.push({ release: release, track: track });
  });
});

fs.mkdirSync(outDir, { recursive: true });

const skipped = [];
const written = [];

await mapPool(jobs, CONCURRENCY, async function (job) {
  const id = job.track.id;
  try {
    const result = await peaksFor(job.release, job.track, catalog);
    const file = path.join(outDir, id + ".json");
    fs.writeFileSync(file, JSON.stringify({ id: id, peaks: result.peaks }) + "\n");
    written.push(id + " (" + result.via + ")");
    console.log("ok", id, result.via);
  } catch (err) {
    skipped.push({ id: id, release: job.release.id, error: err.message });
    console.error("skip", id, err.message);
  }
});

console.log("\nWrote " + written.length + " / " + jobs.length);
if (skipped.length) {
  console.log("Skipped:");
  skipped.forEach(function (row) {
    console.log(" - " + row.id + " (" + row.release + "): " + row.error);
  });
  fs.writeFileSync(path.join(outDir, "_skipped.json"), JSON.stringify(skipped, null, 2) + "\n");
}
