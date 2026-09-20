/** Shared Recharts styling so every chart in the platform reads as one instrument. */
export const chartColors = {
  signal: '#2F8BFF',
  signalBright: '#5AA7FF',
  caution: '#F59E0B',
  critical: '#F04438',
  nominal: '#12B5A0',
  unknown: '#8B7BD8',
  grid: '#222B36',
  axis: '#64717F',
};

export const axisProps = {
  stroke: chartColors.axis,
  tick: { fill: chartColors.axis, fontSize: 11, fontFamily: 'JetBrains Mono, monospace' },
  tickLine: false,
  axisLine: { stroke: chartColors.grid },
} as const;

export const tooltipProps = {
  contentStyle: {
    background: '#0E1218',
    border: '1px solid #2E3A49',
    borderRadius: 4,
    fontSize: 12,
    padding: '8px 10px',
  },
  labelStyle: { color: '#94A1B2', fontSize: 11, marginBottom: 4 },
  itemStyle: { color: '#E7ECF3', fontSize: 12 },
  cursor: { stroke: '#2E3A49', strokeWidth: 1 },
} as const;
