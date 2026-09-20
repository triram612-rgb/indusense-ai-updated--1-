# InduSense AI

**From factory data to confident decisions.**

Frontend shell for an industrial manufacturing intelligence platform. Four layers —
Quality, Production, Profitability and Decision Shadow AI — sit on one visual system
built around a single principle: *know when you don't know*.

## Run it

```bash
npm install
npm run dev
```

## What is here

- Full application shell: sidebar, top bar with plant selector and notifications, routing.
- Eleven reusable components under `src/components/ui`, all driven by the domain types.
- Realistic mock data shaped exactly as a real feed would be — no backend needed.
- All seven routes are modes of one 3D digital twin (see below); the original
  analytical pages are retained as the evidence dossier.


## The digital twin layer (`src/twin`)

The Command Center is no longer a page of cards. All seven routes now open the same
interactive 3D plant in a different analytical mode, and the factory itself is the
primary interface.

```
src/twin/
  layout.ts            Spatial layout derived from src/data — no new numbers
  causal.ts            Causal chains: condition → process → defect → throughput → ₹
  simulate.ts          What-if response surface, with an explicit abstain envelope
  state.tsx            One state object: mode, selection, layers, scenario
  scene/               React Three Fiber: nodes, flow, overlays, camera rig
  panels/              Contextual 2D intelligence around the scene
  TwinWorkspace.tsx    Composition, plus the dossier drawer
```

Design rules held throughout:

- **Nothing in 3D is decorative.** Station status, machine abnormality, queue length,
  loss height and link direction all read out of `src/data`. Change the data, the
  factory changes.
- **The queue is emergent.** Units advance at the rate of the station they are passing
  and hold a minimum gap. The pile-up in front of Station 3 is what a 31.4s cycle
  downstream of a 19.6s one actually produces — it is not a bottleneck graphic.
- **Existing pages are kept as the evidence layer.** Every original page component is
  still mounted, as the analytical dossier drawer inside the workspace. Dense 2D
  charts read better flat; 3D is for spatial reasoning.
- **Uncertainty stays first class.** The novel-pattern chain is drawn dashed and priced
  at nothing. The simulator abstains from a point estimate outside the observed
  operating envelope rather than extrapolating a confident-looking rupee figure.
- **Nothing is connected to plant equipment.** Simulation output is labelled SIMULATED
  everywhere, and the synthetic inspection geometry is labelled as a visualisation
  rather than a scan.

## Builds

```bash
npm run dev            # development
npm run build          # normal deployable build
npm run build:preview  # single self-contained HTML file (hash routing), dist-preview/
```

## The uncertainty system

Three ideas run through every component:

1. **Confidence is never implied, it is shown.** `ConfidenceBar` renders a segmented
   meter plus sample size, and turns violet when a model has abstained.
2. **Simulated is never mistaken for measured.** `SimulationBadge` tags every number
   with its provenance: measured, projected, simulated or imputed.
3. **Unknown is a first-class state.** `Severity` includes `unknown` alongside
   nominal/caution/critical, with its own colour reserved for it — so a defect the
   model refuses to classify can never be displayed as a classified one.
