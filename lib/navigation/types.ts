/**
 * Shared navigation / camera types.
 *
 * This is a 360° spherical camera (balmingtiger / krpano model), not a 2D
 * CSS transform canvas. Mapping to the requested camera vocabulary:
 *
 *   cameraX     → lookTarget.x  (yaw, radians)
 *   cameraY     → lookTarget.y  (pitch, radians)
 *   cameraScale → mfov          (degrees; smaller = more zoomed in)
 */

export type Vec2 = { x: number; y: number };

export type CameraState = {
  /** cameraX — yaw in radians (wraps). */
  yaw: number;
  /** cameraY — pitch in radians (clamped by ViewportManager). */
  pitch: number;
  /** cameraScale — MFOV degrees (krpano view.fov, fovtype=MFOV). */
  mfov: number;
};

/**
 * Mutable look state shared between InteractionManager and the camera Rig.
 * Mirrors the krpano view + control surface balmingtiger drives.
 */
export type Controls = {
  lookTarget: Vec2;
  velocity: Vec2;
  dragging: boolean;
  dragged: boolean;
  mfov: number;
  fisheye: number;
  pointer: Vec2;
  followFactor: number;
  userControl: boolean;
  /**
   * True while a lookto / FOV tween is in flight.
   * Drag may still interrupt (intentional BT parity).
   */
  lookAnimating: boolean;
};

export type ViewportMetrics = {
  width: number;
  height: number;
  aspect: number;
  dpr: number;
  /** visualViewport offset (iOS URL chrome). */
  offsetTop: number;
  offsetLeft: number;
  /** Safe-area insets in CSS pixels. */
  safeTop: number;
  safeRight: number;
  safeBottom: number;
  safeLeft: number;
  /** Normalized margins reserved for chrome (nav / panel). */
  safeMarginX: number;
  safeMarginY: number;
};

export type LookTarget = {
  yaw: number;
  pitch: number;
  mfov: number;
};

export type NavFocusState = {
  activeId: string | null;
  focusedId: string | null;
  panelOpen: boolean;
  /** Ignore free-focus until lookto has landed. */
  focusReadyAt: number;
};
