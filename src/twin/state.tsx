import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { baselineScenario, simulate } from './simulate';
import type { Scenario, SimResult } from './simulate';
import { factoryNodes, hotspots, nodeById } from './layout';
import type { FactoryNode, Hotspot } from './layout';
import { causalChains, chainsForNode } from './causal';
import type { CausalChain } from './causal';

/**
 * One state object for the whole platform.
 *
 * The seven old routes become modes of this single state rather than separate
 * applications. Selecting Station 3 in Production mode and then switching to
 * Profitability keeps the selection, so the user follows one investigation
 * across lenses instead of restarting it on every page.
 */

export type TwinMode =
  | 'command'
  | 'quality'
  | 'production'
  | 'profitability'
  | 'simulation'
  | 'decision'
  | 'confidence';

export type Layer = 'quality' | 'production' | 'bottleneck' | 'rootcause' | 'financial' | 'confidence';

export const LAYERS: Array<{ id: Layer; label: string; hint: string }> = [
  { id: 'production', label: 'Production', hint: 'Flow, cycle time, utilisation' },
  { id: 'bottleneck', label: 'Bottlenecks', hint: 'Queue build-up and constraint pressure' },
  { id: 'quality', label: 'Quality', hint: 'Inspection points and defect hotspots' },
  { id: 'rootcause', label: 'Root cause', hint: 'Causal links between condition and defect' },
  { id: 'financial', label: 'Financial impact', hint: 'Loss attribution as vertical mass' },
  { id: 'confidence', label: 'AI confidence', hint: 'Where the model is unsure or abstaining' },
];

/** Default layer sets per mode. The user can override any of them. */
const MODE_LAYERS: Record<TwinMode, Layer[]> = {
  command: ['production', 'bottleneck', 'quality'],
  quality: ['quality', 'rootcause', 'confidence'],
  production: ['production', 'bottleneck'],
  profitability: ['financial', 'bottleneck'],
  simulation: ['production', 'bottleneck', 'financial'],
  decision: ['production', 'rootcause', 'confidence'],
  confidence: ['confidence', 'quality'],
};

export const MODE_META: Record<TwinMode, { label: string; question: string; route: string }> = {
  command: { label: 'Command Center', question: 'What needs me right now?', route: '/dashboard' },
  quality: { label: 'Quality Intelligence', question: 'What is defective, and why?', route: '/quality' },
  production: { label: 'Production Intelligence', question: 'Where is the bottleneck?', route: '/production' },
  profitability: { label: 'Profitability', question: 'Where is money leaking?', route: '/profitability' },
  simulation: { label: 'What-If Simulator', question: 'What happens if we change it?', route: '/simulator' },
  decision: { label: 'Decision Shadow AI', question: 'Has this call gone badly before?', route: '/decision-shadow' },
  confidence: { label: 'Data & Model Confidence', question: 'How much of this can I trust?', route: '/confidence' },
};

export interface Selection {
  kind: 'node' | 'machine' | 'hotspot';
  id: string;
  /** For machines, the node they sit on. */
  nodeId: string;
}

interface TwinContextValue {
  mode: TwinMode;
  setMode: (m: TwinMode) => void;
  selection: Selection | null;
  select: (s: Selection | null) => void;
  selectedNode: FactoryNode | null;
  selectedHotspot: Hotspot | null;
  hovered: Selection | null;
  setHovered: (s: Selection | null) => void;
  layers: Set<Layer>;
  toggleLayer: (l: Layer) => void;
  activeChain: CausalChain | null;
  setActiveChain: (id: string | null) => void;
  chainsHere: CausalChain[];
  scenario: Scenario;
  setLever: (key: keyof Scenario, value: number) => void;
  resetScenario: () => void;
  sim: SimResult;
  /** True once the user has moved any lever — everything downstream gets a SIMULATED badge. */
  simulating: boolean;
  /** Dimension highlighted from the health score, e.g. 'hd-downtime'. */
  focusDimension: string | null;
  setFocusDimension: (id: string | null) => void;
  reducedMotion: boolean;
  setReducedMotion: (v: boolean) => void;
  /** Bumped when the user asks for a camera reset. */
  cameraResetKey: number;
  resetCamera: () => void;
  /** Full analytical dossier drawer. */
  dossierOpen: boolean;
  setDossierOpen: (v: boolean) => void;
}

