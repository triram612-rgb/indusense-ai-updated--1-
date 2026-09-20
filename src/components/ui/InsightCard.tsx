import type { ReactNode } from 'react';
import { ArrowUpRight } from 'lucide-react';
import type { Confidence, Severity } from '@/lib/types';
import { cn, severityTokens } from '@/lib/severity';
import { ConfidenceBar } from './ConfidenceBar';

interface Props {
  /** What the platform believes, phrased as a finding a person can act on. */
  headline: string;
  body: string;
  severity?: Severity;
  confidence?: Confidence;
  /** The recommended next move, if the platform is confident enough to name one. */
  action?: string;
  onAction?: () => void;
  icon?: ReactNode;
  className?: string;
}

export function InsightCard({
  headline,
  body,
  severity = 'nominal',
  confidence,
  action,
  onAction,
  icon,
  className,
}: Props) {
  const t = severityTokens[severity];
  return (
    <article className={cn('plate p-4', className)}>
      <span className={cn('absolute left-0 top-0 h-full w-[2px]', t.rail)} />
      <div className="flex items-start gap-2.5">
        {icon && <span className={cn('mt-0.5 shrink-0', t.text)}>{icon}</span>}
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-medium leading-snug text-ink">{headline}</h3>
          <p className="mt-1.5 max-w-[64ch] text-xs leading-relaxed text-ink-muted">{body}</p>
        </div>
      </div>

      {confidence && <ConfidenceBar className="mt-3.5" confidence={confidence} />}

      {action && (
        <button
          type="button"
          onClick={onAction}
          className="mt-3.5 inline-flex items-center gap-1 border-b border-signal/40 pb-0.5 text-2xs font-medium text-signal-bright transition-colors hover:border-signal hover:text-white"
        >
          {action}
          <ArrowUpRight className="h-3 w-3" strokeWidth={2.5} />
        </button>
      )}
    </article>
  );
}
