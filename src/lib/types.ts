/**
 * Domain model for InduSense AI.
 *
 * Design rule that runs through every type here: a value is never allowed to
 * travel without the context needed to trust it. Anything the platform asserts
 * carries a confidence, a provenance ("is this measured or simulated?") and,
 * where relevant, an explicit `unknown` state so the model can decline to
 * classify rather than guess.
 */

export type Severity = 'nominal' | 'caution' | 'critical' | 'unknown';

/** Where a number came from. Simulated values are never shown unlabelled. */
export type Provenance = 'measured' | 'simulated' | 'projected' | 'imputed';

export type Trend = 'up' | 'down' | 'flat';

export interface Confidence {
  /** 0–1. */
  score: number;
  /** Count of supporting observations behind the score. */
  sampleSize: number;
  /** Set when the model is explicitly refusing to classify. */
  abstained?: boolean;
  /** Plain-language reason shown on hover when confidence is low. */
  note?: string;
}

export interface MetricValue {
  value: number;
  unit?: string;
  /** ± band around the point estimate, in the same unit. */
  uncertainty?: number;
  provenance: Provenance;
  deltaPct?: number;
  trend?: Trend;
}

export interface Evidence {
  id: string;
  /** e.g. "Vision model", "MES event log", "Torque sensor L3-07" */
  source: string;
  claim: string;
  /** How strongly this single item supports the conclusion, 0–1. */
  weight: number;
  timestamp: string;
  /** Sensor coverage / completeness for this source, 0–1. */
  integrity?: number;
}

export interface DefectClass {
  id: string;
  label: string;
  count: number;
  /** Novel clusters have no label the model is willing to commit to. */
  novel: boolean;
  confidence: Confidence;
  topFactors: string[];
}

export interface LineState {
  id: string;
  name: string;
  cell: string;
  oee: number;
  throughput: MetricValue;
  status: Severity;
  bottleneck: boolean;
  driftScore: number;
}

export interface Alert {
  id: string;
  title: string;
  detail: string;
  /** Where a manager goes to act on this. Every alert is a route, not a dead end. */
  route?: string;
  /** Short reading lines shown on the card face, e.g. "Utilization  96%". */
  readings?: Array<{ label: string; value: string; severity?: Severity }>;
  severity: Severity;
  layer: 'quality' | 'production' | 'profitability' | 'decision';
  raisedAt: string;
  confidence: Confidence;
  estimatedImpact?: MetricValue;
  evidence: Evidence[];
}

export interface DecisionRecord {
  id: string;
  decision: string;
  kind: 'overtime' | 'shift-change' | 'maintenance' | 'production-adjust';
  takenAt: string;
  context: string;
  /** What actually followed, once the outcome window closed. */
  outcome: 'positive' | 'negative' | 'neutral' | 'pending';
  outcomeSummary: string;
  costDelta: number;
  /** 0–100, how risky the same call would be in today's conditions. */
  riskScore: number;
  alternative?: string;
  confidence: Confidence;
}

export interface DataStream {
  id: string;
  name: string;
  kind: 'vision' | 'plc' | 'mes' | 'erp' | 'manual';
  /** 0–1 coverage of expected records in the window. */
  completeness: number;
  freshnessMinutes: number;
  drift: number;
  status: Severity;
}

export interface ModelCard {
  id: string;
  name: string;
  task: string;
  version: string;
  accuracy: number;
  /** Share of inputs the model routed to "unclassified" instead of guessing. */
  abstainRate: number;
  lastTrained: string;
  status: Severity;
}

export interface SeriesPoint {
  t: string;
  [key: string]: string | number;
}

export interface Plant {
  id: string;
  name: string;
  location: string;
  shift: string;
  status: Severity;
}

export interface HealthDimension {
  id: string;
  label: string;
  score: number;
  /** Share of the composite score. Weights are shown, never hidden. */
  weight: number;
  severity: Severity;
  note: string;
}

export interface ImpactSlice {
  id: string;
  label: string;
  /** Rupees in lakhs. */
  lakhs: number;
  color: string;
  confidence: number;
}