/** Exported so the R3F canvas can re-provide it: context does not cross the
 * three.js reconciler boundary on its own. */
export const TwinContext = createContext<TwinContextValue | null>(null);

export function TwinProvider({ mode, children }: { mode: TwinMode; children: ReactNode }) {
  const [selection, setSelection] = useState<Selection | null>(null);
  const [hovered, setHovered] = useState<Selection | null>(null);
  const [layers, setLayers] = useState<Set<Layer>>(new Set(MODE_LAYERS[mode]));
  const [chainId, setChainId] = useState<string | null>(null);
  const [scenario, setScenario] = useState<Scenario>(baselineScenario);
  const [focusDimension, setFocusDimension] = useState<string | null>(null);
  const [cameraResetKey, setCameraResetKey] = useState(0);
  const [dossierOpen, setDossierOpen] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  // Mode changes reset the visible layers but deliberately keep the selection,
  // so switching lens continues the same investigation.
  const [lastMode, setLastMode] = useState(mode);
  useEffect(() => {
    if (mode !== lastMode) {
      setLayers(new Set(MODE_LAYERS[mode]));
      setDossierOpen(false);
      setLastMode(mode);
    }
  }, [mode, lastMode]);

  const setMode = useCallback(() => {
    /* Routing owns the mode; navigation happens through the rail. */
  }, []);

  const toggleLayer = useCallback((l: Layer) => {
    setLayers((prev) => {
      const next = new Set(prev);
      if (next.has(l)) next.delete(l);
      else next.add(l);
      return next;
    });
  }, []);

  const select = useCallback((s: Selection | null) => {
    setSelection(s);
    if (!s) setChainId(null);
  }, []);

  const setLever = useCallback((key: keyof Scenario, value: number) => {
    setScenario((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetScenario = useCallback(() => setScenario(baselineScenario), []);
  const resetCamera = useCallback(() => {
    setSelection(null);
    setChainId(null);
    setCameraResetKey((k) => k + 1);
  }, []);

  const sim = useMemo(() => simulate(scenario), [scenario]);

  const selectedNode = useMemo<FactoryNode | null>(() => {
    if (!selection) return null;
    return nodeById.get(selection.nodeId) ?? null;
  }, [selection]);

  const selectedHotspot = useMemo<Hotspot | null>(() => {
    if (selection?.kind !== 'hotspot') return null;
    return hotspots.find((h) => h.id === selection.id) ?? null;
  }, [selection]);

  const chainsHere = useMemo(
    () => (selection ? chainsForNode(selection.nodeId) : causalChains),
    [selection],
  );

  const activeChain = useMemo(() => causalChains.find((c) => c.id === chainId) ?? null, [chainId]);

  const value: TwinContextValue = {
    mode,
    setMode,
    selection,
    select,
    selectedNode,
    selectedHotspot,
    hovered,
    setHovered,
    layers,
    toggleLayer,
    activeChain,
    setActiveChain: setChainId,
    chainsHere,
    scenario,
    setLever,
    resetScenario,
    sim,
    simulating: sim.dirty,
    focusDimension,
    setFocusDimension,
    reducedMotion,
    setReducedMotion,
    cameraResetKey,
    resetCamera,
    dossierOpen,
    setDossierOpen,
  };

  return <TwinContext.Provider value={value}>{children}</TwinContext.Provider>;
}

export function useTwin(): TwinContextValue {
  const ctx = useContext(TwinContext);
  if (!ctx) throw new Error('useTwin must be used inside a TwinProvider');
  return ctx;
}

/** Which nodes the current mode + focus dimension consider relevant. */
export function relevantNodes(
  mode: TwinMode,
  focusDimension: string | null,
): Set<string> | null {
  if (focusDimension === 'hd-downtime') return new Set(['st-3', 'st-2', 'st-5']);
  if (focusDimension === 'hd-quality') return new Set(['st-2', 'inspection', 'st-3']);
  if (focusDimension === 'hd-profitability') return new Set(['st-2', 'st-3', 'outfeed']);
  if (focusDimension === 'hd-throughput') return new Set(['st-3', 'st-4']);
  if (focusDimension === 'hd-yield') return new Set(['st-2', 'inspection']);
  if (mode === 'quality') return new Set(['st-2', 'inspection', 'st-5', 'st-3']);
  if (mode === 'profitability') return new Set(factoryNodes.filter((n) => n.lossLakhs > 0).map((n) => n.id));
  return null;
}
