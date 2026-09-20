import { useEffect, useRef, useState } from 'react';
import { Bell, Check, ChevronDown, Menu, Radio } from 'lucide-react';
import { alerts, plants } from '@/data/mock';
import { cn, severityTokens } from '@/lib/severity';
import { StatusBadge } from '@/components/ui';
import type { Plant } from '@/lib/types';

interface Props {
  onOpenNav: () => void;
}

export function TopBar({ onOpenNav }: Props) {
  const [plant, setPlant] = useState<Plant>(plants[0]);
  const [menu, setMenu] = useState<'plant' | 'alerts' | null>(null);
  const barRef = useRef<HTMLElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!barRef.current?.contains(e.target as Node)) setMenu(null);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const open = alerts.filter((a) => a.severity !== 'nominal');

  return (
    <header
      ref={barRef}
      className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-hairline bg-surface/95 px-3 backdrop-blur sm:px-4"
    >
      <button
        type="button"
        onClick={onOpenNav}
        className="rounded-sm p-1.5 text-ink-muted hover:bg-raised hover:text-ink lg:hidden"
        aria-label="Open navigation"
      >
        <Menu className="h-4 w-4" strokeWidth={2} />
      </button>

      {/* Plant selector */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setMenu(menu === 'plant' ? null : 'plant')}
          className="flex items-center gap-2 rounded-sm border border-hairline bg-panel px-2.5 py-1.5 text-left hover:border-edge"
        >
          <span className={cn('h-1.5 w-1.5 rounded-full', severityTokens[plant.status].dot)} />
          <span className="leading-none">
            <span className="block text-xs font-medium text-ink">{plant.name}</span>
            <span className="mt-0.5 hidden text-2xs text-ink-faint sm:block">{plant.shift}</span>
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-ink-faint" strokeWidth={2} />
        </button>

        {menu === 'plant' && (
          <ul className="plate absolute left-0 top-full mt-1.5 w-64 overflow-hidden p-1">
            {plants.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => {
                    setPlant(p);
                    setMenu(null);
                  }}
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left hover:bg-raised"
                >
                  <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', severityTokens[p.status].dot)} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs text-ink">{p.name}</span>
                    <span className="block truncate text-2xs text-ink-faint">{p.location}</span>
                  </span>
                  {p.id === plant.id && <Check className="h-3.5 w-3.5 text-signal-bright" strokeWidth={2.5} />}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Live status strip */}
      <div className="hidden items-center gap-2 border-l border-hairline pl-3 md:flex">
        <Radio className="h-3.5 w-3.5 animate-pulse-dot text-nominal" strokeWidth={2} />
        <span className="text-2xs text-ink-faint">
          Streaming · <span className="readout text-ink-muted">14 of 15 sources</span>
        </span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <StatusBadge severity="caution" label="Shift at risk" pulse className="hidden sm:inline-flex" />

        {/* Notifications */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenu(menu === 'alerts' ? null : 'alerts')}
            className="relative rounded-sm p-1.5 text-ink-muted hover:bg-raised hover:text-ink"
            aria-label={`Notifications, ${open.length} open`}
          >
            <Bell className="h-4 w-4" strokeWidth={2} />
            {open.length > 0 && (
              <span className="absolute right-0.5 top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-critical px-1 text-[9px] font-semibold text-white">
                {open.length}
              </span>
            )}
          </button>

          {menu === 'alerts' && (
            <div className="plate absolute right-0 top-full mt-1.5 w-80 overflow-hidden">
              <p className="border-b border-hairline px-3 py-2 text-2xs text-ink-faint">Open signals this shift</p>
              <ul className="max-h-80 overflow-y-auto">
                {open.map((a) => (
                  <li key={a.id} className="flex gap-2 border-b border-hairline/60 px-3 py-2.5 last:border-0">
                    <span className={cn('mt-1 h-1.5 w-1.5 shrink-0 rounded-full', severityTokens[a.severity].dot)} />
                    <div className="min-w-0">
                      <p className="truncate text-xs text-ink">{a.title}</p>
                      <p className="readout mt-0.5 text-2xs text-ink-faint">
                        {a.raisedAt} · confidence {(a.confidence.score * 100).toFixed(0)}%
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* User */}
        <button
          type="button"
          className="flex items-center gap-2 rounded-sm border border-hairline bg-panel py-1 pl-1 pr-2 hover:border-edge"
        >
          <span className="readout flex h-6 w-6 items-center justify-center rounded-sm bg-signal-dim text-2xs font-semibold text-white">
            AK
          </span>
          <span className="hidden leading-none sm:block">
            <span className="block text-xs text-ink">A. Kulkarni</span>
            <span className="mt-0.5 block text-2xs text-ink-faint">Operations manager</span>
          </span>
        </button>
      </div>
    </header>
  );
}
