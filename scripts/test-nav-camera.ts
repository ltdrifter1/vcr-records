/**
 * Camera / viewport math checks for the unified navigation engine.
 * Run: npx tsx scripts/test-nav-camera.ts
 */
import assert from 'node:assert/strict';

import {
  DESIGN_ASPECT,
  adaptMfovToViewport,
  easeInOutQuart,
  horizontalFovToMfov,
  resolveLookMfov,
  yawDelta,
} from '../lib/navigation';
import { mfovToHorizontalFov } from '../lib/pano';

const phone = {
  width: 390,
  height: 844,
  aspect: 390 / 844,
  dpr: 3,
  offsetTop: 0,
  offsetLeft: 0,
  safeTop: 47,
  safeRight: 0,
  safeBottom: 34,
  safeLeft: 0,
  safeMarginX: 0.08,
  safeMarginY: 0.18,
};

const desktop = {
  width: 1440,
  height: 900,
  aspect: 1440 / 900,
  dpr: 2,
  offsetTop: 0,
  offsetLeft: 0,
  safeTop: 0,
  safeRight: 0,
  safeBottom: 0,
  safeLeft: 0,
  safeMarginX: 0.1,
  safeMarginY: 0.12,
};

// 1) Aspect adapt preserves design HFOV
{
  const design = 20;
  const adaptedPhone = adaptMfovToViewport(design, phone.aspect);
  const phoneHfov = mfovToHorizontalFov(adaptedPhone, phone.aspect);
  const designHfov = mfovToHorizontalFov(design, DESIGN_ASPECT);
  assert.ok(
    Math.abs(phoneHfov - designHfov) < 0.5,
    `phone HFOV ${phoneHfov} should ≈ design ${designHfov}`,
  );
  assert.ok(
    adaptedPhone > design + 10,
    `phone MFOV ${adaptedPhone} must be wider than raw ${design} (was over-zooming)`,
  );
  console.log('✓ adaptMfovToViewport preserves HFOV; phone no longer over-zooms');
}

// 2) CRT lookto: desktop keeps authored 20; phone widens
{
  const crt = { w: 4.5, h: 4.2, lookFov: 20 };
  const desk = resolveLookMfov(crt, desktop);
  const mob = resolveLookMfov(crt, phone);
  assert.equal(desk, 20, `desktop CRT should stay authored 20, got ${desk}`);
  assert.ok(mob > desk, `mobile CRT mfov ${mob} should be > desktop ${desk}`);
  assert.ok(mob >= 35 && mob <= 55, `mobile CRT mfov ${mob} in BT-like 40 band`);
  console.log(`✓ CRT lookto desktop=${desk.toFixed(1)} mobile=${mob.toFixed(1)}`);
}

// 3) Music booth: desktop authored 60; phone adapted
{
  const music = { w: 6, h: 9, lookFov: 60 };
  const desk = resolveLookMfov(music, desktop);
  const mob = resolveLookMfov(music, phone);
  assert.equal(desk, 60);
  assert.ok(mob > 60, `mobile music mfov ${mob} should widen past 60`);
  console.log(`✓ music lookto desktop=${desk.toFixed(1)} mobile=${mob.toFixed(1)}`);
}

// 4) horizontalFovToMfov inverse
{
  for (const aspect of [16 / 9, 4 / 3, 390 / 844, 1]) {
    const mfov = 90;
    const h = mfovToHorizontalFov(mfov, aspect);
    const back = horizontalFovToMfov(h, aspect);
    assert.ok(Math.abs(back - mfov) < 0.25, `inverse fail aspect=${aspect}: ${back} vs ${mfov}`);
  }
  console.log('✓ horizontalFovToMfov ↔ mfovToHorizontalFov');
}

// 5) yaw shortest path + easing bounds
{
  assert.ok(Math.abs(yawDelta(0, Math.PI * 0.5) - Math.PI * 0.5) < 1e-9);
  assert.ok(yawDelta(0.1, -0.1) < 0);
  assert.equal(easeInOutQuart(0), 0);
  assert.equal(easeInOutQuart(1), 1);
  assert.ok(easeInOutQuart(0.5) > 0.4 && easeInOutQuart(0.5) < 0.6);
  console.log('✓ yawDelta + easeInOutQuart');
}

console.log('\nAll nav camera checks passed.');
