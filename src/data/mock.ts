import type {
  Alert,
  DataStream,
  DecisionRecord,
  DefectClass,
  LineState,
  MetricValue,
  ModelCard,
  Plant,
  SeriesPoint,
} from '@/lib/types';

/**
 * Mock plant telemetry. Structured exactly as a real feed would be so the
 * components never have to change when a backend is wired in.
 */

export const plants: Plant[] = [
  { id: 'plt-hyd-01', name: 'Hyderabad Assembly', location: 'Telangana, IN', shift: 'Shift B · 14:00–22:00', status: 'caution' },
  { id: 'plt-pun-02', name: 'Pune Stamping', location: 'Maharashtra, IN', shift: 'Shift B · 14:00–22:00', status: 'nominal' },
  { id: 'plt-chn-03', name: 'Chennai Powertrain', location: 'Tamil Nadu, IN', shift: 'Shift C · 22:00–06:00', status: 'critical' },
];

export const headlineMetrics: Record<string, MetricValue> = {
  firstPassYield: { value: 94.2, unit: '%', uncertainty: 0.6, provenance: 'measured', deltaPct: -1.8, trend: 'down' },
  oee: { value: 78.4, unit: '%', uncertainty: 1.1, provenance: 'measured', deltaPct: -3.2, trend: 'down' },
  throughput: { value: 1_284, unit: 'units/shift', uncertainty: 42, provenance: 'measured', deltaPct: 2.1, trend: 'up' },
  scrapCost: { value: 41_600, unit: '₹/shift', uncertainty: 6_200, provenance: 'projected', deltaPct: 18.4, trend: 'up' },
  unclassifiedRate: { value: 6.8, unit: '%', uncertainty: 1.4, provenance: 'measured', deltaPct: 41.0, trend: 'up' },
  marginAtRisk: { value: 2.9, unit: '% of shift margin', uncertainty: 0.8, provenance: 'simulated', deltaPct: 12.0, trend: 'up' },
};

export const yieldSeries: SeriesPoint[] = [
  { t: '06:00', yield: 96.8, target: 96, unclassified: 1.1 },
  { t: '08:00', yield: 96.2, target: 96, unclassified: 1.4 },
  { t: '10:00', yield: 95.9, target: 96, unclassified: 2.0 },
  { t: '12:00', yield: 95.1, target: 96, unclassified: 3.2 },
  { t: '14:00', yield: 94.6, target: 96, unclassified: 4.6 },
  { t: '16:00', yield: 94.2, target: 96, unclassified: 6.1 },
  { t: '18:00', yield: 93.4, target: 96, unclassified: 6.8 },
];

export const throughputSeries: SeriesPoint[] = [
  { t: '06:00', actual: 168, planned: 172, downtime: 4 },
  { t: '08:00', actual: 171, planned: 172, downtime: 2 },
  { t: '10:00', actual: 164, planned: 172, downtime: 9 },
  { t: '12:00', actual: 149, planned: 172, downtime: 21 },
  { t: '14:00', actual: 158, planned: 172, downtime: 14 },
  { t: '16:00', actual: 142, planned: 172, downtime: 27 },
  { t: '18:00', actual: 132, planned: 172, downtime: 33 },
];

export const marginSeries: SeriesPoint[] = [
  { t: 'W-5', margin: 18.2, scenario: 18.2 },
  { t: 'W-4', margin: 18.0, scenario: 18.0 },
  { t: 'W-3', margin: 17.4, scenario: 17.4 },
  { t: 'W-2', margin: 17.1, scenario: 17.1 },
  { t: 'W-1', margin: 16.6, scenario: 16.6 },
  { t: 'Now', margin: 16.2, scenario: 16.2 },
  { t: 'W+1', scenario: 15.4 },
  { t: 'W+2', scenario: 14.9 },
];

export const defectClasses: DefectClass[] = [
  {
    id: 'dc-01',
    label: 'Weld porosity',
    count: 148,
    novel: false,
    confidence: { score: 0.93, sampleSize: 148 },
    topFactors: ['Shield gas flow ↓ 12%', 'Torch angle drift', 'Ambient humidity'],
  },
  {
    id: 'dc-02',
    label: 'Surface scoring',
    count: 91,
    novel: false,
    confidence: { score: 0.86, sampleSize: 91 },
    topFactors: ['Tool wear cycle 4,200+', 'Feed rate variance'],
  },
  {
    id: 'dc-03',
    label: 'Unclassified cluster #7',
    count: 62,
    novel: true,
    confidence: {
      score: 0.31,
      sampleSize: 62,
      abstained: true,
      note: 'Visual signature does not match any trained class above threshold. Routed for engineer review rather than forced into the nearest label.',
    },
    topFactors: ['Appeared after 14:10 material lot change', 'Localised to Line 3 fixtures 5–8'],
  },
  {
    id: 'dc-04',
    label: 'Dimensional out-of-tol',
    count: 37,
    novel: false,
    confidence: { score: 0.78, sampleSize: 37, note: 'CMM sampling rate reduced this shift.' },
    topFactors: ['Fixture clamp pressure', 'Thermal growth in cell 2'],
  },
];

