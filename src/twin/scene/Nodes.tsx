import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useTwin, relevantNodes } from '../state';
import { factoryNodes, hotspots } from '../layout';
import type { FactoryNode } from '../layout';
import { DECK_Y, HEX, mat, severityHex } from './palette';

/**
 * The physical objects on the floor.
 *
 * Every visual property here is bound to data: the status ring takes the
 * station's severity, the plinth glow tracks utilisation, the machine bodies
 * come from the equipment list, and the strobe rate on an abnormal machine
 * follows its measured defect rate. Nothing is decorative.
 */

interface NodeProps {
  node: FactoryNode;
  dimmed: boolean;
}

function StatusRing({ color, radius, active }: { color: string; radius: number; active: boolean }) {
  const ref = useRef<THREE.Mesh>(null);
  const { reducedMotion } = useTwin();
  useFrame(({ clock }) => {
    if (!ref.current || reducedMotion || !active) return;
    const m = ref.current.material as THREE.MeshBasicMaterial;
    m.opacity = 0.35 + Math.sin(clock.elapsedTime * 2.2) * 0.22;
  });
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
      <ringGeometry args={[radius, radius + 0.07, 48]} />
      <meshBasicMaterial color={color} transparent opacity={0.45} side={THREE.DoubleSide} />
    </mesh>
  );
}

/** A machine body. Abnormal machines carry a slow thermal pulse, not a flash. */
function Machine({
  node,
  machine,
  dimmed,
}: {
  node: FactoryNode;
  machine: FactoryNode['machines'][number];
  dimmed: boolean;
}) {
  const { select, setHovered, selection, layers } = useTwin();
  const ref = useRef<THREE.Mesh>(null);
  const { reducedMotion } = useTwin();
  const selected = selection?.kind === 'machine' && selection.id === machine.id;

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const m = ref.current.material as THREE.MeshStandardMaterial;
    const base = machine.flagged ? 0.55 : machine.severity === 'caution' ? 0.16 : 0.06;
    const pulse = machine.flagged && !reducedMotion ? Math.sin(clock.elapsedTime * 1.5) * 0.28 : 0;
    m.emissiveIntensity = (base + pulse) * (dimmed ? 0.25 : 1) * (selected ? 1.4 : 1);
  });

  const color = severityHex[machine.severity];

  return (
    <group position={machine.offset}>
      <mesh
        ref={ref}
        position={[0, 0.85, 0]}
        castShadow
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered({ kind: 'machine', id: machine.id, nodeId: node.id });
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(null);
          document.body.style.cursor = 'auto';
        }}
        onClick={(e) => {
          e.stopPropagation();
          select({ kind: 'machine', id: machine.id, nodeId: node.id });
        }}
      >
        <boxGeometry args={[1.5, 1.7, 1.9]} />
        <meshStandardMaterial
          color={machine.flagged ? '#241A1A' : '#19212B'}
          emissive={color}
          emissiveIntensity={0.08}
          roughness={0.65}
          metalness={0.35}
        />
      </mesh>
      {/* Head unit — reads as a process chamber rather than a plain box */}
      <mesh position={[0, 1.82, -0.25]}>
        <boxGeometry args={[1.0, 0.24, 1.0]} />
        <primitive object={mat.rail} attach="material" />
      </mesh>
      {/* Machine code plate */}
      <Html
        position={[0, 0.5, 1.0]}
        center
        distanceFactor={16}
        style={{ pointerEvents: 'none', opacity: dimmed ? 0.25 : 1 }}
      >
        <span
          className="readout whitespace-nowrap rounded-[2px] border px-1 py-[1px] text-[9px] tracking-widest"
          style={{
            borderColor: machine.flagged ? color : HEX.hairline,
            color: machine.flagged ? color : HEX.inkMuted,
            background: 'rgba(7,9,12,0.72)',
          }}
        >
          {machine.id}
        </span>
      </Html>
      {/* Thermal signature — only drawn when the quality or root-cause layer is on */}
      {machine.flagged && (layers.has('quality') || layers.has('rootcause')) && (
        <ThermalPlume color={color} dimmed={dimmed} />
      )}
    </group>
  );
}

