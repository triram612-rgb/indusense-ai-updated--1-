import { AlertTriangle, ChevronRight, HelpCircle } from 'lucide-react';
import { attentionAlerts } from '@/data/commandCenter';
import { novelPattern } from '@/data/quality';
import { cn, severityTokens } from '@/lib/severity';
import { useTwin } from '../state';
import type { Selection } from '../state';

/**
 * Left rail — the queue of things asking for attention.
 *
 * Each signal is bound to a physical object. Clicking one selects that object
 * in the scene and arms its causal chain, so the rail is a way into the factory
 * rather than a parallel list of problems to read separately.
 */

interface Binding {
  selection: Selection;
  chainId: string | null;
}

/** Which object in the twin each alert points at. */
const BINDINGS: Record<string, Binding> = {
  'at-01': { selection: { kind: 'machine', id: 'M07', nodeId: 'st-2' }, chainId: 'ch-m07' },
  'at-02': { selection: { kind: 'node', id: 'st-3', nodeId: 'st-3' }, chainId: 'ch-st3' },
  'at-03': { selection: { kind: 'hotspot', id: 'hs-b248', nodeId: 'inspection' }, chainId: 'ch-m07' },
};

export function SignalRail() {
  const { select, setActiveChain, selection, layers, toggleLayer } = useTwin();

  function open(alertId: string) {
    const b = BINDINGS[alertId];
    if (!b) return;
    select(b.selection);
    setActiveChain(b.chainId);
    if (b.chainId && !layers.has('rootcause')) toggleLayer('rootcause');
  }

  return (
    <aside className="pointer-events-auto flex w-full flex-col gap-1.5 lg:w-[268px]">
      <div className="plate flex items-center gap-2 px-2.5 py-2">
        <AlertTriangle className="h-3.5 w-3.5 text-caution" strokeWidth={2} />
        <span className="text-[10px] uppercase tracking-[0.16em] text-ink-muted">Attention queue</span>
        <span className="readout ml-auto text-[10px] text-ink-faint">{attentionAlerts.length} open</span>
      </div>

      {attentionAlerts.map((a) => {
        const tok = severityTokens[a.severity];
        const bound = BINDINGS[a.id];
        const active = bound && selection?.id === bound.selection.id;
        return (
          <button
            key={a.id}
            type="button"
            onClick={() => open(a.id)}
            className={cn(
              'plate group relative overflow-hidden p-2.5 text-left transition-colors',
              active ? 'border-edge bg-raised' : 'hover:border-edge',
            )}
          >
            <span className={cn('absolute inset-y-0 left-0 w-[2px]', tok.rail)} />
            <div className="flex items-start gap-2 pl-1.5">
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className={cn('readout text-[9px] uppercase tracking-[0.16em]', tok.text)}>{tok.label}</span>
                  <span className="readout text-[9px] text-ink-faint">{a.raisedAt}</span>
                </div>
                <p className="mt-1 text-xs font-medium leading-snug text-ink">{a.title}</p>
                <dl className="mt-1.5 space-y-[3px]">
                  {a.readings?.slice(0, 2).map((r) => (
                    <div key={r.label} className="flex items-baseline justify-between gap-2">
                      <dt className="truncate text-[10px] text-ink-faint">{r.label}</dt>
                      <dd
                        className={cn(
                          'readout shrink-0 text-[10px]',
                          r.severity ? severityTokens[r.severity].text : 'text-ink',
                        )}
                      >
                        {r.value}
                      </dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-1.5 flex items-center gap-1.5 border-t border-hairline pt-1.5">
                  <span className="readout text-[9px] text-ink-faint">
                    conf {(a.confidence.score * 100).toFixed(0)}% · n={a.confidence.sampleSize.toLocaleString('en-IN')}
                  </span>
                  <ChevronRight className="ml-auto h-3 w-3 text-ink-faint transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
                </div>
              </div>
            </div>
          </button>
        );
      })}

      {/* The gap the platform is explicit about */}
      <button
        type="button"
        onClick={() => {
          select({ kind: 'hotspot', id: 'hs-novel', nodeId: 'st-3' });
          setActiveChain('ch-novel');
          if (!layers.has('rootcause')) toggleLayer('rootcause');
        }}
        className="plate group relative overflow-hidden p-2.5 text-left hover:border-edge"
      >
        <span className="absolute inset-y-0 left-0 w-[2px] bg-unknown" />
        <div className="pl-1.5">
          <div className="flex items-center gap-1.5">
            <HelpCircle className="h-3 w-3 text-unknown" strokeWidth={2} />
            <span className="readout text-[9px] uppercase tracking-[0.16em] text-unknown">Unclassified</span>
          </div>
          <p className="mt-1 text-xs font-medium leading-snug text-ink">{novelPattern.title}</p>
          <p className="mt-1 text-[10px] leading-relaxed text-ink-muted">
            {novelPattern.units} units, nearest class {(novelPattern.similarity * 100).toFixed(0)}% similar. No label
            assigned at this distance.
          </p>
        </div>
      </button>
    </aside>
  );
}
