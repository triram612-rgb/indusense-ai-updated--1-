import type { Severity } from '@/lib/types';

/**
 * Production Intelligence feed for Plant 01.
 *
 * Reconciliation rules used throughout:
 *  - Mean station cycle time (21.4s) is the average of the five stations below.
 *  - Line cycle time is set by the constraint station (31.4s), which is what
 *    the Command Center trend plots.
 *  - Nameplate capacity is 9,260 units/day. Actual is 8,420, so 840 units/day
 *    are lost; the model attributes 707 of those to Station 3 and leaves the
 *    remaining 133 unattributed rather than rounding them into the constraint.
 */

export const productionSummary = {
  throughput: 8_420,
  target: 9_000,
  nameplate: 9_260,
  downtimePct: 4.8,
  utilizationPct: 87,
  meanCycleTime: 21.4,
  lineCycleTime: 31.4,
  lineCycleBaseline: 26.6,
};

export interface Station {
  id: string;
  name: string;
  short: string;
  /** Units per day leaving this station. */
  throughput: number;
  utilization: number;
  cycleTime: number;
  cycleBaseline: number;
  /** Share of total line downtime originating here. */
  downtimeShare: number;
  status: Severity;
  bottleneck: boolean;
  equipment: string;
  note: string;
}

export const stations: Station[] = [
  {
    id: 'st-1',
    name: 'Station 1 — Blank & load',
    short: 'Station 1',
    throughput: 9_180,
    utilization: 84,
    cycleTime: 18.2,
    cycleBaseline: 17.8,
    downtimeShare: 0.06,
    status: 'nominal',
    bottleneck: false,
    equipment: 'M01, M02',
    note: 'Running to standard. Feeds the line above plan.',
  },
  {
    id: 'st-2',
    name: 'Station 2 — Form & heat',
    short: 'Station 2',
    throughput: 9_050,
    utilization: 86,
    cycleTime: 19.6,
    cycleBaseline: 18.9,
    downtimeShare: 0.26,
    status: 'caution',
    bottleneck: false,
    equipment: 'M07, M08',
    note: 'M07 temperature drift originates here. Flow is fine; quality is not.',
  },
  {
    id: 'st-3',
    name: 'Station 3 — Press & join',
    short: 'Station 3',
    throughput: 8_420,
    utilization: 96,
    cycleTime: 31.4,
    cycleBaseline: 26.6,
    downtimeShare: 0.43,
    status: 'critical',
    bottleneck: true,
    equipment: 'M03, M04',
    note: 'The binding constraint. Everything downstream runs at this rate.',
  },
  {
    id: 'st-4',
    name: 'Station 4 — Finish',
    short: 'Station 4',
    throughput: 8_410,
    utilization: 85,
    cycleTime: 19.1,
    cycleBaseline: 18.6,
    downtimeShare: 0.12,
    status: 'nominal',
    bottleneck: false,
    equipment: 'M05',
    note: 'Starved, not slow. Idle 14% of scheduled time waiting on Station 3.',
  },
  {
    id: 'st-5',
    name: 'Station 5 — Inspect & pack',
    short: 'Station 5',
    throughput: 8_400,
    utilization: 84,
    cycleTime: 18.7,
    cycleBaseline: 18.1,
    downtimeShare: 0.13,
    status: 'nominal',
    bottleneck: false,
    equipment: 'M06, vision array',
    note: 'Capacity available. Rework queue is the only pressure here.',
  },
];

export const bottleneck = {
  stationId: 'st-3',
  status: 'BOTTLENECK' as const,
  utilization: 96,
  cycleDeviation: 0.18,
  downtimeContribution: 0.43,
  throughputImpact: -0.084,
  monthlyImpactLakhs: 5.8,
  unitsAttributed: 707,
  unitsUnattributed: 133,
  confidence: { score: 0.89, sampleSize: 962 },
  coverage: 0.98,
  since: '13 Sep',
  limitation:
    'Constraint attribution uses PLC cycle counters and buffer sensors. Manual stop reasons are 46% complete this shift, so the split between mechanical slowdown and operator-side delay inside Station 3 is not yet resolvable.',
};

/** Independent association strengths — these do not sum to 100%. */
export const rootCauseFactors = [
  { label: 'High utilization', share: 0.82, detail: 'No slack left to absorb variation at 96%' },
  { label: 'Cycle-time drift', share: 0.71, detail: 'Gradual since 13 Sep, no step change' },
  { label: 'Maintenance history', share: 0.54, detail: 'M04 press 41 days past its service interval' },
  { label: 'Material variability', share: 0.31, detail: 'Supplier lot BRT-7 thickness spread widened' },
];

export const downtimeSources = [
  { source: 'Station 3', kind: 'Changeover and micro-stops', share: 0.43, minutesPerDay: 29.7, color: '#F04438' },
  { source: 'Machine M07', kind: 'Equipment faults', share: 0.26, minutesPerDay: 17.9, color: '#F59E0B' },
  { source: 'Machine M04', kind: 'Press cycle faults', share: 0.18, minutesPerDay: 12.4, color: '#2F8BFF' },
  { source: 'Station 5', kind: 'Rework queue blocking', share: 0.13, minutesPerDay: 9.0, color: '#12B5A0' },
];

export const operationalImpact = {
  lostThroughputPerDay: 840,
  attributedToBottleneck: 707,
  unattributed: 133,
  lines: [
    { label: 'Estimated lost output', lakhs: 3.5, detail: '707 units/day × 26 days at ₹19 contribution', confidence: 0.86 },
    { label: 'Rework impact', lakhs: 0.9, detail: 'Units returned from Station 5 to Station 3', confidence: 0.68 },
    { label: 'Downtime cost', lakhs: 1.4, detail: '43% of the plant downtime bill', confidence: 0.88 },
  ],
  totalLakhs: 5.8,
};
