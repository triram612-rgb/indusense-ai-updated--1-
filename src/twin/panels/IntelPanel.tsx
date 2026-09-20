import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ExternalLink, FileText, IndianRupee, Microscope, Route, ShieldQuestion } from 'lucide-react';
import { useTwin } from '../state';
import { chainsForNode } from '../causal';
import { hotspots } from '../layout';
import { bottleneck, operationalImpact, rootCauseFactors } from '@/data/production';
import { highRiskUnit, novelPattern, qualitySummary, triageStates } from '@/data/quality';
import { financialSummary, lossBranches } from '@/data/profitability';
import { decisions } from '@/data/mock';
import { cn, confidenceBand, severityTokens } from '@/lib/severity';
import { ConfidenceBar, ContributionBars, EvidenceCard, RangeEstimate } from '@/components/ui';
import { severityHex } from '../scene/palette';

/**
 * Right panel — everything the platform knows about whatever is selected.
 *
 * The tabs follow the question order a manager actually asks: what is this,
 * why is it happening, what backs that up, what does it cost, and has this call
 * gone badly before. Existing analytical components are reused verbatim as the
 * evidence layer rather than being re-implemented in 3D.
 */

type Tab = 'what' | 'why' | 'evidence' | 'impact' | 'shadow';

const TABS: Array<{ id: Tab; label: string; icon: typeof Route }> = [
  { id: 'what', label: 'What', icon: Microscope },
  { id: 'why', label: 'Why', icon: Route },
  { id: 'evidence', label: 'Evidence', icon: FileText },
  { id: 'impact', label: 'Impact', icon: IndianRupee },
  { id: 'shadow', label: 'Shadow', icon: ShieldQuestion },
];

