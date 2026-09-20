import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html, Line } from '@react-three/drei';
import { useTwin } from '../state';
import { factoryNodes, nodeById, attributedLossLakhs } from '../layout';
import { financialSummary } from '@/data/profitability';
import { HEX, severityHex } from './palette';
import type { CausalChain } from '../causal';

/**
 * The causal graph and the financial layer.
 *
 * The causal graph is drawn between the real objects it implicates — the link
 * from M07 to the inspection gantry physically crosses the floor between them —
 * so the reasoning is spatial rather than a flowchart parked beside the scene.
 */

function anchorFor(nodeId: string, lift: number): THREE.Vector3 {
  const node = nodeById.get(nodeId);
  const p = node?.position ?? [0, 0, 0];
  return new THREE.Vector3(p[0], lift, p[2]);
}

/** One animated segment between two causal steps. */
function CausalSegment({
  from,
  to,
  color,
  index,
  dashed,
}: {
  from: THREE.Vector3;
  to: THREE.Vector3;
  color: string;
  index: number;
  dashed: boolean;
}) {
  const { reducedMotion } = useTwin();
  const particles = useRef<THREE.Points>(null);

  const curve = useMemo(() => {
    const mid = from.clone().lerp(to, 0.5);
    // Lift the arc and push it off the line so links never sit on the conveyor.
    mid.y += 0.9 + index * 0.12;
    mid.z += from.z === to.z ? 2.4 : 0;
    return new THREE.QuadraticBezierCurve3(from, mid, to);
  }, [from, to, index]);

  const points = useMemo(() => curve.getPoints(48).map((p) => [p.x, p.y, p.z] as [number, number, number]), [curve]);

  const particleCount = 10;
  const offsets = useMemo(
    () => Array.from({ length: particleCount }, (_, i) => i / particleCount),
    [],
  );
  const positions = useMemo(() => new Float32Array(particleCount * 3), []);

  useFrame(({ clock }) => {
    if (!particles.current || reducedMotion) return;
    const attr = particles.current.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < particleCount; i++) {
      const t = (offsets[i] + clock.elapsedTime * 0.26 - index * 0.06) % 1;
      const p = curve.getPoint(t < 0 ? t + 1 : t);
      attr.setXYZ(i, p.x, p.y, p.z);
    }
    attr.needsUpdate = true;
  });

  return (
    <group>
      <Line
        points={points}
        color={color}
        lineWidth={1.4}
        transparent
        opacity={0.45}
        dashed={dashed}
        dashSize={0.24}
        gapSize={0.18}
      />
      <points ref={particles}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial color={color} size={0.14} transparent opacity={0.9} depthWrite={false} sizeAttenuation />
      </points>
    </group>
  );
}

export function CausalGraph() {
  const { activeChain, layers } = useTwin();
  if (!activeChain || !layers.has('rootcause')) return null;
  return <ChainRender chain={activeChain} />;
}

function ChainRender({ chain }: { chain: CausalChain }) {
  const anchors = chain.steps.map((s) => anchorFor(s.nodeId, s.lift));

  return (
    <group>
      {chain.steps.slice(0, -1).map((step, i) => (
        <CausalSegment
          key={step.id}
          from={anchors[i]}
          to={anchors[i + 1]}
          color={severityHex[chain.steps[i + 1].severity]}
          index={i}
          /* An unproven link is drawn dashed. The novel chain is dashed throughout. */
          dashed={chain.severity === 'unknown' || chain.steps[i + 1].stage === 'defect'}
        />
      ))}

      {chain.steps.map((step, i) => (
        <group key={step.id} position={anchors[i]}>
          <mesh>
            <sphereGeometry args={[0.1, 10, 10]} />
            <meshBasicMaterial color={severityHex[step.severity]} />
          </mesh>
          <Html center distanceFactor={19} position={[0, 0.42, 0]} style={{ pointerEvents: 'none' }}>
            <div
              className="whitespace-nowrap rounded-[2px] border px-1.5 py-[3px] text-center"
              style={{
                borderColor: severityHex[step.severity],
                background: 'rgba(7,9,12,0.86)',
                minWidth: 96,
              }}
            >
              <div className="text-[8px] uppercase tracking-[0.16em]" style={{ color: HEX.inkMuted }}>
                {i + 1} · {step.label}
              </div>
              <div className="readout text-[10px] font-medium" style={{ color: severityHex[step.severity] }}>
                {step.value}
              </div>
            </div>
          </Html>
        </group>
      ))}
    </group>
  );
}

/**
 * Financial layer — loss rendered as vertical mass above the station that
 * generates it. Height is rupees; nothing is normalised away.
 */
export function FinancialMass() {
  const { layers, selection, select, simulating, sim } = useTwin();
  if (!layers.has('financial')) return null;

  const scale = simulating ? sim.lossLakhs / financialSummary.monthlyLossLakhs : 1;

  return (
    <group>
      {factoryNodes
        .filter((n) => n.lossLakhs > 0.05)
        .map((n) => {
          const lakhs = Number((n.lossLakhs * scale).toFixed(2));
          const h = lakhs * 0.62;
          const dimmed = selection ? selection.nodeId !== n.id : false;
          const color = lakhs > 4 ? severityHex.critical : lakhs > 2 ? severityHex.caution : HEX.signal;
          return (
            <group key={n.id} position={[n.position[0], 0, n.position[2] - 2.9]}>
              <mesh
                position={[0, h / 2 + 0.1, 0]}
                onClick={(e) => {
                  e.stopPropagation();
                  select({ kind: 'node', id: n.id, nodeId: n.id });
                }}
                onPointerOver={() => (document.body.style.cursor = 'pointer')}
                onPointerOut={() => (document.body.style.cursor = 'auto')}
              >
                <boxGeometry args={[0.85, h, 0.85]} />
                <meshStandardMaterial
                  color={color}
                  transparent
                  opacity={dimmed ? 0.14 : 0.32}
                  emissive={color}
                  emissiveIntensity={dimmed ? 0.05 : 0.3}
                  roughness={0.3}
                />
              </mesh>
              <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[1.1, 1.1]} />
                <meshBasicMaterial color={color} transparent opacity={dimmed ? 0.1 : 0.28} />
              </mesh>
              <Html center distanceFactor={20} position={[0, h + 0.5, 0]} style={{ pointerEvents: 'none' }}>
                <span
                  className="readout whitespace-nowrap rounded-[2px] border px-1.5 py-[2px] text-[10px]"
                  style={{
                    borderColor: color,
                    color,
                    background: 'rgba(7,9,12,0.82)',
                    opacity: dimmed ? 0.35 : 1,
                  }}
                >
                  ₹{lakhs.toFixed(2)}L
                </span>
              </Html>
            </group>
          );
        })}

      {/* Reconciliation note, anchored to the floor rather than the viewport */}
      <Html position={[factoryNodes[0].position[0] - 1, 0.2, -3]} distanceFactor={26} style={{ pointerEvents: 'none' }}>
        <div className="w-44 text-[9px] leading-relaxed" style={{ color: HEX.inkMuted }}>
          <span className="readout" style={{ color: HEX.ink }}>
            ₹{(attributedLossLakhs * scale).toFixed(1)}L
          </span>{' '}
          attributed of ₹{(financialSummary.monthlyLossLakhs * scale).toFixed(1)}L total. The remainder is unattributed
          and is not forced onto a station.
        </div>
      </Html>
    </group>
  );
}
