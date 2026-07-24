#!/usr/bin/env node
/**
 * Surgical door-wall declutter for store panos.
 * Removes Green Day / NOFX / De La Soul / Rancid / ALL AGES near the
 * payphone + Employees Only door. Keeps phone, label, and Archive posters
 * (Offspring / Bad Religion / LIVE) to the right.
 *
 * Usage: node scripts/declutter-door-wall.mjs
 * Edits:
 *   public/textures/store_pano_v3.webp
 *   public/textures/store_pano_off_v3.webp
 *   public/textures/store_pano_lqip_v3.webp
 */
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(import.meta.dirname, '..');
const ON = path.join(ROOT, 'public/textures/store_pano_v3.webp');
const OFF = path.join(ROOT, 'public/textures/store_pano_off_v3.webp');
const LQIP = path.join(ROOT, 'public/textures/store_pano_lqip_v3.webp');

const WALL_ON = { r: 250, g: 208, b: 92 };
const REGIONS = [
  [1960, 365, 2160, 780], // Green Day + NOFX
  [2125, 365, 2298, 598], // De La Soul
  [2155, 565, 2355, 840], // Rancid
  [2155, 790, 2285, 860], // ALL AGES
];
const FEATHER = 12;
const PHONE_BOX = { left: 1965, top: 780, right: 2165, bottom: 940 };

function inRect(x, y, r) {
  return x >= r[0] && x < r[2] && y >= r[1] && y < r[3];
}
function edgeDist(x, y, r) {
  return Math.min(x - r[0], r[2] - 1 - x, y - r[1], r[3] - 1 - y);
}
function coverage(x, y) {
  let best = -1;
  for (const r of REGIONS) {
    if (!inRect(x, y, r)) continue;
    best = Math.max(best, edgeDist(x, y, r));
  }
  if (best < 0) return 0;
  if (best >= FEATHER) return 1;
  const t = best / FEATHER;
  return t * t * (3 - 2 * t);
}
function inPhoneBox(x, y) {
  return x >= PHONE_BOX.left && x < PHONE_BOX.right && y >= PHONE_BOX.top && y < PHONE_BOX.bottom;
}
function isPhoneRed(r, g, b) {
  return r > 130 && g < 110 && b < 100 && r > g + 50 && r > b + 50;
}
function isPhoneLabel(r, g, b) {
  return r > 200 && g > 190 && b > 170;
}
function isPhoneOff(r, g, b) {
  return r > 18 && r < 100 && r >= g + 4 && r >= b && g < 55 && b < 55;
}

async function sampleOffWall() {
  const { data, info } = await sharp(OFF)
    .extract({ left: 2172, top: 450, width: 14, height: 14 })
    .raw()
    .toBuffer({ resolveWithObject: true });
  let r = 0, g = 0, b = 0, n = 0;
  for (let i = 0; i < data.length; i += info.channels) {
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
    n++;
  }
  return { r: Math.round(r / n), g: Math.round(g / n), b: Math.round(b / n) };
}

async function applyMask(srcPath, outPath, wall, seed, lightsOn) {
  const meta = await sharp(srcPath).metadata();
  const W = meta.width;
  const { data, info } = await sharp(srcPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const ch = info.channels;
  const out = Buffer.from(data);
  let s = seed;
  const rand = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
  let painted = 0;
  let skipped = 0;
  for (let y = 360; y < 870; y++) {
    for (let x = 1955; x < 2365; x++) {
      const a = coverage(x, y);
      if (a <= 0) continue;
      const i = (y * W + x) * ch;
      const pr = data[i];
      const pg = data[i + 1];
      const pb = data[i + 2];
      if (inPhoneBox(x, y)) {
        const phoneHit = lightsOn
          ? isPhoneRed(pr, pg, pb) || isPhoneLabel(pr, pg, pb)
          : isPhoneOff(pr, pg, pb) || (pr > 40 && pg > 40 && pb > 35 && pr < 120);
        if (phoneHit) {
          skipped++;
          continue;
        }
      }
      const n = (rand() - 0.5) * 7 + (rand() - 0.5) * 3;
      const wr = Math.max(0, Math.min(255, wall.r + n));
      const wg = Math.max(0, Math.min(255, wall.g + n * 0.9));
      const wb = Math.max(0, Math.min(255, wall.b + n * 0.55));
      out[i] = Math.round(pr * (1 - a) + wr * a);
      out[i + 1] = Math.round(pg * (1 - a) + wg * a);
      out[i + 2] = Math.round(pb * (1 - a) + wb * a);
      painted++;
    }
  }
  await sharp(out, { raw: { width: W, height: meta.height, channels: ch } })
    .webp({ quality: 91 })
    .toFile(outPath);
  return { painted, skipped };
}

async function main() {
  // Work from clean copies — caller should restore textures first if re-running.
  const tmpOn = path.join(ROOT, 'public/textures/.declutter_on_src.webp');
  const tmpOff = path.join(ROOT, 'public/textures/.declutter_off_src.webp');
  fs.copyFileSync(ON, tmpOn);
  fs.copyFileSync(OFF, tmpOff);

  const wallOff = await sampleOffWall();
  console.log('wall on', WALL_ON, 'off', wallOff);
  console.log('on', await applyMask(tmpOn, ON, WALL_ON, 0xd01, true));
  console.log('off', await applyMask(tmpOff, OFF, wallOff, 0xd02, false));

  await sharp(ON)
    .resize(512, null, { kernel: 'lanczos3' })
    .blur(1.15)
    .webp({ quality: 40 })
    .toFile(LQIP);

  fs.unlinkSync(tmpOn);
  fs.unlinkSync(tmpOff);
  console.log('updated on / off / lqip');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
