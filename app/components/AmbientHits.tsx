'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { type ThreeEvent } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import gsap from 'gsap';
import * as THREE from 'three';

import { SPHERE_RADIUS, uvToSpherical } from '@/lib/pano';
import { playSfx } from '@/lib/audio';
import { useSceneEnv, type Controls } from './sceneContext';

/** Visible click reaction — alpha-cut billboard of the painted object
 * (baked by scripts/build-v9-pano.py as /hotspots/toy_<id>.webp). */
type ToyPlane = {
  u: number;
  v: number;
  w: number;
  h: number;
};

type AmbientHit = {
  id: string;
  u: number;
  v: number;
  w: number;
  h: number;
  sfx: string;
  /** When set, clicking wiggles the painted object (BT toy micro-reaction). */
  toy?: ToyPlane;
  /**
   * balmingtiger globe class — click opens a random wonder link
   * instead of (or after) playing SFX.
   */
  wonder?: boolean;
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
 * Non-nav diegetic toys — balmingtiger cushion / owl / fire / globe class.
 * Invisible click meshes: unique SFX, plus one wonder object that opens
 * a random outbound link (globe parity).
 */
const HITS: AmbientHit[] = [
  // Headphones on the back-wall LISTEN tower (v11)
  {
    id: 'stool',
    u: 0.492,
    v: 0.418,
    w: 2.4,
    h: 2.2,
    sfx: 'stool',
    toy: { u: 0.5, v: 0.428, w: 12, h: 14 },
  },
  // Wall bin run on the CRT side
  { id: 'crate', u: 0.655, v: 0.488, w: 4.5, h: 3.2, sfx: 'crate' },
  // Face-out record row on the CRT-side wall shelf
  { id: 'poster', u: 0.656, v: 0.317, w: 3.5, h: 3.5, sfx: 'poster' },
  // Doormat by the entry door — dust-off wiggle on click
  {
    id: 'cushion',
    u: 0.09,
    v: 0.617,
    w: 3.5,
    h: 2,
    sfx: 'cushion',
    toy: { u: 0.09, v: 0.617, w: 26, h: 7.6 },
  },
  // Potted plant at the island corner — leaf rustle on click
  {
    id: 'owl',
    u: 0.432,
    v: 0.444,
    w: 2.6,
    h: 2.4,
    sfx: 'owl',
    toy: { u: 0.4271, v: 0.4727, w: 20, h: 28.5 },
  },
  // Moss rug pool on the open floor
  { id: 'fire', u: 0.609, v: 0.703, w: 2.8, h: 2.6, sfx: 'fire' },
  // Globe / wonder — the door window looking onto the street
  {
    id: 'wonder',
    u: 0.0885,
    v: 0.41,
    w: 2.4,
    h: 2.4,
    sfx: 'wonder',
    wonder: true,
  },
];

const origin = new THREE.Vector3(0, 0, 0);

function ToySprite({
  id,
  toy,
  pulse,
}: {
  id: string;
  toy: ToyPlane;
  pulse: number;
}) {
  const mesh = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  const env = useSceneEnv();
  const map = useTexture(`/hotspots/toy_${id}.webp`);
  const [x, y, z] = uvToSpherical(toy.u, toy.v, SPHERE_RADIUS - 0.6);

  useLayoutEffect(() => {
    map.colorSpace = THREE.SRGBColorSpace;
    mesh.current?.lookAt(origin);
  }, [map, x, y, z]);

  useEffect(() => {
    const m = mesh.current;
    const material = mat.current;
    if (!pulse || !m || !material) return;
    if (env.reduceMotion) return;

    gsap.killTweensOf([m.rotation, m.scale, material]);
    const baseZ = m.rotation.z;
    const tl = gsap.timeline({
      onComplete: () => {
        m.rotation.z = baseZ;
        m.scale.setScalar(1);
      },
    });
    tl.set(material, { opacity: 1 })
      .to(m.rotation, { z: baseZ + 0.06, duration: 0.07, ease: 'power1.inOut' })
      .to(m.rotation, { z: baseZ - 0.05, duration: 0.11, ease: 'power1.inOut' })
      .to(m.rotation, { z: baseZ + 0.025, duration: 0.1, ease: 'power1.inOut' })
      .to(m.rotation, { z: baseZ, duration: 0.1, ease: 'power1.inOut' })
      .to(material, { opacity: 0, duration: 0.16 }, '>-0.04')
      .fromTo(
        m.scale,
        { x: 1, y: 1, z: 1 },
        { x: 1.06, y: 1.06, z: 1.06, duration: 0.15, yoyo: true, repeat: 1, ease: 'power1.inOut' },
        0,
      );
    return () => {
      tl.kill();
    };
  }, [pulse, env.reduceMotion]);

  return (
    <mesh ref={mesh} position={[x, y, z]} renderOrder={2} raycast={() => null}>
      <planeGeometry args={[toy.w, toy.h]} />
      <meshBasicMaterial
        ref={mat}
        map={map}
        transparent
        opacity={0}
        depthWrite={false}
        depthTest={false}
        side={THREE.DoubleSide}
        toneMapped={false}
      />
    </mesh>
  );
}

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
  const [pulse, setPulse] = useState(0);
  const [x, y, z] = uvToSpherical(hit.u, hit.v, SPHERE_RADIUS - 0.55);

  useLayoutEffect(() => {
    mesh.current?.lookAt(origin);
  }, [x, y, z]);

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (!env.live.value || controls.dragged) return;
    playSfx(hit.sfx);
    if (hit.toy) setPulse((p) => p + 1);
    if (hit.wonder) {
      const href = WONDER_LINKS[Math.floor(Math.random() * WONDER_LINKS.length)];
      window.setTimeout(() => {
        window.open(href, '_blank', 'noopener,noreferrer');
      }, 280);
    }
  };

  return (
    <group>
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
      {hit.toy && <ToySprite id={hit.id} toy={hit.toy} pulse={pulse} />}
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
