'use client';

import { useLayoutEffect, useRef } from 'react';
import { type ThreeEvent } from '@react-three/fiber';
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
};

/** Outbound “globe” destinations — Bandcamp / IG / maps / shop rabbit holes. */
const WONDER_LINKS = [
  'https://vcrrecordings.bandcamp.com',
  'https://www.instagram.com/vcr_recordings',
  'https://ltdrifta.bandcamp.com',
  'https://inletknight.bandcamp.com',
  'https://drifta.bandcamp.com',
  '/shop/',
  '/shop/about.html',
  'https://www.google.com/maps/@49.2827,-123.1207,3a,75y,90t/data=!3m1!1e3',
  'https://www.google.com/maps/@45.5231,-122.6765,3a,75y,120t/data=!3m1!1e3',
];

/**
 * Non-nav diegetic toys — balmingtiger cushion / owl / fire / globe class.
 * Invisible click meshes: unique SFX, plus one wonder object that opens
 * a random outbound link (globe parity).
 */
const HITS: AmbientHit[] = [
  { id: 'stool', u: 0.19, v: 0.58, w: 3.2, h: 2.4, sfx: 'stool' },
  { id: 'crate', u: 0.46, v: 0.72, w: 4.5, h: 3.2, sfx: 'crate' },
  { id: 'poster', u: 0.5, v: 0.28, w: 3.5, h: 3.5, sfx: 'poster' },
  { id: 'cushion', u: 0.62, v: 0.68, w: 3.8, h: 2.6, sfx: 'cushion' },
  // Soft “owl” perch near the listening booth upper shelf
  { id: 'owl', u: 0.16, v: 0.32, w: 2.6, h: 2.4, sfx: 'owl' },
  // Warm crackle near the lamp / back corner
  { id: 'fire', u: 0.38, v: 0.55, w: 2.8, h: 2.6, sfx: 'fire' },
  // Globe / wonder — clear of phone-booth (u≈0.486) and cash-register (u≈0.57)
  {
    id: 'wonder',
    u: 0.55,
    v: 0.62,
    w: 2.4,
    h: 2.4,
    sfx: 'wonder',
    wonder: true,
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
  const mesh = useRef<THREE.Mesh>(null);
  const env = useSceneEnv();
  const [x, y, z] = uvToSpherical(hit.u, hit.v, SPHERE_RADIUS - 0.55);

  useLayoutEffect(() => {
    mesh.current?.lookAt(origin);
  }, [x, y, z]);

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (!env.live.value || controls.dragged) return;
    playSfx(hit.sfx);
    if (hit.wonder) {
      const href = WONDER_LINKS[Math.floor(Math.random() * WONDER_LINKS.length)];
      window.setTimeout(() => {
        window.open(href, '_blank', 'noopener,noreferrer');
      }, 280);
    }
  };

  return (
    <mesh
      ref={mesh}
      position={[x, y, z]}
      renderOrder={1}
      onClick={onClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        if (!env.live.value) return;
        document.documentElement.classList.add('cursor-hot');
      }}
      onPointerOut={() => {
        document.documentElement.classList.remove('cursor-hot');
      }}
      userData={{ ambientId: hit.id }}
    >
      <planeGeometry args={[hit.w, hit.h]} />
      <meshBasicMaterial
        transparent
        opacity={debug ? 0.22 : 0}
        color={debug ? (hit.wonder ? '#ffe66d' : '#7dffb3') : '#ffffff'}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
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
