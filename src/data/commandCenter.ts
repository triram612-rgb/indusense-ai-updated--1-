import type { Alert, HealthDimension, ImpactSlice, MetricValue, SeriesPoint } from '@/lib/types';

/**
 * Command Center feed. Shift-current operating picture for Plant 01.
 * Numbers are mock but internally consistent: the composite health score is
 * computed from the dimensions below, and the financial impact reconciles to
 * the defect and downtime rates shown on the metric row.
 */

export const systemStatus = {
  plant: 'Plant 01 — Main Manufacturing Line',
  state: 'Operational' as const,
  shift: 'Shift B · 14:00–22:00',
  lastSync: '12 seconds ago',
  sourcesOnline: 14,
  sourcesTotal: 15,
};

/**
 * Composite health. Weights sum to 1.0 and are displayed on the panel, so a
 * manager can see why the headline moved rather than being handed a number.
 */
export const healthDimensions: HealthDimension[] = [
  {
    id: 'hd-quality',
    label: 'Quality',
    score: 88,
    weight: 0.3,
    severity: 'nominal',
    note: 'Holding, but the B248 anomaly is not yet in this window.',
  },
  {
    id: 'hd-throughput',
    label: 'Throughput',
    score: 71,
    weight: 0.18,
    severity: 'caution',
    note: 'Station 3 is capping the line at 96% utilisation.',
  },
  {
    id: 'hd-downtime',
    label: 'Downtime',
    score: 64,
    weight: 0.12,
    severity: 'critical',
    note: 'Weakest dimension. 4.8% against a 3.0% target.',
  },
  {
    id: 'hd-yield',
    label: 'Yield',
    score: 82,
    weight: 0.25,
    severity: 'caution',
    note: 'Down 2.4 points week on week.',
  },
  {
    id: 'hd-profitability',
    label: 'Profitability',
    score: 73,
    weight: 0.15,
    severity: 'caution',
    note: 'Margin intact; ₹12.4L monthly loss is the drag.',
  },
];

/** Derived, not typed in — the panel recomputes this from the table above. */
export function compositeHealth(dimensions: HealthDimension[]): number {
  return Math.round(dimensions.reduce((sum, d) => sum + d.score * d.weight, 0));
}

export const healthConfidence = { score: 0.87, sampleSize: 4_212 };
export const dataCoverage = 0.94;

export const commandMetrics: Record<string, MetricValue> = {
  production: { value: 8_420, unit: 'units/day', uncertainty: 180, provenance: 'measured', deltaPct: -3.4, trend: 'down' },
  /**
   * NOT backed by the trained classifier: this plant-wide "6.2%" figure
   * belongs to the illustrative M07/Batch B248 narrative below, which has
   * no grounding in the provided datasets (no machine/batch/sensor data
   * exists to compute a real plant-wide rate). It is intentionally a
   * different number from Quality Intelligence's qualitySummary.defectRate,
   * which IS real but measures something different (accuracy on a
   * class-balanced evaluation set, not a live production rate) — see the
   * comment atop src/data/quality.ts. Marked 'simulated' rather than
   * 'measured' so the UI doesn't overstate it.
   */
  defectRate: { value: 6.2, unit: '%', uncertainty: 0.4, provenance: 'simulated', deltaPct: 210.0, trend: 'up' },
  downtime: { value: 4.8, unit: '%', uncertainty: 0.3, provenance: 'measured', deltaPct: 26.3, trend: 'up' },
  margin: { value: 30.2, unit: '%', uncertainty: 1.2, provenance: 'projected', deltaPct: -1.9, trend: 'down' },
};

