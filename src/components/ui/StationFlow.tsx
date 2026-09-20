import { ChevronRight } from 'lucide-react';
import type { Station } from '@/data/production';
import { cn, formatNumber, severityTokens } from '@/lib/severity';

interface Props {
  stations: Station[];
  selectedId: string;
  onSelect: (id: string) => void;
  className?: string;
}

/**
 * The line, left to right. Each station carries its utilisation as a fill level
 * so the constraint reads as a full tank beside four partly-empty ones — the
 * shape an operations manager already recognises from a plant mimic board.
 */
export function StationFlow({ stations, selectedId, onSelect, className }: Props) {
  return (
    <div className={cn('overflow-x-auto', className)}>
      <ol className="flex min-w-[720px] items-stretch gap-1">
        {stations.map((s, i) => {
          const t = severityTokens[s.status];
          const selected = s.id === selectedId;

          return (
            <li key={s.id} className="flex flex-1 items-stretch gap-1">
              <button
                type="button"
                onClick={() => onSelect(s.id)}
                aria-pressed={selected}
                className={cn(
                  'relative flex-1 rounded-panel border p-3 text-left transition-all',
                  s.bottleneck
                    ? 'border-critical/60 bg-critical/10'
                    : selected
                      ? 'border-signal/50 bg-signal-wash'
                      : 'border-hairline bg-surface/60 hover:border-edge',
                )}
              >
                {s.bottleneck && (
                  <span className="absolute -top-px left-3 right-3 h-[2px] animate-pulse-dot rounded-full bg-critical" />
                )}

                <div className="flex items-center justify-between gap-2">
                  <span className={cn('text-xs font-medium', s.bottleneck ? 'text-critical' : 'text-ink')}>
                    {s.short}
                  </span>
                  {selected && !s.bottleneck && <span className="h-1.5 w-1.5 rounded-full bg-signal" />}
                </div>

                {s.bottleneck && (
                  <span className="readout mt-1 block text-[9px] font-semibold tracking-wide text-critical">
                    BOTTLENECK
                  </span>
                )}

                <div className="mt-2.5">
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xs text-ink-faint">Utilisation</span>
                    <span className={cn('readout text-xs font-medium', t.text)}>{s.utilization}%</span>
                  </div>
                  {/* Fill level — the constraint reads as a full tank */}
                  <div className="mt-1 h-6 overflow-hidden rounded-sm border border-hairline bg-void">
                    <div
                      className={cn('h-full transition-[width] duration-500', t.dot)}
                      style={{ width: `${s.utilization}%`, opacity: s.bottleneck ? 1 : 0.55 }}
                    />
                  </div>
                </div>

                <dl className="mt-2 space-y-0.5">
                  <div className="flex justify-between">
                    <dt className="text-2xs text-ink-faint">Out</dt>
                    <dd className="readout text-2xs text-ink">{formatNumber(s.throughput)}/d</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-2xs text-ink-faint">Cycle</dt>
                    <dd
                      className={cn(
                        'readout text-2xs',
                        s.cycleTime / s.cycleBaseline > 1.1 ? 'text-critical' : 'text-ink',
                      )}
                    >
                      {s.cycleTime.toFixed(1)}s
                    </dd>
                  </div>
                </dl>
              </button>

              {i < stations.length - 1 && (
                <span className="flex shrink-0 items-center" aria-hidden="true">
                  <ChevronRight
                    className={cn(
                      'h-4 w-4',
                      stations[i + 1].bottleneck ? 'text-critical' : 'text-ink-faint',
                    )}
                    strokeWidth={2.5}
                  />
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
