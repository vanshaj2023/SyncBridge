import React, { useState } from 'react'
import SystemStatus from './components/SystemStatus'
import EventFeed from './components/EventFeed'
import ManualTrigger from './components/ManualTrigger'
import ConflictTrigger from './components/ConflictTrigger'
import DLQPanel from './components/DLQPanel'
import ReconciliationPanel from './components/ReconciliationPanel'

const TABS = [
  { id: 'overview',  label: 'Overview',        icon: '◈' },
  { id: 'try',       label: 'Try It Yourself',  icon: '✦' },
  { id: 'scenarios', label: 'Demo Scenarios',   icon: '⚡' },
  { id: 'advanced',  label: 'Advanced',         icon: '⚙' },
]

export default function App() {
  const [tab, setTab] = useState('overview')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* ── Top nav ── */}
      <header style={{
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        position: 'sticky', top: 0, zIndex: 50,
        boxShadow: '0 1px 0 var(--border)',
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 28px', display: 'flex', alignItems: 'center', height: 60, gap: 32 }}>

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 9,
              background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 17, color: '#fff', fontWeight: 700, boxShadow: '0 2px 8px rgba(22,163,74,0.35)',
            }}>⚡</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)', lineHeight: 1 }}>SyncBridge</div>
              <div style={{ fontSize: 10, color: 'var(--text-4)', marginTop: 1 }}>Karnataka Interoperability Layer</div>
            </div>
          </div>

          {/* Tabs */}
          <nav style={{ display: 'flex', gap: 2, flex: 1 }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 7, border: 'none', fontSize: 13,
                background: tab === t.id ? 'var(--accent-light)' : 'transparent',
                color: tab === t.id ? 'var(--accent)' : 'var(--text-3)',
                fontWeight: tab === t.id ? 600 : 400,
                cursor: 'pointer', transition: 'all 0.15s',
              }}>
                <span style={{ fontSize: 11 }}>{t.icon}</span>
                {t.label}
              </button>
            ))}
          </nav>

          {/* Status pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'var(--accent-light)', padding: '5px 12px', borderRadius: 20 }}>
            <div className="live-dot" />
            <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 500 }}>Live</span>
          </div>
        </div>
      </header>

      {/* ── Hero strip ── */}
      <div style={{
        background: 'linear-gradient(to right, #f0fdf4, #f8fafc)',
        borderBottom: '1px solid var(--border)',
        padding: '20px 28px',
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-1)', margin: 0 }}>
                Two-Way Interoperability Dashboard
              </h1>
              <p style={{ fontSize: 13, color: 'var(--text-3)', margin: '4px 0 0' }}>
                Propagates service requests between Karnataka's SWS and 40+ legacy department systems — automatically.
              </p>
            </div>

            {/* Flow pills */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              {[
                { icon: '🏛️', label: 'SWS' },
                null,
                { icon: '🏭', label: 'Factories' },
                null,
                { icon: '🏪', label: 'Shop Est.' },
                null,
                { icon: '🌿', label: 'KSPCB' },
              ].map((item, i) =>
                item === null
                  ? <svg key={i} width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  : <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      background: 'var(--surface)', border: '1px solid var(--border)',
                      borderRadius: 20, padding: '4px 12px', fontSize: 12, color: 'var(--text-2)',
                      boxShadow: 'var(--shadow-sm)',
                    }}>
                      <span>{item.icon}</span>
                      <span style={{ fontWeight: 500 }}>{item.label}</span>
                    </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Page body ── */}
      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 28px' }}>

        {tab === 'overview' && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <SystemStatus />
            <EventFeed />
          </div>
        )}

        {tab === 'try' && (
          <div className="fade-in">
            <ManualTrigger />
          </div>
        )}

        {tab === 'scenarios' && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <ConflictTrigger />
            <EventFeed />
          </div>
        )}

        {tab === 'advanced' && (
          <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <DLQPanel />
            <ReconciliationPanel />
          </div>
        )}
      </main>
    </div>
  )
}
