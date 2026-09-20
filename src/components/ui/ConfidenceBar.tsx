import type { Confidence } from '@/lib/types';
import { cn, confidenceBand, severityTokens } from '@/lib/severity';

interface Props {
  confidence: Confidence;
  /** Hide the numeric readout in dense tables. */
  compact?: boolean;
  className?: string;
}

const SEGMENTS = 12;

/**
 * A segmented meter rather than a smooth bar: an engineer should be able to
 * read "8 of 12" at a glance the way they read a physical gauge, and the
 * discreteness is a reminder that the score is an estimate, not a measurement.
 */
export function ConfidenceBar({ confidence, compact = false, className }: Props) {
  const band = confidence.abstained ? 'unknown' : confidenceBand(confidence.score);
  const t = severityTokens[band];
  const lit = Math.round(confidence.score * SEGMENTS);

  return (
    <div className={cn('w-full', className)}>
      {!compact && (
        <div className="mb-1.5 flex items-baseline justify-between">
          <span className="text-2xs text-ink-faint">
            {confidence.abstained ? 'Model abstained' : 'Model confidence'}
          </span>
          <span className={cn('readout text-2xs font-medium', t.text)}>
            {(confidence.score * 100).toFixed(0)}%
            <span className="ml-1.5 text-ink-faint">n={confidence.sampleSize}</span>
          </span>
        </div>
      )}
      <div className="flex h-1.5 gap-[2px]" role="meter" aria-valuenow={Math.round(confidence.score * 100)} aria-valuemin={0} aria-valuemax={100} aria-label="Model confidence">
        {Array.from({ length: SEGMENTS }).map((_, i) => (
          <span
            key={i}
            className={cn('flex-1 rounded-[1px] transition-colors', i < lit ? t.dot : 'bg-hairline')}
          />
        ))}
      </div>
      {confidence.note && !compact && (
        <p className="mt-2 border-l-2 border-hairline pl-2 text-2xs leading-relaxed text-ink-faint">
          {confidence.note}
        </p>
      )}
    </div>
  );
}
