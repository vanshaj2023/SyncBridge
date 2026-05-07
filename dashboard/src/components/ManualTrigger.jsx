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
      push('Received by SyncBridge — queued for delivery')
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
        push('Audit trail saved to MongoDB')
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
      <section className="card">
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>Custom Sync Trigger</h2>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>Simulate a department update and watch SyncBridge propagate it live</p>
        </div>

        <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Step 1 */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>1 — Source department</div>
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
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>2 — Business ID (UBID)</div>
            <input className="input" value={ubid} onChange={e => setUbid(e.target.value)} placeholder="e.g. KA-2024-MFG-00123" style={{ fontFamily: 'monospace', fontSize: 12 }} />
            <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 5 }}>Common join key across all 4 department systems</div>
          </div>

          {/* Step 3 */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>3 — Fields to update</div>
              <button onClick={() => setFields(dept.example)} className="btn btn-ghost" style={{ padding: '3px 9px', fontSize: 11 }}>Load example</button>
            </div>

            {/* Added fields */}
            {Object.entries(fields).length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 8 }}>
                {Object.entries(fields).map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <div style={{ width: '38%', padding: '7px 10px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 5, fontSize: 11, color: 'var(--text-3)', fontFamily: 'monospace' }}>{k}</div>
                    <input className="input" value={v} onChange={e => setFields(f => ({...f, [k]: e.target.value}))} placeholder="value" style={{ fontFamily: 'monospace', fontSize: 12 }} />
                    <button onClick={() => removeField(k)} style={{ background: 'none', border: 'none', color: 'var(--text-4)', fontSize: 18, cursor: 'pointer', padding: '0 4px', lineHeight: 1, flexShrink: 0 }}>×</button>
                  </div>
                ))}
              </div>
            )}

            {/* Inline add — selecting a field immediately adds it */}
            {dept.fields.some(f => !fields[f]) && (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '8px 10px', border: '1px dashed var(--border)', borderRadius: 7, background: 'var(--surface-2)' }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
                  <path d="M6 1v10M1 6h10" stroke="var(--text-4)" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <select className="input" value={addKey} onChange={e => {
                  const key = e.target.value
                  setAddKey(key)
                  if (key) setFields(f => ({ ...f, [key]: '' }))
                  setAddVal('')
                }} style={{ border: 'none', background: 'transparent', padding: '0', fontSize: 12, color: addKey ? 'var(--text-1)' : 'var(--text-4)', boxShadow: 'none', flex: 1 }}>
                  <option value="">Add a field to update...</option>
                  {dept.fields.filter(f => !fields[f]).map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            )}
          </div>

          <button onClick={send} disabled={busy || !Object.values(fields).some(v => v)} className="btn btn-primary" style={{ width: '100%', padding: '11px', fontSize: 13 }}>
            {busy ? 'Sending...' : 'Send & Watch SyncBridge Work'}
          </button>
        </div>
      </section>

      {/* Trace */}
      <section className="card">
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>Behind the Scenes</h2>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>Every step SyncBridge takes, in real-time</p>
        </div>

        <div style={{ padding: '20px 22px' }}>
          {steps.length === 0 && !result ? (
            <div style={{ textAlign: 'center', padding: '52px 20px' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3v5l3 3" stroke="var(--border-2)" strokeWidth="1.5" strokeLinecap="round"/><circle cx="8" cy="8" r="6" stroke="var(--border-2)" strokeWidth="1.5"/></svg>
              </div>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)', marginBottom: 4 }}>Waiting for a sync</div>
              <div style={{ fontSize: 12, color: 'var(--text-4)' }}>Fill the form and click Send</div>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: result ? 20 : 0 }}>
                {steps.map((s, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--surface-2)', border: '1px solid var(--border-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, color: 'var(--text-3)', flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-1)' }}>{s.msg}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-4)', marginTop: 1 }}>{s.t}</div>
                    </div>
                  </div>
                ))}
                {busy && (
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--surface-2)', border: '1px solid var(--border)', flexShrink: 0 }} />
                    <div style={{ fontSize: 12, color: 'var(--text-4)' }}>Processing...</div>
                  </div>
                )}
              </div>

              {result?.targets_delivered && (
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 18 }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>Delivery result</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {Object.entries(DEPTS).filter(([k]) => k !== source).map(([k, d]) => {
                      const ok   = result.targets_delivered?.includes(k)
                      const fail = result.targets_failed?.includes(k)
                      return (
                        <div key={k} style={{ padding: '11px 13px', borderRadius: 8, background: 'var(--surface-2)', border: `1px solid ${ok ? 'var(--green-bd)' : fail ? 'var(--red-bd)' : 'var(--border)'}` }}>
                          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-1)', marginBottom: 5 }}>{d.label}</div>
                          <span className={`badge ${ok ? 'badge-green' : fail ? 'badge-red' : 'badge-gray'}`}>
                            {ok ? 'Updated' : fail ? 'Failed' : 'Skipped'}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                  {result.conflict && (
                    <div style={{ marginTop: 10, padding: '11px 13px', background: 'var(--surface-2)', borderRadius: 8, border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)', marginBottom: 3 }}>Conflict resolved</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{result.conflict.reason}</div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  )
}
