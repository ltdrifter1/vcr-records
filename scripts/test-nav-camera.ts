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
import { MFOV_EXPLORE, mfovToHorizontalFov, uToYaw, uvToSpherical, vToPitch } from '../lib/pano';

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

// 2) CRT watch mode: desktop authored 22 (BT ~20); phone widens toward ~40
{
  const crt = { w: 4.5, h: 4.2, lookFov: 22 };
  const desk = resolveLookMfov(crt, desktop);
  const mob = resolveLookMfov(crt, phone);
  assert.equal(desk, 22, `desktop CRT should stay authored 22, got ${desk}`);
  assert.ok(mob > desk, `mobile CRT mfov ${mob} should be > desktop ${desk}`);
  assert.ok(mob >= 35 && mob <= 55, `mobile CRT mfov ${mob} in BT-like ~40 band`);
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

// 9) Equirect yaw phase — looking at authored u must sample file_u ≈ 1−u
//    (and hotspot must sit on the same ray). Regression for Music→poster-wall bug.
{
  const cameraForward = (yaw: number, pitch: number) => {
    const cp = Math.cos(pitch);
    const sp = Math.sin(pitch);
    const cy = Math.cos(yaw);
    const sy = Math.sin(yaw);
    return { x: -sy * cp, y: sp, z: -cy * cp };
  };

  const sphereGeomU = (P: { x: number; y: number; z: number }) => {
    const r = Math.hypot(P.x, P.y, P.z);
    const x = P.x / r;
    const y = P.y / r;
    const z = P.z / r;
    const theta = Math.acos(Math.max(-1, Math.min(1, y)));
    const st = Math.sin(theta) || 1e-9;
    let phi = Math.atan2(z / st, -x / st);
    if (phi < 0) phi += Math.PI * 2;
    return phi / (Math.PI * 2);
  };

  const fileUFromDir = (P: { x: number; y: number; z: number }) => {
    // texture.repeat.x = -1, offset.x = 1 → file_u = 1 − geomU
    const geomU = sphereGeomU(P);
    return ((1 - geomU) % 1 + 1) % 1;
  };

  const check = (label: string, u: number, v: number) => {
    const yaw = uToYaw(u);
    const pitch = vToPitch(v);
    const fwd = cameraForward(yaw, pitch);
    const [hx, hy, hz] = uvToSpherical(u, v, 1);
    const hot = { x: hx, y: hy, z: hz };
    const fileCam = fileUFromDir(fwd);
    const fileHot = fileUFromDir(hot);
    const want = ((1 - u) % 1 + 1) % 1;
    const dot = fwd.x * hot.x + fwd.y * hot.y + fwd.z * hot.z;
    assert.ok(
      Math.abs(fileCam - want) < 0.02,
      `${label}: camera file ${fileCam} should ≈ 1−u=${want}`,
    );
    assert.ok(
      Math.abs(fileHot - want) < 0.02,
      `${label}: hotspot file ${fileHot} should ≈ 1−u=${want}`,
    );
    assert.ok(dot > 0.99, `${label}: hotspot must lie on camera forward (dot=${dot})`);
  };

  check('Music lookto', 0.18, 0.42);
  check('Music hit', 0.2, 0.4);
  check('Videos lookto', 0.3, 0.415);
  check('Videos hit', 0.3, 0.42);
  check('Phone', 0.486, 0.406);
  check('Register', 0.573, 0.53);
  console.log('✓ lookto/hotspot yaw phase: file_u ≈ 1−authored_u (Music≠poster wall)');
}

console.log('\nAll nav camera checks passed.');
