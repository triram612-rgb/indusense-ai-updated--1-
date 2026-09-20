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
import { CircleDot, Layers } from 'lucide-react';
import {
  AlertCard,
  BreakdownDonut,
  ChartCard,
  DataQualityIndicator,
  HealthScore,
  InvestigationPanel,
  MetricCard,
  StatusBadge,
} from '@/components/ui';
import {
  attentionAlerts,
  commandMetrics,
  compositeHealth,
  dataCoverage,
  defectTrend,
  healthConfidence,
  healthDimensions,
  impactSlices,
  investigation,
  productionTrend,
  systemStatus,
} from '@/data/commandCenter';
import { dataStreams } from '@/data/mock';
import { axisProps, chartColors, tooltipProps } from '@/lib/chartTheme';

const legendProps = {
  wrapperStyle: { fontSize: 11, color: '#94A1B2', paddingTop: 8 },
  iconType: 'plainline' as const,
  iconSize: 14,
};

export function CommandCenter() {
  const score = compositeHealth(healthDimensions);

  return (
    <>
      {/* Header — plant, state, sync */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink">Factory Command Center</h1>
          <p className="mt-1 max-w-[76ch] text-xs leading-relaxed text-ink-muted">
            Unified operational intelligence across quality, production and profitability.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-sm border border-hairline bg-panel px-2.5 py-1.5">
            <Layers className="h-3.5 w-3.5 text-ink-faint" strokeWidth={2} />
            <span className="text-xs font-medium text-ink">{systemStatus.plant}</span>
          </span>
          <StatusBadge severity="nominal" label={`System status: ${systemStatus.state}`} pulse />
          <span className="readout hidden text-2xs text-ink-faint sm:inline">
            Synced {systemStatus.lastSync} · {systemStatus.sourcesOnline}/{systemStatus.sourcesTotal} sources
          </span>
        </div>
      </header>

      {/* Composite health */}
      <HealthScore
        score={score}
        dimensions={healthDimensions}
        confidence={healthConfidence}
        coverage={dataCoverage}
      />

      {/* Headline metrics */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Production"
          metric={commandMetrics.production}
          severity="caution"
          digits={0}
          comparisonLabel="vs previous 7 days"
          context="Below the 8,800 unit plan for six consecutive days."
        />
        <MetricCard
          label="Defect Rate"
          metric={commandMetrics.defectRate}
          severity="critical"
          invertDelta
          comparisonLabel="vs previous 7 days"
          context="3.1× the 14-day baseline of 2.1%."
        />
        <MetricCard
          label="Downtime"
          metric={commandMetrics.downtime}
          severity="caution"
          invertDelta
          comparisonLabel="vs previous 7 days"
          context="Target is 3.0%. Weakest health dimension."
        />
        <MetricCard
          label="Estimated Margin"
          metric={commandMetrics.margin}
          severity="caution"
          comparisonLabel="vs previous month"
          context="Holding, but absorbing ₹12.4L of monthly loss."
        />
      </div>

      {/* Alert centre */}
      <section>
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm font-medium text-ink">Requires Attention</h2>
          <span className="text-2xs text-ink-faint">
            Ranked by estimated impact. Each opens where the work gets done.
          </span>
        </div>
        <div className="space-y-3">
          {attentionAlerts.map((a) => (
            <AlertCard key={a.id} alert={a} />
          ))}
        </div>
      </section>

      {/* Trends */}
      <div className="grid gap-3 xl:grid-cols-2">
        <ChartCard
          title="Defect rate, last 14 days"
          subtitle="Percent of units failing first inspection"
          provenance="measured"
          footnote="The shaded window is the excursion the investigation below is working on. It opens on 13 Sep, peaks at 8.4% on 18 Sep with batch B248, and has begun to fall."
        >
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={defectTrend} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="defectFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={chartColors.critical} stopOpacity={0.28} />
                  <stop offset="100%" stopColor={chartColors.critical} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={chartColors.grid} vertical={false} />
              <XAxis dataKey="t" {...axisProps} interval={1} />
              <YAxis {...axisProps} domain={[0, 10]} unit="%" />
              <Tooltip {...tooltipProps} />
              <Legend {...legendProps} />
              <ReferenceArea x1="13 Sep" x2="19 Sep" fill={chartColors.critical} fillOpacity={0.06} />
              <ReferenceLine
                y={2.1}
                stroke={chartColors.axis}
                strokeDasharray="4 4"
                label={{ value: 'baseline 2.1%', position: 'insideBottomLeft', fill: chartColors.axis, fontSize: 10 }}
              />
              <Area
                type="monotone"
                dataKey="defectRate"
                stroke={chartColors.critical}
                fill="url(#defectFill)"
                strokeWidth={2}
                name="Defect rate"
                dot={{ r: 2, fill: chartColors.critical, strokeWidth: 0 }}
                activeDot={{ r: 4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Throughput and cycle time"
          subtitle="Daily output against mean cycle time — separate scales"
          provenance="measured"
          footnote="The two move against each other: as line cycle time stretched from 26.7s to 31.4s, daily output fell roughly 660 units. Station 3 is the station doing the stretching."
        >
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={productionTrend} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
              <CartesianGrid stroke={chartColors.grid} vertical={false} />
              <XAxis dataKey="t" {...axisProps} interval={1} />
              <YAxis
                yAxisId="left"
                {...axisProps}
                domain={[8_000, 9_400]}
                tickFormatter={(v: number) => `${(v / 1000).toFixed(1)}k`}
              />
              <YAxis yAxisId="right" orientation="right" {...axisProps} domain={[24, 34]} unit="s" />
              <Tooltip {...tooltipProps} />
              <Legend {...legendProps} />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="throughput"
                stroke={chartColors.signal}
                strokeWidth={2}
                dot={false}
                name="Throughput (units/day)"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="cycleTime"
                stroke={chartColors.caution}
                strokeWidth={2}
                strokeDasharray="5 3"
                dot={false}
                name="Cycle time (s)"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Financial impact */}
      <ChartCard
        title="Estimated Monthly Impact"
        subtitle="Where the ₹12.4L is going, and how confidently each rupee is attributed"
        provenance="projected"
        footnote="Projected from the trailing 30 days at current material and labour rates. Attribution confidence falls as losses get harder to trace — rework at 68% is the softest figure here."
      >
        <BreakdownDonut slices={impactSlices} totalLabel="₹12.4L" />
      </ChartCard>

      {/* Investigation */}
      <InvestigationPanel
        finding={investigation.finding}
        caveat={investigation.caveat}
        drivers={investigation.drivers}
        confidence={investigation.confidence}
        coverage={investigation.coverage}
        investigateTo="/quality"
        simulateTo="/simulator"
      />

      {/* Feed health */}
      <section>
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="flex items-center gap-1.5 text-sm font-medium text-ink">
            <CircleDot className="h-3.5 w-3.5 text-ink-faint" strokeWidth={2} />
            Feed health
          </h2>
          <span className="text-2xs text-ink-faint">Everything above rests on these five sources</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
          {dataStreams.map((s) => (
            <DataQualityIndicator key={s.id} stream={s} />
          ))}
        </div>
      </section>
    </>
  );
}
