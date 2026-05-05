import { useState, useEffect } from 'react'
import axios from 'axios'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const VERDICT_COLORS = { BLOCKED: '#ff4444', FLAGGED: '#ff9900', SAFE: '#00cc66' }

function StatCard({ label, value, color }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <p className="text-slate-400 text-sm mb-1">{label}</p>
      <p className="font-bold text-3xl font-mono" style={{ color: color || '#e2e8f0' }}>{value}</p>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 text-xs font-mono">
        <p className="text-slate-300 mb-1">{label}</p>
        {payload.map((p) => (
          <p key={p.name} style={{ color: p.fill }}>{p.name}: {p.value}</p>
        ))}
      </div>
    )
  }
  return null
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  async function fetchData() {
    try {
      const [statsRes, logsRes] = await Promise.all([
        axios.get(`${API}/api/stats`),
        axios.get(`${API}/api/logs?limit=20`),
      ])
      setStats(statsRes.data)
      setLogs(logsRes.data)
    } catch (e) {
      console.error('Dashboard fetch error', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 15000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400 font-mono text-sm animate-pulse">Loading dashboard...</div>
      </div>
    )
  }

  if (!stats) {
    return <div className="text-slate-500 text-center py-20">No data yet. Run some analyses first.</div>
  }

  // Bar chart data — last 20 logs reversed
  const barData = [...logs].reverse().map((log, i) => ({
    name: `#${log.id}`,
    BLOCKED: log.verdict === 'BLOCKED' ? 1 : 0,
    FLAGGED: log.verdict === 'FLAGGED' ? 1 : 0,
    SAFE: log.verdict === 'SAFE' ? 1 : 0,
  }))

  // Pie chart data
  const pieData = [
    { name: 'BLOCKED', value: stats.blocked_count },
    { name: 'FLAGGED', value: stats.flagged_count },
    { name: 'SAFE', value: stats.safe_count },
  ].filter((d) => d.value > 0)

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Analyzed" value={stats.total_analyzed} />
        <StatCard label="Blocked" value={stats.blocked_count} color="#ff4444" />
        <StatCard label="Flagged" value={stats.flagged_count} color="#ff9900" />
        <StatCard label="Safe" value={stats.safe_count} color="#00cc66" />
      </div>

      {/* Middleware Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Attacks Prevented" value={stats.attacks_prevented || 0} color="#7c3aed" />
        <StatCard label="Attack Rate" value={`${stats.attack_rate_percent || 0}%`} color="#ff9900" />
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-slate-400 text-sm mb-3">Sanitize vs Block Ratio</p>
          {(stats.sanitized_count || 0) + (stats.blocked_action_count || 0) > 0 ? (
            <div>
              <div className="flex gap-1 h-6 rounded-lg overflow-hidden">
                <div
                  className="bg-flagged transition-all"
                  style={{ width: `${Math.round((stats.sanitized_count / ((stats.sanitized_count || 0) + (stats.blocked_action_count || 0))) * 100)}%` }}
                  title={`Sanitized: ${stats.sanitized_count}`}
                />
                <div
                  className="bg-blocked transition-all"
                  style={{ width: `${Math.round((stats.blocked_action_count / ((stats.sanitized_count || 0) + (stats.blocked_action_count || 0))) * 100)}%` }}
                  title={`Blocked: ${stats.blocked_action_count}`}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs font-mono">
                <span className="text-flagged">Sanitized: {stats.sanitized_count || 0}</span>
                <span className="text-blocked">Blocked: {stats.blocked_action_count || 0}</span>
              </div>
            </div>
          ) : (
            <p className="text-slate-600 text-xs font-mono">No middleware actions yet</p>
          )}
        </div>
        <div className="bg-card border border-border rounded-xl p-5 flex flex-col items-center justify-center">
          <p className="text-slate-400 text-sm mb-2">Avg Injection Score</p>
          <p className="text-4xl font-bold font-mono text-accent">
            {Math.round(stats.avg_injection_score * 100)}%
          </p>
        </div>
      </div>

      {/* Processing Time + Block Rate + Threat Types */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Avg Processing Time" value={`${Math.round(stats.avg_processing_time_ms || 0)}ms`} color="#38bdf8" />
        <div className="bg-card border border-border rounded-xl p-6 flex flex-col items-center justify-center">
          <p className="text-slate-400 text-sm mb-2">Block Rate</p>
          <p className="text-6xl font-bold font-mono text-blocked">{stats.block_rate_percent}%</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-6 flex flex-col items-center justify-center">
          <p className="text-slate-400 text-sm mb-2">Top Threat Types</p>
          {stats.top_threat_types?.length > 0 ? (
            <div className="mt-1 flex flex-wrap gap-1 justify-center">
              {stats.top_threat_types.map((t) => (
                <span key={t} className="text-xs bg-accent/10 text-accent border border-accent/20 rounded px-2 py-0.5 font-mono">
                  {t}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-slate-600 text-xs font-mono">No threats detected yet</p>
          )}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-slate-300 font-medium text-sm mb-4">Verdicts — Last 20 Analyses</h3>
          {barData.length === 0 ? (
            <div className="text-slate-500 text-sm text-center py-10">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} barSize={12}>
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#1e1e2e' }} />
                <Bar dataKey="BLOCKED" stackId="a" fill="#ff4444" radius={[0, 0, 0, 0]} />
                <Bar dataKey="FLAGGED" stackId="a" fill="#ff9900" />
                <Bar dataKey="SAFE" stackId="a" fill="#00cc66" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie Chart */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-slate-300 font-medium text-sm mb-4">Verdict Distribution</h3>
          {pieData.length === 0 ? (
            <div className="text-slate-500 text-sm text-center py-10">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={VERDICT_COLORS[entry.name]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  formatter={(value) => <span style={{ color: '#94a3b8', fontSize: 12 }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}