export function IntelPanel({ onInspect }: { onInspect: () => void }) {
  const { selection, selectedNode, activeChain, setActiveChain, layers, toggleLayer, setDossierOpen, simulating, sim } =
    useTwin();
  const [tab, setTab] = useState<Tab>('what');

  const chains = useMemo(() => (selection ? chainsForNode(selection.nodeId) : []), [selection]);
  const hotspot = selection?.kind === 'hotspot' ? hotspots.find((h) => h.id === selection.id) : null;
  const machine = selection?.kind === 'machine' ? selectedNode?.machines.find((m) => m.id === selection.id) : null;

  if (!selection || !selectedNode) {
    return (
      <aside className="pointer-events-auto flex w-full flex-col gap-1.5 lg:w-[330px]">
        <div className="plate p-3">
          <h2 className="text-xs font-medium text-ink">Nothing selected</h2>
          <p className="mt-1.5 text-[11px] leading-relaxed text-ink-muted">
            Select a station, machine or hotspot in the plant. The panel follows what you pick — the factory is the
            index, not a picture of one.
          </p>
          <ul className="mt-2.5 space-y-1 border-t border-hairline pt-2.5 text-[10px] text-ink-faint">
            <li>Drag to orbit · scroll to zoom · right-drag to pan</li>
            <li>Toggle layers to change what the plant emphasises</li>
            <li>Click an item in the attention queue to jump to its object</li>
          </ul>
        </div>
        <div className="plate p-3">
          <div className="text-[9px] uppercase tracking-[0.16em] text-ink-faint">Line status</div>
          <p className="mt-1.5 text-[11px] leading-relaxed text-ink-muted">
            <span className="readout text-critical">Station 3</span> is the binding constraint at{' '}
            <span className="readout text-ink">{bottleneck.utilization}%</span> utilisation. Everything downstream runs
            at its rate.
          </p>
        </div>
      </aside>
    );
  }

  const title = hotspot ? hotspot.label : machine ? `Machine ${machine.id}` : selectedNode.title;
  const severity = hotspot ? hotspot.severity : machine ? machine.severity : selectedNode.status;
  const tok = severityTokens[severity];

  return (
    <aside className="pointer-events-auto flex w-full flex-col gap-1.5 lg:w-[330px]">
      <div className="plate relative overflow-hidden">
        <span className={cn('absolute inset-y-0 left-0 w-[2px]', tok.rail)} />
        <div className="p-3 pl-3.5">
          <div className="flex items-baseline gap-2">
            <span className="readout text-[10px] tracking-[0.18em] text-ink-faint">{selectedNode.code}</span>
            <span className={cn('readout text-[9px] uppercase tracking-[0.16em]', tok.text)}>
              {selectedNode.bottleneck && !hotspot && !machine ? 'CONSTRAINT DETECTED' : tok.label}
            </span>
          </div>
          <h2 className="mt-1 text-sm font-medium leading-snug text-ink">{title}</h2>

          {!hotspot && !machine && selectedNode.utilization != null && (
            <dl className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-1.5 border-t border-hairline pt-2.5">
              <Stat label="Utilization" value={`${selectedNode.utilization}%`} tone={severity} />
              <Stat
                label="Cycle time"
                value={`${(simulating && selectedNode.bottleneck ? sim.constraintCycle : selectedNode.cycleTime ?? 0).toFixed(1)}s`}
                tone={severity}
                sim={simulating && selectedNode.bottleneck}
              />
              <Stat label="Standard" value={`${selectedNode.cycleBaseline?.toFixed(1)}s`} />
              <Stat
                label="Queue"
                value={`${simulating && selectedNode.bottleneck ? sim.queue : selectedNode.queue} units`}
                sim={simulating && selectedNode.bottleneck}
              />
            </dl>
          )}

          {machine && (
            <dl className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-1.5 border-t border-hairline pt-2.5">
              <Stat label="Defect rate" value={`${machine.defectRate}%`} tone={machine.severity} />
              <Stat label="Station" value={selectedNode.code} />
            </dl>
          )}

          {hotspot && <p className="readout mt-2 text-[11px]" style={{ color: severityHex[hotspot.severity] }}>{hotspot.headline}</p>}
        </div>
      </div>

      {/* Tabs */}
      <div className="plate flex gap-px overflow-hidden p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setTab(t.id);
              if (t.id === 'why') {
                if (!layers.has('rootcause')) toggleLayer('rootcause');
                if (!activeChain && chains[0]) setActiveChain(chains[0].id);
              }
              if (t.id === 'impact' && !layers.has('financial')) toggleLayer('financial');
            }}
            className={cn(
              'flex flex-1 items-center justify-center gap-1 rounded-[2px] px-1 py-1.5 text-[10px] transition-colors',
              tab === t.id ? 'bg-raised text-ink' : 'text-ink-faint hover:text-ink-muted',
            )}
          >
            <t.icon className="h-3 w-3" strokeWidth={2} />
            {t.label}
          </button>
        ))}
      </div>

      <div className="plate max-h-[46vh] overflow-y-auto p-3 lg:max-h-none">
        {tab === 'what' && <WhatTab onInspect={onInspect} />}
        {tab === 'why' && <WhyTab />}
        {tab === 'evidence' && <EvidenceTab />}
        {tab === 'impact' && <ImpactTab />}
        {tab === 'shadow' && <ShadowTab />}
      </div>

      <button
        type="button"
        onClick={() => setDossierOpen(true)}
        className="plate flex items-center justify-center gap-1.5 px-2 py-2 text-[10px] text-ink-faint hover:border-edge hover:text-ink"
      >
        <ExternalLink className="h-3 w-3" strokeWidth={2} />
        Open full analytical dossier
      </button>
    </aside>
  );
}

function Stat({ label, value, tone, sim }: { label: string; value: string; tone?: keyof typeof severityTokens; sim?: boolean }) {
  return (
    <div>
      <dt className="text-[9px] uppercase tracking-[0.14em] text-ink-faint">{label}</dt>
      <dd className={cn('readout mt-0.5 text-sm', tone ? severityTokens[tone].text : 'text-ink')}>
        {value}
        {sim && <span className="ml-1 text-[8px] uppercase tracking-[0.16em] text-unknown">sim</span>}
      </dd>
    </div>
  );
}

