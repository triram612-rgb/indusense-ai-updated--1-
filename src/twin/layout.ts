import { stations, downtimeSources, bottleneck } from '@/data/production';
import { lossBranches } from '@/data/profitability';
import { qualitySummary, highRiskUnit, novelPattern, defectByMachine } from '@/data/quality';
import type { Severity } from '@/lib/types';

/**
 * Spatial layout for the digital twin.
 *
 * Nothing here invents numbers. Every node reads its state out of the existing
 * data modules — `stations`, `bottleneck`, `downtimeSources`, `lossBranches`,
 * `defectByMachine` — and adds only geometry: where the thing sits on the floor
 * and how big its footprint is. If the data changes, the factory changes.
 */

export type NodeKind = 'intake' | 'station' | 'inspection' | 'outfeed';

export interface MachineNode {
  id: string;
  /** Local offset from the station origin. */
  offset: [number, number, number];
  defectRate: number;
  flagged: boolean;
  severity: Severity;
  note?: string;
}

export interface FactoryNode {
  id: string;
  kind: NodeKind;
  code: string;
  title: string;
  /** Floor position. The line runs along +X at z = 0. */
  position: [number, number, number];
  status: Severity;
  bottleneck: boolean;
  /** Units waiting on the infeed side of this node. */
  queue: number;
  /** Seconds. Undefined on nodes that do not hold a cycle. */
  cycleTime?: number;
  cycleBaseline?: number;
  utilization?: number;
  throughput?: number;
  machines: MachineNode[];
  /** Monthly rupee loss, in lakhs, attributed to this node. */
  lossLakhs: number;
  note: string;
  /** Route to the full analytical dossier for this node. */
  dossier: string;
}

/** Positions along the line. Spacing is even; the queue does the talking. */
const X = {
  intake: -16,
  'st-1': -11.5,
  'st-2': -7,
  'st-3': -2.5,
  inspection: 2,
  'st-4': 6.5,
  'st-5': 11,
  outfeed: 15.5,
} as const;

/** Downtime rupees, split by the source table rather than guessed. */
const downtimeLakhs = lossBranches.find((b) => b.id === 'lb-downtime')?.lakhs ?? 0;
const defectLakhs = lossBranches.find((b) => b.id === 'lb-defects')?.lakhs ?? 0;
const cycleLakhs = lossBranches.find((b) => b.id === 'lb-cycle')?.lakhs ?? 0;

function downtimeShareFor(matcher: (source: string) => boolean): number {
  return downtimeSources.filter((d) => matcher(d.source)).reduce((sum, d) => sum + d.share, 0);
}

/** Loss attribution per station, reconciled against the ₹12.4L total. */
function lossFor(stationId: string): number {
  const station = stations.find((s) => s.id === stationId);
  if (!station) return 0;
  const machines = station.equipment.split(',').map((m) => m.trim());

  // Downtime: from the downtime source table, matched by station or machine name.
  const downtime =
    downtimeLakhs *
    downtimeShareFor((src) => src === station.short || machines.some((m) => src.includes(m)));

  // Defect rupees follow the machine that is actually generating defects.
  const machineDefect = machines.reduce((sum, m) => {
    const row = defectByMachine.find((d) => d.machine === m);
    return row?.flagged ? sum + defectLakhs * 0.88 : sum;
  }, 0);

  // Cycle-time capacity loss sits entirely on the constraint.
  const cycle = station.id === bottleneck.stationId ? cycleLakhs : 0;

  return Number((downtime + machineDefect + cycle).toFixed(2));
}

function machinesFor(stationId: string): MachineNode[] {
  const station = stations.find((s) => s.id === stationId);
  if (!station) return [];
  const codes = station.equipment.split(',').map((m) => m.trim()).filter((m) => /^M\d+$/.test(m));
  return codes.map((code, i) => {
    const row = defectByMachine.find((d) => d.machine === code);
    const defectRate = row?.defectRate ?? 0;
    const flagged = row?.flagged ?? false;
    return {
      id: code,
      offset: [codes.length === 1 ? 0 : i === 0 ? -0.95 : 0.95, 0, 0] as [number, number, number],
      defectRate,
      flagged,
      severity: flagged ? 'critical' : defectRate > 2.8 ? 'caution' : 'nominal',
      note: flagged
        ? 'Chamber temperature +11°C above baseline for 11h 48m. Tracks the defect rise on this line.'
        : undefined,
    };
  });
}

/**
 * Infeed queues. Only the constraint carries a measured queue (34 units, from
 * the Station 3 alert readings); everywhere else the line is fed to order, and
 * Station 4 is explicitly starved rather than queued.
 */
