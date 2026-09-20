import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Crosshair, Eye, Gauge, Layers, RotateCcw, Wifi, Zap } from 'lucide-react';
import { LAYERS, MODE_META, useTwin } from '../state';
import type { TwinMode } from '../state';
import { nodeById, hotspots } from '../layout';
import { dataCoverage, systemStatus, healthDimensions, compositeHealth, defectTrend, productionTrend } from '@/data/commandCenter';
import { lossTrend } from '@/data/profitability';
import { dataStreams } from '@/data/mock';
import { cn, severityTokens } from '@/lib/severity';
import { severityHex } from '../scene/palette';

/**
 * The chrome around the twin: plant status on top, layer control and camera on
 * one edge, a hover readout that stays small, and a timeline that ties the
 * three headline series to the same 14-day window.
 */

const MODES: TwinMode[] = ['command', 'production', 'quality', 'profitability', 'simulation', 'decision', 'confidence'];

export function TopStatus({ mode }: { mode: TwinMode }) {
  const navigate = useNavigate();
  const { simulating, sim } = useTwin();
  const degraded = dataStreams.filter((d) => d.status !== 'nominal');

  return (
    <header className="pointer-events-auto flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-hairline bg-void/80 px-3 py-2 backdrop-blur-sm sm:px-4">
      <div className="flex items-center gap-2.5">
        <span className="flex h-6 w-6 items-center justify-center rounded-[2px] border border-signal/50 bg-signal/10">
          <Zap className="h-3 w-3 text-signal-bright" strokeWidth={2.5} />
        </span>
        <div className="leading-none">
          <div className="text-xs font-medium tracking-tight text-ink">InduSense AI</div>
          <div className="readout mt-0.5 text-[10px] text-ink-faint">{systemStatus.plant}</div>
        </div>
      </div>

      <div className="hidden items-center gap-3 border-l border-hairline pl-4 lg:flex">
        <Readout label="Shift" value={systemStatus.shift.replace('Shift ', '')} />
        <Readout label="State" value={systemStatus.state} tone="nominal" />
        <Readout label="Sync" value={systemStatus.lastSync} />
      </div>

      {/* Mode rail — the old routes, now lenses on one scene */}
      <nav className="order-last flex w-full gap-1 overflow-x-auto pb-0.5 xl:order-none xl:ml-auto xl:w-auto xl:pb-0">
        {MODES.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => navigate(MODE_META[m].route)}
            className={cn(
              'whitespace-nowrap rounded-[2px] border px-2 py-1 text-[10px] uppercase tracking-[0.14em] transition-colors',
              m === mode
                ? 'border-signal/60 bg-signal/10 text-signal-bright'
                : 'border-hairline text-ink-faint hover:border-edge hover:text-ink-muted',
            )}
          >
            {MODE_META[m].label.replace(' Intelligence', '').replace(' AI', '')}
          </button>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-3 xl:ml-0">
        {simulating && (
          <span className="readout flex items-center gap-1.5 rounded-[2px] border border-unknown/50 bg-unknown/10 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-unknown">
            <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-unknown" />
            Simulated · {sim.confidence.abstained ? 'no point estimate' : `${(sim.confidence.score * 100).toFixed(0)}% conf`}
          </span>
        )}
        <Link
          to="/confidence"
          className="flex items-center gap-1.5 rounded-[2px] border border-hairline px-2 py-1 hover:border-edge"
          title={`${degraded.length} of ${dataStreams.length} streams degraded`}
        >
          <Wifi className={cn('h-3 w-3', degraded.length > 1 ? 'text-caution' : 'text-nominal')} strokeWidth={2} />
          <span className="readout text-[10px] text-ink-muted">
            {systemStatus.sourcesOnline}/{systemStatus.sourcesTotal} · {(dataCoverage * 100).toFixed(0)}%
          </span>
        </Link>
      </div>
    </header>
  );
}

function Readout({ label, value, tone }: { label: string; value: string; tone?: 'nominal' }) {
  return (
    <div className="leading-none">
      <div className="text-[9px] uppercase tracking-[0.16em] text-ink-faint">{label}</div>
      <div className={cn('readout mt-1 text-[11px]', tone === 'nominal' ? 'text-nominal' : 'text-ink')}>{value}</div>
    </div>
  );
}

