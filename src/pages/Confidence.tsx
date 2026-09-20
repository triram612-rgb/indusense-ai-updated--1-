import { DataQualityIndicator, PageHeader, SectionStub, StatusBadge } from '@/components/ui';
import { dataStreams, models } from '@/data/mock';
import { cn, severityTokens } from '@/lib/severity';

export function Confidence() {
  return (
    <>
      <PageHeader
        title="Data & Model Confidence"
        question="Before acting on anything in InduSense, see what the platform is standing on: how complete the feeds are, how current, and how often each model declines to answer."
        actions={<StatusBadge severity="critical" label="1 feed degraded" />}
      />

      <section>
        <h2 className="mb-2 text-sm font-medium text-ink">Source feeds</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
          {dataStreams.map((s) => (
            <DataQualityIndicator key={s.id} stream={s} />
          ))}
        </div>
        <p className="mt-2.5 max-w-[80ch] text-2xs leading-relaxed text-ink-faint">
          The operator defect log is under half complete this shift. Panels that depend on it are marked imputed
          rather than measured, and the gap is not filled silently.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-ink">Models in production</h2>
        <div className="plate overflow-x-auto">
          <table className="w-full min-w-[720px] text-left">
            <thead>
              <tr className="border-b border-hairline text-2xs text-ink-faint">
                <th className="px-4 py-2.5 font-medium">Model</th>
                <th className="px-4 py-2.5 font-medium">Task</th>
                <th className="px-4 py-2.5 font-medium">Version</th>
                <th className="px-4 py-2.5 text-right font-medium">Accuracy</th>
                <th className="px-4 py-2.5 text-right font-medium">Abstain rate</th>
                <th className="px-4 py-2.5 font-medium">Last trained</th>
                <th className="px-4 py-2.5 font-medium">State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {models.map((m) => (
                <tr key={m.id} className="text-xs text-ink-muted transition-colors hover:bg-raised/50">
                  <td className="px-4 py-3 font-medium text-ink">{m.name}</td>
                  <td className="px-4 py-3">{m.task}</td>
                  <td className="readout px-4 py-3">{m.version}</td>
                  <td className="readout px-4 py-3 text-right text-ink">{(m.accuracy * 100).toFixed(1)}%</td>
                  <td
                    className={cn('readout px-4 py-3 text-right', m.abstainRate > 0.1 ? 'text-unknown' : 'text-ink')}
                    title="Share of inputs the model routed to review instead of guessing"
                  >
                    {(m.abstainRate * 100).toFixed(1)}%
                  </td>
                  <td className="readout px-4 py-3">{m.lastTrained}</td>
                  <td className="px-4 py-3">
                    <span className={cn('inline-flex items-center gap-1.5', severityTokens[m.status].text)}>
                      <span className={cn('h-1.5 w-1.5 rounded-full', severityTokens[m.status].dot)} />
                      {severityTokens[m.status].label}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2.5 max-w-[80ch] text-2xs leading-relaxed text-ink-faint">
          A high abstain rate is not a fault. It is the platform refusing to force an uncertain observation into a
          known category — the behaviour that keeps a wrong label out of a manager&apos;s decision.
        </p>
      </section>

      <div className="grid gap-3 lg:grid-cols-2">
        <SectionStub
          title="Drift monitors"
          description="Feature-level distribution shift against each model's training window, with the threshold that triggers a retraining request."
        />
        <SectionStub
          title="Prediction audit trail"
          description="Any prediction the platform has made, with its inputs, confidence and what actually happened — the record that makes the models answerable."
        />
      </div>
    </>
  );
}
