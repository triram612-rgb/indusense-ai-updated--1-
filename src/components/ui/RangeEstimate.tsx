import { cn } from '@/lib/severity';

interface Props {
  label: string;
  /** The point estimate. Always presented as an estimate, never a commitment. */
  value: string;
  low: string;
  high: string;
  /** 0–1 positions of the point estimate within the band, for the marker. */
  position?: number;
  intervalLabel?: string;
  note?: string;
  className?: string;
}

/**
 * A point estimate is a lie without its band. This renders the band first and
 * the point second, so the eye reads the range before the headline figure.
 */
export function RangeEstimate({
  label,
  value,
  low,
  high,
  position = 0.5,
  intervalLabel = '80% interval',
  note,
  className,
}: Props) {
  const pct = Math.min(Math.max(position, 0), 1) * 100;

  return (
    <div className={cn('plate-inset p-3.5', className)}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-2xs text-ink-faint">{label}</span>
        <span className="rounded-sm border border-signal/35 bg-signal-wash px-1.5 py-0.5 text-2xs font-medium text-signal-bright">
          Estimated
        </span>
      </div>

      <p className="readout mt-2 text-3xl font-medium leading-none text-ink">{value}</p>

      <div className="mt-4">
        <div className="relative h-8">
          {/* Band */}
          <div className="absolute inset-x-0 top-3 h-2 rounded-sm bg-surface">
            <div className="h-full rounded-sm bg-signal/25" />
          </div>
          {/* Tick marks at the bounds */}
          <span className="absolute left-0 top-2 h-4 w-px bg-edge" />
          <span className="absolute right-0 top-2 h-4 w-px bg-edge" />
          {/* Point estimate */}
          <span
            className="absolute top-1.5 h-5 w-[2px] -translate-x-1/2 rounded-full bg-signal-bright"
            style={{ left: `${pct}%` }}
          />
          <span
            className="absolute top-0 h-1.5 w-1.5 -translate-x-1/2 rotate-45 bg-signal-bright"
            style={{ left: `${pct}%` }}
          />
        </div>

        <div className="flex items-baseline justify-between">
          <span className="readout text-2xs text-ink-muted">{low}</span>
          <span className="text-2xs text-ink-faint">{intervalLabel}</span>
          <span className="readout text-2xs text-ink-muted">{high}</span>
        </div>
      </div>

      {note && <p className="mt-2.5 border-t border-hairline pt-2.5 text-2xs leading-relaxed text-ink-faint">{note}</p>}
    </div>
  );
}
