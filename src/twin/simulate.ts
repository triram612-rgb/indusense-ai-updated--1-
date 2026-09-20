import { scenarioBaseline } from '@/data/mock';
import { productionSummary, bottleneck, stations } from '@/data/production';
import { financialSummary, lossBranches } from '@/data/profitability';
import type { Confidence } from '@/lib/types';

/**
 * What-if response surface.
 *
 * This is a transparent analytical model, not a served ML model, and the UI
 * says so wherever its output is shown. It is built on top of the recorded
 * baseline so that a scenario at baseline settings reproduces the measured
 * numbers exactly — a scenario that cannot reproduce today is not worth
 * trusting about tomorrow.
 *
 * It also knows its own envelope: push a lever far outside the range the plant
 * has actually operated in and the model abstains from a point estimate
 * instead of extrapolating a confident-looking number.
 */

export type Scenario = typeof scenarioBaseline;

export const baselineScenario: Scenario = { ...scenarioBaseline };

const NAMEPLATE = productionSummary.nameplate; // 9,260 units/day
const BASE_THROUGHPUT = productionSummary.throughput; // 8,420 units/day
const CONSTRAINT_CYCLE = bottleneck ? productionSummary.lineCycleTime : 31.4; // 31.4s
const CONSTRAINT_STANDARD = productionSummary.lineCycleBaseline; // 26.6s
const BASE_QUEUE = 34;
const BASE_LOSS = financialSummary.monthlyLossLakhs; // ₹12.4L
const REVENUE = financialSummary.revenueLakhs; // ₹70.9L
const DEFECT_LOSS = lossBranches.find((b) => b.id === 'lb-defects')?.lakhs ?? 7.1;
const DOWNTIME_LOSS = lossBranches.find((b) => b.id === 'lb-downtime')?.lakhs ?? 3.2;
const CYCLE_LOSS = lossBranches.find((b) => b.id === 'lb-cycle')?.lakhs ?? 2.1;