function WhatTab({ onInspect }: { onInspect: () => void }) {
  const { selectedNode, selectedHotspot, selection } = useTwin();
  if (!selectedNode) return null;

  const isDefectHotspot = selectedHotspot?.kind === 'defect';
  const isNovel = selectedHotspot?.kind === 'novel';

  if (isDefectHotspot) {
    const band = confidenceBand(highRiskUnit.confidence.score);
    return (
      <div className="space-y-3">
        <div>
          <div className="readout text-[9px] uppercase tracking-[0.16em] text-critical">Defect detected</div>
          <h3 className="mt-1 text-xs font-medium text-ink">{highRiskUnit.defect}</h3>
          <dl className="mt-2 space-y-1.5">
            <Row k="Classification" v="Known defect" tone="nominal" />
            <Row k="Unit" v={highRiskUnit.productId} />
            <Row k="Batch" v={highRiskUnit.batch} tone="critical" />
            <Row k="Localization" v={`${highRiskUnit.station} · ${highRiskUnit.machine}`} />
            <Row k="Inspected" v={highRiskUnit.inspectedAt} />
          </dl>
        </div>
        <div>
          <div className="mb-1 text-[9px] uppercase tracking-[0.16em] text-ink-faint">Classification confidence</div>
          <ConfidenceBar confidence={highRiskUnit.confidence} />
        </div>
        <p className="text-[10px] leading-relaxed text-ink-faint">{highRiskUnit.limitation}</p>
        <button
          type="button"
          onClick={onInspect}
          className="flex w-full items-center justify-center gap-1.5 rounded-[2px] border border-signal/50 bg-signal/10 px-2 py-2 text-[11px] text-signal-bright hover:bg-signal/20"
        >
          <Microscope className="h-3 w-3" strokeWidth={2} />
          Inspect unit in 3D
        </button>
        <p className="text-[9px] leading-relaxed text-ink-faint">
          Band: <span className={severityTokens[band].text}>{severityTokens[band].label}</span>. Triage this shift:{' '}
          {triageStates.known.count} classified, {triageStates.uncertain.count} sent to human review,{' '}
          {triageStates.novel.count} held open.
        </p>
      </div>
    );
  }

  if (isNovel) {
    return (
      <div className="space-y-3">
        <div className="rounded-[2px] border border-unknown/40 bg-unknown/10 p-2.5">
          <div className="readout text-[10px] uppercase tracking-[0.16em] text-unknown">Unknown · model abstained</div>
          <p className="mt-1.5 text-[11px] leading-relaxed text-ink-muted">{novelPattern.detail}</p>
        </div>
        <dl className="space-y-1.5">
          <Row k="Pattern" v={novelPattern.id} />
          <Row k="Units" v={`${novelPattern.units}`} />
          <Row k="Nearest class" v={`${novelPattern.nearestClass} · ${(novelPattern.similarity * 100).toFixed(0)}%`} tone="unknown" />
          <Row k="First seen" v={novelPattern.firstSeen} />
          <Row k="Status" v={novelPattern.status} tone="unknown" />
        </dl>
        <div>
          <div className="text-[9px] uppercase tracking-[0.16em] text-ink-faint">Next steps</div>
          <ul className="mt-1.5 space-y-1">
            {novelPattern.nextSteps.map((s) => (
              <li key={s} className="flex gap-1.5 text-[10px] leading-relaxed text-ink-muted">
                <span className="mt-[5px] h-1 w-1 shrink-0 rounded-full bg-unknown" />
                {s}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  if (selection?.kind === 'machine') {
    const machine = selectedNode.machines.find((m) => m.id === selection.id);
    return (
      <div className="space-y-3">
        <p className="text-[11px] leading-relaxed text-ink-muted">
          {machine?.note ?? 'Running inside its control band. No process deviation open against this machine.'}
        </p>
        <dl className="space-y-1.5">
          <Row k="Defect rate" v={`${machine?.defectRate}%`} tone={machine?.flagged ? 'critical' : 'nominal'} />
          <Row k="Line average" v="2.6%" />
          <Row k="Station" v={selectedNode.title} />
        </dl>
        {machine?.flagged && (
          <p className="text-[10px] leading-relaxed text-ink-faint">
            Association with the defect rise is strong. Causation is not established — open the Why tab to see the
            competing explanation the platform has not ruled out.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-[11px] leading-relaxed text-ink-muted">{selectedNode.note}</p>
      {selectedNode.bottleneck && (
        <>
          <div className="space-y-1.5">
            <Row k="Deviation" v={`+${(bottleneck.cycleDeviation * 100).toFixed(0)}%`} tone="caution" />
            <Row k="Downtime share" v={`${(bottleneck.downtimeContribution * 100).toFixed(0)}%`} tone="critical" />
            <Row k="Constraint since" v={bottleneck.since} />
          </div>
          <div>
            <div className="text-[9px] uppercase tracking-[0.16em] text-ink-faint">Associated factors</div>
            <div className="mt-1.5">
              <ContributionBars
                factors={rootCauseFactors.map((f) => ({ label: f.label, share: f.share, detail: f.detail }))}
                title=""
                chipLabel="Association strength"
              />
            </div>
            <p className="mt-1.5 text-[9px] leading-relaxed text-ink-faint">
              Independent association strengths. They do not sum to 100% and are not a causal decomposition.
            </p>
          </div>
        </>
      )}
      {selectedNode.kind === 'inspection' && (
        <dl className="space-y-1.5">
          <Row k="Inspected" v={qualitySummary.inspected.toLocaleString('en-IN')} />
          <Row k="Defective" v={`${qualitySummary.defective} (${qualitySummary.defectRate}%)`} tone="critical" />
          <Row k="Abstain rate" v={`${(qualitySummary.abstainRate * 100).toFixed(1)}%`} tone="unknown" />
          <Row k="Coverage" v={`${(qualitySummary.coverage * 100).toFixed(0)}%`} />
        </dl>
      )}
    </div>
  );
}

function WhyTab() {
  const { selection, activeChain, setActiveChain } = useTwin();
  const chains = selection ? chainsForNode(selection.nodeId) : [];

  if (chains.length === 0) {
    return (
      <p className="text-[11px] leading-relaxed text-ink-muted">
        No causal chain is open against this object. The platform is not asserting a problem here.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1">
        {chains.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setActiveChain(c.id)}
            className={cn(
              'rounded-[2px] border px-1.5 py-1 text-[10px]',
              activeChain?.id === c.id
                ? 'border-signal/60 bg-signal/10 text-signal-bright'
                : 'border-hairline text-ink-faint hover:text-ink',
            )}
          >
            {c.question}
          </button>
        ))}
      </div>

      {activeChain && (
        <>
          <ol className="space-y-0">
            {activeChain.steps.map((s, i) => (
              <li key={s.id} className="relative pl-4">
                {i < activeChain.steps.length - 1 && (
                  <span className="absolute left-[3px] top-3 h-full w-px bg-hairline" />
                )}
                <span
                  className="absolute left-0 top-[6px] h-[7px] w-[7px] rounded-full"
                  style={{ background: severityHex[s.severity] }}
                />
                <div className="pb-3">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[9px] uppercase tracking-[0.14em] text-ink-faint">{s.label}</span>
                    <ArrowRight className="h-2.5 w-2.5 text-ink-faint" strokeWidth={2} />
                  </div>
                  <div className="readout text-[11px]" style={{ color: severityHex[s.severity] }}>
                    {s.value}
                  </div>
                  <p className="mt-0.5 text-[10px] leading-relaxed text-ink-muted">{s.detail}</p>
                </div>
              </li>
            ))}
          </ol>

          <div>
            <div className="mb-1 text-[9px] uppercase tracking-[0.16em] text-ink-faint">Chain confidence</div>
            <ConfidenceBar
              confidence={{ score: activeChain.confidence.score, sampleSize: activeChain.confidence.sampleSize }}
            />
          </div>

          <div className="rounded-[2px] border border-caution/30 bg-caution/5 p-2">
            <div className="readout text-[9px] uppercase tracking-[0.16em] text-caution">Not established</div>
            <p className="mt-1 text-[10px] leading-relaxed text-ink-muted">{activeChain.caveat}</p>
            <ul className="mt-1.5 space-y-1">
              {activeChain.competing.map((c) => (
                <li key={c} className="flex gap-1.5 text-[10px] leading-relaxed text-ink-faint">
                  <span className="mt-[5px] h-1 w-1 shrink-0 rounded-full bg-caution" />
                  {c}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

function EvidenceTab() {
  const { activeChain, selection } = useTwin();
  const chains = selection ? chainsForNode(selection.nodeId) : [];
  const chain = activeChain ?? chains[0];
  if (!chain) return <p className="text-[11px] text-ink-muted">No evidence bundle attached to this object.</p>;

  return (
    <div className="space-y-2">
      <p className="text-[10px] leading-relaxed text-ink-faint">
        {chain.evidence.length} items, ranked by weight. Data coverage for this chain is{' '}
        <span className="readout text-ink">{(chain.coverage * 100).toFixed(0)}%</span>.
      </p>
      <EvidenceCard evidence={chain.evidence} />
    </div>
  );
}

function ImpactTab() {
  const { selectedNode, simulating, sim } = useTwin();
  if (!selectedNode) return null;
  const branch = lossBranches.find((b) => b.lakhs === Math.max(...lossBranches.map((x) => x.lakhs)))!;
  const nodeLoss = simulating
    ? Number((selectedNode.lossLakhs * (sim.lossLakhs / financialSummary.monthlyLossLakhs)).toFixed(2))
    : selectedNode.lossLakhs;

  return (
    <div className="space-y-3">
      {selectedNode.lossLakhs > 0 ? (
        <>
          <div>
            <div className="text-[9px] uppercase tracking-[0.16em] text-ink-faint">Attributed to this node</div>
            <RangeEstimate
              label={simulating ? 'Simulated monthly impact' : 'Projected monthly impact'}
              value={`₹${nodeLoss.toFixed(2)}L`}
              low={`₹${(nodeLoss * 0.83).toFixed(2)}L`}
              high={`₹${(nodeLoss * 1.17).toFixed(2)}L`}
              intervalLabel={simulating ? 'Simulated band' : '80% interval'}
              note="Run rate over a full month at current conditions, not month-to-date."
            />
          </div>
          <ol className="space-y-2 border-t border-hairline pt-2.5">
            <ChainRow label="Throughput loss" value={`${operationalImpact.attributedToBottleneck} units/day`} />
            <ChainRow label="Scrap and rework" value={`₹${branch.lakhs}L`} />
            <ChainRow label="Downtime" value={`${(bottleneck.downtimeContribution * 100).toFixed(0)}% of plant bill`} />
            <ChainRow label="Monthly impact" value={`₹${nodeLoss.toFixed(2)}L`} strong />
          </ol>
        </>
      ) : (
        <p className="text-[11px] leading-relaxed text-ink-muted">
          No loss is attributed to this node. It is not a money-losing point in the line, and the platform will not
          spread the unattributed residual onto it to make the numbers tidy.
        </p>
      )}
      <p className="text-[9px] leading-relaxed text-ink-faint">
        ₹{financialSummary.monthlyLossLakhs}L is a monthly run rate — what the plant loses if today repeats — not
        month-to-date. {financialSummary.workingDaysElapsed} of {financialSummary.workingDaysTotal} working days have
        elapsed.
      </p>
      <Link to="/profitability" className="flex items-center gap-1.5 text-[10px] text-signal-bright hover:underline">
        Open the full loss tree <ArrowRight className="h-3 w-3" strokeWidth={2} />
      </Link>
    </div>
  );
}

function ChainRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <li className="flex items-baseline justify-between gap-2">
      <span className="text-[10px] text-ink-faint">↓ {label}</span>
      <span className={cn('readout text-[11px]', strong ? 'text-critical' : 'text-ink')}>{value}</span>
    </li>
  );
}

function ShadowTab() {
  const { selectedNode } = useTwin();
  const similar = decisions.filter((d) => d.riskScore > 30);
  const worst = similar.reduce((a, b) => (a.riskScore > b.riskScore ? a : b));

  return (
    <div className="space-y-3">
      <div className="rounded-[2px] border border-caution/35 bg-caution/5 p-2.5">
        <div className="readout text-[9px] uppercase tracking-[0.16em] text-caution">Decision shadow</div>
        <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">
          Conditions at {selectedNode?.code} resemble <span className="readout text-ink">{similar.length}</span>{' '}
          previous operating situations.
        </p>
        <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5">
          <Stat label="Risk score" value={`${worst.riskScore}`} tone="critical" />
          <Stat label="Worst outcome" value={`₹${Math.abs(worst.costDelta / 100000).toFixed(2)}L`} tone="critical" />
        </dl>
      </div>

      {similar.slice(0, 3).map((d) => (
        <div key={d.id} className="border-l-2 border-hairline pl-2.5">
          <div className="readout text-[9px] text-ink-faint">{d.takenAt}</div>
          <p className="text-[11px] font-medium leading-snug text-ink">{d.decision}</p>
          <dl className="mt-1 space-y-[3px] text-[10px] leading-relaxed">
            <div className="text-ink-faint">Context · {d.context}</div>
            <div
              className={cn(
                d.outcome === 'negative' ? 'text-critical' : d.outcome === 'positive' ? 'text-nominal' : 'text-ink-muted',
              )}
            >
              Outcome · {d.outcomeSummary}
            </div>
            {d.alternative && <div className="text-signal-bright">Counterfactual · {d.alternative}</div>}
          </dl>
          <div className="readout mt-1 text-[9px] text-ink-faint">
            conf {(d.confidence.score * 100).toFixed(0)}% · n={d.confidence.sampleSize}
            {d.confidence.note ? ` · ${d.confidence.note}` : ''}
          </div>
        </div>
      ))}

      <p className="text-[9px] leading-relaxed text-ink-faint">
        Decision Shadow scores risk from precedent. It does not approve or block anything, and it never acts on plant
        equipment.
      </p>
    </div>
  );
}

function Row({ k, v, tone }: { k: string; v: string; tone?: keyof typeof severityTokens }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-[10px] text-ink-faint">{k}</span>
      <span className={cn('readout text-[11px]', tone ? severityTokens[tone].text : 'text-ink')}>{v}</span>
    </div>
  );
}
