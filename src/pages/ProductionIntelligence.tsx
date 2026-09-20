import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { FlaskConical, Gauge, Search, TrendingDown } from 'lucide-react';
import {
  AlertCard,
  ChartCard,
  ContributionBars,
  EvidencePanel,
  MetricCard,
  PageHeader,
  StationFlow,
  StatusBadge,
} from '@/components/ui';
import { attentionAlerts } from '@/data/commandCenter';
import {
  bottleneck,
  downtimeSources,
  operationalImpact,
  productionSummary,
  rootCauseFactors,
  stations,
} from '@/data/production';
import { axisProps, chartColors, tooltipProps } from '@/lib/chartTheme';
import { cn, formatNumber, severityTokens } from '@/lib/severity';

const legendProps = {
  wrapperStyle: { fontSize: 11, color: '#94A1B2', paddingTop: 8 },
  iconType: 'square' as const,
  iconSize: 10,
};

export function ProductionIntelligence() {
  const [selectedId, setSelectedId] = useState(bottleneck.stationId);
  const station = stations.find((s) => s.id === selectedId) ?? stations[2];
  const isConstraint = station.bottleneck;
  const t = severityTokens[station.status];

  const cycleData = stations.map((s) => ({
    station: s.short.replace('Station ', 'S'),
    current: s.cycleTime,
    baseline: s.cycleBaseline,
    deviation: ((s.cycleTime - s.cycleBaseline) / s.cycleBaseline) * 100,
  }));

  return (
    <>
      <PageHeader
        title="Production Intelligence"
        question="Understand flow, bottlenecks, downtime and throughput impact."
        actions={
          <>
            <StatusBadge severity="critical" label="Station 3 constraint" pulse />
            <span className="readout hidden text-2xs text-ink-faint sm:inline">
              Constraint held since {bottleneck.since}
            </span>
          </>
        }
      />

      {/* Top metrics */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Throughput"
          metric={{ value: productionSummary.throughput, unit: 'units/day', uncertainty: 180, provenance: 'measured', deltaPct: -3.4, trend: 'down' }}
          severity="caution"
          digits={0}
          comparisonLabel="vs previous 7 days"
        />
        <MetricCard
          label="Target"
          metric={{ value: productionSummary.target, unit: 'units/day', provenance: 'measured', trend: 'flat' }}
          digits={0}
          context={`Running ${formatNumber(productionSummary.target - productionSummary.throughput)} units below plan.`}
        />
        <MetricCard
          label="Downtime"
          metric={{ value: productionSummary.downtimePct, unit: '%', uncertainty: 0.3, provenance: 'measured', deltaPct: 26.3, trend: 'up' }}
          severity="caution"
          invertDelta
          comparisonLabel="vs previous 7 days"
        />
        <MetricCard
          label="Utilization"
          metric={{ value: productionSummary.utilizationPct, unit: '%', provenance: 'measured', deltaPct: 2.4, trend: 'up' }}
          severity="caution"
          digits={0}
          comparisonLabel="vs previous 7 days"
          context="Rising because the constraint is running hot, not because output improved."
        />
        <MetricCard
          label="Average Cycle Time"
          metric={{ value: productionSummary.meanCycleTime, unit: 'sec', uncertainty: 0.6, provenance: 'measured', deltaPct: 6.8, trend: 'up' }}
          severity="caution"
          invertDelta
          comparisonLabel="vs previous 7 days"
          context={`Mean across five stations. Line takt is ${productionSummary.lineCycleTime}s, set by Station 3.`}
        />
      </div>

      {/* Bottleneck investigation */}
      <section className="plate overflow-hidden">
        <span className={cn('absolute left-0 top-0 h-full w-[2px]', isConstraint ? 'bg-critical' : t.rail)} />

        <header className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-hairline px-4 py-3">
          <Gauge className={cn('h-4 w-4', isConstraint ? 'text-critical' : t.text)} strokeWidth={2} />
          <h2 className="text-sm font-medium text-ink">{station.short}</h2>
          {isConstraint ? (
            <StatusBadge severity="critical" label={bottleneck.status} pulse />
          ) : (
            <StatusBadge severity={station.status} />
          )}
          <span className="readout ml-auto text-2xs text-ink-faint">{station.equipment}</span>
        </header>

        {/* Line flow */}
        <div className="border-b border-hairline p-4">
          <div className="mb-2.5 flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-xs font-medium text-ink">Line flow</h3>
            <span className="text-2xs text-ink-faint">Select a station to investigate it</span>
          </div>
          <StationFlow stations={stations} selectedId={selectedId} onSelect={setSelectedId} />
        </div>

        <div className="grid gap-5 p-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
              <Field label="Utilization" value={`${station.utilization}%`} tone={station.utilization > 92 ? 'critical' : undefined} strong />
              <Field
                label="Cycle-time deviation"
                value={`${(((station.cycleTime - station.cycleBaseline) / station.cycleBaseline) * 100).toFixed(0)}%`}
                tone={station.cycleTime / station.cycleBaseline > 1.1 ? 'critical' : undefined}
                strong
                prefix="+"
              />
              <Field
                label="Downtime contribution"
                value={`${(station.downtimeShare * 100).toFixed(0)}%`}
                tone={station.downtimeShare > 0.3 ? 'critical' : undefined}
                strong
              />
              <Field label="Cycle time" value={`${station.cycleTime.toFixed(1)}s`} />
              <Field label="Standard" value={`${station.cycleBaseline.toFixed(1)}s`} />
              <Field label="Output" value={`${formatNumber(station.throughput)}/d`} />
            </dl>

            <p className="mt-3 border-l-2 border-hairline pl-2.5 text-xs leading-relaxed text-ink-muted">
              {station.note}
            </p>

            {isConstraint && (
              <div className="mt-4 grid gap-3 border-t border-hairline pt-4 sm:grid-cols-2">
                <div className="plate-inset p-3">
                  <p className="text-2xs text-ink-faint">Estimated throughput impact</p>
                  <p className="readout mt-1 text-2xl font-medium leading-none text-critical">
                    {(bottleneck.throughputImpact * 100).toFixed(1)}%
                  </p>
                  <p className="mt-1.5 text-2xs leading-relaxed text-ink-faint">
                    {formatNumber(bottleneck.unitsAttributed)} units/day attributed to this constraint.
                  </p>
                </div>
                <div className="plate-inset p-3">
                  <p className="text-2xs text-ink-faint">Estimated monthly impact</p>
                  <p className="readout mt-1 text-2xl font-medium leading-none text-critical">
                    ₹{bottleneck.monthlyImpactLakhs.toFixed(1)}L
                  </p>
                  <p className="mt-1.5 text-2xs leading-relaxed text-ink-faint">
                    Lost output, rework and downtime combined.
                  </p>
                </div>
              </div>
            )}

            <ContributionBars
              className="mt-4 border-t border-hairline pt-4"
              title="Bottleneck root cause"
              factors={rootCauseFactors}
              chipLabel="Association strength / evidence"
              caption="High utilization is the strongest observed association with this constraint."
              disclaimer="Each score is an independent association strength, so they do not sum to 100%. A station running at 96% with no slack will correlate with almost any disturbance — that is a property of the constraint, not proof of what caused it."
            />
          </div>

          <div className="flex flex-col gap-3">
            <EvidencePanel
              confidence={bottleneck.confidence}
              coverage={bottleneck.coverage}
              evidence={attentionAlerts.find((a) => a.id === 'at-02')?.evidence ?? []}
              limitation={bottleneck.limitation}
            />

            {/* Operational impact */}
            <div className="plate-inset p-3.5">
              <div className="flex items-center gap-1.5">
                <TrendingDown className="h-3.5 w-3.5 text-critical" strokeWidth={2} />
                <h3 className="text-xs font-medium text-ink">Operational impact</h3>
              </div>

              <div className="mt-3 flex items-baseline gap-2 border-b border-hairline pb-3">
                <span className="readout text-2xl font-medium leading-none text-ink">
                  {formatNumber(operationalImpact.lostThroughputPerDay)}
                </span>
                <span className="text-2xs text-ink-faint">units/day lost throughput</span>
              </div>

              <p className="mt-2.5 text-2xs leading-relaxed text-ink-faint">
                Against nameplate capacity of {formatNumber(productionSummary.nameplate)}. The model attributes{' '}
                <span className="readout text-ink">{operationalImpact.attributedToBottleneck}</span> to Station 3 and
                leaves{' '}
                <span className="readout text-unknown">{operationalImpact.unattributed}</span> unattributed rather
                than folding them into the constraint.
              </p>

              <table className="mt-3 w-full text-left">
                <tbody className="divide-y divide-hairline">
                  {operationalImpact.lines.map((l) => (
                    <tr key={l.label} className="align-top">
                      <td className="py-2 pr-2">
                        <span className="block text-xs text-ink">{l.label}</span>
                        <span className="block text-2xs text-ink-faint">{l.detail}</span>
                      </td>
                      <td className="readout py-2 pl-2 text-right text-xs font-medium text-ink">
                        ₹{l.lakhs.toFixed(1)}L
                      </td>
                      <td
                        className={cn(
                          'readout py-2 pl-3 text-right text-2xs',
                          l.confidence >= 0.8 ? 'text-nominal' : 'text-caution',
                        )}
                        title="Attribution confidence"
                      >
                        {(l.confidence * 100).toFixed(0)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-edge">
                    <td className="py-2 pr-2 text-xs font-medium text-ink">Total monthly impact</td>
                    <td className="readout py-2 pl-2 text-right text-xs font-medium text-critical">
                      ₹{operationalImpact.totalLakhs.toFixed(1)}L
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedId(bottleneck.stationId)}
                className="inline-flex items-center gap-1.5 rounded-sm bg-signal px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-signal-bright"
              >
                <Search className="h-3.5 w-3.5" strokeWidth={2.5} />
                Investigate constraint
              </button>
              <Link
                to={`/simulator?station=${station.id}`}
                className="inline-flex items-center gap-1.5 rounded-sm border border-edge bg-panel px-3 py-2 text-xs font-medium text-ink transition-colors hover:border-signal hover:text-signal-bright"
              >
                <FlaskConical className="h-3.5 w-3.5" strokeWidth={2.5} />
                Run What-If on {station.short}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Flow + cycle time */}
      <div className="grid gap-3 xl:grid-cols-2">
        <ChartCard
          title="Flow analysis"
          subtitle="Units per day leaving each station"
          provenance="measured"
          footnote="The step down at Station 3 is the constraint. Stations 4 and 5 sit within ten units of it because they can only process what Station 3 releases — their spare capacity is invisible in output."
        >
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={stations} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid stroke={chartColors.grid} vertical={false} />
              <XAxis dataKey="short" {...axisProps} />
              <YAxis
                {...axisProps}
                domain={[8_000, 9_400]}
                tickFormatter={(v: number) => `${(v / 1000).toFixed(1)}k`}
              />
              <Tooltip {...tooltipProps} />
              <Legend {...legendProps} />
              <ReferenceLine
                y={productionSummary.target}
                stroke={chartColors.axis}
                strokeDasharray="4 4"
                label={{ value: 'target 9,000', position: 'insideTopRight', fill: chartColors.axis, fontSize: 10 }}
              />
              <Bar dataKey="throughput" name="Units/day out" radius={[2, 2, 0, 0]} barSize={40}>
                {stations.map((s) => (
                  <Cell
                    key={s.id}
                    fill={s.bottleneck ? chartColors.critical : chartColors.signal}
                    fillOpacity={s.id === selectedId ? 1 : 0.75}
                  />
                ))}
              </Bar>
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Cycle time against standard"
          subtitle="Current versus baseline, per station"
          provenance="measured"
          footnote="Four stations sit within 4% of standard. Station 3 is 18% over, and that single gap sets the takt time for the whole line."
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={cycleData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid stroke={chartColors.grid} vertical={false} />
              <XAxis dataKey="station" {...axisProps} />
              <YAxis {...axisProps} unit="s" />
              <Tooltip {...tooltipProps} />
              <Legend {...legendProps} />
              <Bar dataKey="baseline" name="Standard" fill={chartColors.grid} radius={[2, 2, 0, 0]} barSize={18} />
              <Bar dataKey="current" name="Current" radius={[2, 2, 0, 0]} barSize={18}>
                {cycleData.map((c) => (
                  <Cell key={c.station} fill={c.deviation > 10 ? chartColors.critical : chartColors.signal} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Downtime distribution */}
      <ChartCard
        title="Downtime distribution"
        subtitle={`${productionSummary.downtimePct}% of scheduled time, by originating source`}
        provenance="measured"
        footnote="Station 3 and Machine M07 are counted separately — M07 sits at Station 2, so its faults are an upstream quality problem rather than part of the constraint. Manual stop reasons are 46% complete, which is why the split inside each bar is not broken down further."
      >
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={downtimeSources} layout="vertical" margin={{ top: 4, right: 24, left: 68, bottom: 0 }}>
              <CartesianGrid stroke={chartColors.grid} horizontal={false} />
              <XAxis
                type="number"
                {...axisProps}
                domain={[0, 0.5]}
                tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
              />
              <YAxis type="category" dataKey="source" {...axisProps} width={68} />
              <Tooltip
                {...tooltipProps}
                formatter={(v: number) => `${(v * 100).toFixed(0)}%`}
              />
              <Bar dataKey="share" name="Share of downtime" radius={[0, 2, 2, 0]} barSize={26}>
                {downtimeSources.map((d) => (
                  <Cell key={d.source} fill={d.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <ul className="divide-y divide-hairline self-center">
            {downtimeSources.map((d) => (
              <li key={d.source} className="flex items-center gap-2.5 py-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-[2px]" style={{ background: d.color }} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs text-ink">{d.source}</span>
                  <span className="block truncate text-2xs text-ink-faint">{d.kind}</span>
                </span>
                <span className="readout shrink-0 text-right">
                  <span className="block text-xs text-ink">{(d.share * 100).toFixed(0)}%</span>
                  <span className="block text-2xs text-ink-faint">{d.minutesPerDay} min/d</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </ChartCard>

      {/* Linked signals */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-ink">Production signals</h2>
        {attentionAlerts
          .filter((a) => a.layer === 'production')
          .map((a) => (
            <AlertCard key={a.id} alert={{ ...a, route: undefined }} />
          ))}
      </section>
    </>
  );
}

function Field({
  label,
  value,
  tone,
  strong,
  prefix,
}: {
  label: string;
  value: string;
  tone?: 'critical';
  strong?: boolean;
  prefix?: string;
}) {
  return (
    <div>
      <dt className="text-2xs text-ink-faint">{label}</dt>
      <dd
        className={cn(
          'readout mt-0.5',
          strong ? 'text-sm font-medium' : 'text-xs',
          tone === 'critical' ? 'text-critical' : 'text-ink',
        )}
      >
        {prefix && !value.startsWith('-') ? prefix : ''}
        {value}
      </dd>
    </div>
  );
}