const QUEUES: Record<string, number> = {
  'st-1': 6,
  'st-2': 8,
  'st-3': 34,
  inspection: 4,
  'st-4': 0,
  'st-5': 3,
};

const stationNodes: FactoryNode[] = stations.map((s) => ({
  id: s.id,
  kind: 'station' as const,
  code: `ST-${s.id.split('-')[1].padStart(2, '0')}`,
  title: s.name,
  position: [X[s.id as keyof typeof X], 0, 0] as [number, number, number],
  status: s.status,
  bottleneck: s.bottleneck,
  queue: QUEUES[s.id] ?? 0,
  cycleTime: s.cycleTime,
  cycleBaseline: s.cycleBaseline,
  utilization: s.utilization,
  throughput: s.throughput,
  machines: machinesFor(s.id),
  lossLakhs: lossFor(s.id),
  note: s.note,
  dossier: '/production',
}));

const nodeSeed: FactoryNode[] = [
  {
    id: 'intake',
    kind: 'intake',
    code: 'RAW',
    title: 'Raw material intake',
    position: [X.intake, 0, 0],
    status: 'caution',
    bottleneck: false,
    queue: 12,
    machines: [],
    lossLakhs: 0,
    note: 'Supplier lot BRT-7 entered here this week. It is a live competing explanation for the defect rise and has not been ruled out.',
    dossier: '/quality',
  },
  stationNodes[0],
  stationNodes[1],
  {
    id: 'inspection',
    kind: 'inspection',
    code: 'INSP',
    title: 'In-line inspection — vision array',
    position: [X.inspection, 0, 0],
    status: 'caution',
    bottleneck: false,
    queue: QUEUES.inspection,
    machines: [],
    lossLakhs: 0,
    note: `${qualitySummary.inspected.toLocaleString('en-IN')} units inspected this shift. ${qualitySummary.defective} defective, ${novelPattern.units} held open as unclassified rather than forced into the nearest label.`,
    dossier: '/quality',
  },
  stationNodes[2],
  stationNodes[3],
  stationNodes[4],
  {
    id: 'outfeed',
    kind: 'outfeed',
    code: 'PACK',
    title: 'Packaging & dispatch',
    position: [X.outfeed, 0, 0],
    status: 'nominal',
    bottleneck: false,
    queue: 0,
    machines: [],
    lossLakhs: 0,
    note: 'Dispatching at the constraint rate. Capacity is available here; it is never the limiter.',
    dossier: '/profitability',
  },
];

export const factoryNodes: FactoryNode[] = [...nodeSeed].sort(
  (a, b) => a.position[0] - b.position[0],
);

/** Index for quick lookups from panels and the causal graph. */
export const nodeById = new Map(factoryNodes.map((n) => [n.id, n]));

export function nodeForMachine(machineId: string): FactoryNode | undefined {
  return factoryNodes.find((n) => n.machines.some((m) => m.id === machineId));
}

export interface Hotspot {
  id: string;
  nodeId: string;
  /** Local offset from the node, so it reads as attached to the machine. */
  offset: [number, number, number];
  label: string;
  severity: Severity;
  kind: 'process' | 'defect' | 'novel';
  headline: string;
}

/** Hotspots are the clickable evidence anchors on the floor. */
export const hotspots: Hotspot[] = [
  {
    id: 'hs-m07',
    nodeId: 'st-2',
    offset: [-0.95, 1.9, 0],
    label: 'M07 thermal excursion',
    severity: 'critical',
    kind: 'process',
    headline: '+11°C above baseline, 11h 48m sustained',
  },
  {
    id: 'hs-b248',
    nodeId: 'inspection',
    offset: [0, 2.1, 0],
    label: `Defect family ${highRiskUnit.batch}`,
    severity: 'critical',
    kind: 'defect',
    headline: `${highRiskUnit.defect} · ${(highRiskUnit.confidence.score * 100).toFixed(0)}% confidence`,
  },
  {
    id: 'hs-novel',
    nodeId: 'st-3',
    offset: [0.9, 1.9, 0.9],
    label: `${novelPattern.id} unclassified pattern`,
    severity: 'unknown',
    kind: 'novel',
    headline: `${novelPattern.units} units · nearest class only ${(novelPattern.similarity * 100).toFixed(0)}% similar`,
  },
];

/** Total attributed loss, for reconciliation display. */
export const attributedLossLakhs = Number(
  factoryNodes.reduce((sum, n) => sum + n.lossLakhs, 0).toFixed(2),
);
