import React, { useState } from 'react'
import SystemStatus from './components/SystemStatus'
import EventFeed from './components/EventFeed'
import ManualTrigger from './components/ManualTrigger'
import ConflictTrigger from './components/ConflictTrigger'
import DLQPanel from './components/DLQPanel'
import ReconciliationPanel from './components/ReconciliationPanel'

const TABS = [
  { id: 'overview',  label: 'Overview'       },
  { id: 'try',       label: 'Try It Yourself' },
  { id: 'scenarios', label: 'Scenarios'       },
  { id: 'advanced',  label: 'Advanced'        },
]

export default function App() {
  const [tab, setTab] = useState('overview')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* Nav */}
      <header style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', height: 56, gap: 32 }}>

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--text-1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 7h10M7 2l5 5-5 5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)' }}>SyncBridge</span>
          </div>

          {/* Tabs */}
          <nav style={{ display: 'flex', gap: 1, flex: 1 }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                padding: '5px 12px', border: 'none', borderRadius: 6, fontSize: 13,
                background: tab === t.id ? 'var(--surface-2)' : 'transparent',
                color: tab === t.id ? 'var(--text-1)' : 'var(--text-3)',
                fontWeight: tab === t.id ? 500 : 400,
                cursor: 'pointer', transition: 'all 0.12s',
              }}>
                {t.label}
              </button>
            ))}
          </nav>

          {/* Live indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div className="live-dot" />
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Live</span>
          </div>
        </div>
      </header>

      {/* Body */}
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
        {tab === 'overview' && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <SystemStatus />
            <EventFeed />
          </div>
        )}
        {tab === 'try' && <div className="fade-in"><ManualTrigger /></div>}
        {tab === 'scenarios' && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <ConflictTrigger />
            <EventFeed />
          </div>
        )}
        {tab === 'advanced' && (
          <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <DLQPanel />
            <ReconciliationPanel />
          </div>
        )}
      </main>
    </div>
  )
}
