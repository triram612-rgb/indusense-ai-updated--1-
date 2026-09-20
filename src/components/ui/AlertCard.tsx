import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronRight, CircleAlert, CircleHelp, OctagonAlert, TriangleAlert } from 'lucide-react';
import type { Alert } from '@/lib/types';
import { cn, formatNumber, severityTokens } from '@/lib/severity';
import { ConfidenceBar } from './ConfidenceBar';
import { EvidenceCard } from './EvidenceCard';
import { SimulationBadge } from './SimulationBadge';
import { StatusBadge } from './StatusBadge';

const icons = {
  nominal: CircleAlert,
  caution: TriangleAlert,
  critical: OctagonAlert,
  unknown: CircleHelp,
};

const layerLabel = {
  quality: 'Quality Intelligence',
  production: 'Production Intelligence',
  profitability: 'Profitability',
  decision: 'Decision Shadow',
};

/** Badge wording an operator would use, not the internal severity enum. */
const severityWord = {
  critical: 'Critical',
  caution: 'Warning',
  nominal: 'Nominal',
  unknown: 'Unclassified',
};

interface Props {
  alert: Alert;
  defaultOpen?: boolean;
  className?: string;
}

export function AlertCard({ alert, defaultOpen = false, className }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const t = severityTokens[alert.severity];
  const Icon = icons[alert.severity];

  const body = (
    <>
      <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', t.text)} strokeWidth={2} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge
            severity={alert.severity}
            label={severityWord[alert.severity]}
            pulse={alert.severity === 'critical'}
          />
          <h3 className="text-sm font-medium text-ink">{alert.title}</h3>
          <span className="readout ml-auto text-2xs text-ink-faint">{alert.raisedAt}</span>
        </div>

        <p className="mt-1.5 max-w-[68ch] text-xs leading-relaxed text-ink-muted">{alert.detail}</p>

        {alert.readings && (
          <dl className="mt-2.5 flex flex-wrap gap-x-6 gap-y-1.5">
            {alert.readings.map((r) => (
              <div key={r.label} className="flex items-baseline gap-2">
                <dt className="text-2xs text-ink-faint">{r.label}</dt>
                <dd
                  className={cn(
                    'readout text-xs font-medium',
                    r.severity ? severityTokens[r.severity].text : 'text-ink',
                  )}
                >
                  {r.value}
                </dd>
              </div>
            ))}
          </dl>
        )}

        {alert.estimatedImpact && (
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <span className="readout text-sm font-medium text-ink">
              {formatNumber(alert.estimatedImpact.value)}
            </span>
            <span className="text-2xs text-ink-faint">{alert.estimatedImpact.unit}</span>
            {alert.estimatedImpact.uncertainty !== undefined && (
              <span className="readout text-2xs text-ink-faint">
                ±{formatNumber(alert.estimatedImpact.uncertainty)}
              </span>
            )}
            <SimulationBadge provenance={alert.estimatedImpact.provenance} />
          </div>
        )}
      </div>
    </>
  );

  return (
    <article className={cn('plate overflow-hidden', className)}>
      <span className={cn('absolute left-0 top-0 h-full w-[2px]', t.rail)} />

      {alert.route ? (
        <Link
          to={alert.route}
          className="flex items-start gap-3 p-4 transition-colors hover:bg-raised/50"
          aria-label={`${alert.title} — open ${layerLabel[alert.layer]}`}
        >
          {body}
        </Link>
      ) : (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-raised/50"
        >
          {body}
        </button>
      )}

      <div className="flex items-center gap-4 border-t border-hairline px-4 py-2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1 text-2xs text-ink-faint transition-colors hover:text-ink"
        >
          <ChevronDown className={cn('h-3 w-3 transition-transform', open && 'rotate-180')} strokeWidth={2.5} />
          {open ? 'Hide evidence' : `Evidence · ${alert.evidence.length} records`}
        </button>

        <span className="readout text-2xs text-ink-faint">
          Confidence {(alert.confidence.score * 100).toFixed(0)}%
        </span>

        {alert.route && (
          <Link
            to={alert.route}
            className="ml-auto inline-flex items-center gap-0.5 text-2xs font-medium text-signal-bright transition-colors hover:text-white"
          >
            Open in {layerLabel[alert.layer]}
            <ChevronRight className="h-3 w-3" strokeWidth={2.5} />
          </Link>
        )}
      </div>

      {open && (
        <div className="space-y-3 border-t border-hairline bg-surface/60 p-4">
          <ConfidenceBar confidence={alert.confidence} />
          <EvidenceCard evidence={alert.evidence} />
        </div>
      )}
    </article>
  );
}
