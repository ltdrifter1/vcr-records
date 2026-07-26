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
import {
  HASH_BY_SECTION_ID,
  NAV_ORDER,
  SECTION_BY_ID,
  SECTION_ID_BY_HASH,
} from '../app/data/sections';

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

// 2) CRT framing: mid lookto (not watch punch-in); phone widens further
{
  const crt = SECTION_BY_ID['crt-tv'];
  assert.equal(crt.lookFov, 52, 'CRT lookFov should frame the set, not fov 22 punch-in');
  assert.ok(crt.glowLatches !== false, 'CRT glow should latch while Videos is focused');
  assert.ok(crt.hideHint, 'CRT glow should have no proximity text');
  assert.equal(crt.items.length, 0, 'CRT channels cleared (coming soon)');
  const desk = resolveLookMfov(crt, desktop);
  const mob = resolveLookMfov(crt, phone);
  assert.equal(desk, 52, `desktop CRT should stay authored 52, got ${desk}`);
  assert.ok(mob > desk, `mobile CRT mfov ${mob} should be > desktop ${desk}`);
  console.log(`✓ CRT lookto desktop=${desk.toFixed(1)} mobile=${mob.toFixed(1)}`);
}

// 3) Music booth: desktop authored 95 (room view); phone adapted wider; coming soon
{
  const musicSec = SECTION_BY_ID['listening-booth'];
  assert.equal(musicSec.items.length, 0, 'Music should be coming soon (no At Home row)');
  assert.equal(musicSec.title.trim(), '', 'Music panel title cleared');
  assert.ok(musicSec.hideHint, 'Music glow must not show Slip on headphones text');
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

// 10) Shop / cash-register opens in-room panel (no eject)
{
  const controls = createControls({
    lookTarget: { x: 0, y: 0 },
    mfov: MFOV_EXPLORE,
    userControl: true,
  });
  const navState = createNavState();
  let active: string | null = null;
  let focused: string | null = null;
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
  nav.open('cash-register', desktop);
  assert.equal(active, 'cash-register');
  assert.equal(focused, 'cash-register');
  assert.equal(navState.panelOpen, true);
  assert.ok(controls.mfov < MFOV_EXPLORE, 'shop lookto should punch in from explore FOV');
  const shop = SECTION_BY_ID['cash-register'];
  assert.equal(shop.title.trim(), '', 'Shop title cleared (no The Counter)');
  assert.equal(shop.intro.trim(), '', 'Shop intro cleared');
  assert.equal(shop.items.length, 1, 'Shop should only list Inlet Knight');
  assert.match(shop.items[0].label, /Inlet Knight/i);
  console.log('✓ cash-register opens in-room shop panel');
}

// 11) Hash map covers every nav section; Archive/Lore gone; no glow hint text
{
  assert.ok(
    !(NAV_ORDER as readonly string[]).includes('back-room-door'),
    'Lore must be removed from conveyor',
  );
  assert.ok(
    !(NAV_ORDER as readonly string[]).includes('flyer-wall'),
    'Archive must be removed from conveyor',
  );
  assert.ok(!('flyer-wall' in SECTION_BY_ID), 'Archive section must be deleted');
  assert.ok(!('back-room-door' in SECTION_BY_ID), 'Lore section must be deleted');
  for (const id of NAV_ORDER) {
    const hash = HASH_BY_SECTION_ID[id];
    assert.ok(hash, `missing hash for ${id}`);
    assert.equal(SECTION_ID_BY_HASH[hash], id);
    assert.ok(SECTION_BY_ID[id], `missing section ${id}`);
    assert.ok(SECTION_BY_ID[id].goldEdge, `${id} needs gold-edge glow`);
    assert.ok(SECTION_BY_ID[id].hideHint, `${id} must not show glow label text`);
    assert.equal(SECTION_BY_ID[id].hint.trim(), '', `${id} hint text must be empty`);
  }
  const phone = SECTION_BY_ID['phone-booth'];
  assert.equal(phone.title.trim(), '', 'Contact title should be empty (kicker only)');
  assert.equal(phone.intro.trim(), '', 'Contact intro cleared');
  assert.equal(phone.items.length, 2, 'Contact is Charlie + Instagram only');
  assert.ok(
    phone.items.every((it) => !/info@|Booking/i.test(`${it.label}${it.meta ?? ''}`)),
    'Contact must not include info@ or Booking',
  );
  assert.ok(
    phone.items.some((it) => /charlie/i.test(`${it.label}${it.meta ?? ''}`)),
    'Contact must include Charlie',
  );
  console.log('✓ Nav hash map + Archive removed + edge glows without labels');
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
