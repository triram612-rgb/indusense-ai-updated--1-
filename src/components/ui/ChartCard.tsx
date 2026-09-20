import type { ReactNode } from 'react';
import { cn } from '@/lib/severity';
import type { Provenance } from '@/lib/types';
import { SimulationBadge } from './SimulationBadge';

interface Props {
  title: string;
  subtitle?: string;
  provenance?: Provenance;
  actions?: ReactNode;
  /** Legend and footnotes: the chart says what it cannot show, too. */
  footnote?: string;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

export function ChartCard({
  title,
  subtitle,
  provenance,
  actions,
  footnote,
  children,
  className,
  bodyClassName,
}: Props) {
  return (
    <section className={cn('plate flex flex-col', className)}>
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-hairline px-4 py-3">
        <div>
          <h2 className="text-sm font-medium text-ink">{title}</h2>
          {subtitle && <p className="mt-0.5 text-2xs text-ink-faint">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          {provenance && <SimulationBadge provenance={provenance} />}
          {actions}
        </div>
      </header>
      <div className={cn('flex-1 p-4', bodyClassName)}>{children}</div>
      {footnote && (
        <footer className="border-t border-hairline px-4 py-2.5 text-2xs leading-relaxed text-ink-faint">
          {footnote}
        </footer>
      )}
    </section>
  );
}
