import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import type { ImpactSlice } from '@/lib/types';
import { cn } from '@/lib/severity';

interface Props {
  slices: ImpactSlice[];
  /** Rendered in the hole. */
  totalLabel: string;
  unit?: string;
  className?: string;
}

/**
 * Legend is a table, not floating chips: five loss categories with their value,
 * share and attribution confidence, readable at a glance on a wall display.
 */
export function BreakdownDonut({ slices, totalLabel, unit = '₹ lakh / month', className }: Props) {
  const total = slices.reduce((s, x) => s + x.lakhs, 0);

  return (
    <div className={cn('grid gap-5 sm:grid-cols-[180px_1fr] sm:items-center', className)}>
      <div className="relative mx-auto h-[180px] w-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="lakhs"
              nameKey="label"
              innerRadius={58}
              outerRadius={84}
              paddingAngle={2}
              stroke="none"
              startAngle={90}
              endAngle={-270}
              isAnimationActive={false}
            >
              {slices.map((s) => (
                <Cell key={s.id} fill={s.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="readout text-2xl font-semibold leading-none text-ink">{totalLabel}</span>
          <span className="mt-1 text-2xs text-ink-faint">per month</span>
        </div>
      </div>

      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-hairline text-2xs text-ink-faint">
            <th className="py-1.5 pr-2 font-medium">Loss category</th>
            <th className="py-1.5 px-2 text-right font-medium">Value</th>
            <th className="py-1.5 px-2 text-right font-medium">Share</th>
            <th className="py-1.5 pl-2 text-right font-medium">Attribution</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-hairline/70">
          {slices.map((s) => (
            <tr key={s.id} className="text-xs">
              <td className="py-2 pr-2">
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-[2px]" style={{ background: s.color }} />
                  <span className="truncate text-ink">{s.label}</span>
                </span>
              </td>
              <td className="readout py-2 px-2 text-right text-ink">₹{s.lakhs.toFixed(1)}L</td>
              <td className="readout py-2 px-2 text-right text-ink-muted">
                {((s.lakhs / total) * 100).toFixed(0)}%
              </td>
              <td
                className={cn(
                  'readout py-2 pl-2 text-right',
                  s.confidence >= 0.8 ? 'text-nominal' : s.confidence >= 0.7 ? 'text-caution' : 'text-unknown',
                )}
                title="Confidence that this rupee figure is attributed to the right cause"
              >
                {(s.confidence * 100).toFixed(0)}%
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-edge text-xs">
            <td className="py-2 pr-2 font-medium text-ink">Total</td>
            <td className="readout py-2 px-2 text-right font-medium text-ink">₹{total.toFixed(1)}L</td>
            <td className="readout py-2 px-2 text-right text-ink-faint">{unit.includes('lakh') ? '100%' : ''}</td>
            <td className="py-2 pl-2" />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
