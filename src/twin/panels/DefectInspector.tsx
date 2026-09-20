import { useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';
import { X } from 'lucide-react';
import { highRiskUnit } from '@/data/quality';
import { cn, severityTokens } from '@/lib/severity';
import { ConfidenceBar, ContributionBars, EvidenceCard } from '@/components/ui';
import { HEX, severityHex } from '../scene/palette';

/**
 * Close inspection of a single unit.
 *
 * The geometry is a synthetic stand-in for the real component — a bracket form
 * that carries a weld seam and a flange, which is enough to localise a defect
 * against. It is labelled as a visualisation everywhere it appears, because
 * dressing procedural geometry up as a scan would be the exact dishonesty this
 * platform exists to avoid.
 */

interface Region {
  id: string;
  label: string;
  position: [number, number, number];
  /** Model's defect intensity at this region, 0–1. */
  intensity: number;
  finding: string;
}

/** Regions come from the contributing-factor set on the inspected unit. */
const REGIONS: Region[] = [
  {
    id: 'r-03',
    label: 'Inspection region 03 — weld seam',
    position: [0.62, 0.28, 0.34],
    intensity: 0.94,
    finding: 'Surface crack signature along the seam, consistent with thermal excursion during forming.',
  },
  {
    id: 'r-01',
    label: 'Inspection region 01 — flange face',
    position: [-0.72, 0.1, 0.3],
    intensity: 0.22,
    finding: 'Within tolerance. Included so the localisation can be read as specific rather than global.',
  },
  {
    id: 'r-05',
    label: 'Inspection region 05 — clamp boss',
    position: [0.1, -0.34, -0.44],
    intensity: 0.41,
    finding: 'Mild deviation. Tracks the clamp pressure running 2.1σ below setpoint.',
  },
];

function Component({ selected, onSelect }: { selected: string; onSelect: (id: string) => void }) {
  const group = useRef<THREE.Group>(null);
  useFrame((_, d) => {
    if (group.current) group.current.rotation.y += d * 0.12;
  });

  return (
    <group ref={group}>
      {/* Body */}
      <mesh castShadow>
        <boxGeometry args={[1.9, 0.6, 1.0]} />
        <meshStandardMaterial color="#39434F" roughness={0.42} metalness={0.72} />
      </mesh>
      {/* Flange */}
      <mesh position={[-0.95, 0, 0]}>
        <boxGeometry args={[0.18, 1.1, 1.2]} />
        <meshStandardMaterial color="#323C47" roughness={0.5} metalness={0.66} />
      </mesh>
      {/* Weld seam ridge */}
      <mesh position={[0.45, 0.31, 0.3]} rotation={[0, 0, 0]}>
        <boxGeometry args={[0.9, 0.05, 0.1]} />
        <meshStandardMaterial color="#4A5563" roughness={0.6} metalness={0.5} />
      </mesh>
      {/* Boss */}
      <mesh position={[0.1, -0.34, -0.4]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 0.2, 16]} />
        <meshStandardMaterial color="#39434F" roughness={0.45} metalness={0.7} />
      </mesh>

      {REGIONS.map((r) => {
        const color =
          r.intensity > 0.7 ? severityHex.critical : r.intensity > 0.35 ? severityHex.caution : severityHex.nominal;
        const on = selected === r.id;
        return (
          <group key={r.id} position={r.position}>
            <mesh
              onClick={(e) => {
                e.stopPropagation();
                onSelect(r.id);
              }}
              onPointerOver={() => (document.body.style.cursor = 'pointer')}
              onPointerOut={() => (document.body.style.cursor = 'auto')}
            >
              <sphereGeometry args={[on ? 0.17 : 0.12, 14, 14]} />
              <meshBasicMaterial color={color} transparent opacity={0.55 + r.intensity * 0.35} />
            </mesh>
            {/* Heat halo scaled by model intensity */}
            <mesh>
              <sphereGeometry args={[0.16 + r.intensity * 0.28, 16, 16]} />
              <meshBasicMaterial color={color} transparent opacity={0.1 + r.intensity * 0.12} depthWrite={false} />
            </mesh>
            {on && (
              <Html center distanceFactor={7} position={[0, 0.35, 0]} style={{ pointerEvents: 'none' }}>
                <span
                  className="readout whitespace-nowrap rounded-[2px] border px-1.5 py-[2px] text-[9px]"
                  style={{ borderColor: color, color, background: 'rgba(7,9,12,0.9)' }}
                >
                  {r.id.toUpperCase()} · {(r.intensity * 100).toFixed(0)}%
                </span>
              </Html>
            )}
          </group>
        );
      })}
    </group>
  );
}

