import { Suspense, lazy, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { TwinProvider, useTwin, MODE_META } from './state';
import type { TwinMode } from './state';
import { FactoryScene } from './scene/FactoryScene';
import { HoverReadout, LayerBar, TimelineStrip, TopStatus } from './panels/Chrome';
import { SignalRail } from './panels/SignalRail';
import { IntelPanel } from './panels/IntelPanel';
import { SimControls } from './panels/SimControls';
import { DefectInspector } from './panels/DefectInspector';

/**
 * The workspace.
 *
 * One scene, one state, seven lenses. What used to be seven routes are now
 * modes over the same plant: the camera reframes, the layers change, the panels
 * re-scope — but the factory, and whatever the user had selected, persist.
 *
 * The original analytical pages are not thrown away. They are mounted lazily as
 * the dossier drawer, which is where the dense 2D evidence belongs: charts are
 * better read flat, and the 3D layer is for spatial reasoning.
 */

const DOSSIERS: Record<TwinMode, () => Promise<{ default: React.ComponentType }>> = {
  command: () => import('@/pages/CommandCenter').then((m) => ({ default: m.CommandCenter })),
  quality: () => import('@/pages/QualityIntelligence').then((m) => ({ default: m.QualityIntelligence })),
  production: () => import('@/pages/ProductionIntelligence').then((m) => ({ default: m.ProductionIntelligence })),
  profitability: () => import('@/pages/Profitability').then((m) => ({ default: m.Profitability })),
  simulation: () => import('@/pages/Simulator').then((m) => ({ default: m.Simulator })),
  decision: () => import('@/pages/DecisionShadow').then((m) => ({ default: m.DecisionShadow })),
  confidence: () => import('@/pages/Confidence').then((m) => ({ default: m.Confidence })),
};

function Workspace({ mode }: { mode: TwinMode }) {
  const { dossierOpen, setDossierOpen } = useTwin();
  const [inspecting, setInspecting] = useState(false);
  // Memoised: recreating the lazy component each render would remount the dossier.
  const Dossier = useMemo(() => lazy(DOSSIERS[mode]), [mode]);

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-void">
      <TopStatus mode={mode} />

      {/* Scene + panels. On desktop the panels float over the plant; on a
          narrow screen they become a scrollable sheet beneath it, so the 3D
          stays the primary visual instead of being squeezed. */}
      <div className="relative flex min-h-0 flex-1 flex-col lg:block">
        <div className="relative min-h-[44vh] flex-1 lg:absolute lg:inset-0">
          <FactoryScene />
          <div className="pointer-events-none absolute bottom-2 left-2 lg:hidden">
            <LayerBar />
          </div>
        </div>

        <div className="flex max-h-[44vh] shrink-0 flex-col gap-2 overflow-y-auto border-t border-hairline bg-void/70 p-2 lg:pointer-events-none lg:absolute lg:inset-0 lg:max-h-none lg:flex-row lg:overflow-visible lg:border-0 lg:bg-transparent lg:p-3">
          <div className="flex shrink-0 flex-col gap-2">
            <SignalRail />
          </div>

          <div className="pointer-events-none hidden flex-1 items-start justify-center lg:flex">
            <ModeCaption mode={mode} />
          </div>

          <div className="flex shrink-0 flex-col gap-2 lg:items-end">
            {mode === 'simulation' ? <SimControls /> : <IntelPanel onInspect={() => setInspecting(true)} />}
            <div className="hidden lg:block">
              <LayerBar />
            </div>
          </div>
        </div>
      </div>

      <TimelineStrip />
      <HoverReadout />

      {inspecting && <DefectInspector onClose={() => setInspecting(false)} />}

      {dossierOpen && (
        <div className="fixed inset-0 z-40 flex flex-col bg-void/96 backdrop-blur-sm">
          <div className="flex items-center gap-3 border-b border-hairline px-4 py-2.5">
            <span className="text-[10px] uppercase tracking-[0.16em] text-ink-faint">Analytical dossier</span>
            <span className="text-xs text-ink">{MODE_META[mode].label}</span>
            <button
              type="button"
              onClick={() => setDossierOpen(false)}
              className="ml-auto flex items-center gap-1.5 rounded-[2px] border border-hairline px-2 py-1 text-[10px] text-ink-muted hover:border-edge hover:text-ink"
            >
              <X className="h-3 w-3" strokeWidth={2} />
              Back to the plant
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-[1600px] space-y-5 p-4 sm:p-5 lg:p-6">
              <Suspense fallback={<p className="text-xs text-ink-faint">Loading evidence…</p>}>
                <Dossier />
              </Suspense>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** A single line of orientation. The scene should carry the rest. */
function ModeCaption({ mode }: { mode: TwinMode }) {
  const { selection, activeChain } = useTwin();
  if (selection || activeChain) return null;
  return (
    <div className="mt-1 text-center">
      <div className="text-[10px] uppercase tracking-[0.2em] text-ink-faint">{MODE_META[mode].label}</div>
      <div className="mt-1 text-xs text-ink-muted">{MODE_META[mode].question}</div>
    </div>
  );
}

export function TwinWorkspace({ mode }: { mode: TwinMode }) {
  return (
    <TwinProvider mode={mode}>
      <Workspace mode={mode} />
    </TwinProvider>
  );
}
