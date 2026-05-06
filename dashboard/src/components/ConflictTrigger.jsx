import React, { useState } from 'react'
import { api } from '../api'

const UBID = 'KA-2024-MFG-00123'

const SCENARIOS = [
  {
    id: 'seed', icon: '🌱', label: 'Seed Test Business', color: '#2563eb',
    desc: 'Creates a fresh business record in all 4 systems with matching data.',
    steps: ['SWS receives business data', 'SyncBridge detects change via webhook', 'Translates and propagates to Factories, Shop Est., and KSPCB', 'All 4 departments now have the same record'],
    fires: [{ source: 'sws', payload: { registered_address: '12 MG Road Bengaluru', business_name: 'Acme Manufacturing Ltd', phone: '+919876543210', authorized_signatory: 'Ravi Kumar' } }],
  },
  {
    id: 'addr', icon: '⚡', label: 'Address Conflict', color: '#7c3aed',
    desc: 'SWS and Factories update the same address simultaneously — conflict detected.',
    steps: ['SWS sends "Brigade Road" as new address', 'Factories sends "MG Road" simultaneously', 'SyncBridge detects conflict (same UBID, same field, within 5s)', 'SWS_PRIORITY policy — SWS wins', 'All systems get SWS address. Conflict logged.'],
    fires: [{ source: 'sws', payload: { registered_address: 'Brigade Road Bengaluru (SWS)' } }, { source: 'factories', payload: { factory_address: 'MG Road Bengaluru (Factories)' } }],
  },
  {
    id: 'sign', icon: '⚡', label: 'Signatory Conflict', color: '#be185d',
    desc: 'Two departments try to update the authorised signatory at the same time.',
    steps: ['SWS submits "SWS Officer" as authorised signatory', 'Factories submits "Factories Officer" simultaneously', 'Conflict detected on the signatory field', 'SWS wins — propagated everywhere', 'Factories version rejected and logged'],
    fires: [{ source: 'sws', payload: { authorized_signatory: 'Ravi Kumar (SWS)' } }, { source: 'factories', payload: { signatory_name: 'Suresh Menon (Factories)' } }],
  },
  {
    id: 'dept', icon: '🏭', label: 'Factory → SWS Sync', color: '#16a34a',
    desc: 'A change made directly in Factories propagates upstream to SWS automatically.',
    steps: ['Factories updates signatory directly (bypassing SWS)', 'SyncBridge picks it up via webhook', 'Translates signatory_name → authorized_signatory', 'Writes to SWS, Shop Est., and KSPCB', 'All systems stay in sync automatically'],
    fires: [{ source: 'factories', payload: { signatory_name: 'Suresh Menon (Updated in Factories)' } }],
  },
]

export default function ConflictTrigger() {
  const [open, setOpen]     = useState(null)
  const [busy, setBusy]     = useState(null)
  const [log, setLog]       = useState([])

  const fire = async (s) => {
    setBusy(s.id)
    try {
      const results = await Promise.all(s.fires.map(({ source, payload }) => api.trigger(source, UBID, payload)))
      setLog(prev => [{ time: new Date().toLocaleTimeString('en-GB', { hour12: false }), label: s.label, icon: s.icon, ok: results.every(r => r.event_id) }, ...prev.slice(0, 4)])
    } finally {
      setBusy(null)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Info banner */}
      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '14px 18px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <span style={{ fontSize: 20 }}>💡</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#14532d' }}>How to use these scenarios</div>
          <div style={{ fontSize: 12, color: '#166534', marginTop: 2 }}>Click a scenario to trigger it, then click <strong>"What happens?"</strong> to understand each step. Watch the Live Event Feed below to see real results.</div>
        </div>
      </div>

      {/* Scenario cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {SCENARIOS.map(s => (
          <div key={s.id} className="card" style={{ overflow: 'hidden', transition: 'box-shadow 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-lg)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}>

            {/* Color top bar */}
            <div style={{ height: 4, background: s.color }} />

            <div style={{ padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 16, marginBottom: 4 }}>{s.icon}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)' }}>{s.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3 }}>{s.desc}</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => fire(s)} disabled={busy === s.id} className="btn"
                  style={{ flex: 1, justifyContent: 'center', background: busy === s.id ? 'var(--surface-2)' : s.color, color: busy === s.id ? 'var(--text-3)' : '#fff', border: 'none', borderRadius: 7, fontSize: 13 }}>
                  {busy === s.id ? '⏳ Triggering…' : '▶ Run Scenario'}
                </button>
                <button onClick={() => setOpen(open === s.id ? null : s.id)} className="btn btn-ghost" style={{ padding: '8px 12px', fontSize: 12 }}>
                  {open === s.id ? 'Hide' : 'Steps'}
                </button>
              </div>

              {/* Steps expansion */}
              {open === s.id && (
                <div className="fade-in" style={{ marginTop: 12, padding: '12px 14px', background: 'var(--surface-2)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>What happens</div>
                  {s.steps.map((step, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 6 }}>
                      <div style={{
                        width: 18, height: 18, borderRadius: '50%', background: s.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, color: '#fff', fontWeight: 700, flexShrink: 0, marginTop: 1,
                      }}>{i + 1}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{step}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Activity log */}
      {log.length > 0 && (
        <div className="card">
          <div className="card-header">
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)' }}>Recent Activity</div>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {log.map((l, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '6px 0', borderBottom: i < log.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <span style={{ fontSize: 16 }}>{l.icon}</span>
                <span style={{ fontSize: 13, color: 'var(--text-1)', fontWeight: 500 }}>{l.label}</span>
                <span className={`badge ${l.ok ? 'badge-green' : 'badge-red'}`}>{l.ok ? 'Queued' : 'Error'}</span>
                <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-4)' }}>{l.time}</span>
              </div>
            ))}
            <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 4 }}>↓ See Live Event Feed below for full results</div>
          </div>
        </div>
      )}
    </div>
  )
}
