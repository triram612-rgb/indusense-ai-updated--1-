import type { SeriesPoint } from '@/lib/types';

/**
 * Profitability Intelligence for Plant 01.
 *
 * Two figures on this page measure different things and are reconciled in the
 * UI rather than quietly averaged:
 *
 *  - ₹12.4L is a monthly RUN RATE: current loss rates projected over a full
 *    month. It is what the plant loses if today repeats.
 *  - The −2.9 point margin gap is MONTH TO DATE. The Station 3 constraint is
 *    only seven working days old, so most of the run-rate loss has not landed
 *    in this month's margin yet. If it persists, the gap widens to −5.6 pts.
 */

export const financialSummary = {
  monthlyLossLakhs: 12.4,
  revenueLakhs: 70.9,
  estimatedProfitLakhs: 21.4,
  profitLowLakhs: 19.6,
  profitHighLakhs: 23.1,
  currentMargin: 30.2,
  baselineMargin: 33.1,
  marginGap: -2.9,
  /** Where the gap lands if current conditions hold to month end. */
  projectedMargin: 27.5,
  projectedGap: -5.6,
  marginGapLakhs: 2.1,
  confidence: { score: 0.81, sampleSize: 26 },
  coverage: 0.92,
  workingDaysElapsed: 7,
  workingDaysTotal: 26,
};

export interface LossBranch {
  id: string;
  /** Operational driver — the thing that actually happened on the floor. */
  driver: string;
  /** How it turns into money. */
  mechanism: string;
  lakhs: number;
  share: number;
  color: string;
  confidence: number;
  /** The line items from the donut that roll up into this branch. */
  components: Array<{ label: string; lakhs: number }>;
  /** Operational events driving it this month. */
  events: string[];
  route: string;
  routeLabel: string;
}

export const lossBranches: LossBranch[] = [
  {
    id: 'lb-defects',
    driver: 'Defects',
    mechanism: 'Scrap / Rework',
    lakhs: 7.1,
    share: 0.573,
    color: '#F04438',
    confidence: 0.89,
    components: [
      { label: 'Defective units', lakhs: 4.8 },
      { label: 'Material waste', lakhs: 1.4 },
      { label: 'Rework', lakhs: 0.9 },
    ],
    events: [
      'M07 chamber temperature +11°C since 06:00',
      'Batch B248 running at 8.4% against a 2.1% baseline',
      '14 novel patterns held open, unpriced until classified',
    ],
    route: '/quality',
    routeLabel: 'Quality Intelligence',
  },
  {
    id: 'lb-downtime',
    driver: 'Downtime',
    mechanism: 'Lost Output',
    lakhs: 3.2,
    share: 0.258,
    color: '#F59E0B',
    confidence: 0.88,
    components: [{ label: 'Downtime', lakhs: 3.2 }],
    events: [
      'Station 3 micro-stops, 29.7 min/day',
      'M07 equipment faults, 17.9 min/day',
      'M04 press cycle faults, 12.4 min/day',
    ],
    route: '/production',
    routeLabel: 'Production Intelligence',
  },
  {
    id: 'lb-cycle',
    driver: 'Slow Cycle',
    mechanism: 'Capacity Loss',
    lakhs: 2.1,
    share: 0.169,
    color: '#2F8BFF',
    confidence: 0.79,
    components: [{ label: 'Cycle-time loss', lakhs: 2.1 }],
    events: [
      'Station 3 cycle 31.4s against a 26.6s standard',
      '707 units/day of capacity unavailable',
      'Stations 4 and 5 idle 14% of scheduled time',
    ],
    route: '/production',
    routeLabel: 'Production Intelligence',
  },
];

/** Ranked loss sources — the donut line items, ordered by size. */
export const lossSources = [
  {
    rank: 1,
    label: 'Defective units',
    lakhs: 4.8,
    share: 0.387,
    color: '#F04438',
    deltaPct: 61.2,
    confidence: 0.91,
    origin: 'M07 · Batch B248',
    route: '/quality',
  },
  {
    rank: 2,
    label: 'Downtime',
    lakhs: 3.2,
    share: 0.258,
    color: '#F59E0B',
    deltaPct: 24.1,
    confidence: 0.88,
    origin: 'Station 3 · M07 · M04',
    route: '/production',
  },
  {
    rank: 3,
    label: 'Cycle-time loss',
    lakhs: 2.1,
    share: 0.169,
    color: '#2F8BFF',
    deltaPct: 48.0,
    confidence: 0.79,
    origin: 'Station 3 constraint',
    route: '/production',
  },
  {
    rank: 4,
    label: 'Material waste',
    lakhs: 1.4,
    share: 0.113,
    color: '#12B5A0',
    deltaPct: 9.4,
    confidence: 0.74,
    origin: 'Supplier lot BRT-7',
    route: '/quality',
  },
  {
    rank: 5,
    label: 'Rework',
    lakhs: 0.9,
    share: 0.073,
    color: '#8B7BD8',
    deltaPct: 18.6,
    confidence: 0.68,
    origin: 'Station 5 return loop',
    route: '/quality',
  },
];

/** Daily estimated loss, ₹ thousands. The excursion opens on 13 Sep. */
export const lossTrend: SeriesPoint[] = [
  { t: '06 Sep', loss: 26, low: 23, high: 29, baseline: 27 },
  { t: '07 Sep', loss: 28, low: 25, high: 31, baseline: 27 },
  { t: '08 Sep', loss: 25, low: 22, high: 28, baseline: 27 },
  { t: '09 Sep', loss: 27, low: 24, high: 30, baseline: 27 },
  { t: '10 Sep', loss: 29, low: 26, high: 33, baseline: 27 },
  { t: '11 Sep', loss: 26, low: 23, high: 30, baseline: 27 },
  { t: '12 Sep', loss: 28, low: 25, high: 32, baseline: 27 },
  { t: '13 Sep', loss: 33, low: 29, high: 38, baseline: 27 },
  { t: '14 Sep', loss: 38, low: 33, high: 44, baseline: 27 },
  { t: '15 Sep', loss: 43, low: 37, high: 50, baseline: 27 },
  { t: '16 Sep', loss: 49, low: 42, high: 57, baseline: 27 },
  { t: '17 Sep', loss: 54, low: 46, high: 63, baseline: 27 },
  { t: '18 Sep', loss: 61, low: 52, high: 71, baseline: 27 },
  { t: '19 Sep', loss: 58, low: 49, high: 68, baseline: 27 },
];
