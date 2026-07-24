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

/** Warm gold — matches balmingtiger lp/shopbag glow PNGs (~255,239,168). */
const GOLD_TINT = '#fff0b0';

function prepGlowMap(map: THREE.Texture, flipX?: boolean) {
  map.colorSpace = THREE.SRGBColorSpace;
  const img = map.image as
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
        map.image = c;
        map.format = THREE.RGBAFormat;
      }
    }
  }
  if (flipX) {
    map.wrapS = THREE.RepeatWrapping;
    map.repeat.x = -1;
    map.offset.x = 1;
  } else {
    map.wrapS = THREE.ClampToEdgeWrapping;
    map.repeat.x = 1;
    map.offset.x = 0;
  }
  map.needsUpdate = true;
}

/**
 * Hotspot — balmingtiger pattern (3d.xml + site_scripts.js):
 *   invisible hit plane + glow PNG at the SAME ath/atv/scale footprint
 *   hoverIn  → glow alpha 0→1, duration 0.4, ease power1.inOut
 *   hoverOut → glow alpha 1→0 — EXCEPT latched sections while focused
 *
 * Gold-edge props: soft fill + rim, both locked to hit size (no 1.15× halo).
 * Blending: krpano uses normal alpha (not additive).
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
  focusedId?: string | null;
  debug?: boolean;
}) {
  const mesh = useRef<THREE.Mesh>(null);
  const glowMesh = useRef<THREE.Mesh>(null);
  const edgeMesh = useRef<THREE.Mesh>(null);
  const glowMat = useRef<THREE.MeshBasicMaterial>(null);
  const edgeMat = useRef<THREE.MeshBasicMaterial>(null);
  const inner = useRef<HTMLDivElement>(null);
  const opacity = useRef(0);
  const glow = useRef({ a: 0 });
  const [hovered, setHovered] = useState(false);
  const env = useSceneEnv();
  const { camera } = useThree();
  const [x, y, z] = uvToSpherical(section.u, section.v, SPHERE_RADIUS - 0.5);

  const canLatch = section.glowLatches !== false;
  const isFocused = canLatch && focusedId === section.id;
  const useEdge = !!section.goldEdge;

  const glowSrc = `/hotspots/${section.id}_glow.webp`;
  const edgeSrc = `/hotspots/${section.id}_edge.webp`;

  // Always call the same number of hooks: load a tiny fallback when no edge.
  const glowMap = useTexture(glowSrc);
  const edgeMap = useTexture(useEdge ? edgeSrc : glowSrc);

  useLayoutEffect(() => {
    prepGlowMap(glowMap, section.glowFlipX);
    if (useEdge) prepGlowMap(edgeMap, section.glowFlipX);
  }, [glowMap, edgeMap, section.glowFlipX, useEdge]);

  useLayoutEffect(() => {
    mesh.current?.lookAt(origin);
    glowMesh.current?.lookAt(origin);
    edgeMesh.current?.lookAt(origin);
  }, [x, y, z]);

  // hoverIn / hoverOut — alpha only (BT does not scale the hotspot on hover)
  useLayoutEffect(() => {
    const on = isFocused || hovered;
    gsap.to(glow.current, {
      a: on ? 1 : 0,
      duration: env.reduceMotion ? 0 : 0.4,
      ease: 'power1.inOut',
      overwrite: true,
    });
  }, [isFocused, hovered, env.reduceMotion]);

  useFrame(() => {
    const m = mesh.current;
    const el = inner.current;
    if (!m || !el) return;

    // Keep hit + glow planes facing the camera origin every frame.
    m.lookAt(origin);
    glowMesh.current?.lookAt(origin);
    edgeMesh.current?.lookAt(origin);

    m.getWorldPosition(tmp).project(camera);
    const inFront = tmp.z > -1 && tmp.z < 1;
    const dist = Math.hypot(tmp.x, tmp.y);
    const proximity = inFront
      ? THREE.MathUtils.clamp(1 - (dist - 0.08) / 0.55, 0, 1)
      : 0;

    let hintTarget = Math.max(proximity * 0.95, hovered || isFocused ? 1 : 0);
    if (!env.live.value || (env.panelOpen.value && !isFocused && !hovered)) {
      hintTarget = 0;
    }

    opacity.current += (hintTarget - opacity.current) * 0.18;
    el.style.opacity = opacity.current.toFixed(3);
    el.style.visibility = opacity.current < 0.02 ? 'hidden' : 'visible';

    const a = glow.current.a;
    if (glowMat.current) {
      // Soft fill under the rim (or full silhouette when no edge asset).
      glowMat.current.opacity = a * (useEdge ? 0.55 : 1);
      glowMat.current.visible = a > 0.02;
    }
    if (edgeMat.current) {
      edgeMat.current.opacity = a;
      edgeMat.current.visible = useEdge && a > 0.02;
    }
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (!env.live.value || controls.dragged) return;
    if (!canLatch) {
      gsap.fromTo(
        glow.current,
        { a: Math.max(glow.current.a, 0.35) },
        { a: 1, duration: 0.18, yoyo: true, repeat: 1, ease: 'power1.inOut', overwrite: true },
      );
    }
    onOpen(section.id);
  };

  // BT: glow + default share the same ath/atv/scale footprint (hit size).
  const gw = section.w;
  const gh = section.h;

  return (
    <group position={[x, y, z]}>
      {/* Silhouette fill — same size as hit plane */}
      <mesh ref={glowMesh} renderOrder={2} raycast={() => null}>
        <planeGeometry args={[gw, gh]} />
        <meshBasicMaterial
          ref={glowMat}
          map={glowMap}
          color={useEdge ? GOLD_TINT : '#ffffff'}
          transparent
          depthWrite={false}
          depthTest={false}
          blending={THREE.NormalBlending}
          opacity={0}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>

      {/* Optional gold rim — registered to the same footprint (no outer halo) */}
      {useEdge && (
        <mesh ref={edgeMesh} renderOrder={2} raycast={() => null}>
          <planeGeometry args={[gw, gh]} />
          <meshBasicMaterial
            ref={edgeMat}
            map={edgeMap}
            color={GOLD_TINT}
            transparent
            depthWrite={false}
            depthTest={false}
            blending={THREE.NormalBlending}
            opacity={0}
            side={THREE.DoubleSide}
            toneMapped={false}
          />
        </mesh>
      )}

      <mesh
        ref={mesh}
        renderOrder={3}
        onPointerOver={(e) => {
          e.stopPropagation();
          if (!env.live.value) return;
          setHovered(true);
          // CSS: html.cursor-hot → pointer on stage canvas (single hit surface).
          document.documentElement.classList.add('cursor-hot');
        }}
        onPointerOut={() => {
          setHovered(false);
          document.documentElement.classList.remove('cursor-hot');
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
