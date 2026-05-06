import React, { useState } from 'react'
import { api } from '../api'

const UBID = 'KA-2024-MFG-00123'

const scenarios = [
  {
    id: 'seed',
    label: '🌱 Seed Test Business',
    color: '#0369a1',
    desc: 'Creates a fresh business record in all 4 systems with the same data — your starting point.',
    whatHappens: [
      'SWS receives business data',
      'SyncBridge propagates to Factories, Shop Establishment, and KSPCB',
      'All 4 departments now have the same record for UBID ' + UBID,
    ],
    fires: [
      { source: 'sws', payload: { registered_address: '12 MG Road Bengaluru', business_name: 'Acme Manufacturing', phone: '+919876543210', authorized_signatory: 'Ravi Kumar' } },
    ],
  },
  {
    id: 'addr-conflict',
    label: '⚡ Trigger Address Conflict',
    color: '#7c3aed',
    desc: 'Simulates SWS and Factories both updating the address at the same time.',
    whatHappens: [
      'SWS sends "Brigade Road" as the new address',
      'Factories sends "MG Road" as the new address — simultaneously',
      'SyncBridge detects the conflict (same UBID, same field, within 5 seconds)',
      'SWS_PRIORITY policy kicks in — SWS wins',
      'All systems get the SWS address. Conflict is logged in audit trail.',
    ],
    fires: [
      { source: 'sws',       payload: { registered_address: 'Brigade Road, Bengaluru (SWS Version)' } },
      { source: 'factories', payload: { factory_address:    'MG Road, Bengaluru (Factories Version)' } },
    ],
  },
  {
    id: 'sig-conflict',
    label: '⚡ Trigger Signatory Conflict',
    color: '#be185d',
    desc: 'Both SWS and Factories try to update the authorised signatory at the same time.',
    whatHappens: [
      'SWS submits "SWS Officer" as the authorised signatory',
      'Factories submits "Factories Officer" simultaneously',
      'Conflict detected on the signatory field',
      'SWS wins — "SWS Officer" is propagated everywhere',
      'Audit log records why Factories version was rejected',
    ],
    fires: [
      { source: 'sws',       payload: { authorized_signatory: 'SWS Officer (Ravi Kumar)' } },
      { source: 'factories', payload: { signatory_name:       'Factories Officer (Suresh M)' } },
    ],
  },
  {
    id: 'dept-update',
    label: '🏭 Factory Updates Signatory',
    color: '#065f46',
    desc: 'Simulates a change made directly inside Factories — not through SWS.',
    whatHappens: [
      'Factories dept directly updates the authorised signatory',
      'SyncBridge picks it up via webhook',
      'Translates "signatory_name" → "authorized_signatory" (SWS field name)',
      'Writes the update to SWS, Shop Establishment, and KSPCB',
      'All systems stay in sync without anyone manually updating them',
    ],
    fires: [
      { source: 'factories', payload: { signatory_name: 'Suresh Menon (Updated in Factories)' } },
    ],
  },
]

export default function ConflictTrigger() {
  const [log, setLog]         = useState([])
  const [loading, setLoading] = useState(null)
  const [selected, setSelected] = useState(null)

  const fire = async (scenario) => {
    setLoading(scenario.id)
    try {
      const results = await Promise.all(
        scenario.fires.map(({ source, payload }) => api.trigger(source, UBID, payload))
      )
      setLog(prev => [{
        time: new Date().toLocaleTimeString(),
        label: scenario.label,
        results,
      }, ...prev.slice(0, 4)])
    } finally {
      setLoading(null)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      <div style={{ background: '#1e293b', borderRadius: 10, border: '1px solid #334155', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #334155', background: '#162032' }}>
          <h2 style={{ color: '#e2e8f0', fontSize: 16, margin: 0, fontWeight: 600 }}>⚡ Pre-built Demo Scenarios</h2>
          <p style={{ color: '#64748b', fontSize: 12, margin: '4px 0 0' }}>
            Click a scenario to trigger it. Hover or click for details on what happens.
          </p>
        </div>
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {scenarios.map(s => (
            <div key={s.id}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'stretch' }}>
                <button onClick={() => fire(s)} disabled={loading === s.id}
                  style={{
                    flex: 1, background: loading === s.id ? '#334155' : s.color,
                    color: '#fff', border: 'none', borderRadius: 8,
                    padding: '12px 16px', cursor: loading === s.id ? 'not-allowed' : 'pointer',
                    fontSize: 14, fontWeight: 600, textAlign: 'left', transition: 'background 0.15s',
                  }}>
                  {loading === s.id ? '⏳ Triggering...' : s.label}
                  <div style={{ fontSize: 11, fontWeight: 400, color: 'rgba(255,255,255,0.7)', marginTop: 3 }}>
                    {s.desc}
                  </div>
                </button>
                <button onClick={() => setSelected(selected === s.id ? null : s.id)}
                  style={{
                    background: '#0f172a', border: '1px solid #334155', borderRadius: 8,
                    color: '#64748b', fontSize: 12, padding: '8px 14px', cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}>
                  {selected === s.id ? '▲ Hide' : '▼ What happens?'}
                </button>
              </div>

              {selected === s.id && (
                <div style={{ background: '#0f172a', borderRadius: 8, padding: 14, marginTop: 6, border: '1px solid #334155' }}>
                  <div style={{ color: '#94a3b8', fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Step by step:</div>
                  {s.whatHappens.map((step, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 6 }}>
                      <div style={{
                        width: 18, height: 18, borderRadius: '50%', background: s.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, color: '#fff', fontWeight: 700, flexShrink: 0, marginTop: 1,
                      }}>{i + 1}</div>
                      <div style={{ color: '#cbd5e1', fontSize: 12 }}>{step}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Activity log */}
      {log.length > 0 && (
        <div style={{ background: '#1e293b', borderRadius: 10, border: '1px solid #334155', padding: 16 }}>
          <div style={{ color: '#94a3b8', fontSize: 12, fontWeight: 600, marginBottom: 10 }}>Recent Activity</div>
          {log.map((l, i) => (
            <div key={i} style={{ fontSize: 12, color: '#64748b', marginBottom: 6, display: 'flex', gap: 8 }}>
              <span style={{ color: '#475569' }}>[{l.time}]</span>
              <span style={{ color: '#94a3b8' }}>{l.label}</span>
              <span>→ {l.results.map(r => r.event_id ? '✅ queued' : '❌ error').join(', ')}</span>
            </div>
          ))}
          <div style={{ color: '#475569', fontSize: 11, marginTop: 8 }}>
            ↓ Check Live Event Feed below to see results
          </div>
        </div>
      )}
    </div>
  )
}
