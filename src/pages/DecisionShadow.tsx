import { ArrowRight, CalendarClock, Hammer, TrendingDown, Users } from 'lucide-react';
import { AlertCard, ConfidenceBar, PageHeader, SectionStub, StatusBadge } from '@/components/ui';
import { alerts, decisions } from '@/data/mock';
import { cn, formatNumber, severityTokens } from '@/lib/severity';
import type { DecisionRecord } from '@/lib/types';

const kindIcon = {
  overtime: Users,
  'shift-change': CalendarClock,
  maintenance: Hammer,
  'production-adjust': TrendingDown,
};

const outcomeSeverity = {
  positive: 'nominal',
  negative: 'critical',
  neutral: 'caution',
  pending: 'unknown',
} as const;

export function DecisionShadow() {
  return (
    <>
      <PageHeader
        title="Decision Shadow AI"
        question="Every operational call is kept with what followed it. When today's situation resembles one that went badly, the platform says so before the call is made."
        actions={<StatusBadge severity="caution" label="1 risky call pending" pulse />}
      />

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-ink">Pending decision under review</h2>
        {alerts
          .filter((a) => a.layer === 'decision')
          .map((a) => (
            <AlertCard key={a.id} alert={a} defaultOpen />
          ))}
      </section>

      <section>
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="text-sm font-medium text-ink">Decision history</h2>
          <span className="text-2xs text-ink-faint">Risk score is how this call would read in today&apos;s conditions</span>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {decisions.map((d) => (
            <DecisionRow key={d.id} record={d} />
          ))}
        </div>
      </section>

      <SectionStub
        title="Similarity search"
        description="Given the situation on the floor right now, retrieve the closest past decisions with their outcomes — and show how alike they really are, so a thin match is never presented as a strong precedent."
      />
    </>
  );
}

function DecisionRow({ record }: { record: DecisionRecord }) {
  const Icon = kindIcon[record.kind];
  const sev = outcomeSeverity[record.outcome];
  const t = severityTokens[sev];

  return (
    <article className="plate p-4">
      <span className={cn('absolute left-0 top-0 h-full w-[2px]', t.rail)} />
      <header className="flex items-start gap-2.5">
        <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', t.text)} strokeWidth={2} />
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-medium leading-snug text-ink">{record.decision}</h3>
          <p className="readout mt-0.5 text-2xs text-ink-faint">{record.takenAt}</p>
        </div>
        <div className="text-right">
          <span className={cn('readout block text-lg font-medium leading-none', t.text)}>{record.riskScore}</span>
          <span className="text-2xs text-ink-faint">risk</span>
        </div>
      </header>

      <p className="mt-3 text-xs leading-relaxed text-ink-muted">{record.context}</p>
      <p className="mt-2 border-l-2 border-hairline pl-2.5 text-xs leading-relaxed text-ink-muted">
        {record.outcomeSummary}
      </p>

      <div className="mt-3 flex items-center gap-2">
        <span className={cn('readout text-sm font-medium', record.costDelta >= 0 ? 'text-nominal' : 'text-critical')}>
          {record.costDelta >= 0 ? '+' : '−'}₹{formatNumber(Math.abs(record.costDelta))}
        </span>
        <span className="text-2xs text-ink-faint">measured against the counterfactual</span>
      </div>

      {record.alternative && (
        <p className="mt-3 flex items-start gap-1.5 rounded-sm border border-signal/25 bg-signal-wash p-2.5 text-2xs leading-relaxed text-signal-bright">
          <ArrowRight className="mt-0.5 h-3 w-3 shrink-0" strokeWidth={2.5} />
          <span>
            <span className="font-medium">Alternative:</span> {record.alternative}
          </span>
        </p>
      )}

      <ConfidenceBar className="mt-3" confidence={record.confidence} />
    </article>
  );
}
