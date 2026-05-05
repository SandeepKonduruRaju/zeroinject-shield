import { useState } from 'react'
import Analyzer from '../components/Analyzer.jsx'
import Dashboard from '../components/Dashboard.jsx'
import ThreatLog from '../components/ThreatLog.jsx'
import DemoRunner from '../components/DemoRunner.jsx'
import MiddlewareTest from '../components/MiddlewareTest.jsx'

const TABS = ['Analyzer', 'Dashboard', 'Threat Log', 'Demo Benchmark', 'Middleware Test']

export default function Home() {
  const [activeTab, setActiveTab] = useState(0)

  return (
    <div className="min-h-screen bg-bg font-sans">
      {/* Header */}
      <header className="border-b border-border px-6 py-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>
        <div>
          <h1 className="text-white font-bold text-lg leading-none">ZeroInject Shield</h1>
          <p className="text-slate-500 text-xs mt-0.5">Prompt Injection Defense Middleware</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-safe animate-pulse"></span>
          <span className="text-slate-400 text-xs">llama-3.3-70b-versatile</span>
        </div>
      </header>

      {/* Tab Nav */}
      <nav className="border-b border-border px-6 flex gap-1">
        {TABS.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === i
                ? 'border-accent text-accent'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main className="p-6 max-w-7xl mx-auto">
        {activeTab === 0 && <Analyzer />}
        {activeTab === 1 && <Dashboard />}
        {activeTab === 2 && <ThreatLog />}
        {activeTab === 3 && <DemoRunner />}
        {activeTab === 4 && <MiddlewareTest />}
      </main>
    </div>
  )
}
