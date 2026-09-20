import { cn } from '@/lib/severity';

export type FlowTerminal = 'classify' | 'review' | 'anomaly';

interface Props {
  /** Which terminal the currently selected cohort lands on. */
  active: FlowTerminal;
  onSelect: (terminal: FlowTerminal) => void;
  className?: string;
}

/**
 * The routing rule, drawn. Clicking any terminal selects that cohort, and the
 * path taken to reach it lights up — so the answer to "why did this unit end up
 * in human review?" is a visible route, not a black box.
 */
export function ClassificationFlow({ active, onSelect, className }: Props) {
  const knownYes = active === 'classify' || active === 'review';
  const confYes = active === 'classify';

  return (
    <div className={cn('text-xs', className)}>
      <Node label="Model prediction" state="active" kind="start" />
      <Connector lit />

      <Node label="Known defect match?" state="active" kind="decision" />

      <div className="mt-1 grid gap-3 sm:grid-cols-2">
        {/* YES branch */}
        <div className={cn('rounded-panel border p-3 transition-colors', knownYes ? 'border-signal/40 bg-signal-wash' : 'border-hairline bg-surface/40')}>
          <BranchLabel value="YES" lit={knownYes} />
          <Node label="Confidence above threshold?" state={knownYes ? 'active' : 'dim'} kind="decision" className="mt-2" />

          <div className="mt-2 grid gap-2">
            <div>
              <BranchLabel value="YES" lit={confYes} small />
              <Terminal
                label="Classify"
                note="Counted, costed, routed automatically"
                tone="nominal"
                selected={active === 'classify'}
                onClick={() => onSelect('classify')}
              />
            </div>
            <div>
              <BranchLabel value="NO" lit={knownYes && !confYes} small />
              <Terminal
                label="Human review"
                note="Queued for a quality engineer"
                tone="caution"
                selected={active === 'review'}
                onClick={() => onSelect('review')}
              />
            </div>
          </div>
        </div>

        {/* NO branch */}
        <div className={cn('flex flex-col rounded-panel border p-3 transition-colors', active === 'anomaly' ? 'border-unknown/40 bg-unknown-wash' : 'border-hairline bg-surface/40')}>
          <BranchLabel value="NO" lit={active === 'anomaly'} />
          <Terminal
            className="mt-2"
            label="Flag as anomaly"
            note="Held open — no label assigned"
            tone="unknown"
            selected={active === 'anomaly'}
            onClick={() => onSelect('anomaly')}
          />
          <p className="mt-2.5 text-2xs leading-relaxed text-ink-faint">
            This is the branch most systems do not have. Without it, every one of these units would be
            reported as the nearest known defect.
          </p>
        </div>
      </div>
    </div>
  );
}

function Node({
  label,
  state,
  kind,
  className,
}: {
  label: string;
  state: 'active' | 'dim';
  kind: 'start' | 'decision';
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 border px-2.5 py-1.5 transition-colors',
        kind === 'decision' ? 'rounded-sm' : 'rounded-panel',
        state === 'active' ? 'border-edge bg-panel text-ink' : 'border-hairline bg-surface/40 text-ink-faint',
        className,
      )}
    >
      {kind === 'decision' && (
        <span className={cn('h-2 w-2 rotate-45 border', state === 'active' ? 'border-signal' : 'border-hairline')} />
      )}
      <span className="text-xs font-medium">{label}</span>
    </div>
  );
}

function Connector({ lit }: { lit?: boolean }) {
  return (
    <div className="flex h-4 justify-start pl-4">
      <span className={cn('w-px', lit ? 'bg-signal/60' : 'bg-hairline')} />
    </div>
  );
}

function BranchLabel({ value, lit, small }: { value: string; lit: boolean; small?: boolean }) {
  return (
    <span
      className={cn(
        'readout inline-block rounded-sm border px-1.5 py-0.5 font-medium transition-colors',
        small ? 'text-[9px]' : 'text-2xs',
        lit ? 'border-signal/50 bg-signal-wash text-signal-bright' : 'border-hairline bg-surface text-ink-faint',
      )}
    >
      {value}
    </span>
  );
}

function Terminal({
  label,
  note,
  tone,
  selected,
  onClick,
  className,
}: {
  label: string;
  note: string;
  tone: 'nominal' | 'caution' | 'unknown';
  selected: boolean;
  onClick: () => void;
  className?: string;
}) {
  const tones = {
    nominal: 'border-nominal/45 bg-nominal/10 text-nominal',
    caution: 'border-caution/45 bg-caution/10 text-caution',
    unknown: 'border-unknown/45 bg-unknown/10 text-unknown',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        'mt-1 w-full rounded-sm border px-2.5 py-2 text-left transition-all',
        selected ? tones[tone] : 'border-hairline bg-surface/60 text-ink-muted hover:border-edge hover:text-ink',
        className,
      )}
    >
      <span className="block text-xs font-medium">{label}</span>
      <span className="mt-0.5 block text-2xs text-ink-faint">{note}</span>
    </button>
  );
}
