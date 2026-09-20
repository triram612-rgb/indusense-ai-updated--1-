import { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CircleHelp, FlaskConical, ScanSearch, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  AlertCard,
  ChartCard,
  ClassificationFlow,
  ContributionBars,
  EvidenceCard,
  EvidencePanel,
  LiveClassifyPanel,
  MetricCard,
  PageHeader,
  StatusBadge,
} from '@/components/ui';
import type { FlowTerminal } from '@/components/ui/ClassificationFlow';
import { attentionAlerts } from '@/data/commandCenter';
import {
  batchBaseline,
  defectByBatch,
  defectByMachine,
  defectTypes,
  highRiskUnit,
  novelPattern,
  qualitySummary,
  qualityTrend,
  triageStates,
  type TriageState,
} from '@/data/quality';
import { axisProps, chartColors, tooltipProps } from '@/lib/chartTheme';
import { cn, formatNumber, severityTokens } from '@/lib/severity';

const terminalToState: Record<FlowTerminal, TriageState> = {
  classify: 'known',
  review: 'uncertain',
  anomaly: 'novel',
};

const legendProps = {
  wrapperStyle: { fontSize: 11, color: '#94A1B2', paddingTop: 8 },
  iconType: 'plainline' as const,
  iconSize: 14,
};

export function QualityIntelligence() {
  const [selected, setSelected] = useState<TriageState>('novel');
  const state = triageStates[selected];

  return (
    <>
      <PageHeader
        title="Quality Intelligence"
        question="Explainable defect detection with uncertainty-aware classification."
        actions={
          <>
            <StatusBadge severity="unknown" label={`${qualitySummary.novelPatterns} novel patterns`} pulse />
            <StatusBadge severity="nominal" label={`Coverage ${(qualitySummary.coverage * 100).toFixed(0)}%`} />
          </>
        }
      />

      {/* Summary */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total Inspected"
          metric={{ value: qualitySummary.inspected, unit: 'units', provenance: 'measured', deltaPct: 1.2, trend: 'up' }}
          digits={0}
          comparisonLabel="vs previous 7 days"
        />
        <MetricCard
          label="Defective"
          metric={{ value: qualitySummary.defective, unit: 'units', uncertainty: 18, provenance: 'measured', deltaPct: 214.0, trend: 'up' }}
          severity="critical"
          invertDelta
          digits={0}
          comparisonLabel="vs previous 7 days"
        />
        <MetricCard
          label="Defect Rate"
          metric={{ value: qualitySummary.defectRate, unit: '%', uncertainty: 0.4, provenance: 'measured', deltaPct: 210.0, trend: 'up' }}
          severity="critical"
          invertDelta
          comparisonLabel="vs previous 7 days"
          context="Baseline is 2.1%."
        />
        <MetricCard
          label="Novel Patterns"
          metric={{ value: qualitySummary.novelPatterns, unit: 'open clusters', provenance: 'measured', deltaPct: 180.0, trend: 'up' }}
          severity="unknown"
          invertDelta
          digits={0}
          comparisonLabel="vs previous 7 days"
          context="Signatures the model refused to label."
        />
      </div>

      {/* Live classification — the one live, backend-connected panel on this page */}
      <LiveClassifyPanel />

      {/* High-risk defect investigation */}
      <section className="plate overflow-hidden">
        <span className="absolute left-0 top-0 h-full w-[2px] bg-critical" />

        <header className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-hairline px-4 py-3">
          <ScanSearch className="h-4 w-4 text-critical" strokeWidth={2} />
          <h2 className="text-sm font-medium text-ink">High-risk defect investigation</h2>
          <StatusBadge severity="critical" label={highRiskUnit.status} pulse />
          <span className="readout ml-auto text-2xs text-ink-faint">Inspected {highRiskUnit.inspectedAt}</span>
        </header>

        <div className="grid gap-5 p-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div>
            {/* Identity block */}
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
              <Field label="Product" value={highRiskUnit.productId} strong />
              <Field label="Defect" value={highRiskUnit.defect} strong />
              <Field label="Severity" value={highRiskUnit.severity} tone="critical" strong />
              <Field label="Confidence" value={`${(highRiskUnit.confidence.score * 100).toFixed(0)}%`} tone="nominal" strong />
              <Field label="Machine" value={highRiskUnit.machine} />
              <Field label="Batch" value={highRiskUnit.batch} />
            </dl>

            <ContributionBars
              className="mt-5 border-t border-hairline pt-4"
              factors={highRiskUnit.factors}
              caption="Temperature deviation is the strongest observed contributor in this prediction."
            />
          </div>

          <div className="flex flex-col gap-3">
            <EvidencePanel
              confidence={highRiskUnit.confidence}
              coverage={highRiskUnit.coverage}
              evidence={highRiskUnit.evidence}
              limitation={highRiskUnit.limitation}
            />

            <div className="flex flex-wrap gap-2">
              <Link
                to="/production"
                className="inline-flex items-center gap-1.5 rounded-sm bg-signal px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-signal-bright"
              >
                <Search className="h-3.5 w-3.5" strokeWidth={2.5} />
                Investigate M07
              </Link>
              <Link
                to="/simulator"
                className="inline-flex items-center gap-1.5 rounded-sm border border-edge bg-panel px-3 py-2 text-xs font-medium text-ink transition-colors hover:border-signal hover:text-signal-bright"
              >
                <FlaskConical className="h-3.5 w-3.5" strokeWidth={2.5} />
                Run Simulation
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Known vs novel */}
      <section className="plate overflow-hidden">
        <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-hairline px-4 py-3">
          <h2 className="text-sm font-medium text-ink">Known, uncertain or novel</h2>
          <span className="text-2xs text-ink-faint">
            How all {formatNumber(qualitySummary.defective)} defective units were routed this shift
          </span>
        </header>

        {/* Three cohorts */}
        <div className="grid gap-3 border-b border-hairline p-4 lg:grid-cols-3">
          {(Object.keys(triageStates) as TriageState[]).map((key) => {
            const s = triageStates[key];
            const t = severityTokens[s.severity];
            const active = selected === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelected(key)}
                aria-pressed={active}
                className={cn(
                  'rounded-panel border p-3.5 text-left transition-all',
                  active ? cn(t.border, t.bg) : 'border-hairline bg-surface/50 hover:border-edge',
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={cn('text-xs font-medium', active ? t.text : 'text-ink')}>{s.label}</span>
                  <span className="readout text-sm font-medium text-ink">{s.count}</span>
                </div>
                <p className={cn('readout mt-1 text-xs font-medium', t.text)}>{s.headline}</p>
                <p className="mt-0.5 text-2xs text-ink-faint">{s.confidenceLabel}</p>
                <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-hairline">
                  <div className={cn('h-full rounded-full', t.dot)} style={{ width: `${s.share * 100}%` }} />
                </div>
                <p className="readout mt-1 text-2xs text-ink-faint">{(s.share * 100).toFixed(1)}% of defective units</p>
              </button>
            );
          })}
        </div>

        <div className="grid gap-5 p-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <div>
            <h3 className="mb-3 text-xs font-medium text-ink">Routing rule</h3>
            <ClassificationFlow
              active={state.terminal}
              onSelect={(terminal) => setSelected(terminalToState[terminal])}
            />
          </div>

          {/* Detail panel for the selected cohort */}
          <div className={cn('rounded-panel border p-4', severityTokens[state.severity].border, severityTokens[state.severity].bg)}>
            {selected === 'novel' ? (
              <>
                <div className="flex items-center gap-2">
                  <CircleHelp className="h-4 w-4 text-unknown" strokeWidth={2} />
                  <h3 className="text-sm font-medium text-ink">{novelPattern.title}</h3>
                  <span className="readout ml-auto text-2xs text-ink-faint">{novelPattern.id}</span>
                </div>

                <p className="mt-2 max-w-[62ch] text-xs leading-relaxed text-ink-muted">{novelPattern.detail}</p>

                <dl className="mt-3.5 space-y-2.5">
                  <div>
                    <div className="flex items-baseline justify-between">
                      <dt className="text-2xs text-ink-faint">Similarity to known defect classes</dt>
                      <dd className="readout text-xs font-medium text-unknown">
                        {(novelPattern.similarity * 100).toFixed(0)}%
                      </dd>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-sm bg-surface">
                      <div className="h-full rounded-sm bg-unknown" style={{ width: `${novelPattern.similarity * 100}%` }} />
                    </div>
                    <p className="mt-1 text-2xs text-ink-faint">
                      Nearest class is {novelPattern.nearestClass}, well under the 85% match required to assign a label.
                    </p>
                  </div>

                  <div className="flex items-baseline justify-between border-t border-unknown/20 pt-2.5">
                    <dt className="text-2xs text-ink-faint">Status</dt>
                    <dd className="text-xs font-medium text-unknown">{novelPattern.status}</dd>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <dt className="text-2xs text-ink-faint">Units held</dt>
                    <dd className="readout text-xs text-ink">{novelPattern.units}</dd>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <dt className="text-2xs text-ink-faint">First seen</dt>
                    <dd className="readout text-xs text-ink">{novelPattern.firstSeen}</dd>
                  </div>
                </dl>

                <p className="mt-3 border-l-2 border-unknown pl-2.5 text-xs leading-relaxed text-ink">
                  <span className="font-medium">Recommendation. </span>
                  {novelPattern.recommendation}
                </p>

                <ol className="mt-3 space-y-1.5">
                  {novelPattern.nextSteps.map((step, i) => (
                    <li key={step} className="flex gap-2 text-2xs leading-relaxed text-ink-muted">
                      <span className="readout shrink-0 text-unknown">{i + 1}.</span>
                      {step}
                    </li>
                  ))}
                </ol>

                <EvidenceCard className="mt-3.5" evidence={novelPattern.evidence} title="What we do know" />
              </>
            ) : (
              <>
                <h3 className={cn('text-sm font-medium', severityTokens[state.severity].text)}>{state.label}</h3>
                <p className="readout mt-1 text-lg font-medium text-ink">
                  {state.count} <span className="text-xs text-ink-faint">units · {state.headline}</span>
                </p>
                <p className="mt-2.5 max-w-[60ch] text-xs leading-relaxed text-ink-muted">{state.body}</p>
                <p className="mt-3 border-t border-hairline/60 pt-2.5 text-2xs leading-relaxed text-ink-faint">
                  Select Novel / anomaly to see what the platform does when nothing matches.
                </p>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Distribution + trend */}
      <div className="grid gap-3 xl:grid-cols-2">
        <ChartCard
          title="Defect distribution by type"
          subtitle="Units this shift, with mean classification confidence"
          provenance="measured"
          footnote="The violet bar is not a defect type. It is the bucket for units the classifier would not place — kept visible rather than folded into &lsquo;other&rsquo;."
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={defectTypes} layout="vertical" margin={{ top: 4, right: 16, left: 96, bottom: 0 }}>
              <CartesianGrid stroke={chartColors.grid} horizontal={false} />
              <XAxis type="number" {...axisProps} />
              <YAxis type="category" dataKey="type" {...axisProps} width={96} />
              <Tooltip {...tooltipProps} />
              <Bar dataKey="count" name="Units" radius={[0, 2, 2, 0]} barSize={22}>
                {defectTypes.map((d) => (
                  <Cell key={d.type} fill={d.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <ul className="mt-2 grid gap-1.5 border-t border-hairline pt-2.5 sm:grid-cols-2">
            {defectTypes.map((d) => (
              <li key={d.type} className="flex items-center gap-2 text-2xs">
                <span className="h-2 w-2 shrink-0 rounded-[2px]" style={{ background: d.color }} />
                <span className="truncate text-ink-muted">{d.type}</span>
                <span
                  className={cn(
                    'readout ml-auto',
                    d.confidence >= 0.85 ? 'text-nominal' : d.confidence >= 0.6 ? 'text-caution' : 'text-unknown',
                  )}
                >
                  {(d.confidence * 100).toFixed(0)}%
                </span>
              </li>
            ))}
          </ul>
        </ChartCard>

        <ChartCard
          title="Defect rate, last 14 days"
          subtitle="Percent failing first inspection, against novel patterns opened"
          provenance="measured"
          footnote="Novel patterns climb alongside the defect rate. That pairing is the tell: when both rise together, the process has moved somewhere the model was never trained."
        >
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={qualityTrend} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
              <CartesianGrid stroke={chartColors.grid} vertical={false} />
              <XAxis dataKey="t" {...axisProps} interval={1} />
              <YAxis yAxisId="left" {...axisProps} domain={[0, 10]} unit="%" />
              <YAxis yAxisId="right" orientation="right" {...axisProps} domain={[0, 16]} />
              <Tooltip {...tooltipProps} />
              <Legend {...legendProps} />
              <ReferenceLine yAxisId="left" y={batchBaseline} stroke={chartColors.axis} strokeDasharray="4 4" />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="defectRate"
                stroke={chartColors.critical}
                strokeWidth={2}
                dot={false}
                name="Defect rate (%)"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="novel"
                stroke={chartColors.unknown}
                strokeWidth={2}
                strokeDasharray="5 3"
                dot={false}
                name="Novel patterns open"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Machine + batch */}
      <div className="grid gap-3 xl:grid-cols-2">
        <ChartCard
          title="Defect rate by machine"
          subtitle="All eight machines, same 14-day window"
          provenance="measured"
          footnote="M07 sits 4.5× above the next-worst machine. Every other machine is inside normal spread, which is what makes this a machine problem rather than a line problem."
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={defectByMachine} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid stroke={chartColors.grid} vertical={false} />
              <XAxis dataKey="machine" {...axisProps} />
              <YAxis {...axisProps} unit="%" />
              <Tooltip {...tooltipProps} />
              <ReferenceLine y={batchBaseline} stroke={chartColors.axis} strokeDasharray="4 4" />
              <Bar dataKey="defectRate" name="Defect rate (%)" radius={[2, 2, 0, 0]}>
                {defectByMachine.map((m) => (
                  <Cell key={m.machine} fill={m.flagged ? chartColors.critical : chartColors.signal} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Defect rate by batch"
          subtitle="Six most recent batches against the 2.1% baseline"
          provenance="measured"
        >
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={defectByBatch} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid stroke={chartColors.grid} vertical={false} />
              <XAxis dataKey="batch" {...axisProps} />
              <YAxis {...axisProps} unit="%" />
              <Tooltip {...tooltipProps} />
              <ReferenceLine y={batchBaseline} stroke={chartColors.axis} strokeDasharray="4 4" />
              <Bar dataKey="defectRate" name="Defect rate (%)" radius={[2, 2, 0, 0]}>
                {defectByBatch.map((b) => (
                  <Cell key={b.batch} fill={severityTokens[b.status].stroke} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <ul className="mt-3 divide-y divide-hairline border-t border-hairline">
            {defectByBatch
              .filter((b) => b.status !== 'nominal')
              .map((b) => (
                <li key={b.batch} className="flex items-center gap-3 py-2">
                  <span className={cn('h-6 w-[2px] shrink-0 rounded-full', severityTokens[b.status].rail)} />
                  <span className="readout text-xs font-medium text-ink">{b.batch}</span>
                  <span className={cn('readout text-xs', severityTokens[b.status].text)}>{b.defectRate}%</span>
                  <span className="truncate text-2xs text-ink-faint">{b.note}</span>
                  <span className="readout ml-auto shrink-0 text-2xs text-ink-faint">
                    {formatNumber(b.units)} units
                  </span>
                </li>
              ))}
          </ul>
        </ChartCard>
      </div>

      {/* Linked signal */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-ink">Quality signals</h2>
        {attentionAlerts
          .filter((a) => a.layer === 'quality')
          .map((a) => (
            <AlertCard key={a.id} alert={{ ...a, route: undefined }} defaultOpen />
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
}: {
  label: string;
  value: string;
  tone?: 'critical' | 'nominal';
  strong?: boolean;
}) {
  return (
    <div>
      <dt className="text-2xs text-ink-faint">{label}</dt>
      <dd
        className={cn(
          'mt-0.5 readout',
          strong ? 'text-sm font-medium' : 'text-xs',
          tone === 'critical' ? 'text-critical' : tone === 'nominal' ? 'text-nominal' : 'text-ink',
        )}
      >
        {value}
      </dd>
    </div>
  );
}
