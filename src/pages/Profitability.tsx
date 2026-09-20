import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ArrowUpRight, ChevronRight, FlaskConical, Search } from 'lucide-react';
import {
  BreakdownDonut,
  ChartCard,
  LossDriverTree,
  PageHeader,
  RangeEstimate,
  SimulationBadge,
  StatusBadge,
} from '@/components/ui';
import { impactSlices } from '@/data/commandCenter';
import { financialSummary as fin, lossBranches, lossSources, lossTrend } from '@/data/profitability';
import { axisProps, chartColors, tooltipProps } from '@/lib/chartTheme';
import { cn } from '@/lib/severity';

const legendProps = {
  wrapperStyle: { fontSize: 11, color: '#94A1B2', paddingTop: 8 },
  iconType: 'plainline' as const,
  iconSize: 14,
};

export function Profitability() {
  const [branchId, setBranchId] = useState(lossBranches[0].id);
  const branch = lossBranches.find((b) => b.id === branchId) ?? lossBranches[0];

  /** Stacked areas need the band as a delta, not an absolute upper bound. */
  const trendWithBand = lossTrend.map((d) => ({
    ...d,
    band: (d.high as number) - (d.low as number),
  }));

  const profitPosition =
    (fin.estimatedProfitLakhs - fin.profitLowLakhs) / (fin.profitHighLakhs - fin.profitLowLakhs);

  return (
    <>
      <PageHeader
        title="Profitability Intelligence"
        question="Trace operational losses to estimated financial impact."
        actions={
          <>
            <SimulationBadge provenance="projected" />
            <StatusBadge severity="caution" label={`Margin gap ${fin.marginGap} pts`} />
          </>
        }
      />

      {/* Headline impact + donut */}
      <section className="plate overflow-hidden">
        <span className="absolute left-0 top-0 h-full w-[2px] bg-critical" />
        <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-hairline px-4 py-3">
          <h2 className="text-sm font-medium text-ink">Estimated Monthly Impact</h2>
          <span className="text-2xs text-ink-faint">
            Current loss rates projected over a full month — what this plant loses if today repeats
          </span>
        </header>

        <div className="p-4">
          <BreakdownDonut slices={impactSlices} totalLabel={`₹${fin.monthlyLossLakhs.toFixed(1)}L`} />
        </div>

        <p className="border-t border-hairline px-4 py-2.5 text-2xs leading-relaxed text-ink-faint">
          Every figure here is an estimate carrying an attribution confidence, shown in the right-hand column.
          Rework at 68% is the softest: returns are logged by operators, and that log is the least complete feed
          in the plant.
        </p>
      </section>

      {/* Loss driver tree */}
      <section className="plate overflow-hidden">
        <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-hairline px-4 py-3">
          <h2 className="text-sm font-medium text-ink">Loss driver tree</h2>
          <span className="text-2xs text-ink-faint">
            Select a driver to see the floor events behind the money
          </span>
        </header>

        <div className="grid gap-5 p-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
          <LossDriverTree
            branches={lossBranches}
            selectedId={branchId}
            onSelect={setBranchId}
            totalLakhs={fin.monthlyLossLakhs}
            margin={fin.currentMargin}
          />

          {/* Selected branch detail */}
          <div className="rounded-panel border border-hairline bg-surface/60 p-4">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-[2px]" style={{ background: branch.color }} />
              <h3 className="text-sm font-medium text-ink">
                {branch.driver} → {branch.mechanism}
              </h3>
              <span className="readout ml-auto text-sm font-medium text-ink">₹{branch.lakhs.toFixed(1)}L</span>
            </div>

            <table className="mt-3 w-full text-left">
              <tbody className="divide-y divide-hairline">
                {branch.components.map((c) => (
                  <tr key={c.label} className="text-xs">
                    <td className="py-1.5 text-ink-muted">{c.label}</td>
                    <td className="readout py-1.5 text-right text-ink">₹{c.lakhs.toFixed(1)}L</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-3 border-t border-hairline pt-3">
              <p className="mb-2 text-2xs font-medium text-ink-muted">Operational events behind this</p>
              <ul className="space-y-1.5">
                {branch.events.map((e) => (
                  <li key={e} className="flex gap-2 text-2xs leading-relaxed text-ink-muted">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full" style={{ background: branch.color }} />
                    {e}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-hairline pt-2.5">
              <span className="text-2xs text-ink-faint">Attribution confidence</span>
              <span
                className={cn(
                  'readout text-2xs font-medium',
                  branch.confidence >= 0.85 ? 'text-nominal' : 'text-caution',
                )}
              >
                {(branch.confidence * 100).toFixed(0)}%
              </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                to={branch.route}
                className="inline-flex items-center gap-1.5 rounded-sm bg-signal px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-signal-bright"
              >
                <Search className="h-3.5 w-3.5" strokeWidth={2.5} />
                Investigate Loss
              </Link>
              <Link
                to="/simulator"
                className="inline-flex items-center gap-1.5 rounded-sm border border-edge bg-panel px-3 py-2 text-xs font-medium text-ink transition-colors hover:border-signal hover:text-signal-bright"
              >
                <FlaskConical className="h-3.5 w-3.5" strokeWidth={2.5} />
                Simulate Improvement
              </Link>
            </div>

            <p className="mt-2.5 text-2xs text-ink-faint">Opens {branch.routeLabel}.</p>
          </div>
        </div>
      </section>

      {/* Margin + profit range */}
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="plate p-4">
          <span className="absolute left-0 top-0 h-full w-[2px] bg-caution" />
          <h2 className="text-sm font-medium text-ink">Margin</h2>

          <div className="mt-3.5 grid grid-cols-3 gap-3">
            <Stat label="Current estimated margin" value={`${fin.currentMargin}%`} tone="ink" />
            <Stat label="Projected baseline" value={`${fin.baselineMargin}%`} tone="muted" />
            <Stat label="Estimated gap" value={`${fin.marginGap} pts`} tone="critical" />
          </div>

          {/* Gap bar: baseline vs current */}
          <div className="mt-4">
            <div className="relative h-7 overflow-hidden rounded-sm border border-hairline bg-void">
              <div
                className="absolute inset-y-0 left-0 bg-nominal/25"
                style={{ width: `${(fin.baselineMargin / 40) * 100}%` }}
              />
              <div
                className="absolute inset-y-0 left-0 bg-signal/70"
                style={{ width: `${(fin.currentMargin / 40) * 100}%` }}
              />
              <span
                className="absolute inset-y-0 w-px bg-nominal"
                style={{ left: `${(fin.baselineMargin / 40) * 100}%` }}
              />
            </div>
            <div className="mt-1.5 flex justify-between text-2xs text-ink-faint">
              <span className="readout">current {fin.currentMargin}%</span>
              <span className="readout text-nominal">baseline {fin.baselineMargin}%</span>
            </div>
          </div>

          <p className="mt-3.5 border-t border-hairline pt-3 text-2xs leading-relaxed text-ink-muted">
            The gap is month to date, worth about{' '}
            <span className="readout text-ink">₹{fin.marginGapLakhs.toFixed(1)}L</span> on{' '}
            <span className="readout text-ink">₹{fin.revenueLakhs.toFixed(1)}L</span> of revenue. It is smaller
            than the ₹{fin.monthlyLossLakhs.toFixed(1)}L run rate because the Station 3 constraint is only{' '}
            {fin.workingDaysElapsed} of {fin.workingDaysTotal} working days old.
          </p>

          <p className="mt-2.5 flex items-start gap-1.5 border-l-2 border-caution/60 bg-caution-wash py-2 pl-2.5 pr-2 text-2xs leading-relaxed text-ink-muted">
            <ArrowUpRight className="mt-0.5 h-3 w-3 shrink-0 text-caution" strokeWidth={2.5} />
            <span>
              If current conditions hold to month end, the estimated gap widens to{' '}
              <span className="readout font-medium text-caution">{fin.projectedGap} pts</span> and margin lands
              near <span className="readout font-medium text-caution">{fin.projectedMargin}%</span>.
            </span>
          </p>
        </section>

        <section className="plate p-4">
          <span className="absolute left-0 top-0 h-full w-[2px] bg-signal" />
          <h2 className="text-sm font-medium text-ink">Estimated profit this month</h2>

          <RangeEstimate
            className="mt-3.5"
            label="Point estimate"
            value={`₹${fin.estimatedProfitLakhs.toFixed(1)}L`}
            low={`₹${fin.profitLowLakhs.toFixed(1)}L`}
            high={`₹${fin.profitHighLakhs.toFixed(1)}L`}
            position={profitPosition}
            note="The band reflects uncertainty in scrap valuation, unresolved rework returns and the 8% of process data missing this month. A single figure without this range would be a forecast dressed as a fact."
          />

          <dl className="mt-3 divide-y divide-hairline">
            <Row label="Estimated revenue" value={`₹${fin.revenueLakhs.toFixed(1)}L`} />
            <Row label="Estimated loss at current rates" value={`₹${fin.monthlyLossLakhs.toFixed(1)}L`} tone="critical" />
            <Row label="Attribution coverage" value={`${(fin.coverage * 100).toFixed(0)}%`} />
            <Row label="Model confidence" value={`${(fin.confidence.score * 100).toFixed(0)}%`} />
          </dl>
        </section>
      </div>

      {/* Loss trend */}
      <ChartCard
        title="Estimated daily loss, last 14 days"
        subtitle="₹ thousands per day, with the estimation band"
        provenance="projected"
        footnote="The shaded band is the uncertainty range, not a second series. It widens as the excursion grows because more of the loss depends on scrap valuations that are still open. The dashed line is the pre-excursion baseline of ₹27k per day."
      >
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={trendWithBand} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="lossBand" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={chartColors.critical} stopOpacity={0.22} />
                <stop offset="100%" stopColor={chartColors.critical} stopOpacity={0.04} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={chartColors.grid} vertical={false} />
            <XAxis dataKey="t" {...axisProps} interval={1} />
            <YAxis {...axisProps} domain={[0, 80]} tickFormatter={(v: number) => `₹${v}k`} />
            <Tooltip
              {...tooltipProps}
              formatter={(v: number, name: string) =>
                name === 'Estimation range' ? [`±₹${(v / 2).toFixed(0)}k`, name] : [`₹${v}k`, name]
              }
            />
            <Legend {...legendProps} />
            <ReferenceArea x1="13 Sep" x2="19 Sep" fill={chartColors.critical} fillOpacity={0.05} />
            <ReferenceLine y={27} stroke={chartColors.axis} strokeDasharray="4 4" />
            <Area
              type="monotone"
              dataKey="low"
              stackId="band"
              stroke="none"
              fill="none"
              legendType="none"
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="band"
              stackId="band"
              stroke="none"
              fill="url(#lossBand)"
              name="Estimation range"
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="loss"
              stroke={chartColors.critical}
              strokeWidth={2}
              dot={false}
              name="Estimated loss"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Ranked loss sources */}
      <section className="plate overflow-hidden">
        <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-hairline px-4 py-3">
          <h2 className="text-sm font-medium text-ink">Top loss sources</h2>
          <span className="text-2xs text-ink-faint">Ranked by estimated monthly value, with where each starts</span>
        </header>

        <ul className="divide-y divide-hairline">
          {lossSources.map((s) => (
            <li key={s.label}>
              <Link
                to={s.route}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-raised/50"
              >
                <span className="readout w-4 shrink-0 text-sm font-medium text-ink-faint">{s.rank}</span>
                <span className="h-8 w-[2px] shrink-0 rounded-full" style={{ background: s.color }} />

                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-medium text-ink">{s.label}</span>
                  <span className="readout block text-2xs text-ink-faint">{s.origin}</span>
                </span>

                <span className="hidden w-32 shrink-0 sm:block">
                  <span className="h-1 block overflow-hidden rounded-full bg-hairline">
                    <span
                      className="block h-full rounded-full"
                      style={{ width: `${s.share * 100}%`, background: s.color }}
                    />
                  </span>
                  <span className="readout mt-1 block text-2xs text-ink-faint">
                    {(s.share * 100).toFixed(1)}%
                  </span>
                </span>

                <span className="w-16 shrink-0 text-right">
                  <span className="readout block text-sm font-medium text-ink">₹{s.lakhs.toFixed(1)}L</span>
                  <span className="readout block text-2xs text-critical">+{s.deltaPct.toFixed(0)}%</span>
                </span>

                <span
                  className={cn(
                    'readout hidden w-10 shrink-0 text-right text-2xs sm:block',
                    s.confidence >= 0.85 ? 'text-nominal' : s.confidence >= 0.7 ? 'text-caution' : 'text-unknown',
                  )}
                  title="Attribution confidence"
                >
                  {(s.confidence * 100).toFixed(0)}%
                </span>

                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-ink-faint" strokeWidth={2.5} />
              </Link>
            </li>
          ))}
        </ul>

        <p className="border-t border-hairline px-4 py-2.5 text-2xs leading-relaxed text-ink-faint">
          Percentage change is against the previous 30 days. Defective units is both the largest source and the
          fastest growing, which is why the investigation on the Command Center starts there rather than with
          downtime.
        </p>
      </section>
    </>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: 'ink' | 'muted' | 'critical' }) {
  const tones = { ink: 'text-ink', muted: 'text-ink-muted', critical: 'text-critical' };
  return (
    <div>
      <p className="text-2xs leading-tight text-ink-faint">{label}</p>
      <p className={cn('readout mt-1 text-xl font-medium leading-none', tones[tone])}>{value}</p>
    </div>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: 'critical' }) {
  return (
    <div className="flex items-baseline justify-between py-2">
      <dt className="text-2xs text-ink-faint">{label}</dt>
      <dd className={cn('readout text-xs font-medium', tone === 'critical' ? 'text-critical' : 'text-ink')}>
        {value}
      </dd>
    </div>
  );
}
