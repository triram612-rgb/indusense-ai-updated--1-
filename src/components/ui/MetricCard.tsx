import { ArrowDownRight, ArrowRight, ArrowUpRight } from 'lucide-react';
import type { MetricValue, Severity } from '@/lib/types';
import { cn, formatNumber, severityTokens } from '@/lib/severity';
import { SimulationBadge } from './SimulationBadge';

interface Props {
  label: string;
  metric: MetricValue;
  severity?: Severity;
  /** One line of context under the number — what a manager should do with it. */
  context?: string;
  /** Lower is better for costs and scrap; flips the colour of the delta. */
  invertDelta?: boolean;
  /** What the delta is measured against, e.g. "vs previous 7 days". */
  comparisonLabel?: string;
  digits?: number;
  className?: string;
}

const trendIcon = { up: ArrowUpRight, down: ArrowDownRight, flat: ArrowRight };

export function MetricCard({
  label,
  metric,
  severity,
  context,
  invertDelta = false,
  comparisonLabel = 'vs 7-shift median',
  digits = 1,
  className,
}: Props) {
  const Trend = trendIcon[metric.trend ?? 'flat'];
  const rising = (metric.deltaPct ?? 0) > 0;
  const good = invertDelta ? !rising : rising;
  const deltaTone = metric.deltaPct === undefined ? 'text-ink-faint' : good ? 'text-nominal' : 'text-critical';

  return (
    <article className={cn('plate group p-4', className)}>
      {severity && (
        <span className={cn('absolute left-0 top-0 h-full w-[2px] rounded-l-panel', severityTokens[severity].rail)} />
      )}
      <header className="flex items-start justify-between gap-3">
        <h3 className="text-xs font-medium leading-tight text-ink-muted">{label}</h3>
        <SimulationBadge provenance={metric.provenance} />
      </header>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="readout text-3xl font-medium leading-none text-ink">
          {formatNumber(metric.value, digits)}
        </span>
        {metric.unit && <span className="text-xs text-ink-faint">{metric.unit}</span>}
      </div>

      <div className="mt-2 flex items-center gap-3 text-2xs">
        {metric.uncertainty !== undefined && (
          <span className="readout text-ink-faint" title="Estimated uncertainty band around the point value">
            ±{formatNumber(metric.uncertainty, digits)}
          </span>
        )}
        {metric.deltaPct !== undefined && (
          <span className={cn('readout inline-flex items-center gap-0.5 font-medium', deltaTone)}>
            <Trend className="h-3 w-3" strokeWidth={2.5} />
            {Math.abs(metric.deltaPct).toFixed(1)}%
            <span className="ml-1 font-sans text-ink-faint">{comparisonLabel}</span>
          </span>
        )}
      </div>

      {context && <p className="mt-3 border-t border-hairline pt-2.5 text-2xs leading-relaxed text-ink-faint">{context}</p>}
    </article>
  );
}
