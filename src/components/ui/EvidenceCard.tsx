import { FileSearch } from 'lucide-react';
import type { Evidence } from '@/lib/types';
import { cn } from '@/lib/severity';

interface Props {
  evidence: Evidence[];
  title?: string;
  className?: string;
}

/**
 * Evidence is first-class: no conclusion appears in InduSense without the
 * records that produced it, each with its own weight and source integrity.
 */
export function EvidenceCard({ evidence, title = 'Evidence', className }: Props) {
  return (
    <div className={cn('plate-inset p-3', className)}>
      <div className="mb-2.5 flex items-center gap-1.5 text-2xs font-medium text-ink-muted">
        <FileSearch className="h-3.5 w-3.5" strokeWidth={2} />
        {title}
        <span className="text-ink-faint">· {evidence.length} records</span>
      </div>
      <ul className="space-y-2.5">
        {evidence.map((e) => (
          <li key={e.id} className="grid grid-cols-[auto_1fr] gap-x-2.5">
            <span className="mt-1.5 h-1 w-1 rounded-full bg-signal" />
            <div>
              <p className="text-xs leading-snug text-ink">{e.claim}</p>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-2xs text-ink-faint">
                <span>{e.source}</span>
                <span className="readout">{e.timestamp}</span>
                <span className="readout" title="How strongly this record supports the conclusion">
                  weight {e.weight.toFixed(2)}
                </span>
                {e.integrity !== undefined && e.integrity < 0.9 && (
                  <span className="readout text-caution" title="Source coverage is incomplete">
                    coverage {(e.integrity * 100).toFixed(0)}%
                  </span>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
