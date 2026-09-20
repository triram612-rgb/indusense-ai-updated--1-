import type { ReactNode } from 'react';
import { cn } from '@/lib/severity';

interface Props {
  title: string;
  /** The question this section of the platform answers. */
  question: string;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ title, question, actions, className }: Props) {
  return (
    <header className={cn('flex flex-wrap items-end justify-between gap-4 pb-1', className)}>
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-ink">{title}</h1>
        <p className="mt-1 max-w-[72ch] text-xs leading-relaxed text-ink-muted">{question}</p>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}
