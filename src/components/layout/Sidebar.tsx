import { NavLink } from 'react-router-dom';
import { X } from 'lucide-react';
import { navGroups, navItems } from '@/lib/nav';
import { cn } from '@/lib/severity';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: Props) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-[260px] shrink-0 flex-col border-r border-hairline bg-surface transition-transform duration-200 lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-hairline px-4">
          <Brand />
          <button
            type="button"
            onClick={onClose}
            className="rounded-sm p-1 text-ink-faint hover:text-ink lg:hidden"
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-4">
          {navGroups.map((group) => (
            <div key={group} className="mb-5">
              <p className="px-2 pb-2 text-2xs font-medium text-ink-faint">{group}</p>
              <ul className="space-y-0.5">
                {navItems
                  .filter((item) => item.group === group)
                  .map((item) => (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        onClick={onClose}
                        className={({ isActive }) =>
                          cn(
                            'group relative flex items-start gap-2.5 rounded-sm px-2 py-2 transition-colors',
                            isActive
                              ? 'bg-signal-wash text-ink'
                              : 'text-ink-muted hover:bg-raised hover:text-ink',
                          )
                        }
                      >
                        {({ isActive }) => (
                          <>
                            {isActive && (
                              <span className="absolute -left-2 top-1.5 h-[calc(100%-12px)] w-[2px] rounded-r bg-signal" />
                            )}
                            <item.icon
                              className={cn('mt-0.5 h-4 w-4 shrink-0', isActive ? 'text-signal-bright' : 'text-ink-faint')}
                              strokeWidth={2}
                            />
                            <span className="min-w-0">
                              <span className="block truncate text-xs font-medium">{item.label}</span>
                              <span className="block truncate text-2xs text-ink-faint">{item.hint}</span>
                            </span>
                          </>
                        )}
                      </NavLink>
                    </li>
                  ))}
            </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-hairline p-3">
          <p className="text-2xs leading-relaxed text-ink-faint">
            InduSense reports what it knows and flags what it doesn&apos;t. Anything unlabelled or
            simulated is marked in place.
          </p>
        </div>
      </aside>
    </>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      {/* Mark: four stacked intelligence layers reading as a signal trace */}
      <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
        <rect x="1" y="1" width="22" height="22" rx="3" className="fill-panel stroke-edge" strokeWidth="1" />
        <path d="M5 16.5 L9 16.5 L11 9.5 L13.5 18.5 L15.5 12.5 L19 12.5" className="stroke-signal" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="leading-none">
        <span className="block text-sm font-semibold tracking-tight text-ink">
          InduSense <span className="text-signal-bright">AI</span>
        </span>
        <span className="mt-0.5 block text-2xs text-ink-faint">Factory data to decisions</span>
      </div>
    </div>
  );
}
