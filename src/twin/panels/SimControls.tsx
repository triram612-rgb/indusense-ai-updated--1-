import { AlertOctagon, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { useTwin } from '../state';
import type { Scenario } from '../simulate';
import { baselineScenario } from '../simulate';
import { productionSummary } from '@/data/production';
import { financialSummary } from '@/data/profitability';
import { cn } from '@/lib/severity';

/**
 * The lever deck.
 *
 * It sits over the plant rather than on a page of its own, because the point is
 * to watch the factory respond: raise line speed and the queue in front of
 * Station 3 physically grows, because the units are moving under a constraint
 * rule rather than playing an animation of a bottleneck.
 *
 * Nothing here touches plant equipment. Every output is labelled SIMULATED, and
 * when a scenario leaves the operating envelope the model abstains from a point
 * estimate instead of extrapolating.
 */

interface Lever {
  key: keyof Scenario;
  label: string;
  hint: string;
  min: number;
  max: number;
  step: number;
  unit: string;
}

const LEVERS: Lever[] = [
  { key: 'lineSpeedPct', label: 'Line speed', hint: 'Percent of nameplate fed into the line', min: 80, max: 115, step: 1, unit: '%' },
  { key: 'overtimeHours', label: 'Overtime', hint: 'Hours added to the current crew', min: 0, max: 4, step: 0.5, unit: 'h' },
  { key: 'maintenanceWindowHours', label: 'Maintenance', hint: 'Production time taken out for planned work', min: 0, max: 3, step: 0.5, unit: 'h' },
  { key: 'scrapRatePct', label: 'Scrap rate', hint: 'Assumed scrap for the remainder of the shift', min: 2, max: 12, step: 0.1, unit: '%' },
];

export function SimControls() {
  const { scenario, setLever, resetScenario, sim, simulating } = useTwin();

  return (
    <div className="pointer-events-auto flex w-full flex-col gap-1.5 lg:w-[300px]">
      <div className="plate p-3">
        <div className="flex items-center gap-1.5">
          <SlidersHorizontal className="h-3.5 w-3.5 text-signal-bright" strokeWidth={2} />
          <span className="text-[10px] uppercase tracking-[0.16em] text-ink-muted">Scenario levers</span>
          <button
            type="button"
            onClick={resetScenario}
            disabled={!simulating}
            className="ml-auto flex items-center gap-1 text-[10px] text-ink-faint hover:text-ink disabled:opacity-40"
          >
            <RotateCcw className="h-3 w-3" strokeWidth={2} />
            Actual
          </button>
        </div>

        <div className="mt-3 space-y-3.5">
          {LEVERS.map((l) => {
            const moved = scenario[l.key] !== baselineScenario[l.key];
            return (
              <div key={l.key}>
                <div className="flex items-baseline justify-between">
                  <label htmlFor={`lv-${l.key}`} className="text-[11px] text-ink">
                    {l.label}
                  </label>
                  <span className={cn('readout text-[11px]', moved ? 'text-unknown' : 'text-ink-muted')}>
                    {scenario[l.key]}
                    {l.unit}
                  </span>
                </div>
                <input
                  id={`lv-${l.key}`}
                  type="range"
                  min={l.min}
                  max={l.max}
                  step={l.step}
                  value={scenario[l.key]}
                  onChange={(e) => setLever(l.key, Number(e.target.value))}
                  className="mt-1.5 h-1 w-full cursor-pointer appearance-none rounded-full bg-hairline accent-signal"
                />
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="readout text-[9px] text-ink-faint">
                    {l.min}
                    {l.unit}
                  </span>
                  <span className="text-[9px] text-ink-faint">{l.hint}</span>
                  <span className="readout text-[9px] text-ink-faint">
                    {l.max}
                    {l.unit}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Current vs simulated */}
      <div className="plate p-3">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-b border-hairline pb-2">
          <span className="text-[9px] uppercase tracking-[0.16em] text-ink-faint">Current</span>
          <span className="text-[9px] text-ink-faint">vs</span>
          <span className="readout text-right text-[9px] uppercase tracking-[0.16em] text-unknown">Simulated</span>
        </div>

        <Compare
          label="Throughput"
          current={`${productionSummary.throughput.toLocaleString('en-IN')} u/d`}
          simulated={`${sim.throughput.toLocaleString('en-IN')} u/d`}
          delta={sim.throughputDelta}
          good={sim.throughputDelta >= 0}
          active={simulating}
        />
        <Compare
          label="Station 3 queue"
          current="34 units"
          simulated={`${sim.queue} units`}
          delta={sim.queue - 34}
          good={sim.queue <= 34}
          active={simulating}
        />
        <Compare
          label="Constraint cycle"
          current={`${productionSummary.lineCycleTime}s`}
          simulated={`${sim.constraintCycle}s`}
          delta={Number((sim.constraintCycle - productionSummary.lineCycleTime).toFixed(1))}
          good={sim.constraintCycle <= productionSummary.lineCycleTime}
          active={simulating}
        />
        <Compare
          label="Scrap rate"
          current={`${baselineScenario.scrapRatePct}%`}
          simulated={`${sim.scrapRatePct}%`}
          delta={Number((sim.scrapRatePct - baselineScenario.scrapRatePct).toFixed(2))}
          good={sim.scrapRatePct <= baselineScenario.scrapRatePct}
          active={simulating}
        />
        <Compare
          label="Monthly loss"
          current={`₹${financialSummary.monthlyLossLakhs}L`}
          simulated={sim.confidence.abstained ? '—' : `₹${sim.lossLakhs}L ± ${sim.lossUncertainty}`}
          delta={sim.lossDelta}
          good={sim.lossDelta <= 0}
          active={simulating}
        />
        <Compare
          label="Margin"
          current={`${financialSummary.currentMargin}%`}
          simulated={sim.confidence.abstained ? '—' : `${sim.marginPct}%`}
          delta={sim.marginDelta}
          good={sim.marginDelta >= 0}
          active={simulating}
        />
      </div>

      {sim.confidence.abstained ? (
        <div className="plate border-unknown/40 bg-unknown/5 p-2.5">
          <div className="flex items-center gap-1.5">
            <AlertOctagon className="h-3.5 w-3.5 text-unknown" strokeWidth={2} />
            <span className="readout text-[10px] uppercase tracking-[0.16em] text-unknown">
              Outside observed range
            </span>
          </div>
          <p className="mt-1.5 text-[10px] leading-relaxed text-ink-muted">{sim.confidence.note}</p>
          <p className="mt-1.5 text-[10px] leading-relaxed text-ink-faint">
            The 3D response still shows direction of travel. The rupee and margin figures are withheld rather than
            extrapolated.
          </p>
        </div>
      ) : (
        <div className="plate p-2.5">
          <div className="flex items-baseline justify-between">
            <span className="text-[9px] uppercase tracking-[0.16em] text-ink-faint">Model confidence</span>
            <span className="readout text-[10px] text-ink">
              {(sim.confidence.score * 100).toFixed(0)}% · n={sim.confidence.sampleSize}
            </span>
          </div>
          <div className="mt-1.5 h-[3px] w-full bg-hairline">
            <div className="h-full bg-signal" style={{ width: `${sim.confidence.score * 100}%` }} />
          </div>
          {sim.notes.length > 0 && (
            <ul className="mt-2 space-y-1">
              {sim.notes.map((n) => (
                <li key={n} className="flex gap-1.5 text-[10px] leading-relaxed text-ink-faint">
                  <span className="mt-[5px] h-1 w-1 shrink-0 rounded-full bg-signal-dim" />
                  {n}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <p className="px-1 text-[9px] leading-relaxed text-ink-faint">
        Simulation is advisory. InduSense AI does not control production hardware, and no lever on this panel is
        connected to plant equipment.
      </p>
    </div>
  );
}

function Compare({
  label,
  current,
  simulated,
  delta,
  good,
  active,
}: {
  label: string;
  current: string;
  simulated: string;
  delta: number;
  good: boolean;
  active: boolean;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-baseline gap-2 border-b border-hairline/60 py-1.5 last:border-0">
      <div>
        <div className="text-[9px] text-ink-faint">{label}</div>
        <div className="readout text-[11px] text-ink-muted">{current}</div>
      </div>
      <span className="text-[10px] text-ink-faint">→</span>
      <div className="text-right">
        <div
          className={cn(
            'readout text-[9px]',
            !active ? 'text-ink-faint' : good ? 'text-nominal' : 'text-critical',
          )}
        >
          {active && delta !== 0 ? `${delta > 0 ? '+' : ''}${delta}` : 'no change'}
        </div>
        <div className={cn('readout text-[11px]', active ? 'text-unknown' : 'text-ink-faint')}>{simulated}</div>
      </div>
    </div>
  );
}
