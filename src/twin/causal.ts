import { attentionAlerts, investigation } from '@/data/commandCenter';
import { bottleneck, rootCauseFactors, operationalImpact } from '@/data/production';
import { highRiskUnit, novelPattern, defectByBatch, batchBaseline } from '@/data/quality';
import { lossBranches } from '@/data/profitability';
import type { Evidence, Severity } from '@/lib/types';

/**
 * Causal chains.
 *
 * Each chain is the spine of one investigation: a physical condition on the
 * floor, what it does to the process, what that does to the product, and what
 * that costs. The 3D scene draws these as animated links between real objects,
 * so the graph is the factory rather than a flowchart drawn next to it.
 *
 * Every chain carries its own caveat. The platform ranks associations; it does
 * not claim to have proven a cause, and the UI repeats that at every step.
 */

export type LinkStage = 'condition' | 'process' | 'defect' | 'throughput' | 'financial';

export interface CausalStep {
  id: string;
  stage: LinkStage;
  /** Node the step is anchored to in 3D. */
  nodeId: string;
  /** Height above the floor the link rides at, for visual separation. */
  lift: number;
  label: string;
  value: string;
  detail: string;
  severity: Severity;
}

export interface CausalChain {
  id: string;
  title: string;
  question: string;
  severity: Severity;
  originNodeId: string;
  confidence: { score: number; sampleSize: number };
  coverage: number;
  steps: CausalStep[];
  evidence: Evidence[];
  caveat: string;
  /** Competing explanations the platform has not ruled out. */
  competing: string[];
}

const m07Alert = attentionAlerts.find((a) => a.id === 'at-01')!;
const st3Alert = attentionAlerts.find((a) => a.id === 'at-02')!;
const b248Alert = attentionAlerts.find((a) => a.id === 'at-03')!;
const b248 = defectByBatch.find((b) => b.batch === 'B248')!;
const defectBranch = lossBranches.find((b) => b.id === 'lb-defects')!;
const cycleBranch = lossBranches.find((b) => b.id === 'lb-cycle')!;
const downtimeBranch = lossBranches.find((b) => b.id === 'lb-downtime')!;