/** Rising signal above an abnormal machine. Represents the measured excursion. */
function ThermalPlume({ color, dimmed }: { color: string; dimmed: boolean }) {
  const ref = useRef<THREE.Points>(null);
  const { reducedMotion } = useTwin();
  const count = 22;
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 0.7;
      arr[i * 3 + 1] = Math.random() * 2.2;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 0.7;
    }
    return arr;
  }, []);

  useFrame((_, delta) => {
    if (!ref.current || reducedMotion) return;
    const p = ref.current.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < count; i++) {
      let y = p.getY(i) + delta * 0.42;
      if (y > 2.4) y = 0;
      p.setY(i, y);
    }
    p.needsUpdate = true;
  });

  return (
    <points ref={ref} position={[0, 1.9, 0]}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={0.085}
        transparent
        opacity={dimmed ? 0.12 : 0.55}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

function NodeBody({ node, dimmed }: NodeProps) {
  const { select, setHovered, selection, layers, sim, simulating } = useTwin();
  const selected = selection?.nodeId === node.id;
  const color = severityHex[node.status];
  const isStation = node.kind === 'station';

  // Constraint pressure comes from the simulator when a lever has moved,
  // otherwise from the measured utilisation.
  const pressure = node.bottleneck
    ? simulating
      ? sim.constraintPressure
      : (node.utilization ?? 0) / 100
    : (node.utilization ?? 0) / 100;

  return (
    <group
      position={node.position}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered({ kind: 'node', id: node.id, nodeId: node.id });
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(null);
        document.body.style.cursor = 'auto';
      }}
      onClick={(e) => {
        e.stopPropagation();
        select({ kind: 'node', id: node.id, nodeId: node.id });
      }}
    >
      {/* Plinth */}
      <mesh position={[0, 0.1, 0]} receiveShadow>
        <boxGeometry args={[isStation ? 3.4 : 2.6, 0.2, isStation ? 3.4 : 2.6]} />
        <primitive object={dimmed ? mat.chassisDark : mat.chassis} attach="material" />
      </mesh>

      {/* Utilisation / pressure bar set into the floor plate */}
      {isStation && (
        <mesh position={[0, 0.21, 1.45]}>
          <boxGeometry args={[Math.max(0.2, Math.min(3.0, 3.0 * pressure)), 0.04, 0.12]} />
          <meshBasicMaterial color={color} transparent opacity={dimmed ? 0.2 : 0.9} />
        </mesh>
      )}

      {(node.bottleneck || selected) && (
        <StatusRing color={color} radius={isStation ? 2.2 : 1.7} active={node.bottleneck} />
      )}

      {/* Machines */}
      {node.machines.map((m) => (
        <Machine key={m.id} node={node} machine={m} dimmed={dimmed} />
      ))}

      {/* Intake / outfeed / inspection get their own silhouettes */}
      {node.kind === 'intake' && (
        <>
          <mesh position={[0, 0.95, 0]}>
            <boxGeometry args={[1.6, 1.5, 2.0]} />
            <primitive object={mat.chassis} attach="material" />
          </mesh>
          <mesh position={[0, 1.78, 0]}>
            <boxGeometry args={[1.9, 0.16, 2.3]} />
            <primitive object={mat.rail} attach="material" />
          </mesh>
        </>
      )}

      {node.kind === 'outfeed' && (
        <>
          <mesh position={[0, 0.75, 0]}>
            <boxGeometry args={[1.8, 1.1, 2.2]} />
            <primitive object={mat.chassis} attach="material" />
          </mesh>
          <mesh position={[0, 1.42, 0]}>
            <boxGeometry args={[1.2, 0.24, 1.2]} />
            <primitive object={mat.deck} attach="material" />
          </mesh>
        </>
      )}

      {node.kind === 'inspection' && <InspectionGantry dimmed={dimmed} active={layers.has('quality')} />}

      {/* Node code */}
      <Html
        position={[0, node.kind === 'station' ? 2.75 : 2.25, 0]}
        center
        distanceFactor={20}
        style={{ pointerEvents: 'none', opacity: dimmed ? 0.3 : 1 }}
      >
        <div className="flex flex-col items-center gap-0.5">
          <span
            className="readout whitespace-nowrap rounded-[2px] border px-1.5 py-[2px] text-[10px] font-medium tracking-[0.18em]"
            style={{
              borderColor: selected ? color : HEX.hairline,
              color: node.bottleneck || selected ? color : HEX.ink,
              background: 'rgba(7,9,12,0.8)',
            }}
          >
            {node.code}
          </span>
          {node.bottleneck && (
            <span className="readout text-[8px] tracking-[0.16em]" style={{ color }}>
              CONSTRAINT
            </span>
          )}
        </div>
      </Html>
    </group>
  );
}

