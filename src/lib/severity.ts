import type { Provenance, Severity } from './types';

interface SeverityTokens {
  label: string;
  text: string;
  border: string;
  bg: string;
  dot: string;
  /** Left signal rail on panels. */
  rail: string;
  stroke: string;
}

export const severityTokens: Record<Severity, SeverityTokens> = {
  nominal: {
    label: 'Nominal',
    text: 'text-nominal',
    border: 'border-nominal/35',
    bg: 'bg-nominal/10',
    dot: 'bg-nominal',
    rail: 'bg-nominal',
    stroke: '#12B5A0',
  },
  caution: {
    label: 'Caution',
    text: 'text-caution',
    border: 'border-caution/35',
    bg: 'bg-caution/10',
    dot: 'bg-caution',
    rail: 'bg-caution',
    stroke: '#F59E0B',
  },
  critical: {
    label: 'Critical',
    text: 'text-critical',
    border: 'border-critical/35',
    bg: 'bg-critical/10',
    dot: 'bg-critical',
    rail: 'bg-critical',
    stroke: '#F04438',
  },
  unknown: {
    label: 'Unclassified',
    text: 'text-unknown',
    border: 'border-unknown/35',
    bg: 'bg-unknown/10',
    dot: 'bg-unknown',
    rail: 'bg-unknown',
    stroke: '#8B7BD8',
  },
};

export const provenanceCopy: Record<Provenance, { short: string; long: string }> = {
  measured: { short: 'Measured', long: 'Read directly from plant instrumentation.' },
  simulated: { short: 'Simulated', long: 'Produced by a what-if model, not observed on the floor.' },
  projected: { short: 'Projected', long: 'Extrapolated from the current shift to its end.' },
  imputed: { short: 'Imputed', long: 'Filled in where source records were missing.' },
};

/** Confidence bands. Anything under 0.55 is treated as not yet decidable. */
export function confidenceBand(score: number): Severity {
  if (score >= 0.8) return 'nominal';
  if (score >= 0.55) return 'caution';
  return 'unknown';
}

export function formatNumber(value: number, digits = 0): string {
  return value.toLocaleString('en-IN', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}
