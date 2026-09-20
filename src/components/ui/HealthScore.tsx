import type { Confidence, HealthDimension } from '@/lib/types';
import { cn, severityTokens } from '@/lib/severity';
import { ConfidenceBar } from './ConfidenceBar';

interface Props {
  score: number;
  dimensions: HealthDimension[];
  confidence?: Confidence;
  coverage?: number;
  className?: string;
}

/**
 * The composite is computed from the dimensions by the caller and the weights
 * are printed beside each bar. A manager should never have to ask why the
 * headline number moved.
 */
export function HealthScore({ score, dimensions, confidence, coverage, className }: Props) {
  const band = score >= 85 ? 'nominal' : score >= 70 ? 'caution' : 'critical';
  const t = severityTokens[band];
  const weakest = dimensions.reduce((a, b) => (a.score <= b.score ? a : b));

  return (
    <section className={cn('plate flex flex-col lg:flex-row', className)}>
      <span className={cn('absolute left-0 top-0 h-full w-[2px]', t.rail)} />

      {/* Dial */}
      <div className="flex shrink-0 flex-col justify-center gap-3 border-b border-hairline p-5 lg:w-[260px] lg:border-b-0 lg:border-r">
        <h2 className="text-xs font-medium text-ink-muted">Production Health Score</h2>

        <div className="relative">
          <Dial score={score} stroke={t.stroke} />
        </div>

        <p className="text-2xs leading-relaxed text-ink-faint">
          Weighted composite of the five dimensions on the right. {weakest.label} is holding it down.
        </p>

        {confidence && <ConfidenceBar confidence={confidence} />}

        {coverage !== undefined && (
          <div className="flex items-center justify-between border-t border-hairline pt-2.5 text-2xs">
            <span className="text-ink-faint">Data coverage</span>
            <span className={cn('readout font-medium', coverage >= 0.9 ? 'text-nominal' : 'text-caution')}>
              {(coverage * 100).toFixed(0)}%
            </span>
          </div>
        )}
      </div>

      {/* Dimension bars */}
      <div className="min-w-0 flex-1 p-5">
        <div className="mb-3 flex items-baseline justify-between">
          <h3 className="text-xs font-medium text-ink-muted">Contributing dimensions</h3>
          <span className="text-2xs text-ink-faint">score × weight = contribution</span>
        </div>

        <ul className="space-y-3">
          {dimensions.map((d) => {
            const dt = severityTokens[d.severity];
            return (
              <li key={d.id}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-xs font-medium text-ink">{d.label}</span>
                  <span className="readout shrink-0 text-2xs text-ink-faint">
                    <span className={cn('text-sm font-medium', dt.text)}>{d.score}</span>
                    <span className="mx-1.5">×</span>
                    {d.weight.toFixed(2)}
                    <span className="mx-1.5">=</span>
                    <span className="text-ink">{(d.score * d.weight).toFixed(1)}</span>
                  </span>
                </div>

                <div className="mt-1.5 flex items-center gap-2">
                  <div className="h-2 flex-1 overflow-hidden rounded-sm bg-surface">
                    {/* Filled portion is the score; the outline marks its weighted share of the bar */}
                    <div
                      className={cn('h-full rounded-sm transition-[width] duration-500', dt.dot)}
                      style={{ width: `${d.score}%` }}
                    />
                  </div>
                </div>

                <p className="mt-1 text-2xs leading-relaxed text-ink-faint">{d.note}</p>
              </li>
            );
          })}
        </ul>

        <p className="mt-4 border-t border-hairline pt-2.5 text-2xs text-ink-faint">
          Contributions sum to{' '}
          <span className="readout text-ink">
            {dimensions.reduce((s, d) => s + d.score * d.weight, 0).toFixed(1)}
          </span>{' '}
          — rounded to the {score} shown left. Weights are set per plant and visible here by design.
        </p>
      </div>
    </section>
  );
}

function Dial({ score, stroke }: { score: number; stroke: string }) {
  const r = 52;
  const circumference = Math.PI * r; // half circle
  const filled = (score / 100) * circumference;

  return (
    <div className="relative flex items-end justify-center">
      <svg viewBox="0 0 140 78" className="w-full max-w-[200px]" role="img" aria-label={`Health score ${score} of 100`}>
        <path
          d="M 18 70 A 52 52 0 0 1 122 70"
          fill="none"
          stroke="#222B36"
          strokeWidth="9"
          strokeLinecap="round"
        />
        <path
          d="M 18 70 A 52 52 0 0 1 122 70"
          fill="none"
          stroke={stroke}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circumference}`}
          className="transition-[stroke-dasharray] duration-700"
        />
        {/* Graduations every 20 points */}
        {[0, 20, 40, 60, 80, 100].map((tick) => {
          const angle = Math.PI * (1 - tick / 100);
          const x1 = 70 + Math.cos(angle) * 43;
          const y1 = 70 - Math.sin(angle) * 43;
          const x2 = 70 + Math.cos(angle) * 38;
          const y2 = 70 - Math.sin(angle) * 38;
          return <line key={tick} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#2E3A49" strokeWidth="1" />;
        })}
      </svg>

      <div className="absolute bottom-0 flex items-baseline gap-1">
        <span className="readout text-4xl font-semibold leading-none text-ink">{score}</span>
        <span className="readout text-xs text-ink-faint">/100</span>
      </div>
    </div>
  );
}