export const causalChains: CausalChain[] = [
  {
    id: 'ch-m07',
    title: 'M07 thermal drift → defect family B248',
    question: 'Why did the defect rate triple?',
    severity: 'critical',
    originNodeId: 'st-2',
    confidence: m07Alert.confidence,
    coverage: investigation.coverage,
    steps: [
      {
        id: 'ch-m07-s1',
        stage: 'condition',
        nodeId: 'st-2',
        lift: 2.6,
        label: 'Process condition',
        value: '+11°C above baseline',
        detail: 'M07 chamber temperature has climbed steadily since 06:00 and has held outside the control band for 11h 48m.',
        severity: 'critical',
      },
      {
        id: 'ch-m07-s2',
        stage: 'process',
        nodeId: 'st-2',
        lift: 3.2,
        label: 'Process deviation',
        value: '8 points above centreline',
        detail: 'Western Electric rule 2 violation on the SPC chart. The coolant pump is 94 days into a 60-day service interval.',
        severity: 'critical',
      },
      {
        id: 'ch-m07-s3',
        stage: 'defect',
        nodeId: 'inspection',
        lift: 3.0,
        label: `Defect family ${b248.batch}`,
        value: `${b248.defectRate}% vs ${batchBaseline}% baseline`,
        detail: `${highRiskUnit.defect} dominates the family. The full batch was processed on M07 inside the elevated temperature window.`,
        severity: 'critical',
      },
      {
        id: 'ch-m07-s4',
        stage: 'throughput',
        nodeId: 'st-5',
        lift: 2.6,
        label: 'Scrap and rework',
        value: `${b248Alert.readings?.[2]?.value ?? '1,240 units'} affected`,
        detail: 'Units route to scrap or back through the Station 5 return loop, consuming capacity that was already constrained.',
        severity: 'caution',
      },
      {
        id: 'ch-m07-s5',
        stage: 'financial',
        nodeId: 'outfeed',
        lift: 2.2,
        label: 'Financial impact',
        value: `₹${defectBranch.lakhs}L / month`,
        detail: `${defectBranch.mechanism}, at ${(defectBranch.confidence * 100).toFixed(0)}% confidence. Run rate, not month-to-date.`,
        severity: 'critical',
      },
    ],
    evidence: [...m07Alert.evidence, ...b248Alert.evidence],
    caveat: investigation.caveat,
    competing: [
      'Supplier lot BRT-7 entered the same window and is not ruled out — it carries 0.54 evidence weight on its own.',
      'Batch B248 overlaps both explanations, so the split between them is not resolvable on this sample.',
    ],
  },
  {
    id: 'ch-st3',
    title: 'Station 3 constraint → capacity loss',
    question: 'Where is the line being throttled?',
    severity: 'caution',
    originNodeId: 'st-3',
    confidence: bottleneck.confidence,
    coverage: bottleneck.coverage,
    steps: [
      {
        id: 'ch-st3-s1',
        stage: 'condition',
        nodeId: 'st-3',
        lift: 2.6,
        label: 'Operating condition',
        value: `${bottleneck.utilization}% utilisation`,
        detail: `No slack left to absorb variation. ${rootCauseFactors[0].detail}.`,
        severity: 'caution',
      },
      {
        id: 'ch-st3-s2',
        stage: 'process',
        nodeId: 'st-3',
        lift: 3.2,
        label: 'Cycle-time drift',
        value: `31.4s vs 26.6s standard`,
        detail: `+${(bottleneck.cycleDeviation * 100).toFixed(0)}% deviation, gradual since ${bottleneck.since}. No step change, which rules out a single failure event.`,
        severity: 'caution',
      },
      {
        id: 'ch-st3-s3',
        stage: 'defect',
        nodeId: 'st-3',
        lift: 2.8,
        label: 'Queue accumulation',
        value: `${st3Alert.readings?.[2]?.value ?? '34 units'}`,
        detail: 'Work piles up on the infeed while Stations 4 and 5 sit idle 14% of scheduled time waiting on this cell.',
        severity: 'caution',
      },
      {
        id: 'ch-st3-s4',
        stage: 'throughput',
        nodeId: 'st-4',
        lift: 2.6,
        label: 'Throughput loss',
        value: `${operationalImpact.attributedToBottleneck} units/day`,
        detail: `${operationalImpact.lostThroughputPerDay} units/day are lost line-wide. ${operationalImpact.unattributed} stay unattributed rather than being rounded into the constraint.`,
        severity: 'critical',
      },
      {
        id: 'ch-st3-s5',
        stage: 'financial',
        nodeId: 'outfeed',
        lift: 2.2,
        label: 'Financial impact',
        value: `₹${bottleneck.monthlyImpactLakhs}L / month`,
        detail: `${cycleBranch.mechanism} plus ${(bottleneck.downtimeContribution * 100).toFixed(0)}% of the plant downtime bill (₹${downtimeBranch.lakhs}L total).`,
        severity: 'critical',
      },
    ],
    evidence: st3Alert.evidence,
    caveat: bottleneck.limitation,
    competing: [
      'M04 press is 41 days past its service interval — 0.54 association weight.',
      'Supplier lot BRT-7 thickness spread widened in the same window — 0.31 association weight.',
    ],
  },
  {
    id: 'ch-novel',
    title: `${novelPattern.id} — unclassified pattern`,
    question: 'What does the model not know?',
    severity: 'unknown',
    originNodeId: 'st-3',
    confidence: { score: 0.31, sampleSize: novelPattern.units },
    coverage: 0.72,
    steps: [
      {
        id: 'ch-novel-s1',
        stage: 'condition',
        nodeId: 'st-3',
        lift: 2.6,
        label: 'Localisation',
        value: 'Fixtures 5–8',
        detail: `All ${novelPattern.units} units localise to the same four fixtures. Fixture telemetry is only 72% complete, so this is suggestive rather than conclusive.`,
        severity: 'unknown',
      },
      {
        id: 'ch-novel-s2',
        stage: 'process',
        nodeId: 'intake',
        lift: 3.0,
        label: 'Material association',
        value: '12 of 14 on lot BRT-7',
        detail: 'A material association exists but does not explain the two units that carry a different lot.',
        severity: 'unknown',
      },
      {
        id: 'ch-novel-s3',
        stage: 'defect',
        nodeId: 'inspection',
        lift: 3.2,
        label: 'Classification',
        value: 'MODEL ABSTAINED',
        detail: `Embedding distance to the nearest class centroid is 2.6σ; the closest trained class is only ${(novelPattern.similarity * 100).toFixed(0)}% similar. No label is assigned at this distance.`,
        severity: 'unknown',
      },
      {
        id: 'ch-novel-s4',
        stage: 'throughput',
        nodeId: 'st-5',
        lift: 2.6,
        label: 'Disposition',
        value: 'Held for inspection',
        detail: novelPattern.recommendation,
        severity: 'unknown',
      },
      {
        id: 'ch-novel-s5',
        stage: 'financial',
        nodeId: 'outfeed',
        lift: 2.2,
        label: 'Financial impact',
        value: 'NOT PRICED',
        detail: 'These units are deliberately left out of the ₹12.4L figure. Costing an unclassified defect would mean inventing a disposition the platform has not established.',
        severity: 'unknown',
      },
    ],
    evidence: novelPattern.evidence,
    caveat:
      'This chain is an open question, not a finding. It is shown so the gap is visible rather than quietly absorbed into a neighbouring class.',
    competing: novelPattern.nextSteps,
  },
];

export const chainById = new Map(causalChains.map((c) => [c.id, c]));

/** The chain a given node is implicated in, if any. */
export function chainsForNode(nodeId: string): CausalChain[] {
  return causalChains.filter((c) => c.steps.some((s) => s.nodeId === nodeId));
}

export const stageOrder: LinkStage[] = ['condition', 'process', 'defect', 'throughput', 'financial'];
