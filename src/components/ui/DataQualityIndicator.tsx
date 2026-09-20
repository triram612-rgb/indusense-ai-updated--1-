import { Clock, Database, Waves } from 'lucide-react';
import type { DataStream } from '@/lib/types';
import { cn, severityTokens } from '@/lib/severity';

interface Props {
  stream: DataStream;
  className?: string;
}

function freshness(minutes: number): string {
  if (minutes < 1) return 'live';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  return hours < 24 ? `${hours}h ago` : `${Math.round(hours / 24)}d ago`;
}

/**
 * Three dimensions a manager needs before trusting a panel: is the data
 * complete, is it current, and has its distribution moved since training.
 */
export function DataQualityIndicator({ stream, className }: Props) {
  const t = severityTokens[stream.status];
  const pct = Math.round(stream.completeness * 100);

  return (
    <div className={cn('plate-inset flex flex-col gap-2.5 p-3', className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-xs font-medium text-ink">{stream.name}</span>
        <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', t.dot)} title={t.label} />
      </div>

      <div className="flex items-center gap-2">
        <Database className="h-3 w-3 shrink-0 text-ink-faint" strokeWidth={2} />
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-hairline">
          <div className={cn('h-full rounded-full', t.dot)} style={{ width: `${pct}%` }} />
        </div>
        <span className="readout w-9 text-right text-2xs text-ink-muted">{pct}%</span>
      </div>

      <div className="flex items-center justify-between text-2xs text-ink-faint">
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3 w-3" strokeWidth={2} />
          <span className="readout">{freshness(stream.freshnessMinutes)}</span>
        </span>
        <span
          className={cn('inline-flex items-center gap-1', stream.drift > 0.3 && 'text-caution')}
          title="Distribution shift versus the training window"
        >
          <Waves className="h-3 w-3" strokeWidth={2} />
          <span className="readout">drift {stream.drift.toFixed(2)}</span>
        </span>
      </div>
    </div>
  );
}