/** Layer control, camera reset and the motion fallback. */
export function LayerBar() {
  const { layers, toggleLayer, resetCamera, reducedMotion, setReducedMotion, selection } = useTwin();

  return (
    <div className="pointer-events-auto flex flex-col gap-1.5">
      <div className="plate p-2">
        <div className="mb-1.5 flex items-center gap-1.5 text-[9px] uppercase tracking-[0.16em] text-ink-faint">
          <Layers className="h-3 w-3" strokeWidth={2} />
          Layers
        </div>
        <div className="flex flex-col gap-0.5">
          {LAYERS.map((l) => {
            const on = layers.has(l.id);
            return (
              <button
                key={l.id}
                type="button"
                onClick={() => toggleLayer(l.id)}
                title={l.hint}
                className={cn(
                  'flex items-center gap-2 rounded-[2px] px-1.5 py-1 text-left text-[11px] transition-colors',
                  on ? 'bg-raised text-ink' : 'text-ink-faint hover:text-ink-muted',
                )}
              >
                <span
                  className={cn('h-1.5 w-1.5 rounded-full', on ? 'bg-signal-bright' : 'bg-hairline')}
                />
                {l.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="plate flex gap-1 p-1.5">
        <button
          type="button"
          onClick={resetCamera}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-[2px] px-1.5 py-1 text-[10px] text-ink-faint hover:bg-raised hover:text-ink"
          title="Reset camera and clear selection"
        >
          <RotateCcw className="h-3 w-3" strokeWidth={2} />
          Reset
        </button>
        <button
          type="button"
          onClick={() => setReducedMotion(!reducedMotion)}
          className={cn(
            'flex flex-1 items-center justify-center gap-1.5 rounded-[2px] px-1.5 py-1 text-[10px]',
            reducedMotion ? 'bg-raised text-signal-bright' : 'text-ink-faint hover:bg-raised hover:text-ink',
          )}
          title="Pause animation and lower scene complexity"
        >
          <Eye className="h-3 w-3" strokeWidth={2} />
          {reducedMotion ? 'Static' : 'Motion'}
        </button>
      </div>

      {selection && (
        <div className="plate flex items-center gap-1.5 px-2 py-1.5 text-[10px] text-ink-faint">
          <Crosshair className="h-3 w-3 text-signal-bright" strokeWidth={2} />
          Focused · click empty floor to clear
        </div>
      )}
    </div>
  );
}

/** Compact hover layer. Deliberately small — it orients, it does not explain. */
export function HoverReadout() {
  const { hovered } = useTwin();
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    function onMove(e: PointerEvent) {
      setPos({ x: e.clientX, y: e.clientY });
    }
    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  if (!hovered) return null;
  const node = nodeById.get(hovered.nodeId);
  if (!node) return null;

  const machine = hovered.kind === 'machine' ? node.machines.find((m) => m.id === hovered.id) : null;
  const spot = hovered.kind === 'hotspot' ? hotspots.find((h) => h.id === hovered.id) : null;

  const rows: Array<[string, string, string?]> = spot
    ? [['Signal', spot.headline, severityHex[spot.severity]]]
    : machine
      ? [
          ['Defect rate', `${machine.defectRate}%`, machine.flagged ? severityHex.critical : undefined],
          ['State', machine.flagged ? 'ABNORMAL' : 'Nominal', machine.flagged ? severityHex.critical : undefined],
        ]
      : [
          ['Utilization', node.utilization != null ? `${node.utilization}%` : '—'],
          ['Cycle time', node.cycleTime != null ? `${node.cycleTime.toFixed(1)}s` : '—'],
          ['Standard', node.cycleBaseline != null ? `${node.cycleBaseline.toFixed(1)}s` : '—'],
          ['Queue', `${node.queue} units`],
        ];

  return (
    <div
      className="pointer-events-none fixed z-40 w-[196px] border border-edge bg-void/95 px-2.5 py-2 shadow-panel backdrop-blur-sm"
      style={{ left: Math.min(pos.x + 16, window.innerWidth - 210), top: Math.min(pos.y + 16, window.innerHeight - 150) }}
    >
      <div className="readout text-[10px] tracking-[0.16em] text-ink">
        {spot ? spot.label.toUpperCase() : machine ? machine.id : node.code}
      </div>
      <div className="mt-1 border-t border-hairline pt-1.5">
        {rows.map(([k, v, c]) => (
          <div key={k} className="flex items-baseline justify-between gap-2 py-[1px]">
            <span className="text-[10px] text-ink-faint">{k}</span>
            <span className="readout text-[10px]" style={{ color: c ?? '#E7ECF3' }}>
              {v}
            </span>
          </div>
        ))}
      </div>
      {node.bottleneck && !machine && !spot && (
        <div className="readout mt-1 border-t border-hairline pt-1 text-[9px] tracking-[0.16em] text-critical">
          STATUS: CONSTRAINT
        </div>
      )}
    </div>
  );
}

/** Bottom strip: health, throughput and loss over the same 14-day window. */
export function TimelineStrip() {
  const { focusDimension, setFocusDimension } = useTwin();
  const health = compositeHealth(healthDimensions);

  return (
    <div className="pointer-events-auto flex items-stretch gap-px overflow-x-auto border-t border-hairline bg-void/85 backdrop-blur-sm">
      <div className="flex min-w-[168px] shrink-0 items-center gap-3 px-3 py-2">
        <div className="leading-none">
          <div className="text-[9px] uppercase tracking-[0.16em] text-ink-faint">Production health</div>
          <div className="readout mt-1 text-xl text-ink">{health}</div>
        </div>
        <div className="flex flex-1 flex-col gap-[3px]">
          {healthDimensions.map((d) => {
            const active = focusDimension === d.id;
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => setFocusDimension(active ? null : d.id)}
                title={d.note}
                className="group flex items-center gap-1.5"
              >
                <span
                  className={cn(
                    'w-[52px] text-left text-[9px] transition-colors',
                    active ? 'text-ink' : 'text-ink-faint group-hover:text-ink-muted',
                  )}
                >
                  {d.label}
                </span>
                <span className="relative h-[3px] flex-1 bg-hairline">
                  <span
                    className={cn('absolute inset-y-0 left-0', severityTokens[d.severity].rail)}
                    style={{ width: `${d.score}%`, opacity: active ? 1 : 0.6 }}
                  />
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <Spark
        label="Defect rate"
        unit="%"
        series={defectTrend.map((p) => Number(p.defectRate))}
        color={severityHex.critical}
      />
      <Spark
        label="Throughput"
        unit=" u/d"
        series={productionTrend.map((p) => Number(p.throughput))}
        color={severityHex.nominal}
      />
      <Spark
        label="Daily loss"
        unit="k"
        series={lossTrend.map((p) => Number(p.loss))}
        color={severityHex.caution}
        prefix="₹"
      />

      <div className="flex min-w-[150px] shrink-0 items-center gap-2 px-3 py-2">
        <Gauge className="h-3.5 w-3.5 text-ink-faint" strokeWidth={2} />
        <p className="text-[9px] leading-relaxed text-ink-faint">
          Click a health dimension to highlight the stations behind it.
        </p>
      </div>
    </div>
  );
}

function Spark({
  label,
  series,
  color,
  unit,
  prefix = '',
}: {
  label: string;
  series: number[];
  color: string;
  unit: string;
  prefix?: string;
}) {
  const min = Math.min(...series);
  const max = Math.max(...series);
  const span = max - min || 1;
  const pts = series
    .map((v, i) => `${(i / (series.length - 1)) * 100},${28 - ((v - min) / span) * 24}`)
    .join(' ');
  const last = series[series.length - 1];

  return (
    <div className="flex min-w-[140px] flex-1 shrink-0 flex-col justify-center border-l border-hairline px-3 py-2">
      <div className="flex items-baseline justify-between">
        <span className="text-[9px] uppercase tracking-[0.16em] text-ink-faint">{label}</span>
        <span className="readout text-[11px]" style={{ color }}>
          {prefix}
          {last.toLocaleString('en-IN')}
          {unit}
        </span>
      </div>
      <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="mt-1 h-7 w-full">
        <polyline points={pts} fill="none" stroke={color} strokeWidth={1} vectorEffect="non-scaling-stroke" />
      </svg>
      <span className="text-[8px] text-ink-faint">14 days · measured</span>
    </div>
  );
}
