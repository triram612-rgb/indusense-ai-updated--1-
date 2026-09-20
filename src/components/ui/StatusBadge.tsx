import type { Severity } from '@/lib/types';
import { cn, severityTokens } from '@/lib/severity';

interface Props {
  severity: Severity;
  label?: string;
  /** Live states get a slow pulse so the eye finds them across a wall display. */
  pulse?: boolean;
  className?: string;
}

export function StatusBadge({ severity, label, pulse = false, className }: Props) {
  const t = severityTokens[severity];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-2xs font-medium',
        t.border,
        t.bg,
        t.text,
        className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', t.dot, pulse && 'animate-pulse-dot')} />
      {label ?? t.label}
    </span>
  );
}
