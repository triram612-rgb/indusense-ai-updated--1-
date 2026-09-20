import { Activity, FlaskConical, TrendingUp, Wand2 } from 'lucide-react';
import type { Provenance } from '@/lib/types';
import { cn, provenanceCopy } from '@/lib/severity';

const icons: Record<Provenance, typeof Activity> = {
  measured: Activity,
  simulated: FlaskConical,
  projected: TrendingUp,
  imputed: Wand2,
};

const tone: Record<Provenance, string> = {
  measured: 'border-hairline bg-surface text-ink-faint',
  simulated: 'border-unknown/40 bg-unknown/10 text-unknown',
  projected: 'border-signal/35 bg-signal/10 text-signal-bright',
  imputed: 'border-caution/35 bg-caution/10 text-caution',
};

interface Props {
  provenance: Provenance;
  className?: string;
}

/** Any number that was not measured says so, everywhere it appears. */
export function SimulationBadge({ provenance, className }: Props) {
  const Icon = icons[provenance];
  return (
    <span
      title={provenanceCopy[provenance].long}
      className={cn(
        'inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-2xs font-medium',
        tone[provenance],
        className,
      )}
    >
      <Icon className="h-3 w-3" strokeWidth={2} />
      {provenanceCopy[provenance].short}
    </span>
  );
}