export function DefectInspector({ onClose }: { onClose: () => void }) {
  const [region, setRegion] = useState('r-03');
  const active = REGIONS.find((r) => r.id === region)!;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-void/95 backdrop-blur-sm lg:flex-row">
      <div className="relative min-h-[46vh] flex-1">
        <Canvas camera={{ position: [2.6, 1.8, 3.2], fov: 42 }} dpr={[1, 1.6]}>
          <color attach="background" args={[HEX.void]} />
          <ambientLight intensity={0.7} />
          <directionalLight position={[4, 6, 5]} intensity={1.2} />
          <directionalLight position={[-5, 2, -4]} intensity={0.4} color={HEX.signal} />
          <Component selected={region} onSelect={setRegion} />
          <gridHelper args={[8, 16, new THREE.Color('#1B242F'), new THREE.Color('#111821')]} position={[0, -0.9, 0]} />
          <OrbitControls enablePan={false} minDistance={2} maxDistance={8} />
        </Canvas>

        <div className="pointer-events-none absolute left-3 top-3 space-y-1">
          <span className="readout block w-fit rounded-[2px] border border-unknown/50 bg-unknown/10 px-2 py-1 text-[9px] uppercase tracking-[0.16em] text-unknown">
            Synthetic visualisation — not a scan
          </span>
          <span className="block max-w-[280px] text-[9px] leading-relaxed text-ink-faint">
            Representative geometry used to localise the defect. Region positions come from the inspection record; the
            body shape does not.
          </span>
        </div>

        <span className="pointer-events-none absolute bottom-3 left-3 text-[9px] text-ink-faint">
          Drag to rotate · scroll to zoom · click a marker to select a region
        </span>
      </div>

      <aside className="flex w-full flex-col gap-2 overflow-y-auto border-t border-hairline p-3 lg:w-[380px] lg:border-l lg:border-t-0">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <div className="readout text-[9px] uppercase tracking-[0.16em] text-critical">Defect detected</div>
            <h2 className="mt-1 text-sm font-medium text-ink">
              {highRiskUnit.defect} · {highRiskUnit.productId}
            </h2>
            <p className="readout mt-0.5 text-[10px] text-ink-faint">
              {highRiskUnit.batch} · {highRiskUnit.machine} · {highRiskUnit.station} · {highRiskUnit.inspectedAt}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[2px] border border-hairline p-1.5 text-ink-muted hover:border-edge hover:text-ink"
            aria-label="Close inspection"
          >
            <X className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        </div>

        <div className="plate p-2.5">
          <dl className="space-y-1.5">
            <Row k="Classification" v="Known defect" tone="nominal" />
            <Row k="Severity" v={highRiskUnit.severity} tone="critical" />
            <Row k="Localization" v={active.label} />
            <Row k="Region intensity" v={`${(active.intensity * 100).toFixed(0)}%`} />
          </dl>
          <p className="mt-2 border-t border-hairline pt-2 text-[10px] leading-relaxed text-ink-muted">
            {active.finding}
          </p>
        </div>

        <div className="plate p-2.5">
          <div className="mb-1.5 text-[9px] uppercase tracking-[0.16em] text-ink-faint">Classification confidence</div>
          <ConfidenceBar confidence={highRiskUnit.confidence} />
          <p className="mt-2 text-[10px] leading-relaxed text-ink-faint">{highRiskUnit.limitation}</p>
        </div>

        <ContributionBars
          factors={highRiskUnit.factors}
          title="Contributing factors"
          chipLabel="Contribution share"
        />

        <EvidenceCard evidence={highRiskUnit.evidence} />
      </aside>
    </div>
  );
}

function Row({ k, v, tone }: { k: string; v: string; tone?: keyof typeof severityTokens }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-[10px] text-ink-faint">{k}</span>
      <span className={cn('readout text-[11px]', tone ? severityTokens[tone].text : 'text-ink')}>{v}</span>
    </div>
  );
}
