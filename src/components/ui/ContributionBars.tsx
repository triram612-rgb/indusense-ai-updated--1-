import { cn } from '@/lib/severity';

export interface Contribution {
  label: string;
  /** 0–1 share of the model's explanation. */
  share: number;
  detail?: string;
  unattributed?: boolean;
}

interface Props {
  factors: Contribution[];
  /** Deliberately not "cause". These are ranked associations. */
  title?: string;
  caption?: string;
  /** Chip above the bars. Defaults to the contribution-share framing. */
  chipLabel?: string;
  /** Replaces the standing not-causal note when the scale means something else. */
  disclaimer?: string;
  className?: string;
}

export function ContributionBars({
  factors,
  title = 'Key contributing factors',
  caption,
  chipLabel = 'Model contribution / evidence',
  disclaimer,
  className,
}: Props) {
  return (
    <div className={className}>
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-xs font-medium text-ink">{title}</h3>
        <span className="rounded-sm border border-hairline bg-surface px-1.5 py-0.5 text-2xs text-ink-faint">
          {chipLabel}
        </span>
      </div>

      <ul className="space-y-2.5">
        {factors.map((f) => (
          <li key={f.label}>
            <div className="flex items-baseline justify-between gap-3">
              <span className={cn('text-xs', f.unattributed ? 'text-unknown' : 'text-ink')}>{f.label}</span>
              <span className={cn('readout shrink-0 text-xs font-medium', f.unattributed ? 'text-unknown' : 'text-ink')}>
                {(f.share * 100).toFixed(0)}%
              </span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-sm bg-surface">
              <div
                className={cn(
                  'h-full rounded-sm transition-[width] duration-500',
                  f.unattributed ? 'bg-unknown' : 'bg-signal',
                )}
                style={{ width: `${f.share * 100}%` }}
              />
            </div>
            {f.detail && <p className="mt-1 text-2xs leading-relaxed text-ink-faint">{f.detail}</p>}
          </li>
        ))}
      </ul>

      {caption && (
        <p className="mt-3 border-t border-hairline pt-2.5 text-2xs leading-relaxed text-ink-muted">{caption}</p>
      )}

      <p className="mt-2 text-2xs leading-relaxed text-ink-faint">
        {disclaimer ??
          'These are the model\u2019s ranked associations for this prediction, not measured causal effects. A high share means the variable moved the prediction most, not that removing it would remove the defect.'}
      </p>
    </div>
  );
}
