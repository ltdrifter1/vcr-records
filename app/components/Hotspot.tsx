'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { Html, useTexture } from '@react-three/drei';
import gsap from 'gsap';
import * as THREE from 'three';

import { uvToSpherical, SPHERE_RADIUS } from '@/lib/pano';
import type { Section } from '@/app/data/sections';
import { useSceneEnv, type Controls } from './sceneContext';

const tmp = new THREE.Vector3();
const origin = new THREE.Vector3(0, 0, 0);

/**
 * Hotspot — balmingtiger pattern (3d.xml + site_scripts.js):
 *   invisible hit plane (default hotspot) + authored glow PNG (alpha 0)
 *   hoverIn  → glow alpha 0→1, duration 0.4, ease power1.inOut
 *   hoverOut → glow alpha 1→0 (same tween) — EXCEPT music/tour/contact
 *              which early-return while active_scene matches (latch)
 *   shopbag  → never latches; click opens outbound URL (no lookto)
 *
 * Blending: krpano uses normal alpha (not additive). Additive washed out
 * on the bright cel room.
 */
export default function Hotspot({
  section,
  onOpen,
  controls,
  focusedId = null,
  debug = false,
}: {
  section: Section;
  onOpen: (id: string) => void;
  controls: Controls;
  /** Glow latch id (panel open OR lookto lock). Ignored when glowLatches=false. */
  focusedId?: string | null;
  debug?: boolean;
}) {
  const mesh = useRef<THREE.Mesh>(null);
  const glowMesh = useRef<THREE.Mesh>(null);
  const glowMat = useRef<THREE.MeshBasicMaterial>(null);
  const inner = useRef<HTMLDivElement>(null);
  const opacity = useRef(0);
  const glow = useRef({ a: 0 });
  const [hovered, setHovered] = useState(false);
  const env = useSceneEnv();
  const { camera, gl } = useThree();
  const [x, y, z] = uvToSpherical(section.u, section.v, SPHERE_RADIUS - 0.5);

  // balmingtiger: shopbag glowLatches=false; music/tour/contact latch
  const canLatch = section.glowLatches !== false;
  const isFocused = canLatch && focusedId === section.id;

  // Prefer authored RGBA silhouette glows (`*_glow.webp`).
  const glowSrc = `/hotspots/${section.id}_glow.webp`;
  const glowMap = useTexture(glowSrc);
  useLayoutEffect(() => {
    glowMap.colorSpace = THREE.SRGBColorSpace;
    // Some legacy glows were saved as lossy RGB (no alpha). Convert
    // luminance → alpha so NormalBlending matches krpano / shopbag PNGs.
    const img = glowMap.image as
      | HTMLImageElement
      | HTMLCanvasElement
      | ImageBitmap
      | undefined;
    if (img && 'width' in img && img.width) {
      const w = img.width;
      const h = img.height;
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const ctx = c.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        ctx.drawImage(img as CanvasImageSource, 0, 0);
        const data = ctx.getImageData(0, 0, w, h);
        let hasTrans = false;
        for (let i = 3; i < data.data.length; i += 4) {
          if (data.data[i] < 250) {
            hasTrans = true;
            break;
          }
        }
        if (!hasTrans) {
          for (let i = 0; i < data.data.length; i += 4) {
            const lum = Math.max(data.data[i], data.data[i + 1], data.data[i + 2]);
            data.data[i + 3] = lum;
          }
          ctx.putImageData(data, 0, 0);
          glowMap.image = c;
          glowMap.format = THREE.RGBAFormat;
        }
      }
    }
    glowMap.needsUpdate = true;
  }, [glowMap]);

  useLayoutEffect(() => {
    mesh.current?.lookAt(origin);
    glowMesh.current?.lookAt(origin);
  }, [x, y, z]);

  // hoverIn / hoverOut — identical GSAP numbers to site_scripts.js
  useLayoutEffect(() => {
    const on = isFocused || hovered;
    gsap.to(glow.current, {
      a: on ? 1 : 0,
      duration: 0.4,
      ease: 'power1.inOut',
      overwrite: true,
    });
  }, [isFocused, hovered]);

  useFrame(() => {
    const m = mesh.current;
    const el = inner.current;
    if (!m || !el) return;

    m.getWorldPosition(tmp).project(camera);
    const inFront = tmp.z > -1 && tmp.z < 1;
    const dist = Math.hypot(tmp.x, tmp.y);
    const proximity = inFront
      ? THREE.MathUtils.clamp(1 - (dist - 0.08) / 0.55, 0, 1)
      : 0;

    // Hints only — BT glow is pointer hover / active_scene, not proximity
    let hintTarget = Math.max(proximity * 0.95, hovered || isFocused ? 1 : 0);
    if (!env.live.value || (env.panelOpen.value && !isFocused && !hovered)) {
      hintTarget = 0;
    }

    opacity.current += (hintTarget - opacity.current) * 0.18;
    el.style.opacity = opacity.current.toFixed(3);
    el.style.visibility = opacity.current < 0.02 ? 'hidden' : 'visible';

    if (glowMat.current) {
      glowMat.current.opacity = glow.current.a;
      glowMat.current.visible = glow.current.a > 0.02;
    }
    // BT keeps glow scale locked to the default hotspot (same ath/atv/scale)
    if (glowMesh.current) {
      glowMesh.current.scale.setScalar(1);
    }
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (controls.dragged || controls.lookAnimating) return;
    onOpen(section.id);
  };

  // Glow plane matches default hotspot footprint (BT same scale for both)
  const gw = section.w * 1.15;
  const gh = section.h * 1.15;

  return (
    <group position={[x, y, z]}>
      <mesh ref={glowMesh} renderOrder={2} raycast={() => null}>
        <planeGeometry args={[gw, gh]} />
        <meshBasicMaterial
          ref={glowMat}
          map={glowMap}
          color="#ffffff"
          transparent
          depthWrite={false}
          depthTest={false}
          // krpano hotspot alpha — NOT AdditiveBlending (washes out on cel walls)
          blending={THREE.NormalBlending}
          opacity={0}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>

      <mesh
        ref={mesh}
        renderOrder={3}
        onPointerOver={(e) => {
          e.stopPropagation();
          if (!env.live.value) return;
          setHovered(true);
          document.documentElement.classList.add('cursor-hot');
        }}
        onPointerOut={() => {
          // balmingtiger hoverOutShopbag: always fades (no latch).
          // music/tour/contact: hoverOut early-returns while active —
          // local hovered clears, isFocused keeps glow via GSAP.
          setHovered(false);
          document.documentElement.classList.remove('cursor-hot');
          gl.domElement.style.cursor = '';
        }}
        onClick={handleClick}
        userData={{ hotspotId: section.id, nav: section.nav }}
      >
        <planeGeometry args={[section.w, section.h]} />
        <meshBasicMaterial
          transparent
          opacity={debug ? 0.3 : 0}
          color={debug ? section.accent : '#ffffff'}
          depthWrite={false}
          side={THREE.DoubleSide}
        />

        <Html
          center
          prepend
          occlude={false}
          zIndexRange={[20, 10]}
          style={{ pointerEvents: 'none' }}
          distanceFactor={28}
        >
          <div
            ref={inner}
            className="hint"
            data-nav={section.nav}
            data-hotspot={section.id}
            style={
              {
                opacity: 0,
                ['--hint-accent' as string]: section.accent,
              } as React.CSSProperties
            }
          >
            <span className={`hint-ring ${hovered || isFocused ? 'hint-pulse' : ''}`} />
            <span className="hint-label">{section.hint}</span>
            <span className="hint-nav">{section.nav}</span>
          </div>
        </Html>
      </mesh>
    </group>
  );
}
