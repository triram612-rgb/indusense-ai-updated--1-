import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartCard, MetricCard, PageHeader, SectionStub, SimulationBadge, StatusBadge } from '@/components/ui';
import { stations } from '@/data/production';
import { marginSeries, scenarioBaseline } from '@/data/mock';
import { axisProps, chartColors, tooltipProps } from '@/lib/chartTheme';

interface Control {
  key: keyof typeof scenarioBaseline;
  label: string;
  hint: string;
  min: number;
  max: number;
  step: number;
  unit: string;
}

const controls: Control[] = [
  { key: 'lineSpeedPct', label: 'Line speed', hint: 'Percent of nameplate rate on the constraint line.', min: 80, max: 115, step: 1, unit: '%' },
  { key: 'overtimeHours', label: 'Overtime', hint: 'Additional hours added to the current crew.', min: 0, max: 4, step: 0.5, unit: 'h' },
  { key: 'maintenanceWindowHours', label: 'Maintenance window', hint: 'Time taken out of production for planned work.', min: 0, max: 3, step: 0.5, unit: 'h' },
  { key: 'scrapRatePct', label: 'Scrap rate', hint: 'Assumed scrap for the remainder of the shift.', min: 2, max: 12, step: 0.1, unit: '%' },
];

export function Simulator() {
  const [params] = useSearchParams();
  /** A scenario can arrive scoped to one station from Production Intelligence. */
  const scopedStation = stations.find((s) => s.id === params.get('station'));
  const [scenario, setScenario] = useState(scenarioBaseline);
  const dirty = useMemo(
    () => (Object.keys(scenario) as Array<keyof typeof scenario>).some((k) => scenario[k] !== scenarioBaseline[k]),
    [scenario],
  );

  /** Placeholder response surface — replaced by the served model later. */
  const projected = useMemo(() => {
    const speed = (scenario.lineSpeedPct - 100) * 0.06;
    const ot = scenario.overtimeHours * 0.18;
    const maint = scenario.maintenanceWindowHours * -0.31;
    const scrap = (scenarioBaseline.scrapRatePct - scenario.scrapRatePct) * 0.42;
    return 16.2 + speed + ot + maint + scrap;
  }, [scenario]);

  const curve = useMemo(
    () =>
      marginSeries.map((p, i) => ({
        ...p,
        whatIf: i >= 5 ? Number((projected - (i - 5) * 0.12).toFixed(2)) : undefined,
      })),
    [projected],
  );

  return (
    <>
      <PageHeader
        title="What-If Simulator"
        question="Move the levers you actually control and see the modelled effect before committing. Everything on this page is simulated and labelled as such."
        actions={
          <>
            {scopedStation && (
              <StatusBadge
                severity={scopedStation.status}
                label={`Scoped to ${scopedStation.short}`}
              />
            )}
            <SimulationBadge provenance="simulated" />
          </>
        }
      />

      <div className="grid gap-3 xl:grid-cols-[320px_1fr]">
        <section className="plate p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-ink">Scenario levers</h2>
            <button
              type="button"
              disabled={!dirty}
              onClick={() => setScenario(scenarioBaseline)}
              className="text-2xs text-ink-faint transition-colors hover:text-ink disabled:opacity-40"
            >
              Reset to actual
            </button>
          </div>

          {scopedStation && (
            <p className="mt-3 border-l-2 border-signal pl-2.5 text-2xs leading-relaxed text-ink-muted">
              Levers apply to {scopedStation.short} ({scopedStation.equipment}), currently at{' '}
              <span className="readout text-ink">{scopedStation.utilization}%</span> utilisation and{' '}
              <span className="readout text-ink">{scopedStation.cycleTime.toFixed(1)}s</span> cycle against a{' '}
              <span className="readout text-ink">{scopedStation.cycleBaseline.toFixed(1)}s</span> standard.
            </p>
          )}

          <div className="mt-4 space-y-5">
            {controls.map((c) => (
              <div key={c.key}>
                <div className="flex items-baseline justify-between">
                  <label htmlFor={c.key} className="text-xs font-medium text-ink">
                    {c.label}
                  </label>
                  <span className="readout text-xs text-signal-bright">
                    {scenario[c.key]}
                    {c.unit}
                  </span>
                </div>
                <input
                  id={c.key}
                  type="range"
                  min={c.min}
                  max={c.max}
                  step={c.step}
                  value={scenario[c.key]}
                  onChange={(e) => setScenario((s) => ({ ...s, [c.key]: Number(e.target.value) }))}
                  className="mt-2 h-1 w-full cursor-pointer appearance-none rounded-full bg-hairline accent-signal"
                />
                <p className="mt-1.5 text-2xs leading-relaxed text-ink-faint">{c.hint}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <MetricCard
              label="Projected margin"
              metric={{ value: projected, unit: '% of revenue', uncertainty: 0.9, provenance: 'simulated', deltaPct: ((projected - 16.2) / 16.2) * 100, trend: projected >= 16.2 ? 'up' : 'down' }}
              severity={projected >= 16.2 ? 'nominal' : 'caution'}
            />
            <MetricCard
              label="Units this shift"
              metric={{ value: 1284 + (scenario.lineSpeedPct - 100) * 11 + scenario.overtimeHours * 148 - scenario.maintenanceWindowHours * 160, unit: 'units', uncertainty: 60, provenance: 'simulated' }}
              digits={0}
            />
            <MetricCard
              label="Scrap cost"
              metric={{ value: scenario.scrapRatePct * 7_200, unit: '₹/shift', uncertainty: 5_400, provenance: 'simulated' }}
              invertDelta
              digits={0}
            />
          </div>

          <ChartCard
            title="Margin under this scenario"
            subtitle="Solid line is recorded history; both forward paths are model output"
            provenance="simulated"
            footnote="The response surface behind these numbers is a placeholder. Wire the served model in before anyone treats a simulated margin as a commitment."
          >
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={curve} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid stroke={chartColors.grid} vertical={false} />
                <XAxis dataKey="t" {...axisProps} />
                <YAxis {...axisProps} domain={[12, 20]} />
                <Tooltip {...tooltipProps} />
                <Line type="monotone" dataKey="margin" stroke={chartColors.signal} strokeWidth={2} dot={false} name="Recorded" />
                <Line type="monotone" dataKey="scenario" stroke={chartColors.axis} strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="Do nothing" />
                <Line type="monotone" dataKey="whatIf" stroke={chartColors.unknown} strokeWidth={2} strokeDasharray="5 4" dot={false} name="This scenario" />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>

      <SectionStub
        title="Scenario comparison and save"
        description="Hold two or three scenarios side by side, keep the assumptions with them, and hand the chosen one to Decision Shadow so the outcome can be scored later."
      />
    </>
  );
}
