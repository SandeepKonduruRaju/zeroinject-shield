import { useState, useEffect } from 'react'
import axios from 'axios'
import VerdictBadge from './VerdictBadge.jsx'
import AgentVerdicts from './AgentVerdicts.jsx'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const FILTERS = ['ALL', 'BLOCKED', 'FLAGGED', 'SAFE']

function formatTime(ts) {
  if (!ts) return '—'
  try {
    return new Date(ts).toLocaleString()
  } catch {
    return ts
  }
}

export default function ThreatLog() {
  const [logs, setLogs] = useState([])
  const [filter, setFilter] = useState('ALL')
  const [expanded, setExpanded] = useState(null)
  const [loading, setLoading] = useState(true)

  async function fetchLogs() {
    try {
      const params = filter !== 'ALL' ? `?verdict=${filter}` : ''
      const { data } = await axios.get(`${API}/api/logs${params}&limit=100`)
      setLogs(data)
    } catch (e) {
      console.error('Log fetch error', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
    const interval = setInterval(fetchLogs, 10000)
    return () => clearInterval(interval)
  }, [filter])

  const rowBg = (verdict) => {
    if (verdict === 'BLOCKED') return 'border-l-2 border-l-blocked'
    if (verdict === 'FLAGGED') return 'border-l-2 border-l-flagged'
    return 'border-l-2 border-l-safe'
  }

  return (
    <div className="space-y-4">
      {/* Filter Buttons */}
      <div className="flex items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => { setFilter(f); setExpanded(null) }}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
              filter === f
                ? 'bg-accent border-accent text-white'
                : 'border-border text-slate-400 hover:text-white hover:border-slate-500'
            }`}
          >
            {f}
          </button>
        ))}
        <span className="ml-auto text-slate-500 text-xs font-mono">Auto-refresh: 10s</span>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-slate-500 font-mono text-sm animate-pulse">Loading logs...</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16 text-slate-500">No logs found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-slate-500 text-xs uppercase tracking-wider">
                  <th className="text-left px-4 py-3">Timestamp</th>
                  <th className="text-left px-4 py-3">Input</th>
                  <th className="text-left px-4 py-3">Verdict</th>
                  <th className="text-left px-4 py-3">Score</th>
                  <th className="text-left px-4 py-3">Action</th>
                  <th className="text-left px-4 py-3">Attack Type</th>
                  <th className="text-left px-4 py-3">Mode</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <>
                    <tr
                      key={log.id}
                      onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                      className={`border-b border-border/50 cursor-pointer hover:bg-bg/50 transition-colors ${rowBg(log.verdict)}`}
                    >
                      <td className="px-4 py-3 text-slate-400 font-mono text-xs whitespace-nowrap">
                        {formatTime(log.timestamp)}
                      </td>
                      <td className="px-4 py-3 text-slate-300 max-w-xs">
                        <span className="font-mono text-xs truncate block max-w-xs">
                          {log.original_input?.slice(0, 80)}{log.original_input?.length > 80 ? '…' : ''}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <VerdictBadge verdict={log.verdict} size="sm" />
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-300">
                        {Math.round((log.injection_score || 0) * 100)}%
                      </td>
                      <td className="px-4 py-3">
                        {log.action_taken ? (
                          <span className={`text-xs font-mono px-2 py-0.5 rounded border ${
                            log.action_taken === 'BLOCK'
                              ? 'text-blocked border-blocked/40 bg-blocked/10'
                              : log.action_taken === 'SANITIZE'
                              ? 'text-flagged border-flagged/40 bg-flagged/10'
                              : 'text-safe border-safe/40 bg-safe/10'
                          }`}>
                            {log.action_taken}
                          </span>
                        ) : (
                          <span className="text-slate-600 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {log.attack_type ? (
                          <span className="text-xs font-mono px-2 py-0.5 rounded border text-accent border-accent/30 bg-accent/10 capitalize">
                            {log.attack_type.replace(/_/g, ' ')}
                          </span>
                        ) : (
                          <span className="text-slate-600 text-xs italic">Unknown</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-slate-500 font-mono capitalize">{log.mode}</span>
                      </td>
                    </tr>
                    {expanded === log.id && (
                      <tr key={`${log.id}-detail`} className="bg-bg/60">
                        <td colSpan={7} className="px-6 py-4">
                          <div className="space-y-3">
                            <div>
                              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Full Input</p>
                              <p className="text-slate-300 text-xs font-mono bg-card rounded p-3 border border-border whitespace-pre-wrap break-words">
                                {log.original_input}
                              </p>
                            </div>
                            {log.sanitized_input && (
                              <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Sanitized Preview</p>
                                <p className="text-slate-300 text-xs font-mono bg-card rounded p-3 border border-safe/20 whitespace-pre-wrap break-words">
                                  {log.sanitized_input}
                                </p>
                              </div>
                            )}
                            {log.action_taken && (
                              <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Action Taken</p>
                                <span className={`text-xs font-mono px-3 py-1 rounded border ${
                                  log.action_taken === 'BLOCK'
                                    ? 'text-blocked border-blocked/40 bg-blocked/10'
                                    : log.action_taken === 'SANITIZE'
                                    ? 'text-flagged border-flagged/40 bg-flagged/10'
                                    : 'text-safe border-safe/40 bg-safe/10'
                                }`}>
                                  {log.action_taken === 'BLOCK' ? '🛡️' : log.action_taken === 'SANITIZE' ? '🧹' : '✅'} {log.action_taken}
                                </span>
                              </div>
                            )}
                            {[log.agent1_verdict, log.agent2_verdict, log.agent3_verdict].filter(Boolean).length > 0 && (
                              <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Agent Verdicts</p>
                                <AgentVerdicts
                                  verdicts={[log.agent1_verdict, log.agent2_verdict, log.agent3_verdict].filter(Boolean)}
                                />
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
