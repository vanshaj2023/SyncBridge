import React, { useState } from 'react'
import { api } from '../api'

const UBID = 'KA-2024-MFG-00123'

const SCENARIOS = [
  {
    id: 'seed', label: 'Seed Test Business',
    desc: 'Creates a matching business record across all 4 departments.',
    steps: ['SWS receives the business data', 'SyncBridge detects the change via webhook', 'Translates and propagates to Factories, Shop Est., KSPCB', 'All 4 departments now share the same record'],
    fires: [{ source: 'sws', payload: { registered_address: '12 MG Road Bengaluru', business_name: 'Acme Manufacturing Ltd', phone: '+919876543210', authorized_signatory: 'Ravi Kumar' } }],
  },
  {
    id: 'addr', label: 'Address Conflict',
    desc: 'SWS and Factories update the same address simultaneously.',
    steps: ['SWS sends "Brigade Road" as new address', 'Factories sends "MG Road" at the same time', 'SyncBridge detects the conflict (same UBID, same field, within 5s)', 'SWS_PRIORITY policy — SWS wins', 'All systems receive the SWS address. Conflict is logged.'],
    fires: [{ source: 'sws', payload: { registered_address: 'Brigade Road, Bengaluru' } }, { source: 'factories', payload: { factory_address: 'MG Road, Bengaluru' } }],
  },
  {
    id: 'sign', label: 'Signatory Conflict',
    desc: 'SWS and Factories update the authorised signatory simultaneously.',
    steps: ['SWS submits "Ravi Kumar" as signatory', 'Factories submits "Suresh Menon" at the same time', 'Conflict detected on the signatory field', 'SWS wins — propagated to all departments', 'Factories version rejected and audit logged'],
    fires: [{ source: 'sws', payload: { authorized_signatory: 'Ravi Kumar' } }, { source: 'factories', payload: { signatory_name: 'Suresh Menon' } }],
  },
  {
    id: 'dept', label: 'Factory Updates Signatory',
    desc: 'A change in Factories propagates back to SWS and other departments.',
    steps: ['Factories updates signatory directly — not through SWS', 'SyncBridge detects it via webhook', 'Translates signatory_name to authorized_signatory', 'Writes to SWS, Shop Est., and KSPCB', 'All systems stay in sync automatically'],
    fires: [{ source: 'factories', payload: { signatory_name: 'Suresh Menon' } }],
  },
]

export default function ConflictTrigger() {
  const [open, setOpen] = useState(null)
  const [busy, setBusy] = useState(null)
  const [log, setLog]   = useState([])

  const fire = async (s) => {
    setBusy(s.id)
    try {
      const results = await Promise.all(s.fires.map(({ source, payload }) => api.trigger(source, UBID, payload)))
      setLog(prev => [{ t: new Date().toLocaleTimeString(), label: s.label, ok: results.every(r => r.event_id) }, ...prev.slice(0, 4)])
    } finally {
      setBusy(null)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      <div>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>Demo Scenarios</h2>
        <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>Pre-built scenarios to demonstrate SyncBridge capabilities — UBID: <span style={{ fontFamily: 'monospace' }}>{UBID}</span></p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {SCENARIOS.map(s => (
          <div key={s.id} className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '16px 18px', borderBottom: open === s.id ? '1px solid var(--border)' : 'none' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', letterSpacing: '-0.01em', marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 14, lineHeight: 1.5 }}>{s.desc}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => fire(s)} disabled={busy === s.id} className="btn btn-primary" style={{ flex: 1, fontSize: 12, padding: '7px 12px' }}>
                  {busy === s.id ? 'Running...' : 'Run Scenario'}
                </button>
                <button onClick={() => setOpen(open === s.id ? null : s.id)} className="btn btn-ghost" style={{ fontSize: 12, padding: '7px 12px' }}>
                  {open === s.id ? 'Hide' : 'How it works'}
                </button>
              </div>
            </div>

            {open === s.id && (
              <div style={{ padding: '14px 18px', background: 'var(--surface-2)' }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Execution steps</div>
                {s.steps.map((step, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: i < s.steps.length - 1 ? 8 : 0 }}>
                    <div style={{
                      width: 18, height: 18, borderRadius: '50%',
                      background: 'var(--surface)', border: '1px solid var(--border-2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 9, fontWeight: 600, color: 'var(--text-3)', flexShrink: 0, marginTop: 1,
                    }}>{i + 1}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>{step}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {log.length > 0 && (
        <section className="card">
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>Activity</div>
            <span className="badge badge-gray">{log.length}</span>
          </div>
          <div style={{ padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {log.map((l, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: i < log.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-1)' }}>{l.label}</span>
                <span className={`badge ${l.ok ? 'badge-green' : 'badge-red'}`}>{l.ok ? 'Queued' : 'Error'}</span>
                <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-4)' }}>{l.t}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
