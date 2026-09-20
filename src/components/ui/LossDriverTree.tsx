import type { LossBranch } from '@/data/profitability';
import { cn } from '@/lib/severity';

interface Props {
  branches: LossBranch[];
  selectedId: string;
  onSelect: (id: string) => void;
  totalLakhs: number;
  margin: number;
  className?: string;
}

/**
 * Operations on top, money at the bottom. Reading down the tree is the whole
 * argument of the page: a floor event becomes a mechanism becomes a rupee
 * figure becomes a margin point.
 */
export function LossDriverTree({ branches, selectedId, onSelect, totalLakhs, margin, className }: Props) {
  return (
    <div className={cn('flex flex-col items-center', className)}>
      {/* Root */}
      <Node label="Profitability" sublabel="Plant 01, current month" tone="root" />
      <Stem />

      {/* Fan-out rule */}
      <div className="relative h-4 w-full">
        <span className="absolute left-1/2 top-0 h-4 w-px -translate-x-1/2 bg-hairline sm:hidden" />
        <span className="absolute left-[16.6%] right-[16.6%] top-0 hidden h-px bg-hairline sm:block" />
        {[16.6, 50, 83.4].map((x) => (
          <span
            key={x}
            className="absolute top-0 hidden h-4 w-px bg-hairline sm:block"
            style={{ left: `${x}%` }}
          />
        ))}
      </div>

      {/* Three branches */}
      <div className="grid w-full gap-3 sm:grid-cols-3">
        {branches.map((b) => {
          const selected = b.id === selectedId;
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => onSelect(b.id)}
              aria-pressed={selected}
              className={cn(
                'rounded-panel border p-3 text-left transition-all',
                selected ? 'border-signal/50 bg-signal-wash' : 'border-hairline bg-surface/60 hover:border-edge',
              )}
            >
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 shrink-0 rounded-[2px]" style={{ background: b.color }} />
                <span className="text-xs font-medium text-ink">{b.driver}</span>
                <span className="readout ml-auto text-xs font-medium text-ink">₹{b.lakhs.toFixed(1)}L</span>
              </div>

              {/* Mechanism sits below its driver, connected */}
              <div className="ml-1 mt-2 border-l border-hairline pl-3">
                <span className="block text-2xs text-ink-faint">becomes</span>
                <span className="mt-0.5 block text-xs text-ink-muted">{b.mechanism}</span>
              </div>

              <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-hairline">
                <div className="h-full rounded-full" style={{ width: `${b.share * 100}%`, background: b.color }} />
              </div>
              <span className="readout mt-1 block text-2xs text-ink-faint">
                {(b.share * 100).toFixed(1)}% of estimated loss
              </span>
            </button>
          );
        })}
      </div>

      {/* Converge */}
      <div className="relative h-4 w-full">
        <span className="absolute left-1/2 bottom-0 h-4 w-px -translate-x-1/2 bg-hairline sm:hidden" />
        <span className="absolute left-[16.6%] right-[16.6%] bottom-0 hidden h-px bg-hairline sm:block" />
        {[16.6, 50, 83.4].map((x) => (
          <span
            key={x}
            className="absolute bottom-0 hidden h-4 w-px bg-hairline sm:block"
            style={{ left: `${x}%` }}
          />
        ))}
      </div>

      <Node
        label="Estimated Loss"
        sublabel={`₹${totalLakhs.toFixed(1)}L per month at current rates`}
        tone="loss"
      />
      <Stem />
      <Node label="Estimated Margin" sublabel={`${margin.toFixed(1)}% month to date`} tone="margin" />
    </div>
  );
}

function Stem() {
  return <span className="h-4 w-px bg-hairline" />;
}

function Node({
  label,
  sublabel,
  tone,
}: {
  label: string;
  sublabel: string;
  tone: 'root' | 'loss' | 'margin';
}) {
  const tones = {
    root: 'border-edge bg-panel text-ink',
    loss: 'border-critical/45 bg-critical/10 text-critical',
    margin: 'border-nominal/45 bg-nominal/10 text-nominal',
  };

  return (
    <div className={cn('rounded-panel border px-4 py-2 text-center', tones[tone])}>
      <span className="block text-xs font-medium">{label}</span>
      <span className="readout mt-0.5 block text-2xs text-ink-faint">{sublabel}</span>
    </div>
  );
}
