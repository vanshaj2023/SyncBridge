import React, { useState } from 'react'
import SystemStatus from './components/SystemStatus'
import EventFeed from './components/EventFeed'
import ManualTrigger from './components/ManualTrigger'
import ConflictTrigger from './components/ConflictTrigger'
import DLQPanel from './components/DLQPanel'
import ReconciliationPanel from './components/ReconciliationPanel'

export default function App() {
  const [activeTab, setActiveTab] = useState('overview')

  const tabs = [
    { id: 'overview',      label: '🏠 Overview' },
    { id: 'manual',        label: '✏️ Try It Yourself' },
    { id: 'scenarios',     label: '⚡ Demo Scenarios' },
    { id: 'advanced',      label: '🔧 Advanced' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ background: '#1e293b', borderBottom: '1px solid #334155', padding: '16px 24px' }}>
        <div style={{ maxWidth: 1300, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ color: '#38bdf8', fontSize: 22, fontWeight: 700, margin: 0 }}>
              ⚡ SyncBridge
            </h1>
            <p style={{ color: '#64748b', fontSize: 12, margin: '2px 0 0' }}>
              Two-way interoperability for Karnataka's Single Window System ↔ Legacy Department Systems
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['SWS', 'Factories', 'Shop Est.', 'KSPCB'].map(d => (
              <span key={d} style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 20, padding: '3px 10px', fontSize: 11, color: '#94a3b8' }}>
                {d}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* How it works banner */}
      <div style={{ background: '#0c1a2e', borderBottom: '1px solid #1e3a5f', padding: '12px 24px' }}>
        <div style={{ maxWidth: 1300, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: '#475569', marginRight: 4 }}>HOW IT WORKS:</span>
          {[
            { icon: '🏛️', text: 'Business updates address in SWS' },
            { icon: '→' },
            { icon: '🔄', text: 'SyncBridge detects change' },
            { icon: '→' },
            { icon: '🔀', text: 'Translates field names' },
            { icon: '→' },
            { icon: '✅', text: 'Updates all 3 dept systems automatically' },
          ].map((step, i) => (
            step.icon === '→'
              ? <span key={i} style={{ color: '#334155', fontSize: 14 }}>→</span>
              : <span key={i} style={{ fontSize: 11, color: '#94a3b8', background: '#1e293b', padding: '3px 8px', borderRadius: 4 }}>
                  {step.icon} {step.text}
                </span>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: '#1e293b', borderBottom: '1px solid #334155' }}>
        <div style={{ maxWidth: 1300, margin: '0 auto', display: 'flex', gap: 0 }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              padding: '12px 20px', border: 'none', cursor: 'pointer', fontSize: 13,
              background: activeTab === tab.id ? '#0f172a' : 'transparent',
              color: activeTab === tab.id ? '#38bdf8' : '#64748b',
              borderBottom: activeTab === tab.id ? '2px solid #38bdf8' : '2px solid transparent',
              fontWeight: activeTab === tab.id ? 600 : 400,
              transition: 'all 0.15s',
            }}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: 1300, margin: '0 auto', padding: '20px 24px' }}>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div>
            <SystemStatus />
            <div style={{ marginTop: 20 }}>
              <EventFeed />
            </div>
          </div>
        )}

        {/* MANUAL TRIGGER TAB */}
        {activeTab === 'manual' && <ManualTrigger />}

        {/* DEMO SCENARIOS TAB */}
        {activeTab === 'scenarios' && (
          <div>
            <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 10, padding: 20, marginBottom: 20 }}>
              <h2 style={{ color: '#38bdf8', fontSize: 16, margin: '0 0 6px' }}>Pre-built Demo Scenarios</h2>
              <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>
                Click any scenario below to trigger it. Watch the Live Event Feed on the Overview tab to see what happens.
              </p>
            </div>
            <ConflictTrigger />
            <div style={{ marginTop: 20 }}>
              <EventFeed />
            </div>
          </div>
        )}

        {/* ADVANCED TAB */}
        {activeTab === 'advanced' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <DLQPanel />
            <ReconciliationPanel />
          </div>
        )}
      </div>
    </div>
  )
}
