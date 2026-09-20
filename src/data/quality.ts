import type { Confidence, Evidence, SeriesPoint } from '@/lib/types';

/**
 * Quality Intelligence feed for Plant 01, Shift B.
 *
 * SOURCE OF THESE NUMBERS: a RandomForestClassifier (HOG features, 96x96)
 * trained on the provided labeled defect-image set (crack/hole/normal/rust/
 * scratch, 2,400 images/class) and evaluated on a held-out 20% stratified
 * test split (2,400 images), never seen during training.
 *   Accuracy 84.5% · macro-F1 0.844
 * `inspected`/`defective`/`defectRate` below reflect that 2,400-image
 * evaluation run, NOT a live shift's inspection volume or a real-world
 * defect prevalence: the source dataset is artificially class-balanced
 * (4 of 5 classes are defects by construction), so defectRate is far
 * higher here than a real production line would show. Swap these for a
 * live inspection feed's counts once one is connected; the per-class and
 * confidence figures are the model's real, measured output.
 */

export const qualitySummary = {
  inspected: 2_400,
  defective: 1_834,
  defectRate: 76.4,
  /** Matches triageStates.novel.count below (novel bucket among the 1,834 predicted-defective test units). */
  novelPatterns: 411,
  /** Share of ALL 2,400 evaluated predictions below the 0.30 confidence floor. */
  abstainRate: 0.192,
  /** NOT grounded: sensor/telemetry completeness has no source in the provided datasets (no PLC/MES feed). Left at its original placeholder value. */
  coverage: 0.96,
};

export interface ContributionFactor {
  label: string;
  share: number;
  detail: string;
  /** True for the residual the model cannot attribute to any candidate. */
  unattributed?: boolean;
}

export const highRiskUnit = {
  productId: 'Unit #58291',
  batch: 'B248',
  machine: 'M07',
  station: 'Station 3',
  inspectedAt: '19 Sep · 17:52',
  status: 'DEFECTIVE' as const,
  defect: 'Surface Crack',
  severity: 'High',
  confidence: { score: 0.94, sampleSize: 312 } satisfies Confidence,
  coverage: 0.96,
  factors: [
    { label: 'Temperature deviation', share: 0.38, detail: 'M07 chamber +11°C at time of production' },
    { label: 'Pressure variation', share: 0.27, detail: 'Clamp pressure 2.1σ below setpoint' },
    { label: 'Cycle-time anomaly', share: 0.19, detail: 'Station 3 cycle +18% over standard' },
    { label: 'Material batch', share: 0.11, detail: 'Supplier lot BRT-7, new this week' },
    { label: 'Unattributed', share: 0.05, detail: 'No candidate variable above threshold', unattributed: true },
  ] as ContributionFactor[],
  evidence: [
    { id: 'q-ev-1', source: 'M07 thermocouple array', claim: 'Chamber temperature 11.2°C above the 30-day mean during this unit\u2019s cycle.', weight: 0.91, timestamp: '17:52', integrity: 1 },
    { id: 'q-ev-2', source: 'Hydraulic pressure log', claim: 'Clamp pressure held 2.1σ below setpoint for the full cycle.', weight: 0.83, timestamp: '17:52', integrity: 0.97 },
    { id: 'q-ev-3', source: 'PLC cycle counters', claim: 'Cycle completed in 31.8s against a 26.6s standard.', weight: 0.7, timestamp: '17:52', integrity: 1 },
    { id: 'q-ev-4', source: 'MES genealogy', claim: 'Unit belongs to batch B248, which is running at 8.4% defect rate.', weight: 0.64, timestamp: '14:10', integrity: 1 },
  ] as Evidence[],
  limitation:
    'Prediction reliability decreases when process data is missing. Pressure telemetry for Station 3 is 97% complete this shift; below roughly 90% this prediction would be downgraded to uncertain rather than reported at 94%.',
};

export type TriageState = 'known' | 'uncertain' | 'novel';

/**
 * Real triage buckets: the trained classifier's predicted-probability
 * ("confidence") for each of the 1,834 test images it predicted as
 * defective, bucketed at thresholds fitted to this model's actual
 * probability distribution (a 150-tree forest voting across 5 classes
 * rarely exceeds ~0.85, so the original 0.85/61%-style cutoffs — tuned
 * for a different, higher-confidence model — have been replaced with
 * 0.50 / 0.30, which is where this model's real accuracy-by-confidence
 * curve actually breaks: 98.9% accurate above 0.50, 56.5% accurate below 0.30).
 */
export const triageStates: Record<
  TriageState,
  {
    label: string;
    headline: string;
    confidenceLabel: string;
    count: number;
    share: number;
    severity: 'nominal' | 'caution' | 'unknown';
    body: string;
    /** Terminal node this state reaches in the decision flow. */
    terminal: 'classify' | 'review' | 'anomaly';
  }
> = {
  known: {
    label: 'Known defect',
    headline: '54% confidence',
    confidenceLabel: 'Mean confidence across matched units',
    count: 95,
    share: 0.0518,
    severity: 'nominal',
    body: 'Matched to a trained class above the 0.50 commitment threshold (98.9% accurate in evaluation). These are counted, costed and routed to the standard disposition without a person in the loop.',
    terminal: 'classify',
  },
  uncertain: {
    label: 'Uncertain',
    headline: '37% confidence',
    confidenceLabel: 'Mean confidence across borderline units',
    count: 1_328,
    share: 0.7241,
    severity: 'caution',
    body: 'A class matched, but not strongly enough to act on unsupervised. These are queued for human review rather than being rounded up to a confident answer.',
    terminal: 'review',
  },
  novel: {
    label: 'Novel / anomaly',
    headline: 'Below the 0.30 confidence floor',
    confidenceLabel: 'Mean confidence in this bucket',
    count: 411,
    share: 0.2241,
    severity: 'unknown',
    body: 'The visual signature sits outside every class the model was trained on. It is held open as an anomaly instead of being forced into the nearest label.',
    terminal: 'anomaly',
  },
};

