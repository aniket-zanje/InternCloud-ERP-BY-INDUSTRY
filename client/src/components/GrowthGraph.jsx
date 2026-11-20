export default function GrowthGraph({ data }) {
  const W = 560, H = 230, p = 36
  const x = (i) => p + (i * (W - 2 * p)) / Math.max(1, data.length - 1)
  const y = (v) => H - p - ((v - 40) / 60) * (H - 2 * p)
  const pts = data.map((v, i) => `${x(i)},${y(v)}`).join(' ')

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Weekly score growth graph">
      <defs>
        <linearGradient id="gg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: 'var(--brand)', stopOpacity: 0.35 }} />
          <stop offset="1" style={{ stopColor: 'var(--brand)', stopOpacity: 0 }} />
        </linearGradient>
      </defs>
      {[40, 60, 80, 100].map((v) => (
        <g key={v}>
          <line x1={p} x2={W - p} y1={y(v)} y2={y(v)} stroke="var(--border)" />
          <text x={p - 8} y={y(v) + 4} textAnchor="end" fontSize="11" fill="var(--muted)">{v}</text>
        </g>
      ))}
      <polygon points={`${p},${H - p} ${pts} ${x(data.length - 1)},${H - p}`} fill="url(#gg)" />
      <polyline points={pts} fill="none" stroke="var(--brand)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((v, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(v)} r="4.5" fill="var(--surface)" stroke="var(--brand)" strokeWidth="2.5">
            <title>{`Week ${i + 1}: ${v}`}</title>
          </circle>
          <text x={x(i)} y={H - 12} textAnchor="middle" fontSize="11" fill="var(--muted)">{`W${i + 1}`}</text>
        </g>
      ))}
    </svg>
  )
}
