import { useState } from 'react';
import { ChevronDown, Info, ShieldCheck } from 'lucide-react';
import type { Confidence, Evidence } from '@/lib/types';
import { cn } from '@/lib/severity';
import { ConfidenceBar } from './ConfidenceBar';
import { EvidenceCard } from './EvidenceCard';

interface Props {
  confidence: Confidence;
  coverage: number;
  evidence: Evidence[];
  /** What would make this prediction less reliable. Always shown, never hidden. */
  limitation: string;
  className?: string;
}

/**
 * The standing contract for any prediction on this page: confidence, data
 * coverage, the evidence behind it, and the conditions under which it degrades.
 */
export function EvidencePanel({ confidence, coverage, evidence, limitation, className }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn('plate-inset p-3.5', className)}>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <ConfidenceBar confidence={confidence} />
        </div>
        <div>
          <div className="mb-1.5 flex items-baseline justify-between">
            <span className="text-2xs text-ink-faint">Data coverage</span>
            <span className={cn('readout text-2xs font-medium', coverage >= 0.9 ? 'text-nominal' : 'text-caution')}>
              {(coverage * 100).toFixed(0)}%
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-hairline">
            <div
              className={cn('h-full rounded-full', coverage >= 0.9 ? 'bg-nominal' : 'bg-caution')}
              style={{ width: `${coverage * 100}%` }}
            />
          </div>
          <p className="mt-2 text-2xs text-ink-faint">
            Share of the process signals this prediction expects that were actually present.
          </p>
        </div>
      </div>

      <div className="mt-3 border-t border-hairline pt-3">
        <p className="mb-2 flex items-center gap-1.5 text-2xs font-medium text-ink-muted">
          <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2} />
          Evidence behind this prediction
        </p>
        <ul className="flex flex-wrap gap-1.5">
          {evidence.map((e) => (
            <li
              key={e.id}
              className="rounded-sm border border-hairline bg-panel px-2 py-1 text-2xs text-ink-muted"
              title={e.claim}
            >
              {e.source}
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-3 flex items-start gap-1.5 border-l-2 border-caution/60 bg-caution-wash py-2 pl-2.5 pr-2 text-2xs leading-relaxed text-ink-muted">
        <Info className="mt-0.5 h-3 w-3 shrink-0 text-caution" strokeWidth={2.5} />
        <span>
          <span className="font-medium text-caution">Limitations. </span>
          {limitation}
        </span>
      </p>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="mt-3 inline-flex items-center gap-1.5 rounded-sm border border-edge bg-panel px-3 py-1.5 text-2xs font-medium text-ink transition-colors hover:border-signal hover:text-signal-bright"
      >
        <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} strokeWidth={2.5} />
        {open ? 'Hide Evidence' : 'View Evidence'}
      </button>

      {open && <EvidenceCard className="mt-3" evidence={evidence} title="Source records" />}
    </div>
  );
}