export const lines: LineState[] = [
  { id: 'ln-01', name: 'Line 1 — Body weld', cell: 'Cell A', oee: 86.1, throughput: { value: 172, unit: 'u/h', provenance: 'measured', trend: 'flat' }, status: 'nominal', bottleneck: false, driftScore: 0.12 },
  { id: 'ln-02', name: 'Line 2 — Machining', cell: 'Cell B', oee: 81.3, throughput: { value: 164, unit: 'u/h', provenance: 'measured', trend: 'down' }, status: 'caution', bottleneck: false, driftScore: 0.34 },
  { id: 'ln-03', name: 'Line 3 — Final assembly', cell: 'Cell C', oee: 61.7, throughput: { value: 132, unit: 'u/h', uncertainty: 8, provenance: 'measured', trend: 'down' }, status: 'critical', bottleneck: true, driftScore: 0.71 },
  { id: 'ln-04', name: 'Line 4 — Paint', cell: 'Cell C', oee: 88.9, throughput: { value: 180, unit: 'u/h', provenance: 'measured', trend: 'up' }, status: 'nominal', bottleneck: false, driftScore: 0.08 },
];

export const alerts: Alert[] = [
  {
    id: 'al-01',
    title: 'Novel defect signature on Line 3',
    detail:
      'A cluster of 62 parts shares a visual signature the vision model will not assign to a known class. Flagged as unknown rather than merged into weld porosity.',
    severity: 'unknown',
    layer: 'quality',
    raisedAt: '18:04',
    confidence: {
      score: 0.31,
      sampleSize: 62,
      abstained: true,
      note: 'Below the 0.70 classification threshold on all 14 trained classes.',
    },
    estimatedImpact: { value: 118_000, unit: '₹ if trend holds to shift end', uncertainty: 34_000, provenance: 'projected' },
    evidence: [
      { id: 'ev-01', source: 'Vision model v4.2', claim: 'Embedding distance to nearest class centroid is 2.6σ.', weight: 0.82, timestamp: '18:04', integrity: 0.98 },
      { id: 'ev-02', source: 'MES material log', claim: 'Lot change to supplier BRT-7 recorded at 14:10.', weight: 0.64, timestamp: '14:10', integrity: 1 },
      { id: 'ev-03', source: 'Fixture telemetry L3', claim: 'Defects localise to fixtures 5–8 only.', weight: 0.57, timestamp: '17:40', integrity: 0.72 },
    ],
  },
  {
    id: 'al-02',
    title: 'Line 3 is the binding constraint',
    detail: 'Final assembly has held below planned rate for four consecutive intervals, starving downstream paint buffer.',
    severity: 'critical',
    layer: 'production',
    raisedAt: '17:20',
    confidence: { score: 0.91, sampleSize: 480 },
    estimatedImpact: { value: 214, unit: 'units lost this shift', uncertainty: 26, provenance: 'projected' },
    evidence: [
      { id: 'ev-04', source: 'PLC cycle counters', claim: 'Cycle time up 19% versus 30-day baseline.', weight: 0.88, timestamp: '17:18', integrity: 1 },
      { id: 'ev-05', source: 'Buffer sensors', claim: 'Paint infeed buffer starved for 41 minutes.', weight: 0.71, timestamp: '17:05', integrity: 0.95 },
    ],
  },
  {
    id: 'al-03',
    title: 'Overtime call resembles a past loss pattern',
    detail:
      'The pending overtime approval for Cell C matches three historical decisions that preceded elevated defect rates in the following shift.',
    severity: 'caution',
    layer: 'decision',
    raisedAt: '18:12',
    confidence: { score: 0.68, sampleSize: 23, note: 'Only 23 comparable situations in the decision history.' },
    estimatedImpact: { value: 62_000, unit: '₹ expected next-shift rework', uncertainty: 28_000, provenance: 'simulated' },
    evidence: [
      { id: 'ev-06', source: 'Decision history', claim: '3 of 4 similar overtime approvals were followed by a yield drop above 1.2 pts.', weight: 0.74, timestamp: 'Historical', integrity: 0.86 },
      { id: 'ev-07', source: 'Labour roster', claim: 'Cell C crew is already 9.5 hours into the shift.', weight: 0.66, timestamp: '18:00', integrity: 1 },
    ],
  },
  {
    id: 'al-04',
    title: 'Scrap cost tracking above plan',
    detail: 'Projected scrap for the shift exceeds budget, driven mainly by the unclassified cluster on Line 3.',
    severity: 'caution',
    layer: 'profitability',
    raisedAt: '18:06',
    confidence: { score: 0.74, sampleSize: 96 },
    estimatedImpact: { value: 41_600, unit: '₹/shift', uncertainty: 6_200, provenance: 'projected' },
    evidence: [
      { id: 'ev-08', source: 'ERP standard costs', claim: 'Unit scrap cost ₹1,890 at current material rates.', weight: 0.8, timestamp: '18:00', integrity: 1 },
    ],
  },
];

