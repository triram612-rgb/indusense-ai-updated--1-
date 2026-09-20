import { useRef, useState } from 'react';
import { AlertTriangle, Loader2, ShieldCheck, ShieldQuestion, UploadCloud, XCircle } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { cn, severityTokens } from '@/lib/severity';

/**
 * Live classification panel — the one genuinely new UI surface added to
 * connect the dashboard to the real backend (see backend/main.py). Every
 * other panel on this page still reads static numbers from src/data/;
 * this one calls POST /api/predict on an uploaded image and renders
 * whatever the trained model actually returns. No API key involved —
 * it's a local FastAPI service serving a local scikit-learn model.
 *
 * Material Number / Batch Number are free-text fields, not pulled from any
 * real picklist — neither provided dataset contains a material or batch
 * catalogue. They're attached to the record purely as labels you supply;
 * they do not influence the prediction, which comes from the photo alone.
 *
 * "Known / Uncertain / Novel" below uses the same 0.50 / 0.30 confidence
 * thresholds as the triage buckets elsewhere on this page (see quality.ts) —
 * fitted to this model's real probability distribution, not the app's
 * default 0.80/0.55 bands, which were tuned for a different model.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

const CLASS_COLORS: Record<string, string> = {
  crack: '#F04438',
  scratch: '#F59E0B',
  hole: '#2F8BFF',
  rust: '#12B5A0',
  normal: '#4ADE80',
};

interface PredictResponse {
  predicted_class: string;
  confidence: number;
  probabilities: Record<string, number>;
  model_version: string;
}

type Classification = 'known' | 'uncertain' | 'novel';

function classifyConfidence(score: number): Classification {
  if (score >= 0.5) return 'known';
  if (score >= 0.3) return 'uncertain';
  return 'novel';
}

const classificationCopy: Record<Classification, { label: string; severity: 'nominal' | 'caution' | 'unknown' }> = {
  known: { label: 'Known defect', severity: 'nominal' },
  uncertain: { label: 'Uncertain — recommend human review', severity: 'caution' },
  novel: { label: 'Novel / anomaly — below confidence floor', severity: 'unknown' },
};

export function LiveClassifyPanel() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [materialNumber, setMaterialNumber] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PredictResponse | null>(null);
  const [inspectedAt, setInspectedAt] = useState<string | null>(null);
  const [unitId] = useState(() => `UNIT-${Math.floor(100000 + Math.random() * 900000)}`);

  async function classifyFile(file: File) {
    setLoading(true);
    setError(null);
    setResult(null);
    setPreviewUrl(URL.createObjectURL(file));

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_BASE}/api/predict`, { method: 'POST', body: formData });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.detail ?? `Backend returned ${res.status}`);
      }
      const data: PredictResponse = await res.json();
      setResult(data);
      setInspectedAt(new Date().toLocaleString());
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      setError(
        message.includes('fetch') || message.includes('NetworkError') || message.includes('Failed to fetch')
          ? `Can't reach the backend at ${API_BASE}. Start it with "uvicorn main:app --port 8000" (see backend/README.md).`
          : message,
      );
    } finally {
      setLoading(false);
    }
  }

  function onFileSelected(f: File | undefined | null) {
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }
    void classifyFile(f);
  }

  function reset() {
    setResult(null);
    setError(null);
    setPreviewUrl(null);
    setInspectedAt(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  const sortedProba = result
    ? Object.entries(result.probabilities).sort(([, a], [, b]) => b - a)
    : [];
  const isDefect = result && result.predicted_class !== 'normal';
  const classification = result ? classifyConfidence(result.confidence) : null;
  const cc = classification ? classificationCopy[classification] : null;
  const ct = cc ? severityTokens[cc.severity] : null;

  return (
    <section className="plate overflow-hidden">
      <span className="absolute left-0 top-0 h-full w-[2px] bg-signal" />

      <header className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-hairline px-4 py-3">
        <UploadCloud className="h-4 w-4 text-signal" strokeWidth={2} />
        <h2 className="text-sm font-medium text-ink">Live classification</h2>
        <StatusBadge severity="nominal" label="Local model · no API key" />
        <span className="readout ml-auto text-2xs text-ink-faint">RandomForest + HOG · v1.0</span>
      </header>

      <div className="grid gap-5 p-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        {/* Upload + metadata */}
        <div>
          <div className="mb-3 grid grid-cols-2 gap-2.5">
            <label className="block">
              <span className="text-2xs text-ink-faint">Material number</span>
              <input
                type="text"
                value={materialNumber}
                onChange={(e) => setMaterialNumber(e.target.value)}
                placeholder="e.g. MAT-2201"
                className="mt-1 w-full rounded-sm border border-edge bg-surface px-2.5 py-1.5 text-xs text-ink placeholder:text-ink-faint focus:border-signal focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="text-2xs text-ink-faint">Batch number</span>
              <input
                type="text"
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                placeholder="e.g. B248"
                className="mt-1 w-full rounded-sm border border-edge bg-surface px-2.5 py-1.5 text-xs text-ink placeholder:text-ink-faint focus:border-signal focus:outline-none"
              />
            </label>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onFileSelected(e.target.files?.[0])}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className={cn(
              'flex min-h-[200px] w-full flex-col items-center justify-center gap-2 rounded-panel border border-dashed border-edge bg-surface/50 p-4 text-center transition-colors hover:border-signal',
              previewUrl && 'p-0',
            )}
          >
            {previewUrl ? (
              <img src={previewUrl} alt="Uploaded unit" className="max-h-[200px] w-full rounded-panel object-contain" />
            ) : (
              <>
                <UploadCloud className="h-6 w-6 text-ink-faint" strokeWidth={1.5} />
                <span className="text-xs font-medium text-ink">Click to upload a photo</span>
                <span className="text-2xs text-ink-faint">Real inference from the trained classifier</span>
              </>
            )}
          </button>

          {previewUrl && (
            <button
              type="button"
              onClick={reset}
              className="mt-2 inline-flex items-center gap-1.5 text-2xs text-ink-faint transition-colors hover:text-ink"
            >
              <XCircle className="h-3 w-3" strokeWidth={2} />
              Clear and try another
            </button>
          )}
        </div>

        {/* Full defect report */}
        <div className="flex flex-col justify-center rounded-panel border border-hairline bg-surface/40 p-3.5">
          {loading && (
            <div className="flex items-center gap-2 text-xs text-ink-faint">
              <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
              Classifying with the real model…
            </div>
          )}

          {error && !loading && (
            <div className="flex items-start gap-2 rounded-panel border border-critical/35 bg-critical/10 p-3 text-xs text-critical">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} />
              <span>{error}</span>
            </div>
          )}

          {result && cc && ct && !loading && !error && (
            <div>
              <div className="flex items-center justify-between gap-2 border-b border-hairline pb-2.5">
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-sm px-2 py-1 text-2xs font-medium',
                    isDefect ? 'bg-critical/15 text-critical' : 'bg-nominal/15 text-nominal',
                  )}
                >
                  {isDefect ? <AlertTriangle className="h-3 w-3" strokeWidth={2.5} /> : <ShieldCheck className="h-3 w-3" strokeWidth={2.5} />}
                  {isDefect ? 'Defect detected' : 'No defect detected'}
                </span>
                <span className="readout text-2xs text-ink-faint">{unitId}</span>
              </div>

              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5">
                <Field label="Defect type" value={result.predicted_class} strong color={CLASS_COLORS[result.predicted_class]} />
                <Field label="Confidence" value={`${(result.confidence * 100).toFixed(1)}%`} strong />
                <Field label="Material number" value={materialNumber || '—'} />
                <Field label="Batch number" value={batchNumber || '—'} />
                <Field label="Inspected" value={inspectedAt ?? '—'} />
                <Field label="Model" value={result.model_version} />
              </dl>

              <div className={cn('mt-3 flex items-center gap-1.5 rounded-sm border px-2.5 py-1.5 text-2xs', ct.border, ct.bg, ct.text)}>
                {classification === 'novel' ? <ShieldQuestion className="h-3 w-3 shrink-0" strokeWidth={2} /> : <ShieldCheck className="h-3 w-3 shrink-0" strokeWidth={2} />}
                {cc.label}
              </div>

              <p className="mt-3 text-2xs text-ink-faint">Full probability breakdown</p>
              <ul className="mt-1.5 space-y-1.5">
                {sortedProba.map(([cls, p]) => (
                  <li key={cls} className="flex items-center gap-2 text-2xs">
                    <span className="w-14 shrink-0 truncate capitalize text-ink-muted">{cls}</span>
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-hairline">
                      <span
                        className="block h-full rounded-full"
                        style={{ width: `${Math.round(p * 100)}%`, background: CLASS_COLORS[cls] ?? '#8B7BD8' }}
                      />
                    </span>
                    <span className="readout w-10 shrink-0 text-right text-ink-faint">{(p * 100).toFixed(0)}%</span>
                  </li>
                ))}
              </ul>

              <p className="mt-3 border-t border-hairline/60 pt-2.5 text-2xs leading-relaxed text-ink-faint">
                Defect type and confidence are real model output. Material/batch numbers are the labels you entered, not looked up against any system.
              </p>
            </div>
          )}

          {!loading && !error && !result && (
            <p className="text-2xs leading-relaxed text-ink-faint">
              Fill in material and batch numbers, then upload a surface photo. The trained model
              classifies it live and this panel fills in with the full report — defect type,
              confidence, classification, and the complete per-class probability breakdown.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function Field({
  label,
  value,
  strong,
  color,
}: {
  label: string;
  value: string;
  strong?: boolean;
  color?: string;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-2xs text-ink-faint">{label}</dt>
      <dd
        className={cn('mt-0.5 readout truncate capitalize', strong ? 'text-sm font-medium' : 'text-xs text-ink-muted')}
        style={color ? { color } : undefined}
      >
        {value}
      </dd>
    </div>
  );
}
