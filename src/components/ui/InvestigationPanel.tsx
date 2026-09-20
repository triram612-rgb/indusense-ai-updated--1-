import { Link } from 'react-router-dom';
import { FlaskConical, Search, Sparkles } from 'lucide-react';
import type { Confidence } from '@/lib/types';
import { cn } from '@/lib/severity';
import { ConfidenceBar } from './ConfidenceBar';

interface Driver {
  label: string;
  /** Share of the explained change, 0–1. */
  contribution: number;
  detail: string;
}

interface Props {
  finding: string;
  /** What the finding does not establish. Shown, not buried. */
  caveat?: string;
  drivers: Driver[];
  confidence: Confidence;
  coverage: number;
  investigateTo: string;
  simulateTo: string;
  className?: string;
}

export function InvestigationPanel({
  finding,
  caveat,
  drivers,
  confidence,
  coverage,
  investigateTo,
  simulateTo,
  className,
}: Props) {
  return (
    <section className={cn('plate overflow-hidden', className)}>
      <span className="absolute left-0 top-0 h-full w-[2px] bg-signal" />

      <header className="flex items-center gap-2 border-b border-hairline px-4 py-3">
        <Sparkles className="h-4 w-4 text-signal-bright" strokeWidth={2} />
        <h2 className="text-sm font-medium text-ink">AI Investigation</h2>
        <span className="readout ml-auto text-2xs text-ink-faint">
          Confidence {(confidence.score * 100).toFixed(0)}% · Data coverage {(coverage * 100).toFixed(0)}%
        </span>
      </header>

      <div className="grid gap-5 p-4 lg:grid-cols-[1fr_320px]">
        <div>
          <p className="max-w-[72ch] text-sm leading-relaxed text-ink">{finding}</p>

          {caveat && (
            <p className="mt-3 max-w-[72ch] border-l-2 border-unknown/60 bg-unknown-wash py-2 pl-3 pr-2 text-xs leading-relaxed text-ink-muted">
              {caveat}
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              to={investigateTo}
              className="inline-flex items-center gap-1.5 rounded-sm bg-signal px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-signal-bright"
            >
              <Search className="h-3.5 w-3.5" strokeWidth={2.5} />
              Investigate
            </Link>
            <Link
              to={simulateTo}
              className="inline-flex items-center gap-1.5 rounded-sm border border-edge bg-panel px-3 py-2 text-xs font-medium text-ink transition-colors hover:border-signal hover:text-signal-bright"
            >
              <FlaskConical className="h-3.5 w-3.5" strokeWidth={2.5} />
              Run Simulation
            </Link>
          </div>
        </div>

        <div className="plate-inset p-3">
          <p className="mb-2.5 text-2xs font-medium text-ink-muted">Ranked associations</p>
          <ul className="space-y-2.5">
            {drivers.map((d) => {
              const unattributed = d.label.toLowerCase().startsWith('unattributed');
              return (
                <li key={d.label}>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className={cn('text-xs', unattributed ? 'text-unknown' : 'text-ink')}>{d.label}</span>
                    <span className="readout shrink-0 text-2xs text-ink-muted">
                      {(d.contribution * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-hairline">
                    <div
                      className={cn('h-full rounded-full', unattributed ? 'bg-unknown' : 'bg-signal')}
                      style={{ width: `${d.contribution * 100}%` }}
                    />
                  </div>
                  <p className="readout mt-1 text-2xs text-ink-faint">{d.detail}</p>
                </li>
              );
            })}
          </ul>

          <ConfidenceBar className="mt-3.5 border-t border-hairline pt-3" confidence={confidence} />
        </div>
      </div>
    </section>
  );
}