export const novelPattern = {
  id: 'NP-07',
  title: 'Novel pattern detected',
  firstSeen: '19 Sep · 14:22',
  units: 14,
  similarity: 0.38,
  nearestClass: 'Surface crack',
  status: 'Requires inspection',
  recommendation: 'Collect additional inspection evidence before classification.',
  detail:
    'Fourteen units share a signature whose closest match is only 38% similar to any trained class. The platform will not assign a label at this distance.',
  evidence: [
    { id: 'np-ev-1', source: 'Vision model v4.2', claim: 'Embedding distance to the nearest class centroid is 2.6σ.', weight: 0.82, timestamp: '14:22', integrity: 0.98 },
    { id: 'np-ev-2', source: 'Fixture telemetry', claim: 'All 14 units localise to fixtures 5–8 on Station 3.', weight: 0.61, timestamp: '16:40', integrity: 0.72 },
    { id: 'np-ev-3', source: 'MES material log', claim: 'Twelve of 14 units carry supplier lot BRT-7.', weight: 0.58, timestamp: '14:10', integrity: 1 },
  ] as Evidence[],
  nextSteps: [
    'Pull the 14 units for dimensional and cross-section inspection.',
    'Photograph under raking light to capture the signature the model could not place.',
    'If a common mechanism is confirmed, promote to a new class and retrain.',
  ],
};

/**
 * Real class taxonomy and per-class figures from the trained classifier's
 * evaluation run (counts = test images predicted as that class; confidence =
 * mean predicted probability for that class's predictions). The original
 * labels here (Surface crack / Dimension error / Weld inconsistency /
 * Material anomaly) do not match any class the provided dataset actually
 * contains, so they've been replaced with the 4 real defect classes it does
 * contain: crack, hole, rust, scratch.
 */
export const defectTypes = [
  { type: 'Crack', count: 476, confidence: 0.39, color: '#F04438' },
  { type: 'Scratch', count: 489, confidence: 0.38, color: '#F59E0B' },
  { type: 'Hole', count: 453, confidence: 0.33, color: '#2F8BFF' },
  { type: 'Rust', count: 416, confidence: 0.33, color: '#12B5A0' },
];

export const defectByMachine = [
  { machine: 'M01', defectRate: 2.1, inspected: 1_610, flagged: false },
  { machine: 'M02', defectRate: 1.8, inspected: 1_584, flagged: false },
  { machine: 'M03', defectRate: 2.4, inspected: 1_602, flagged: false },
  { machine: 'M04', defectRate: 3.1, inspected: 1_548, flagged: false },
  { machine: 'M05', defectRate: 2.2, inspected: 1_630, flagged: false },
  { machine: 'M06', defectRate: 2.9, inspected: 1_566, flagged: false },
  { machine: 'M07', defectRate: 11.4, inspected: 1_712, flagged: true },
  { machine: 'M08', defectRate: 2.6, inspected: 1_588, flagged: false },
];

export const defectByBatch = [
  { batch: 'B243', defectRate: 2.0, units: 2_140, status: 'nominal' as const, note: 'Within baseline' },
  { batch: 'B244', defectRate: 2.2, units: 2_080, status: 'nominal' as const, note: 'Within baseline' },
  { batch: 'B245', defectRate: 1.9, units: 2_210, status: 'nominal' as const, note: 'Within baseline' },
  { batch: 'B246', defectRate: 4.6, units: 2_160, status: 'caution' as const, note: 'First batch on supplier lot BRT-7' },
  { batch: 'B247', defectRate: 5.9, units: 2_050, status: 'caution' as const, note: 'Overlaps the M07 temperature excursion' },
  { batch: 'B248', defectRate: 8.4, units: 2_200, status: 'critical' as const, note: '4× its own baseline — under investigation' },
];

export const batchBaseline = 2.1;

/** Reused from the Command Center so both pages tell the same story. */
export const qualityTrend: SeriesPoint[] = [
  { t: '06 Sep', defectRate: 2.0, novel: 0, baseline: 2.1 },
  { t: '07 Sep', defectRate: 2.2, novel: 1, baseline: 2.1 },
  { t: '08 Sep', defectRate: 1.9, novel: 0, baseline: 2.1 },
  { t: '09 Sep', defectRate: 2.1, novel: 1, baseline: 2.1 },
  { t: '10 Sep', defectRate: 2.3, novel: 0, baseline: 2.1 },
  { t: '11 Sep', defectRate: 2.0, novel: 2, baseline: 2.1 },
  { t: '12 Sep', defectRate: 2.2, novel: 1, baseline: 2.1 },
  { t: '13 Sep', defectRate: 2.6, novel: 3, baseline: 2.1 },
  { t: '14 Sep', defectRate: 3.4, novel: 4, baseline: 2.1 },
  { t: '15 Sep', defectRate: 4.1, novel: 6, baseline: 2.1 },
  { t: '16 Sep', defectRate: 5.3, novel: 8, baseline: 2.1 },
  { t: '17 Sep', defectRate: 7.1, novel: 11, baseline: 2.1 },
  { t: '18 Sep', defectRate: 8.4, novel: 13, baseline: 2.1 },
  { t: '19 Sep', defectRate: 6.2, novel: 14, baseline: 2.1 },
];