/** Inspection gantry with a sweeping vision bar. */
function InspectionGantry({ dimmed, active }: { dimmed: boolean; active: boolean }) {
  const beam = useRef<THREE.Mesh>(null);
  const { reducedMotion } = useTwin();
  useFrame(({ clock }) => {
    if (!beam.current || reducedMotion) return;
    beam.current.position.x = Math.sin(clock.elapsedTime * 1.1) * 1.05;
  });
  return (
    <group>
      <mesh position={[-1.5, 1.3, 0]}>
        <boxGeometry args={[0.16, 2.4, 0.16]} />
        <primitive object={mat.rail} attach="material" />
      </mesh>
      <mesh position={[1.5, 1.3, 0]}>
        <boxGeometry args={[0.16, 2.4, 0.16]} />
        <primitive object={mat.rail} attach="material" />
      </mesh>
      <mesh position={[0, 2.45, 0]}>
        <boxGeometry args={[3.2, 0.2, 0.7]} />
        <primitive object={mat.chassis} attach="material" />
      </mesh>
      <mesh ref={beam} position={[0, 0.9, 0]}>
        <boxGeometry args={[0.05, 1.0, 1.5]} />
        <meshBasicMaterial
          color={HEX.signalBright}
          transparent
          opacity={dimmed ? 0.08 : active ? 0.5 : 0.22}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

/** Hotspot markers — the clickable evidence anchors. */
function Hotspot({ id, dimmed }: { id: string; dimmed: boolean }) {
  const spot = hotspots.find((h) => h.id === id)!;
  const node = factoryNodes.find((n) => n.id === spot.nodeId)!;
  const { select, selection, setHovered, reducedMotion } = useTwin();
  const ref = useRef<THREE.Mesh>(null);
  const selected = selection?.kind === 'hotspot' && selection.id === spot.id;
  const color = severityHex[spot.severity];

  useFrame(({ clock }) => {
    if (!ref.current) return;
    if (!reducedMotion) {
      ref.current.rotation.y = clock.elapsedTime * 0.8;
      ref.current.position.y = spot.offset[1] + Math.sin(clock.elapsedTime * 1.6) * 0.09;
    }
    const m = ref.current.material as THREE.MeshBasicMaterial;
    m.opacity = dimmed ? 0.2 : selected ? 1 : 0.85;
  });

  return (
    <group position={[node.position[0] + spot.offset[0], 0, node.position[2] + spot.offset[2]]}>
      <mesh
        ref={ref}
        position={[0, spot.offset[1], 0]}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered({ kind: 'hotspot', id: spot.id, nodeId: spot.nodeId });
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(null);
          document.body.style.cursor = 'auto';
        }}
        onClick={(e) => {
          e.stopPropagation();
          select({ kind: 'hotspot', id: spot.id, nodeId: spot.nodeId });
        }}
      >
        <octahedronGeometry args={[0.2, 0]} />
        <meshBasicMaterial color={color} transparent opacity={0.85} />
      </mesh>
      {/* Tether to the floor so the marker reads as attached, not floating */}
      <mesh position={[0, spot.offset[1] / 2, 0]}>
        <cylinderGeometry args={[0.012, 0.012, spot.offset[1], 4]} />
        <meshBasicMaterial color={color} transparent opacity={dimmed ? 0.1 : 0.32} />
      </mesh>
      {selected && (
        <Html position={[0, spot.offset[1] + 0.55, 0]} center distanceFactor={18} style={{ pointerEvents: 'none' }}>
          <span
            className="readout whitespace-nowrap rounded-[2px] border px-1.5 py-[2px] text-[9px] tracking-wider"
            style={{ borderColor: color, color, background: 'rgba(7,9,12,0.85)' }}
          >
            {spot.label}
          </span>
        </Html>
      )}
    </group>
  );
}

export function FactoryNodes() {
  const { mode, focusDimension, selection, layers } = useTwin();
  const relevant = relevantNodes(mode, focusDimension);

  return (
    <group>
      {factoryNodes.map((node) => {
        const dimmed =
          (selection ? selection.nodeId !== node.id : false) ||
          (relevant ? !relevant.has(node.id) : false);
        return <NodeBody key={node.id} node={node} dimmed={dimmed} />;
      })}

      {(layers.has('quality') || layers.has('confidence') || layers.has('rootcause')) &&
        hotspots
          .filter((h) => (h.kind === 'novel' ? layers.has('confidence') || layers.has('quality') : true))
          .map((h) => (
            <Hotspot
              key={h.id}
              id={h.id}
              dimmed={selection ? selection.nodeId !== h.nodeId && selection.id !== h.id : false}
            />
          ))}
    </group>
  );
}

export { DECK_Y };
