import React, { useState } from 'react'
import { api } from '../api'

const DEPTS = {
  sws:                { label: 'Single Window System', icon: '🏛️', color: '#2563eb', fields: ['registered_address','business_name','phone','authorized_signatory'], example: { registered_address: '42 Brigade Road, Bangalore', business_name: 'Acme Corp Pvt Ltd', phone: '+919876543210' } },
  factories:          { label: 'Dept. of Factories',   icon: '🏭', color: '#7c3aed', fields: ['factory_address','factory_name','contact_number','signatory_name'],   example: { factory_address: '100 Industrial Area, Peenya', factory_name: 'Acme Factory', contact_number: '9876543210' } },
  shop_establishment: { label: 'Shop & Establishment', icon: '🏪', color: '#d97706', fields: ['shop_address','shop_name','mobile','proprietor'],                     example: { shop_address: '5 Commercial Street, MG Road', shop_name: 'Acme Shop', mobile: '9876543210' } },
  kspcb:              { label: 'Pollution Control',    icon: '🌿', color: '#16a34a', fields: ['plant_address','unit_name','helpline','nodal_officer'],               example: { plant_address: '200 KIADB Industrial Area', unit_name: 'Acme Plant', helpline: '9876543210' } },
}

export default function ManualTrigger() {
  const [source, setSource] = useState('sws')
  const [ubid, setUbid]     = useState('KA-2024-MFG-00123')
  const [fields, setFields] = useState({})
  const [addKey, setAddKey] = useState('')
  const [addVal, setAddVal] = useState('')
  const [steps, setSteps]   = useState([])
  const [result, setResult] = useState(null)
  const [busy, setBusy]     = useState(false)

  const dept = DEPTS[source]

  const addField = () => {
    if (addKey.trim()) {
      setFields(f => ({ ...f, [addKey.trim()]: addVal }))
      setAddKey(''); setAddVal('')
    }
  }

  const send = async () => {
    const payload = Object.fromEntries(Object.entries(fields).filter(([,v]) => v !== ''))
    if (!Object.keys(payload).length) return
    setBusy(true); setSteps([]); setResult(null)

    const push = (msg, color = '#64748b') =>
      setSteps(s => [...s, { msg, color, t: new Date().toLocaleTimeString('en-GB', { hour12: false }) }])

    push(`Sending change from ${source.toUpperCase()} via webhook`, '#2563eb')
    push(`UBID: ${ubid}`, '#64748b')
    push(`${Object.keys(payload).length} field(s): ${Object.keys(payload).join(', ')}`, '#64748b')

    try {
      const res = await api.trigger(source, ubid, payload)
      push(`Received by SyncBridge — Event ID: ${res.event_id?.slice(0,8)}…`, '#16a34a')
      push('Translating field names for each target schema…', '#d97706')
      push('Delivering to all connected departments…', '#7c3aed')

      await new Promise(r => setTimeout(r, 1800))
      const evts = await api.events()
      const match = evts.find(e => e.event_id === res.event_id)
      if (match) {
        const ok = match.targets_delivered || []
        const fail = match.targets_failed  || []
        if (ok.length)   push(`Delivered to: ${ok.join(', ')}`,  '#16a34a')
        if (fail.length) push(`Failed: ${fail.join(', ')}`,       '#dc2626')
        if (match.conflict) push(`Conflict resolved — ${match.conflict.winner} wins (${match.conflict.resolution_policy})`, '#7c3aed')
        push('Audit trail saved to MongoDB', '#94a3b8')
        setResult(match)
      } else {
        push('Event queued — check Live Event Feed', '#d97706')
        setResult(res)
      }
    } catch (err) {
      push(`Error: ${err.message}`, '#dc2626')
    }
    setBusy(false)
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>

      {/* ── Left: Form ── */}
      <div className="card">
        <div className="card-header">
          <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-1)' }}>✦ Custom Sync Trigger</h2>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3 }}>
            Simulate any department updating a business record. SyncBridge propagates it automatically.
          </p>
        </div>
        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Step 1: Source */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>1</span>
              Which department is making the change?
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {Object.entries(DEPTS).map(([key, d]) => (
                <div key={key} onClick={() => { setSource(key); setFields({}) }}
                  style={{
                    padding: '12px 14px', borderRadius: 9, cursor: 'pointer',
                    border: `1.5px solid ${source === key ? d.color : 'var(--border)'}`,
                    background: source === key ? `${d.color}08` : 'var(--surface)',
                    transition: 'all 0.15s',
                  }}>
                  <div style={{ fontSize: 18 }}>{d.icon}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: source === key ? d.color : 'var(--text-1)', marginTop: 6 }}>{d.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Step 2: UBID */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>2</span>
              Business ID (UBID)
            </div>
            <input className="input" value={ubid} onChange={e => setUbid(e.target.value)}
              placeholder="e.g. KA-2024-MFG-00123" style={{ fontFamily: 'monospace' }} />
            <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 5 }}>
              The Unique Business Identifier — same across all department systems
            </div>
          </div>

          {/* Step 3: Fields */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>3</span>
                Fields to update
              </div>
              <button onClick={() => setFields(dept.example)} className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 11 }}>
                Load example
              </button>
            </div>

            {/* Current fields */}
            {Object.entries(fields).length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
                {Object.entries(fields).map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <div style={{ width: '38%', padding: '7px 10px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, color: 'var(--text-3)', fontFamily: 'monospace' }}>{k}</div>
                    <input className="input" value={v} onChange={e => setFields(f => ({ ...f, [k]: e.target.value }))}
                      style={{ flex: 1, fontFamily: 'monospace' }} placeholder="value" />
                    <button onClick={() => { const f = {...fields}; delete f[k]; setFields(f) }}
                      style={{ background: 'none', border: 'none', color: 'var(--text-4)', fontSize: 16, cursor: 'pointer', padding: '0 4px' }}>×</button>
                  </div>
                ))}
              </div>
            )}

            {/* Add field row */}
            <div style={{ display: 'flex', gap: 6 }}>
              <select className="input" value={addKey} onChange={e => setAddKey(e.target.value)}
                style={{ flex: '0 0 46%', color: addKey ? 'var(--text-1)' : 'var(--text-4)' }}>
                <option value="">Select field…</option>
                {dept.fields.filter(f => !fields[f]).map(f => <option key={f} value={f}>{f}</option>)}
              </select>
              <input className="input" value={addVal} onChange={e => setAddVal(e.target.value)}
                placeholder="New value" onKeyDown={e => e.key === 'Enter' && addField()} style={{ flex: 1 }} />
              <button onClick={addField} className="btn btn-secondary" style={{ padding: '8px 12px', fontSize: 13 }}>+</button>
            </div>
          </div>

          {/* Send */}
          <button onClick={send} disabled={busy || !Object.values(fields).some(v => v)} className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '11px 20px', fontSize: 14, borderRadius: 9 }}>
            {busy ? '⏳ Sending…' : '🚀 Send & Watch SyncBridge Work'}
          </button>
        </div>
      </div>

      {/* ── Right: Trace ── */}
      <div className="card">
        <div className="card-header">
          <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-1)' }}>🔍 Behind the Scenes</h2>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3 }}>Real-time trace of every step SyncBridge takes</p>
        </div>
        <div className="card-body">
          {steps.length === 0 && !result ? (
            <div style={{ textAlign: 'center', padding: '52px 20px', border: '2px dashed var(--border)', borderRadius: 10 }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🔎</div>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-3)', marginBottom: 6 }}>Fill the form and click Send</div>
              <div style={{ fontSize: 12, color: 'var(--text-4)' }}>You'll see every step in real-time here</div>
            </div>
          ) : (
            <>
              {/* Steps */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                {steps.map((s, i) => (
                  <div key={i} className="slide-in" style={{ display: 'flex', gap: 10, alignItems: 'flex-start', animationDelay: `${i * 0.06}s` }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%', background: s.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, color: '#fff', fontWeight: 700, flexShrink: 0, marginTop: 1,
                    }}>{i + 1}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: 'var(--text-1)' }}>{s.msg}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-4)' }}>{s.t}</div>
                    </div>
                  </div>
                ))}
                {busy && (
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--border)', flexShrink: 0 }} />
                    <div style={{ fontSize: 12, color: 'var(--text-4)' }}>Processing…</div>
                  </div>
                )}
              </div>

              {/* Result grid */}
              {result?.targets_delivered && (
                <div style={{ background: 'var(--surface-2)', borderRadius: 10, padding: 16, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 12 }}>Final Result</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {Object.entries(DEPTS).filter(([k]) => k !== source).map(([k, d]) => {
                      const ok   = result.targets_delivered?.includes(k)
                      const fail = result.targets_failed?.includes(k)
                      return (
                        <div key={k} style={{
                          padding: '10px 12px', borderRadius: 8, background: 'var(--surface)',
                          border: `1px solid ${ok ? '#bbf7d0' : fail ? '#fecaca' : 'var(--border)'}`,
                        }}>
                          <div style={{ fontSize: 18 }}>{d.icon}</div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-1)', marginTop: 6 }}>{d.label}</div>
                          <div style={{ fontSize: 11, marginTop: 4, color: ok ? 'var(--accent)' : fail ? 'var(--red)' : 'var(--text-4)' }}>
                            {ok ? '✓ Updated' : fail ? '✗ Failed' : '— Skipped'}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  {result.conflict && (
                    <div style={{ marginTop: 12, padding: '10px 14px', background: '#faf5ff', borderRadius: 8, border: '1px solid #c4b5fd' }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#7c3aed' }}>⚡ Conflict Resolved</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>{result.conflict.reason}</div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
