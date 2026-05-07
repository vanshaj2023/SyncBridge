import React, { useState } from 'react'
import SystemStatus from './components/SystemStatus'
import EventFeed from './components/EventFeed'
import ManualTrigger from './components/ManualTrigger'
import ConflictTrigger from './components/ConflictTrigger'
import DLQPanel from './components/DLQPanel'
import ReconciliationPanel from './components/ReconciliationPanel'

const TABS = [
  { id: 'overview',  label: 'Overview'        },
  { id: 'try',       label: 'Try It Yourself'  },
  { id: 'scenarios', label: 'Scenarios'        },
  { id: 'advanced',  label: 'Advanced'         },
]

export default function App() {
  const [tab, setTab] = useState('overview')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* ── Dark Navigation ── */}
      <header style={{
        background: 'var(--nav-bg)',
        borderBottom: '1px solid var(--nav-border)',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 28px', height: 56, display: 'flex', alignItems: 'center', gap: 0 }}>

          {/* Logo mark */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 36 }}>
            <div style={{
              width: 26, height: 26, borderRadius: 6,
              background: 'linear-gradient(135deg, #16a34a, #15803d)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M1 6h10M6 1l5 5-5 5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#fff', letterSpacing: '-0.02em' }}>SyncBridge</span>
            <span style={{ color: '#3f3f46', fontSize: 13, marginLeft: 2 }}>/</span>
            <span style={{ fontSize: 12, color: '#71717a' }}>Karnataka</span>
          </div>

          {/* Tabs */}
          <nav style={{ display: 'flex', gap: 2, flex: 1 }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                padding: '6px 13px', border: 'none', borderRadius: 6,
                fontSize: 13, fontWeight: 400, cursor: 'pointer',
                background: tab === t.id ? '#18181b' : 'transparent',
                color: tab === t.id ? '#fff' : '#71717a',
                transition: 'all 0.15s',
              }}>
                {t.label}
              </button>
            ))}
          </nav>

          {/* Live badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '4px 10px', borderRadius: 20, border: '1px solid #1f1f1f' }}>
            <div className="live-dot" />
            <span style={{ fontSize: 11, color: '#a1a1aa', fontWeight: 500 }}>Live</span>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 28px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24 }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.03em', lineHeight: 1.15 }}>
                Interoperability Dashboard
              </h1>
              <p style={{ fontSize: 14, color: 'var(--text-3)', marginTop: 6, lineHeight: 1.6, maxWidth: 480 }}>
                Two-way sync between Karnataka's Single Window System and 40+ legacy department systems — automatic, auditable, conflict-aware.
              </p>
            </div>

            {/* Flow diagram */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 0, flexShrink: 0 }}>
              {[
                { name: 'SWS', sub: 'Single Window' },
                null,
                { name: 'Factories', sub: 'Dept. system' },
                null,
                { name: 'Shop Est.', sub: 'Dept. system' },
                null,
                { name: 'KSPCB', sub: 'Dept. system' },
              ].map((item, i) => item === null ? (
                <svg key={i} width="28" height="16" viewBox="0 0 28 16" fill="none" style={{ flexShrink: 0 }}>
                  <path d="M4 8h20M18 3l6 5-6 5" stroke="var(--border-2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <div key={i} style={{
                  padding: '8px 14px', background: 'var(--surface-2)',
                  border: '1px solid var(--border)', borderRadius: 8,
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)' }}>{item.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-4)', marginTop: 1 }}>{item.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '28px' }}>
        {tab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="fade-up"><SystemStatus /></div>
            <div className="fade-up-1"><EventFeed /></div>
          </div>
        )}
        {tab === 'try' && <div className="fade-up"><ManualTrigger /></div>}
        {tab === 'scenarios' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="fade-up"><ConflictTrigger /></div>
            <div className="fade-up-1"><EventFeed /></div>
          </div>
        )}
        {tab === 'advanced' && (
          <div className="fade-up" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <DLQPanel />
            <ReconciliationPanel />
          </div>
        )}
      </main>
    </div>
  )
}
