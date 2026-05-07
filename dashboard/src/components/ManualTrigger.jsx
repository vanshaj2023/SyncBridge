import React, { useState } from 'react'
import { api } from '../api'

const DEPTS = {
  sws:                { label: 'Single Window System', fields: ['registered_address','business_name','phone','authorized_signatory'], example: { registered_address: '42 Brigade Road, Bangalore', business_name: 'Acme Corp', phone: '+919876543210' } },
  factories:          { label: 'Dept. of Factories',   fields: ['factory_address','factory_name','contact_number','signatory_name'],   example: { factory_address: '100 Industrial Area, Peenya', factory_name: 'Acme Factory', contact_number: '9876543210' } },
  shop_establishment: { label: 'Shop & Establishment', fields: ['shop_address','shop_name','mobile','proprietor'],                     example: { shop_address: '5 Commercial Street', shop_name: 'Acme Shop', mobile: '9876543210' } },
  kspcb:              { label: 'Pollution Control',    fields: ['plant_address','unit_name','helpline','nodal_officer'],               example: { plant_address: '200 KIADB Area', unit_name: 'Acme Plant', helpline: '9876543210' } },
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

  const removeField = (k) => { const f = {...fields}; delete f[k]; setFields(f) }
  const addField    = () => { if (addKey.trim()) { setFields(f => ({...f, [addKey.trim()]: addVal})); setAddKey(''); setAddVal('') } }

  const send = async () => {
    const payload = Object.fromEntries(Object.entries(fields).filter(([,v]) => v !== ''))
    if (!Object.keys(payload).length) return
    setBusy(true); setSteps([]); setResult(null)

    const push = (msg) => setSteps(s => [...s, { msg, t: new Date().toLocaleTimeString() }])
    push(`Sending change from ${source.toUpperCase()}`)
    push(`UBID: ${ubid} — ${Object.keys(payload).length} field(s)`)

    try {
      const res = await api.trigger(source, ubid, payload)
      push(`Received by SyncBridge — queued for delivery`)
      push('Translating field names for each target...')
      await new Promise(r => setTimeout(r, 1600))
      const evts = await api.events()
      const match = evts.find(e => e.event_id === res.event_id)
      if (match) {
        const ok   = match.targets_delivered || []
        const fail = match.targets_failed    || []
        if (ok.length)     push(`Delivered to: ${ok.join(', ')}`)
        if (fail.length)   push(`Failed: ${fail.join(', ')}`)
        if (match.conflict) push(`Conflict resolved — ${match.conflict.winner} wins`)
        push('Audit trail saved')
        setResult(match)
      } else {
        push('Event queued — check Live Event Feed')
      }
    } catch (err) {
      push(`Error: ${err.message}`)
    }
    setBusy(false)
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>

      {/* Form */}
      <div className="card">
        <div className="card-header">
          <div className="section-title">Custom Sync Trigger</div>
          <div className="section-sub">Simulate a department update and watch SyncBridge propagate it</div>
        </div>
        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Step 1 */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>1 — Source department</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {Object.entries(DEPTS).map(([key, d]) => (
                <button key={key} onClick={() => { setSource(key); setFields({}) }} style={{
                  padding: '9px 12px', borderRadius: 7, cursor: 'pointer', textAlign: 'left',
                  border: `1px solid ${source === key ? 'var(--text-2)' : 'var(--border)'}`,
                  background: source === key ? 'var(--text-1)' : 'var(--surface)',
                  color: source === key ? '#fff' : 'var(--text-2)',
                  fontSize: 12, fontWeight: source === key ? 500 : 400,
                  transition: 'all 0.15s',
                }}>
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Step 2 */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>2 — Business ID (UBID)</div>
            <input className="input" value={ubid} onChange={e => setUbid(e.target.value)} placeholder="e.g. KA-2024-MFG-00123" style={{ fontFamily: 'monospace' }} />
            <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 5 }}>The common join key across all department systems</div>
          </div>

          {/* Step 3 */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>3 — Fields to update</div>
              <button onClick={() => setFields(dept.example)} className="btn btn-ghost" style={{ padding: '3px 9px', fontSize: 11 }}>Load example</button>
            </div>

            {Object.entries(fields).length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 8 }}>
                {Object.entries(fields).map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <div style={{ width: '38%', padding: '7px 10px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 5, fontSize: 11, color: 'var(--text-4)', fontFamily: 'monospace' }}>{k}</div>
                    <input className="input" value={v} onChange={e => setFields(f => ({...f, [k]: e.target.value}))} placeholder="value" style={{ fontFamily: 'monospace' }} />
                    <button onClick={() => removeField(k)} style={{ background: 'none', border: 'none', color: 'var(--text-4)', fontSize: 16, cursor: 'pointer', padding: '0 4px', lineHeight: 1 }}>×</button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: 6 }}>
              <select className="input" value={addKey} onChange={e => setAddKey(e.target.value)} style={{ flex: '0 0 44%', color: addKey ? 'var(--text-1)' : 'var(--text-4)' }}>
                <option value="">Select field...</option>
                {dept.fields.filter(f => !fields[f]).map(f => <option key={f} value={f}>{f}</option>)}
              </select>
              <input className="input" value={addVal} onChange={e => setAddVal(e.target.value)} placeholder="Value" onKeyDown={e => e.key === 'Enter' && addField()} />
              <button onClick={addField} className="btn btn-secondary" style={{ padding: '8px 12px' }}>Add</button>
            </div>
          </div>

          <button onClick={send} disabled={busy || !Object.values(fields).some(v => v)} className="btn btn-primary" style={{ width: '100%', padding: '10px', fontSize: 13 }}>
            {busy ? 'Sending...' : 'Send & Watch SyncBridge Work'}
          </button>
        </div>
      </div>

      {/* Trace */}
      <div className="card">
        <div className="card-header">
          <div className="section-title">Behind the Scenes</div>
          <div className="section-sub">Real-time trace of every step SyncBridge takes</div>
        </div>
        <div className="card-body">
          {steps.length === 0 && !result ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', border: '1px dashed var(--border)', borderRadius: 8 }}>
              <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 4 }}>Fill the form and click Send</div>
              <div style={{ fontSize: 12, color: 'var(--text-4)' }}>You'll see every step in real-time here</div>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: result ? 16 : 0 }}>
                {steps.map((s, i) => (
                  <div key={i} className="fade-in" style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, color: 'var(--text-3)', flexShrink: 0 }}>{i + 1}</div>
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--text-1)' }}>{s.msg}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-4)' }}>{s.t}</div>
                    </div>
                  </div>
                ))}
                {busy && (
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--surface-2)', border: '1px solid var(--border)', flexShrink: 0 }} />
                    <div style={{ fontSize: 12, color: 'var(--text-4)' }}>Processing...</div>
                  </div>
                )}
              </div>

              {result?.targets_delivered && (
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Result</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {Object.entries(DEPTS).filter(([k]) => k !== source).map(([k, d]) => {
                      const ok   = result.targets_delivered?.includes(k)
                      const fail = result.targets_failed?.includes(k)
                      return (
                        <div key={k} style={{ padding: '10px 12px', borderRadius: 7, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-1)', marginBottom: 4 }}>{d.label}</div>
                          <span className={`badge ${ok ? 'badge-green' : fail ? 'badge-red' : 'badge-gray'}`}>
                            {ok ? 'Updated' : fail ? 'Failed' : 'Skipped'}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                  {result.conflict && (
                    <div style={{ marginTop: 10, padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 7, border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-1)', marginBottom: 3 }}>Conflict resolved</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{result.conflict.reason}</div>
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
