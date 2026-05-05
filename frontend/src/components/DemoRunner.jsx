import { useState } from 'react'
import axios from 'axios'
import VerdictBadge from './VerdictBadge.jsx'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function MetricCard({ label, value, color }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 text-center">
      <p className="text-slate-400 text-sm mb-1">{label}</p>
      <p className="text-3xl font-bold font-mono" style={{ color: color || '#e2e8f0' }}>
        {typeof value === 'number' ? (value * 100).toFixed(1) + '%' : value}
      </p>
    </div>
  )
}

export default function DemoRunner() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  async function runDemo() {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const { data } = await axios.post(`${API}/api/demo/run`, {}, { timeout: 300000 })
      setResult(data)
    } catch (e) {
      setError(e.response?.data?.detail || 'Demo run failed. Check backend connection.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-white font-semibold mb-1">Demo Benchmark</h2>
            <p className="text-slate-400 text-sm">
              Runs 10 samples from the dataset through the full pipeline and measures accuracy.
            </p>
          </div>
          <button
            onClick={runDemo}
            disabled={loading}
            className="flex items-center gap-2 bg-accent hover:bg-accent/80 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-6 py-2.5 rounded-lg transition-colors whitespace-nowrap"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Running...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                Run Demo
              </>
            )}
          </button>
        </div>

        {loading && (
          <div className="mt-4 bg-bg rounded-lg border border-border p-4">
            <div className="flex items-center gap-3">
              <svg className="animate-spin w-5 h-5 text-accent" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <div>
                <p className="text-slate-300 text-sm font-medium">Processing 10 samples through full pipeline...</p>
                <p className="text-slate-500 text-xs mt-0.5">This may take 30–90 seconds due to rate limits.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-blocked/10 border border-blocked/30 rounded-xl p-4 text-blocked text-sm font-mono">
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <>
          {/* Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard label="Precision" value={result.precision} color="#7c3aed" />
            <MetricCard label="Recall" value={result.recall} color="#00cc66" />
            <MetricCard label="F1 Score" value={result.f1_score} color="#ff9900" />
            <MetricCard label="Total Samples" value={result.total_samples} />
          </div>

          {/* Confusion Matrix */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-slate-300 font-medium text-sm mb-4">Confusion Matrix</h3>
            <div className="grid grid-cols-2 gap-3 max-w-sm">
              <div className="bg-safe/10 border border-safe/20 rounded-lg p-4 text-center">
                <p className="text-safe text-2xl font-bold font-mono">{result.true_positives}</p>
                <p className="text-slate-400 text-xs mt-1">True Positives</p>
              </div>
              <div className="bg-blocked/10 border border-blocked/20 rounded-lg p-4 text-center">
                <p className="text-blocked text-2xl font-bold font-mono">{result.false_positives}</p>
                <p className="text-slate-400 text-xs mt-1">False Positives</p>
              </div>
              <div className="bg-blocked/10 border border-blocked/20 rounded-lg p-4 text-center">
                <p className="text-blocked text-2xl font-bold font-mono">{result.false_negatives}</p>
                <p className="text-slate-400 text-xs mt-1">False Negatives</p>
              </div>
              <div className="bg-safe/10 border border-safe/20 rounded-lg p-4 text-center">
                <p className="text-safe text-2xl font-bold font-mono">{result.true_negatives}</p>
                <p className="text-slate-400 text-xs mt-1">True Negatives</p>
              </div>
            </div>
          </div>

          {/* Baseline vs Pipeline Comparison */}
          {result.baseline_f1 != null && (
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-slate-300 font-medium text-sm mb-4">Baseline vs Full Pipeline</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-slate-500 text-xs uppercase tracking-wider mb-2">Baseline F1</p>
                  <p className="text-3xl font-bold font-mono text-slate-400">
                    {(result.baseline_f1 * 100).toFixed(1)}%
                  </p>
                  <p className="text-slate-600 text-xs mt-1">Verifiers only</p>
                </div>
                <div className="text-center flex flex-col items-center justify-center">
                  <span className={`text-lg font-bold font-mono px-4 py-2 rounded-lg border ${
                    result.improvement_percent > 0
                      ? 'text-safe bg-safe/10 border-safe/30'
                      : result.improvement_percent === 0
                      ? 'text-slate-400 bg-slate-400/10 border-slate-400/30'
                      : 'text-blocked bg-blocked/10 border-blocked/30'
                  }`}>
                    {result.improvement_percent > 0 ? '+' : ''}{result.improvement_percent}%
                  </span>
                  <p className="text-slate-500 text-xs mt-2">Improvement</p>
                </div>
                <div className="text-center">
                  <p className="text-slate-500 text-xs uppercase tracking-wider mb-2">Pipeline F1</p>
                  <p className="text-3xl font-bold font-mono text-accent">
                    {(result.pipeline_f1 * 100).toFixed(1)}%
                  </p>
                  <p className="text-slate-600 text-xs mt-1">Sanitizer + Verifiers</p>
                </div>
              </div>
            </div>
          )}

          {/* Sample Results Table */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h3 className="text-slate-300 font-medium text-sm">Sample Results</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-slate-500 text-xs uppercase tracking-wider">
                    <th className="text-left px-4 py-3">Input</th>
                    <th className="text-left px-4 py-3">Ground Truth</th>
                    <th className="text-left px-4 py-3">Pipeline</th>
                    <th className="text-left px-4 py-3">Score</th>
                    <th className="text-left px-4 py-3">Match</th>
                  </tr>
                </thead>
                <tbody>
                  {result.samples.map((s, i) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-bg/50 transition-colors">
                      <td className="px-4 py-3 text-slate-300 font-mono text-xs max-w-xs">
                        <span className="truncate block max-w-xs">{s.input?.slice(0, 70)}{s.input?.length > 70 ? '…' : ''}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-mono px-2 py-0.5 rounded border ${
                          s.ground_truth === 'injection'
                            ? 'text-blocked border-blocked/40 bg-blocked/10'
                            : 'text-safe border-safe/40 bg-safe/10'
                        }`}>
                          {s.ground_truth}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <VerdictBadge verdict={s.pipeline_verdict} size="sm" />
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-300">
                        {Math.round((s.injection_score || 0) * 100)}%
                      </td>
                      <td className="px-4 py-3 text-lg">
                        {s.match ? '✅' : '❌'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