/** The three items a manager must look at before doing anything else. */
export const attentionAlerts: Alert[] = [
  {
    id: 'at-01',
    title: 'Machine M07 process drift',
    detail:
      'Chamber temperature has climbed steadily since 06:00 and is now well outside the control band. The drift tracks the defect rise on the same line.',
    route: '/production',
    severity: 'critical',
    layer: 'production',
    raisedAt: '17:48',
    readings: [
      { label: 'Temperature', value: '+11°C above baseline', severity: 'critical' },
      { label: 'Potential quality impact', value: 'High', severity: 'critical' },
      { label: 'Drift duration', value: '11h 48m' },
    ],
    confidence: { score: 0.94, sampleSize: 1_408 },
    estimatedImpact: { value: 186_000, unit: '₹ if uncorrected through shift end', uncertainty: 41_000, provenance: 'projected' },
    evidence: [
      { id: 'at-01-e1', source: 'M07 thermocouple array', claim: 'Chamber temperature 11.2°C above the 30-day mean for 11 consecutive hours.', weight: 0.91, timestamp: '17:48', integrity: 1 },
      { id: 'at-01-e2', source: 'SPC control chart', claim: 'Eight consecutive points above centreline — Western Electric rule 2 violation.', weight: 0.84, timestamp: '16:20', integrity: 1 },
      { id: 'at-01-e3', source: 'Maintenance log', claim: 'Coolant pump on M07 was last serviced 94 days ago against a 60-day interval.', weight: 0.68, timestamp: '17 Jun', integrity: 0.9 },
    ],
  },
  {
    id: 'at-02',
    title: 'Station 3 bottleneck',
    detail:
      'Station 3 is the binding constraint on the line. Utilisation is at the ceiling and cycle time has stretched, starving everything downstream.',
    route: '/production',
    severity: 'caution',
    layer: 'production',
    raisedAt: '17:12',
    readings: [
      { label: 'Utilization', value: '96%', severity: 'caution' },
      { label: 'Cycle-time deviation', value: '+18%', severity: 'caution' },
      { label: 'Queue ahead', value: '34 units' },
    ],
    confidence: { score: 0.89, sampleSize: 962 },
    estimatedImpact: { value: 312, unit: 'units/day forgone', uncertainty: 44, provenance: 'projected' },
    evidence: [
      { id: 'at-02-e1', source: 'PLC cycle counters', claim: 'Mean cycle time 31.4s against a 26.6s standard.', weight: 0.9, timestamp: '17:10', integrity: 1 },
      { id: 'at-02-e2', source: 'Buffer sensors', claim: 'Downstream buffer starved for 38 minutes across the shift.', weight: 0.72, timestamp: '16:55', integrity: 0.95 },
    ],
  },
  {
    id: 'at-03',
    title: 'Batch B248 anomaly',
    detail:
      'Defect rate on batch B248 is four times its own baseline. The batch shares the M07 window, but the platform has not established that as the cause.',
    route: '/quality',
    severity: 'caution',
    layer: 'quality',
    raisedAt: '16:34',
    readings: [
      { label: 'Defect rate', value: '8.4%', severity: 'critical' },
      { label: 'Normal baseline', value: '2.1%' },
      { label: 'Units affected', value: '1,240 of 14,800' },
    ],
    confidence: { score: 0.76, sampleSize: 1_240, note: 'Association with M07 is strong; causation is not established on this sample.' },
    estimatedImpact: { value: 94_000, unit: '₹ scrap and rework', uncertainty: 22_000, provenance: 'projected' },
    evidence: [
      { id: 'at-03-e1', source: 'Vision model v4.2', claim: 'Defect rate 8.4% against a 2.1% batch baseline.', weight: 0.88, timestamp: '16:34', integrity: 0.98 },
      { id: 'at-03-e2', source: 'MES genealogy', claim: 'Full batch processed on M07 during the elevated temperature window.', weight: 0.79, timestamp: '14:10', integrity: 1 },
      { id: 'at-03-e3', source: 'Material lot record', claim: 'Batch also used supplier lot BRT-7, which is new this week — a competing explanation.', weight: 0.54, timestamp: '14:10', integrity: 0.86 },
    ],
  },
];

