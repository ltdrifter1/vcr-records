/**
 * Camera / viewport / navigation interaction checks.
 * Run: npx tsx scripts/test-nav-camera.ts
 */
import assert from 'node:assert/strict';

import {
  DESIGN_ASPECT,
  adaptMfovToViewport,
  createControls,
  createNavState,
  createNavigationController,
  easeInOutQuart,
  frontLookTarget,
  horizontalFovToMfov,
  resolveLookMfov,
  yawDelta,
} from '../lib/navigation';
import { MFOV_EXPLORE, mfovToHorizontalFov } from '../lib/pano';

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

// 3) Music booth: desktop authored 95 (room view); phone adapted wider
{
  const music = { w: 6, h: 9, lookFov: 95 };
  const desk = resolveLookMfov(music, desktop);
  const mob = resolveLookMfov(music, phone);
  assert.equal(desk, 95);
  assert.ok(mob > 95, `mobile music mfov ${mob} should widen past 95`);
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

// 6) Soft close keeps camera pose (BT BACK) — no front snap
{
  const controls = createControls({
    lookTarget: { x: 0.4, y: -0.1 },
    mfov: 45,
    userControl: true,
    followFactor: 0,
  });
  const navState = createNavState();
  let active: string | null = 'listening-booth';
  let focused: string | null = 'listening-booth';
  navState.activeId = 'listening-booth';
  navState.focusedId = 'listening-booth';
  navState.panelOpen = true;

  const nav = createNavigationController(controls, navState, {
    onActiveChange: (id) => {
      active = id;
    },
    onFocusedChange: (id) => {
      focused = id;
    },
    reduceMotion: true,
  });
  nav.setLookEnabled(true);

  const yawBefore = controls.lookTarget.x;
  const pitchBefore = controls.lookTarget.y;
  const mfovBefore = controls.mfov;
  nav.close({ force: true, silent: true });

  assert.equal(active, null);
  assert.equal(focused, null);
  assert.equal(navState.panelOpen, false);
  assert.equal(controls.lookTarget.x, yawBefore, 'soft close must keep yaw');
  assert.equal(controls.lookTarget.y, pitchBefore, 'soft close must keep pitch');
  assert.equal(controls.mfov, mfovBefore, 'soft close must keep mfov');
  console.log('✓ soft close clears HUD without moving the camera');
}

// 7) CRT resetToFront snaps to explore front (BT video drag)
{
  const controls = createControls({
    lookTarget: { x: 0.9, y: 0.2 },
    mfov: 28,
    userControl: true,
  });
  const navState = createNavState();
  navState.activeId = 'crt-tv';
  navState.focusedId = 'crt-tv';
  navState.panelOpen = true;

  const nav = createNavigationController(controls, navState, {
    onActiveChange: () => {},
    onFocusedChange: () => {},
    reduceMotion: true,
  });
  nav.setLookEnabled(true);
  nav.resetToFront({ silent: true });

  const front = frontLookTarget();
  assert.equal(navState.focusedId, null);
  assert.ok(Math.abs(controls.lookTarget.x - front.yaw) < 1e-9);
  assert.ok(Math.abs(controls.lookTarget.y - front.pitch) < 1e-9);
  assert.equal(controls.mfov, MFOV_EXPLORE);
  console.log('✓ resetToFront restores explore front framing');
}

// 8) reframeFocused only changes MFOV
{
  const controls = createControls({
    lookTarget: { x: 0.33, y: 0.05 },
    mfov: 20,
    userControl: true,
  });
  const navState = createNavState();
  navState.activeId = 'crt-tv';
  navState.focusedId = 'crt-tv';
  navState.panelOpen = true;

  const nav = createNavigationController(controls, navState, {
    onActiveChange: () => {},
    onFocusedChange: () => {},
    reduceMotion: true,
  });
  nav.setLookEnabled(true);

  const yawBefore = controls.lookTarget.x;
  const pitchBefore = controls.lookTarget.y;
  nav.reframeFocused(phone);
  assert.equal(controls.lookTarget.x, yawBefore);
  assert.equal(controls.lookTarget.y, pitchBefore);
  assert.ok(controls.mfov > 20, `reframe should widen CRT mfov on phone, got ${controls.mfov}`);
  console.log(`✓ reframeFocused adapts mfov→${controls.mfov.toFixed(1)} without re-aiming`);
}

console.log('\nAll nav camera checks passed.');
