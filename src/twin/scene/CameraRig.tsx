import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useTwin } from '../state';
import type { TwinMode } from '../state';
import { nodeById } from '../layout';

/**
 * Camera states.
 *
 * The camera never cuts. Selecting a station eases the view toward it and the
 * surrounding plant stays in frame, so the user keeps their bearings instead of
 * being teleported into a new page. Manual orbit always wins: once the user
 * drags, the rig stops steering until the next explicit selection or mode
 * change.
 */

interface Framing {
  position: [number, number, number];
  target: [number, number, number];
}

const MODE_FRAMING: Record<TwinMode, Framing> = {
  command: { position: [-13, 16, 24], target: [-1, 0.5, 0] },
  production: { position: [-18, 11, 20], target: [-3, 0.5, 0] },
  quality: { position: [6, 9, 16], target: [1, 1, 0] },
  profitability: { position: [2, 13, 21], target: [1, 1, -2] },
  simulation: { position: [-8, 12, 20], target: [-2, 0.5, 0] },
  decision: { position: [-6, 14, 22], target: [-2, 0.5, 0] },
  confidence: { position: [0, 12, 19], target: [0, 1, 0] },
};

export function CameraRig() {
  const controls = useRef<OrbitControlsImpl>(null);
  const { camera } = useThree();
  const { mode, selection, cameraResetKey, reducedMotion } = useTwin();

  const goalPos = useRef(new THREE.Vector3(...MODE_FRAMING.command.position));
  const goalTarget = useRef(new THREE.Vector3(...MODE_FRAMING.command.target));
  const steering = useRef(true);

  // Mode / reset framing
  useEffect(() => {
    const f = MODE_FRAMING[mode];
    goalPos.current.set(...f.position);
    goalTarget.current.set(...f.target);
    steering.current = true;
  }, [mode, cameraResetKey]);

  // Focus on the current selection
  useEffect(() => {
    if (!selection) return;
    const node = nodeById.get(selection.nodeId);
    if (!node) return;
    const [x, , z] = node.position;
    goalTarget.current.set(x, 1.1, z);
    // Approach from the same side the user is already on, so the move reads as
    // a push-in rather than a jump to the other side of the plant.
    const side = Math.sign(camera.position.z || 1);
    goalPos.current.set(x - 5.5, 6.4, z + 10.5 * side);
    steering.current = true;
  }, [selection, camera]);

  useFrame((_, delta) => {
    const c = controls.current;
    if (!c) return;
    if (!steering.current) return;
    const k = reducedMotion ? 1 : 1 - Math.pow(0.0016, delta);
    camera.position.lerp(goalPos.current, k);
    c.target.lerp(goalTarget.current, k);
    c.update();
    if (camera.position.distanceTo(goalPos.current) < 0.05) steering.current = false;
  });

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enablePan
      enableDamping
      dampingFactor={0.08}
      minDistance={6}
      maxDistance={46}
      maxPolarAngle={Math.PI / 2.12}
      onStart={() => {
        steering.current = false;
      }}
    />
  );
}
