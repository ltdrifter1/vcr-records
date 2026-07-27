/**
 * One-shot visual QA for the v7 room: loading gate, explore view, and each
 * hotspot lookto (with hover glow). Writes PNGs to .shots/v7/.
 * Run: node scripts/shoot-v7.mjs  (needs `npm run start` on :3000 + playwright)
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const OUT = '.shots/v7';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
page.on('console', (m) => {
  if (m.type() === 'error') console.log('CONSOLE', m.text());
});
// Deterministic shots in headless: intro / looktos snap instead of tweening.
await page.emulateMedia({ reducedMotion: 'reduce' });

await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
await page.waitForSelector('.gate-enter:not([disabled])', { timeout: 60000 });
await page.waitForTimeout(600);
await page.screenshot({ path: `${OUT}/01-loading-gate.png` });
console.log('gate ready');

await page.click('.gate-enter');
await page.waitForSelector('.stage.can-look', { timeout: 60000 });
await page.waitForTimeout(1500);
await page.screenshot({ path: `${OUT}/02-explore.png` });
console.log('explore ready');

const sections = ['music', 'videos', 'artists', 'shop', 'contact'];
for (const [i, hash] of sections.entries()) {
  await page.evaluate((h) => {
    window.location.hash = h;
  }, hash);
  await page.waitForTimeout(2600);
  await page.screenshot({ path: `${OUT}/0${i + 3}-${hash}.png` });
  console.log('shot', hash);
}

await browser.close();
console.log('done');
