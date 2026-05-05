export default function AgentVerdicts({ verdicts }) {
  if (!verdicts || verdicts.length === 0) return null

  return (
    <div className="space-y-3">
      {verdicts.map((v, i) => (
        <div key={i} className="bg-bg rounded-lg border border-border p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex flex-col">
              <span className="text-slate-300 font-medium text-sm">{v.agent || `Agent ${i + 1}`}</span>
              <span className="text-slate-500 text-xs mt-0.5">{i === 0 ? "llama-3.3-70b" : i === 1 ? "llama-3.1-8b" : "qwen3-32b"}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-mono px-2 py-0.5 rounded border ${
                v.is_injection
                  ? 'text-blocked border-blocked/40 bg-blocked/10'
                  : 'text-safe border-safe/40 bg-safe/10'
              }`}>
                {v.is_injection ? 'INJECTION' : 'CLEAN'}
              </span>
              <span className="text-slate-400 text-xs font-mono">
                {Math.round((v.confidence || 0) * 100)}% conf
              </span>
            </div>
          </div>
          {/* Confidence bar */}
          <div className="w-full bg-border rounded-full h-1.5 mb-2">
            <div
              className={`h-1.5 rounded-full transition-all ${v.is_injection ? 'bg-blocked' : 'bg-safe'}`}
              style={{ width: `${Math.round((v.confidence || 0) * 100)}%` }}
            />
          </div>
          <p className="text-slate-400 text-xs font-mono leading-relaxed">{v.reason || v.threat_type || '—'}</p>
        </div>
      ))}
    </div>
  )
}