export interface SimResult {
  scenario: Scenario;
  dirty: boolean;
  /** Units/day leaving the line. */
  throughput: number;
  throughputDelta: number;
  /** Effective cycle time on the constraint, seconds. */
  constraintCycle: number;
  /** Units waiting at the Station 3 infeed. */
  queue: number;
  /** 0–1 pressure on the constraint; 1.0 means demand exactly meets capacity. */
  constraintPressure: number;
  scrapRatePct: number;
  goodUnits: number;
  lossLakhs: number;
  lossUncertainty: number;
  lossDelta: number;
  marginPct: number;
  marginDelta: number;
  /** How far outside the observed operating envelope this scenario sits, 0–1+. */
  extrapolation: number;
  confidence: Confidence;
  /** Per-node flow speed multiplier, keyed by station id. Drives the 3D. */
  flowMultiplier: Record<string, number>;
  /** Stations taken out of production by a maintenance window. */
  offline: string[];
  notes: string[];
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

export function simulate(scenario: Scenario): SimResult {
  const dirty = (Object.keys(scenario) as Array<keyof Scenario>).some(
    (k) => scenario[k] !== baselineScenario[k],
  );

  // --- Demand side -----------------------------------------------------
  // Line speed scales the rate material is pushed into the line.
  const demand = NAMEPLATE * (scenario.lineSpeedPct / 100);

  // --- Constraint side -------------------------------------------------
  // Maintenance recovers part of the accumulated cycle drift. Three hours
  // recovers 75% of the gap between the current 31.4s and the 26.6s standard;
  // the rest is design, not drift, so the model does not promise it back.
  const recovery = clamp(scenario.maintenanceWindowHours / 3, 0, 1) * 0.75;
  const constraintCycle = CONSTRAINT_CYCLE - (CONSTRAINT_CYCLE - CONSTRAINT_STANDARD) * recovery;
  const capacityFromCycle = BASE_THROUGHPUT * (CONSTRAINT_CYCLE / constraintCycle);

  // The maintenance window itself costs production time out of a 24h day.
  const maintenanceLoss = capacityFromCycle * (scenario.maintenanceWindowHours / 24);
  const capacity = capacityFromCycle - maintenanceLoss;

  // Overtime adds crew hours on top of the scheduled day.
  const overtimeUnits = Math.min(demand, capacityFromCycle) * (scenario.overtimeHours / 24);

  const throughput = Math.round(Math.min(demand, capacity) + overtimeUnits);

  // --- Queue and pressure ----------------------------------------------
  const pressure = demand / capacityFromCycle;
  const queue = Math.round(
    clamp(BASE_QUEUE * Math.pow(pressure / (NAMEPLATE / BASE_THROUGHPUT), 2.2), 0, 260),
  );
  const constraintPressure = clamp(pressure / (NAMEPLATE / BASE_THROUGHPUT), 0, 3);

  // --- Quality ---------------------------------------------------------
  // Fatigue effect: the decision history records a 1.6pt yield drop after a
  // 2h overtime approval, so ~0.35pt of scrap per hour is carried forward.
  // Running the line hot also degrades quality; slowing it recovers a little.
  const fatigue = scenario.overtimeHours * 0.35;
  const speedStress = Math.max(0, scenario.lineSpeedPct - 100) * 0.06;
  const maintenanceGain = clamp(scenario.maintenanceWindowHours / 3, 0, 1) * 0.9;
  const scrapRatePct = clamp(scenario.scrapRatePct + fatigue + speedStress - maintenanceGain, 0.4, 20);
  const goodUnits = Math.round(throughput * (1 - scrapRatePct / 100));

  // --- Money -----------------------------------------------------------
  const defectLoss = DEFECT_LOSS * (scrapRatePct / baselineScenario.scrapRatePct);
  const downtimeLoss =
    DOWNTIME_LOSS * (1 - clamp(scenario.maintenanceWindowHours / 3, 0, 1) * 0.42) +
    scenario.maintenanceWindowHours * 0.22;
  const cycleLoss = CYCLE_LOSS * (constraintCycle - CONSTRAINT_STANDARD) / (CONSTRAINT_CYCLE - CONSTRAINT_STANDARD);
  const overtimeCost = scenario.overtimeHours * 0.31;
  const lossLakhs = Number(Math.max(0, defectLoss + downtimeLoss + Math.max(0, cycleLoss) + overtimeCost).toFixed(2));

  const marginPct = Number((financialSummary.currentMargin + ((BASE_LOSS - lossLakhs) / REVENUE) * 100).toFixed(2));

  // --- Trust -----------------------------------------------------------
  // Observed envelope: the plant has run 92–108% of nameplate, up to 2h
  // overtime, up to 1.5h planned windows, and 4.6–8.4% scrap.
  const extrapolation = Math.max(
    Math.abs(scenario.lineSpeedPct - 100) / 8,
    scenario.overtimeHours / 2,
    scenario.maintenanceWindowHours / 1.5,
    Math.abs(scenario.scrapRatePct - baselineScenario.scrapRatePct) / 2.6,
  );

  const abstained = extrapolation > 1.55;
  const score = clamp(financialSummary.confidence.score - Math.max(0, extrapolation - 1) * 0.42, 0.18, 0.86);

  const notes: string[] = [];
  if (scenario.lineSpeedPct > 100)
    notes.push('Pushing above nameplate loads the Station 3 constraint. Extra input becomes queue, not output.');
  if (scenario.overtimeHours > 0)
    notes.push('Overtime carries a modelled fatigue penalty drawn from four comparable historical approvals.');
  if (scenario.maintenanceWindowHours > 0)
    notes.push('The window costs production hours now and recovers part of the cycle drift afterwards.');
  if (scenario.scrapRatePct < 4)
    notes.push('Scrap below 4% has not been observed on this line since the excursion opened on 13 Sep.');

  const flowMultiplier: Record<string, number> = {};
  const constraintIndex = stations.findIndex((s) => s.bottleneck);
  stations.forEach((s, i) => {
    if (i >= constraintIndex) {
      // The constraint and everything after it run at the constraint rate.
      flowMultiplier[s.id] = clamp(CONSTRAINT_CYCLE / constraintCycle, 0.4, 1.8);
    } else {
      // Upstream stations run at whatever the line speed lever asks for.
      flowMultiplier[s.id] = clamp(scenario.lineSpeedPct / 100, 0.5, 1.6);
    }
  });

  return {
    scenario,
    dirty,
    throughput,
    throughputDelta: throughput - BASE_THROUGHPUT,
    constraintCycle: Number(constraintCycle.toFixed(1)),
    queue,
    constraintPressure,
    scrapRatePct: Number(scrapRatePct.toFixed(2)),
    goodUnits,
    lossLakhs,
    lossUncertainty: Number((lossLakhs * 0.17 * (1 + Math.max(0, extrapolation - 1))).toFixed(2)),
    lossDelta: Number((lossLakhs - BASE_LOSS).toFixed(2)),
    marginPct,
    marginDelta: Number((marginPct - financialSummary.currentMargin).toFixed(2)),
    extrapolation,
    confidence: {
      score,
      sampleSize: financialSummary.confidence.sampleSize,
      abstained,
      note: abstained
        ? 'This scenario sits outside every operating window the plant has actually run. The model will not put a point estimate on it.'
        : undefined,
    },
    flowMultiplier,
    offline: scenario.maintenanceWindowHours > 0 ? [bottleneck.stationId] : [],
    notes,
  };
}
