export default function VerdictBadge({ verdict, size = 'md' }) {
  const colors = {
    BLOCKED: 'bg-blocked/20 text-blocked border-blocked/40',
    FLAGGED: 'bg-flagged/20 text-flagged border-flagged/40',
    SAFE: 'bg-safe/20 text-safe border-safe/40',
    ERROR: 'bg-slate-500/20 text-slate-400 border-slate-500/40',
  }

  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-2xl px-6 py-2 font-bold tracking-widest',
  }

  const icons = {
    BLOCKED: '🚫',
    FLAGGED: '⚠️',
    SAFE: '✅',
    ERROR: '❌',
  }

  const key = verdict?.toUpperCase() || 'ERROR'
  return (
    <span className={`inline-flex items-center gap-1.5 rounded border font-mono font-semibold ${colors[key] || colors.ERROR} ${sizes[size]}`}>
      <span>{icons[key] || '?'}</span>
      {key}
    </span>
  )
}