export const decisions: DecisionRecord[] = [
  {
    id: 'dr-01',
    decision: 'Approved 2h overtime for Cell C',
    kind: 'overtime',
    takenAt: '12 Sep · Shift B',
    context: 'Backlog of 180 units after an unplanned stop.',
    outcome: 'negative',
    outcomeSummary: 'Backlog cleared, but next-shift first pass yield fell 1.6 pts and rework absorbed the gain.',
    costDelta: -74_000,
    riskScore: 78,
    alternative: 'Split the backlog across two shifts with a fresh crew on the second.',
    confidence: { score: 0.71, sampleSize: 23 },
  },
  {
    id: 'dr-02',
    decision: 'Deferred spindle maintenance on Line 2',
    kind: 'maintenance',
    takenAt: '09 Sep · Shift A',
    context: 'Maintenance window clashed with a priority order.',
    outcome: 'negative',
    outcomeSummary: 'Unplanned 3.2h stop four days later; order shipped late regardless.',
    costDelta: -186_000,
    riskScore: 91,
    alternative: 'Take the 45-minute planned window and reschedule the order tail.',
    confidence: { score: 0.88, sampleSize: 41 },
  },
  {
    id: 'dr-03',
    decision: 'Reduced line speed 8% on Line 1',
    kind: 'production-adjust',
    takenAt: '05 Sep · Shift B',
    context: 'Weld porosity trending upward.',
    outcome: 'positive',
    outcomeSummary: 'Defect rate returned to baseline within 40 minutes; throughput loss recovered next shift.',
    costDelta: 52_000,
    riskScore: 22,
    confidence: { score: 0.84, sampleSize: 58 },
  },
  {
    id: 'dr-04',
    decision: 'Swapped Cell B crew mid-shift',
    kind: 'shift-change',
    takenAt: '02 Sep · Shift C',
    context: 'Absenteeism on the night roster.',
    outcome: 'neutral',
    outcomeSummary: 'No measurable effect on yield or throughput beyond the changeover gap.',
    costDelta: -4_200,
    riskScore: 35,
    confidence: { score: 0.52, sampleSize: 11, note: 'Thin comparison set — treat as weakly supported.' },
  },
];

export const dataStreams: DataStream[] = [
  { id: 'ds-01', name: 'Line 3 vision array', kind: 'vision', completeness: 0.97, freshnessMinutes: 1, drift: 0.41, status: 'caution' },
  { id: 'ds-02', name: 'PLC cycle counters', kind: 'plc', completeness: 1, freshnessMinutes: 0, drift: 0.06, status: 'nominal' },
  { id: 'ds-03', name: 'MES work orders', kind: 'mes', completeness: 0.94, freshnessMinutes: 6, drift: 0.11, status: 'nominal' },
  { id: 'ds-04', name: 'ERP cost master', kind: 'erp', completeness: 0.88, freshnessMinutes: 1_440, drift: 0.03, status: 'caution' },
  { id: 'ds-05', name: 'Operator defect log', kind: 'manual', completeness: 0.46, freshnessMinutes: 92, drift: 0.28, status: 'critical' },
];

export const models: ModelCard[] = [
  { id: 'md-01', name: 'Defect classifier', task: 'Visual defect classification', version: 'v1.0 (RF+HOG)', accuracy: 0.845, abstainRate: 0.192, lastTrained: '20 Sep 2026', status: 'caution' },
  { id: 'md-02', name: 'Bottleneck detector', task: 'Constraint identification', version: 'v2.1', accuracy: 0.911, abstainRate: 0.021, lastTrained: '11 Sep 2026', status: 'nominal' },
  { id: 'md-03', name: 'Cost attribution', task: 'Loss-to-cause mapping', version: 'v1.7', accuracy: 0.836, abstainRate: 0.104, lastTrained: '02 Sep 2026', status: 'nominal' },
  { id: 'md-04', name: 'Decision Shadow', task: 'Decision risk scoring', version: 'v0.9', accuracy: 0.742, abstainRate: 0.187, lastTrained: '15 Sep 2026', status: 'caution' },
];

export const scenarioBaseline = {
  lineSpeedPct: 100,
  overtimeHours: 0,
  maintenanceWindowHours: 0,
  scrapRatePct: 5.8,
};