/** 14 days of defect rate. The anomaly opens on day 9 and peaks on day 13. */
export const defectTrend: SeriesPoint[] = [
  { t: '06 Sep', defectRate: 2.0, baseline: 2.1 },
  { t: '07 Sep', defectRate: 2.2, baseline: 2.1 },
  { t: '08 Sep', defectRate: 1.9, baseline: 2.1 },
  { t: '09 Sep', defectRate: 2.1, baseline: 2.1 },
  { t: '10 Sep', defectRate: 2.3, baseline: 2.1 },
  { t: '11 Sep', defectRate: 2.0, baseline: 2.1 },
  { t: '12 Sep', defectRate: 2.2, baseline: 2.1 },
  { t: '13 Sep', defectRate: 2.6, baseline: 2.1 },
  { t: '14 Sep', defectRate: 3.4, baseline: 2.1 },
  { t: '15 Sep', defectRate: 4.1, baseline: 2.1 },
  { t: '16 Sep', defectRate: 5.3, baseline: 2.1 },
  { t: '17 Sep', defectRate: 7.1, baseline: 2.1 },
  { t: '18 Sep', defectRate: 8.4, baseline: 2.1 },
  { t: '19 Sep', defectRate: 6.2, baseline: 2.1 },
];

/** Throughput against cycle time — two scales, so two axes. */
export const productionTrend: SeriesPoint[] = [
  { t: '06 Sep', throughput: 9_080, cycleTime: 26.7 },
  { t: '07 Sep', throughput: 9_140, cycleTime: 26.6 },
  { t: '08 Sep', throughput: 8_960, cycleTime: 26.9 },
  { t: '09 Sep', throughput: 9_020, cycleTime: 26.8 },
  { t: '10 Sep', throughput: 8_870, cycleTime: 27.2 },
  { t: '11 Sep', throughput: 8_910, cycleTime: 27.1 },
  { t: '12 Sep', throughput: 8_840, cycleTime: 27.5 },
  { t: '13 Sep', throughput: 8_760, cycleTime: 28.0 },
  { t: '14 Sep', throughput: 8_690, cycleTime: 28.7 },
  { t: '15 Sep', throughput: 8_610, cycleTime: 29.3 },
  { t: '16 Sep', throughput: 8_540, cycleTime: 30.1 },
  { t: '17 Sep', throughput: 8_480, cycleTime: 30.7 },
  { t: '18 Sep', throughput: 8_390, cycleTime: 31.2 },
  { t: '19 Sep', throughput: 8_420, cycleTime: 31.4 },
];

export const impactSlices: ImpactSlice[] = [
  { id: 'is-01', label: 'Defective units', lakhs: 4.8, color: '#F04438', confidence: 0.91 },
  { id: 'is-02', label: 'Downtime', lakhs: 3.2, color: '#F59E0B', confidence: 0.88 },
  { id: 'is-03', label: 'Cycle-time loss', lakhs: 2.1, color: '#2F8BFF', confidence: 0.79 },
  { id: 'is-04', label: 'Material waste', lakhs: 1.4, color: '#12B5A0', confidence: 0.74 },
  { id: 'is-05', label: 'Rework', lakhs: 0.9, color: '#8B7BD8', confidence: 0.68 },
];

export const investigation = {
  finding:
    'Defect rate increased 3.1× over the last 7 days. The strongest associated changes are Machine M07 temperature (+11°C), Batch B248 and Station 3 cycle-time deviation (+18%).',
  caveat:
    'These are associations ranked by strength, not a proven cause. Supplier lot BRT-7 entered the same window and has not been ruled out.',
  drivers: [
    { label: 'M07 chamber temperature', contribution: 0.52, detail: '+11°C, 11h sustained' },
    { label: 'Batch B248', contribution: 0.27, detail: '8.4% defect rate vs 2.1% baseline' },
    { label: 'Station 3 cycle time', contribution: 0.14, detail: '+18% deviation (31.4s vs 26.6s)' },
    { label: 'Unattributed', contribution: 0.07, detail: 'No candidate above threshold' },
  ],
  confidence: { score: 0.87, sampleSize: 4_212 },
  coverage: 0.94,
};
