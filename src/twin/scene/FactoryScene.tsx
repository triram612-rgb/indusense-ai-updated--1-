import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { TwinContext, useTwin } from '../state';
import { FactoryNodes } from './Nodes';
import { Conveyor, ProductFlow } from './Flow';
import { CausalGraph, FinancialMass } from './Overlays';
import { CameraRig } from './CameraRig';
import { HEX, LINE_END, LINE_START } from './palette';

/**
 * The scene.
 *
 * Lighting is deliberately restrained: one key light, one cool fill, and a
 * ground bounce. There is no bloom, no colour grading and no environment map —
 * a control room is lit so you can read instruments, not so it looks cinematic
 * at the cost of legibility.
 */

function Floor() {
  return (
    <group>
      {/* Bay plate */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[70, 42]} />
        <meshStandardMaterial color="#0A0E13" roughness={0.95} metalness={0.05} />
      </mesh>
      {/* Fine technical grid */}
      <gridHelper
        args={[70, 70, new THREE.Color('#1B242F'), new THREE.Color('#121922')]}
        position={[0, 0.005, 0]}
      />
      {/* Line centreline marking */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[(LINE_START + LINE_END) / 2, 0.012, 0]}>
        <planeGeometry args={[LINE_END - LINE_START + 3, 4.6]} />
        <meshBasicMaterial color={HEX.signal} transparent opacity={0.035} />
      </mesh>
    </group>
  );
}

function Lighting() {
  return (
    <>
      <ambientLight intensity={0.55} color="#8FA6BF" />
      <directionalLight
        position={[-12, 20, 14]}
        intensity={1.15}
        color="#CFE0F5"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[16, 10, -12]} intensity={0.35} color="#2F8BFF" />
      <hemisphereLight args={['#22303F', '#05070A', 0.5]} />
    </>
  );
}

export function FactoryScene() {
  const twin = useTwin();
  const { reducedMotion, select } = twin;

  return (
    <Canvas
      shadows={!reducedMotion}
      dpr={[1, reducedMotion ? 1.2 : 1.75]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      camera={{ position: [-13, 16, 24], fov: 38, near: 0.5, far: 200 }}
      onPointerMissed={() => select(null)}
    >
      <color attach="background" args={[HEX.void]} />
      <fog attach="fog" args={[HEX.void, 34, 78]} />
      <TwinContext.Provider value={twin}>
      <Suspense fallback={null}>
        <Lighting />
        <Floor />
        <Conveyor />
        <ProductFlow />
        <FactoryNodes />
        <CausalGraph />
        <FinancialMass />
        <CameraRig />
      </Suspense>
      </TwinContext.Provider>
    </Canvas>
  );
}
