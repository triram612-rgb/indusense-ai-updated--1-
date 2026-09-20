import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useTwin } from '../state';
import { factoryNodes } from '../layout';
import { DECK_Y, HEX, LINE_END, LINE_START, severityColor } from './palette';

/**
 * Product flow.
 *
 * Units are advanced individually along the line. Each unit moves at the rate
 * of the station it is currently passing, and a minimum gap is enforced against
 * the unit ahead of it. That single rule is what produces the queue: nothing
 * draws a "bottleneck graphic", the pile-up in front of Station 3 is what
 * happens when a 31.4s cycle sits downstream of a 19.6s one.
 *
 * Raise the line-speed lever and the spawn rate rises; the constraint does not,
 * so the queue physically grows. Reduce scrap and fewer units carry the defect
 * colour past the inspection gantry.
 */

const MAX_UNITS = 190;
const GAP = 0.44;

interface Unit {
  x: number;
  active: boolean;
  defective: boolean;
  /** Set once the unit has passed the inspection gantry. */
  flagged: boolean;
  lane: number;
}

/** Station centres and their cycle times, used to build the speed profile. */
function speedProfile(flowMultiplier: Record<string, number>) {
  return factoryNodes
    .filter((n) => n.kind === 'station')
    .map((n) => ({
      id: n.id,
      x: n.position[0],
      /** Normalised rate: a 26.6s standard cycle is 1.0. */
      rate: (n.cycleBaseline ?? 20) / (n.cycleTime ?? 20) * (flowMultiplier[n.id] ?? 1),
    }));
}

export function ProductFlow() {
  const { sim, simulating, layers, reducedMotion, selection } = useTwin();
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const units = useRef<Unit[]>([]);
  const spawnClock = useRef(0);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const colorNominal = useMemo(() => new THREE.Color('#5E6C7D'), []);
  const colorScan = useMemo(() => new THREE.Color(HEX.signal), []);

  const inspectionX = factoryNodes.find((n) => n.id === 'inspection')!.position[0];

  if (units.current.length === 0) {
    units.current = Array.from({ length: MAX_UNITS }, () => ({
      x: 0,
      active: false,
      defective: false,
      flagged: false,
      lane: 0,
    }));
  }

  const profile = useMemo(() => speedProfile(sim.flowMultiplier), [sim.flowMultiplier]);

  /** Local rate at a given x — the nearest station's rate, blended at the edges. */
  const rateAt = useMemo(() => {
    return (x: number) => {
      let nearest = profile[0];
      let best = Infinity;
      for (const p of profile) {
        const d = Math.abs(p.x - x);
        if (d < best) {
          best = d;
          nearest = p;
        }
      }
      return nearest.rate;
    };
  }, [profile]);

  const scrapRate = simulating ? sim.scrapRatePct : 6.2;
  const spawnInterval = 0.42 / Math.max(0.35, sim.scenario.lineSpeedPct / 100);

  useFrame((_, rawDelta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const delta = Math.min(rawDelta, 0.05);
    const speedScale = reducedMotion ? 0 : 1;

    // Spawn
    spawnClock.current += delta;
    while (spawnClock.current > spawnInterval) {
      spawnClock.current -= spawnInterval;
      const free = units.current.find((u) => !u.active);
      if (free) {
        free.active = true;
        free.x = LINE_START;
        free.defective = Math.random() * 100 < scrapRate;
        free.flagged = false;
        free.lane = (Math.random() - 0.5) * 0.5;
      }
    }

    // Advance, respecting the unit ahead. Spawn order is position order.
    const active = units.current.filter((u) => u.active).sort((a, b) => b.x - a.x);
    let aheadX = Infinity;
    for (const u of active) {
      const desired = u.x + rateAt(u.x) * 2.6 * delta * speedScale;
      u.x = Math.min(desired, aheadX - GAP);
      aheadX = u.x;
      if (!u.flagged && u.x > inspectionX) u.flagged = true;
      if (u.x > LINE_END) {
        u.active = false;
      }
    }

    // Write instance transforms
    let i = 0;
    for (const u of units.current) {
      if (!u.active) continue;
      dummy.position.set(u.x, DECK_Y + 0.12, u.lane);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      const showDefect = layers.has('quality') && u.defective && u.flagged;
      const c = showDefect ? severityColor.critical : u.flagged ? colorScan : colorNominal;
      mesh.setColorAt(i, c);
      i++;
    }
    // Park unused instances out of sight rather than reallocating the buffer.
    for (; i < MAX_UNITS; i++) {
      dummy.position.set(0, -50, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.count = MAX_UNITS;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  const dim = selection ? 0.55 : 1;

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, MAX_UNITS]} frustumCulled={false}>
      <boxGeometry args={[0.3, 0.2, 0.3]} />
      <meshStandardMaterial
        roughness={0.45}
        metalness={0.45}
        emissiveIntensity={0.25}
        transparent
        opacity={dim}
      />
    </instancedMesh>
  );
}

/** The conveyor deck and its side rails. */
export function Conveyor() {
  return (
    <group>
      <mesh position={[(LINE_START + LINE_END) / 2, DECK_Y - 0.06, 0]} receiveShadow>
        <boxGeometry args={[LINE_END - LINE_START, 0.12, 1.1]} />
        <meshStandardMaterial color="#141B23" roughness={0.75} metalness={0.3} />
      </mesh>
      {[-0.62, 0.62].map((z) => (
        <mesh key={z} position={[(LINE_START + LINE_END) / 2, DECK_Y + 0.02, z]}>
          <boxGeometry args={[LINE_END - LINE_START, 0.06, 0.06]} />
          <meshStandardMaterial color="#2E3A49" roughness={0.35} metalness={0.7} />
        </mesh>
      ))}
    </group>
  );
}
