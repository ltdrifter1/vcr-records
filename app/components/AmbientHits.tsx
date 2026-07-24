'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import gsap from 'gsap';
import * as THREE from 'three';

import { SPHERE_RADIUS, uvToSpherical } from '@/lib/pano';
import { playSfx } from '@/lib/audio';
import { useSceneEnv, type Controls } from './sceneContext';

type AmbientHit = {
  id: string;
  u: number;
  v: number;
  w: number;
  h: number;
  sfx: string;
  /**
   * balmingtiger globe class — click opens a random wonder link
   * instead of (or after) playing SFX.
   */
  wonder?: boolean;
  /** Soft glow tint on hover / click */
  accent: string;
};

/** Outbound “globe” destinations — Bandcamp / IG / maps rabbit holes. */
const WONDER_LINKS = [
  'https://vcrrecordings.bandcamp.com',
  'https://www.instagram.com/vcr_recordings',
  'https://ltdrifta.bandcamp.com',
  'https://inletknight.bandcamp.com',
  'https://drifta.bandcamp.com',
  'https://www.google.com/maps/@49.2827,-123.1207,3a,75y,90t/data=!3m1!1e3',
  'https://www.google.com/maps/@45.5231,-122.6765,3a,75y,120t/data=!3m1!1e3',
];

/**
 * Non-nav diegetic toys — cushion / owl / fire / globe class.
 * Soft glow + scale punch on hover/click so curiosity reads as intentional.
 */
const HITS: AmbientHit[] = [
  { id: 'stool', u: 0.19, v: 0.58, w: 3.2, h: 2.4, sfx: 'stool', accent: '#7dffb3' },
  { id: 'crate', u: 0.46, v: 0.72, w: 4.5, h: 3.2, sfx: 'crate', accent: '#ffe566' },
  { id: 'poster', u: 0.5, v: 0.28, w: 3.5, h: 3.5, sfx: 'poster', accent: '#ffb347' },
  { id: 'cushion', u: 0.62, v: 0.68, w: 3.8, h: 2.6, sfx: 'cushion', accent: '#ff7a9c' },
  { id: 'owl', u: 0.16, v: 0.32, w: 2.6, h: 2.4, sfx: 'owl', accent: '#c9a6ff' },
  { id: 'fire', u: 0.38, v: 0.55, w: 2.8, h: 2.6, sfx: 'fire', accent: '#ff5e5e' },
  {
    id: 'wonder',
    u: 0.55,
    v: 0.62,
    w: 2.4,
    h: 2.4,
    sfx: 'wonder',
    wonder: true,
    accent: '#e9b21d',
  },
];

const origin = new THREE.Vector3(0, 0, 0);

function AmbientMesh({
  hit,
  controls,
  debug,
}: {
  hit: AmbientHit;
  controls: Controls;
  debug?: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const hitMesh = useRef<THREE.Mesh>(null);
  const glowMesh = useRef<THREE.Mesh>(null);
  const glowMat = useRef<THREE.MeshBasicMaterial>(null);
  const env = useSceneEnv();
  const [hovered, setHovered] = useState(false);
  const glow = useRef({ a: 0 });
  const [x, y, z] = uvToSpherical(hit.u, hit.v, SPHERE_RADIUS - 0.55);

  useLayoutEffect(() => {
    group.current?.lookAt(origin);
  }, [x, y, z]);

  useLayoutEffect(() => {
    const target = hovered ? (hit.wonder ? 0.42 : 0.28) : 0;
    gsap.to(glow.current, {
      a: target,
      duration: env.reduceMotion ? 0 : 0.28,
      ease: 'power1.out',
      overwrite: true,
    });
  }, [hovered, hit.wonder, env.reduceMotion]);

  useFrame(() => {
    if (glowMat.current) glowMat.current.opacity = glow.current.a;
    group.current?.lookAt(origin);
  });

  const pulse = () => {
    const g = group.current;
    if (!g) return;
    if (env.reduceMotion) {
      glow.current.a = hit.wonder ? 0.55 : 0.4;
      return;
    }
    gsap.fromTo(
      g.scale,
      { x: 1, y: 1, z: 1 },
      {
        x: 1.08,
        y: 1.08,
        z: 1.08,
        duration: 0.12,
        yoyo: true,
        repeat: 1,
        ease: 'power2.out',
        overwrite: true,
      },
    );
    gsap.fromTo(
      glow.current,
      { a: hit.wonder ? 0.55 : 0.4 },
      {
        a: hovered ? (hit.wonder ? 0.42 : 0.28) : 0,
        duration: 0.55,
        ease: 'power2.out',
        overwrite: 'auto',
      },
    );
  };

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (!env.live.value || controls.dragged) return;
    playSfx(hit.sfx);
    pulse();
    if (hit.wonder) {
      const href = WONDER_LINKS[Math.floor(Math.random() * WONDER_LINKS.length)];
      window.setTimeout(() => {
        window.open(href, '_blank', 'noopener,noreferrer');
      }, 280);
    }
  };

  const glowW = hit.w * 0.55;
  const glowH = hit.h * 0.55;

  return (
    <group ref={group} position={[x, y, z]}>
      {/* Soft diegetic glow — visible on hover / click */}
      <mesh ref={glowMesh} position={[0, 0, 0.02]} renderOrder={2} raycast={() => null}>
        <planeGeometry args={[glowW, glowH]} />
        <meshBasicMaterial
          ref={glowMat}
          transparent
          opacity={0}
          color={hit.accent}
          depthWrite={false}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      <mesh
        ref={hitMesh}
        position={[0, 0, 0]}
        renderOrder={1}
        onClick={onClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          if (!env.live.value) return;
          setHovered(true);
          document.documentElement.classList.add('cursor-hot');
        }}
        onPointerOut={() => {
          setHovered(false);
          document.documentElement.classList.remove('cursor-hot');
        }}
        userData={{ ambientId: hit.id }}
      >
        <planeGeometry args={[hit.w, hit.h]} />
        <meshBasicMaterial
          transparent
          opacity={debug ? 0.22 : 0}
          color={debug ? hit.accent : '#ffffff'}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

export default function AmbientHits({
  controls,
  debug = false,
}: {
  controls: Controls;
  debug?: boolean;
}) {
  return (
    <group>
      {HITS.map((hit) => (
        <AmbientMesh key={hit.id} hit={hit} controls={controls} debug={debug} />
      ))}
    </group>
  );
}
