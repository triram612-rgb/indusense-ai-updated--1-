import { Construction } from 'lucide-react';
import { cn } from '@/lib/severity';

interface Props {
  title: string;
  /** What this panel will do once the layer is wired up. */
  description: string;
  className?: string;
}

/**
 * Honest placeholder. The shell ships before the logic does, and an empty
 * screen should say what is coming rather than pretend to hold data.
 */
export function SectionStub({ title, description, className }: Props) {
  return (
    <div
      className={cn(
        'relative flex min-h-[160px] flex-col justify-center overflow-hidden rounded-panel border border-dashed border-edge/70 bg-surface/50 p-5',
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 grid-etch opacity-60" />
      <div className="relative flex items-start gap-2.5">
        <Construction className="mt-0.5 h-4 w-4 shrink-0 text-ink-faint" strokeWidth={2} />
        <div>
          <h3 className="text-sm font-medium text-ink-muted">{title}</h3>
          <p className="mt-1 max-w-[60ch] text-xs leading-relaxed text-ink-faint">{description}</p>
        </div>
      </div>
    </div>
  );
}
