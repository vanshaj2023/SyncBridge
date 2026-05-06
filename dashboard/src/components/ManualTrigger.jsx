import React, { useState } from 'react'
import { api } from '../api'

const DEPT_FIELDS = {
  sws:                ['registered_address', 'business_name', 'phone', 'authorized_signatory'],
  factories:          ['factory_address', 'factory_name', 'contact_number', 'signatory_name'],
  shop_establishment: ['shop_address', 'shop_name', 'mobile', 'proprietor'],
  kspcb:              ['plant_address', 'unit_name', 'helpline', 'nodal_officer'],
}

const DEPT_ICON = { sws: '🏛️', factories: '🏭', shop_establishment: '🏪', kspcb: '🌿' }
const DEPT_DESC = {
  sws:                'Main government business registry',
  factories:          'Department of Factories & Boilers',
  shop_establishment: 'Shop & Establishment Act',
  kspcb:              'Karnataka Pollution Control Board',
}

const EXAMPLE_PAYLOADS = {
  sws: { registered_address: '42 Brigade Road, Bangalore', business_name: 'Acme Corp', phone: '+919876543210' },
  factories: { factory_address: '100 Industrial Area, Peenya', factory_name: 'Acme Factory', contact_number: '9876543210' },
  shop_establishment: { shop_address: '5 Commercial Street', shop_name: 'Acme Shop', mobile: '9876543210' },
  kspcb: { plant_address: '200 KIADB Area', unit_name: 'Acme Plant', helpline: '9876543210' },
}

export default function ManualTrigger() {
  const [source, setSource]     = useState('sws')
  const [ubid, setUbid]         = useState('KA-2024-MFG-00123')
  const [fields, setFields]     = useState({ registered_address: '', business_name: '', phone: '' })
  const [customField, setCustomField] = useState('')
  const [customValue, setCustomValue] = useState('')
  const [result, setResult]     = useState(null)
  const [loading, setLoading]   = useState(false)
  const [steps, setSteps]       = useState([])

  const addField = () => {
    if (customField.trim()) {
      setFields(f => ({ ...f, [customField.trim()]: customValue }))
      setCustomField('')
      setCustomValue('')
    }
  }

  const removeField = (key) => {
    const f = { ...fields }
    delete f[key]
    setFields(f)
  }

  const loadExample = () => {
    setFields(EXAMPLE_PAYLOADS[source] || {})
  }

  const send = async () => {
    const payload = Object.fromEntries(Object.entries(fields).filter(([,v]) => v !== ''))
    if (!Object.keys(payload).length) return
    setLoading(true)
    setResult(null)
    setSteps([])

    const addStep = (msg, color = '#64748b') =>
      setSteps(s => [...s, { msg, color, time: new Date().toLocaleTimeString() }])

    addStep(`📤 Sending change from ${source.toUpperCase()}...`, '#818cf8')
    addStep(`🔑 UBID: ${ubid}`, '#64748b')
    addStep(`📋 Fields: ${Object.entries(payload).map(([k,v]) => `${k}="${v}"`).join(', ')}`, '#64748b')

    try {
      const res = await api.trigger(source, ubid, payload)
      addStep(`✅ SyncBridge received the event (ID: ${res.event_id || '—'})`, '#22c55e')
      addStep(`🔄 Translating field names for each target department...`, '#fb923c')
      addStep(`📡 Delivering to all departments with UBID ${ubid}...`, '#34d399')

      await new Promise(r => setTimeout(r, 1500))
      const events = await api.events()
      const match = events.find(e => e.event_id === res.event_id)
      if (match) {
        const delivered = match.targets_delivered || []
        const failed    = match.targets_failed    || []
        if (delivered.length) addStep(`✅ Delivered to: ${delivered.join(', ')}`, '#22c55e')
        if (failed.length)    addStep(`❌ Failed: ${failed.join(', ')}`, '#ef4444')
        if (match.conflict)   addStep(`⚡ Conflict detected! ${match.conflict.winner} won (${match.conflict.resolution_policy})`, '#c084fc')
        addStep(`📝 Audit trail saved to MongoDB`, '#64748b')
        setResult(match)
      } else {
        addStep('⏳ Event queued — check Live Event Feed in a moment', '#f59e0b')
        setResult(res)
      }
    } catch (e) {
      addStep(`❌ Error: ${e.message}`, '#ef4444')
    }
    setLoading(false)
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>

      {/* LEFT: Input form */}
      <div style={{ background: '#1e293b', borderRadius: 10, border: '1px solid #334155', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #334155', background: '#162032' }}>
          <h2 style={{ color: '#e2e8f0', fontSize: 16, margin: 0, fontWeight: 600 }}>✏️ Trigger a Custom Sync</h2>
          <p style={{ color: '#64748b', fontSize: 12, margin: '4px 0 0' }}>
            Simulate a real department changing a business record. SyncBridge will propagate it automatically.
          </p>
        </div>

        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Source dept */}
          <div>
            <label style={{ color: '#94a3b8', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 8 }}>
              1. Which department is making the change?
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {Object.keys(DEPT_FIELDS).map(dept => (
                <div key={dept} onClick={() => { setSource(dept); setFields({}) }}
                  style={{
                    padding: '10px 12px', borderRadius: 6, cursor: 'pointer',
                    border: `1px solid ${source === dept ? '#38bdf8' : '#334155'}`,
                    background: source === dept ? '#0c2d4a' : '#0f172a',
                    transition: 'all 0.15s',
                  }}>
                  <div style={{ fontSize: 16 }}>{DEPT_ICON[dept]}</div>
                  <div style={{ color: source === dept ? '#38bdf8' : '#e2e8f0', fontSize: 12, fontWeight: 600, marginTop: 4 }}>
                    {dept.replace(/_/g, ' ').toUpperCase()}
                  </div>
                  <div style={{ color: '#475569', fontSize: 10, marginTop: 2 }}>{DEPT_DESC[dept]}</div>
                </div>
              ))}
            </div>
          </div>

          {/* UBID */}
          <div>
            <label style={{ color: '#94a3b8', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>
              2. Business ID (UBID)
            </label>
            <input value={ubid} onChange={e => setUbid(e.target.value)}
              style={{
                width: '100%', padding: '8px 12px', background: '#0f172a',
                border: '1px solid #334155', borderRadius: 6, color: '#e2e8f0',
                fontSize: 13, fontFamily: 'monospace', boxSizing: 'border-box',
              }}
              placeholder="e.g. KA-2024-MFG-00123"
            />
            <div style={{ color: '#475569', fontSize: 11, marginTop: 4 }}>
              This is the Unique Business Identifier — the join key across all systems
            </div>
          </div>

          {/* Fields */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <label style={{ color: '#94a3b8', fontSize: 12, fontWeight: 600 }}>
                3. What fields are changing?
              </label>
              <button onClick={loadExample} style={{
                background: 'transparent', border: '1px solid #334155', borderRadius: 4,
                color: '#64748b', fontSize: 11, padding: '3px 8px', cursor: 'pointer',
              }}>
                Load example
              </button>
            </div>

            {/* Existing fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
              {Object.entries(fields).map(([key, val]) => (
                <div key={key} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <input value={key} readOnly style={{
                    width: '38%', padding: '6px 10px', background: '#0f172a',
                    border: '1px solid #1e3a5f', borderRadius: 6, color: '#64748b',
                    fontSize: 12, fontFamily: 'monospace',
                  }} />
                  <input value={val} onChange={e => setFields(f => ({ ...f, [key]: e.target.value }))}
                    style={{
                      flex: 1, padding: '6px 10px', background: '#0f172a',
                      border: '1px solid #334155', borderRadius: 6, color: '#e2e8f0',
                      fontSize: 12, fontFamily: 'monospace',
                    }}
                    placeholder="new value"
                  />
                  <button onClick={() => removeField(key)} style={{
                    background: 'transparent', border: '1px solid #334155', borderRadius: 4,
                    color: '#ef4444', fontSize: 14, padding: '4px 8px', cursor: 'pointer',
                  }}>×</button>
                </div>
              ))}
            </div>

            {/* Add custom field */}
            <div style={{ display: 'flex', gap: 6 }}>
              <select value={customField} onChange={e => setCustomField(e.target.value)}
                style={{
                  flex: 1, padding: '6px 10px', background: '#0f172a',
                  border: '1px solid #334155', borderRadius: 6, color: '#94a3b8', fontSize: 12,
                }}>
                <option value="">+ Select a field...</option>
                {(DEPT_FIELDS[source] || []).filter(f => !fields[f]).map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
              <input value={customValue} onChange={e => setCustomValue(e.target.value)}
                placeholder="value" style={{
                  flex: 1, padding: '6px 10px', background: '#0f172a',
                  border: '1px solid #334155', borderRadius: 6, color: '#e2e8f0', fontSize: 12,
                }}
              />
              <button onClick={addField} style={{
                background: '#0369a1', border: 'none', borderRadius: 6,
                color: '#fff', fontSize: 12, padding: '6px 12px', cursor: 'pointer',
              }}>Add</button>
            </div>
          </div>

          {/* Send button */}
          <button onClick={send} disabled={loading || !Object.values(fields).some(v => v)}
            style={{
              background: loading ? '#334155' : '#0369a1',
              border: 'none', borderRadius: 8, color: '#fff',
              fontSize: 14, fontWeight: 600, padding: '12px 20px',
              cursor: loading ? 'not-allowed' : 'pointer',
              width: '100%', transition: 'background 0.15s',
            }}>
            {loading ? '⏳ Sending...' : '🚀 Send & Watch SyncBridge Work'}
          </button>
        </div>
      </div>

      {/* RIGHT: Live trace */}
      <div style={{ background: '#1e293b', borderRadius: 10, border: '1px solid #334155', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #334155', background: '#162032' }}>
          <h2 style={{ color: '#e2e8f0', fontSize: 16, margin: 0, fontWeight: 600 }}>🔍 What's Happening Behind the Scenes</h2>
          <p style={{ color: '#64748b', fontSize: 12, margin: '4px 0 0' }}>
            Real-time trace of every step SyncBridge takes
          </p>
        </div>

        <div style={{ padding: 20 }}>
          {steps.length === 0 && !result && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#475569' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🔎</div>
              <div style={{ fontSize: 14, color: '#64748b', marginBottom: 6 }}>Fill the form and click Send</div>
              <div style={{ fontSize: 12 }}>You'll see every step SyncBridge takes in real-time</div>
            </div>
          )}

          {/* Step trace */}
          {steps.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {steps.map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%', background: s.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, color: '#0f172a', fontWeight: 700, flexShrink: 0, marginTop: 1,
                  }}>{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: '#e2e8f0' }}>{s.msg}</div>
                    <div style={{ fontSize: 10, color: '#475569' }}>{s.time}</div>
                  </div>
                </div>
              ))}
              {loading && (
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#334155', flexShrink: 0 }} />
                  <div style={{ color: '#64748b', fontSize: 13 }}>Processing...</div>
                </div>
              )}
            </div>
          )}

          {/* Result summary */}
          {result && result.targets_delivered && (
            <div style={{ background: '#0f172a', borderRadius: 8, padding: 16, border: '1px solid #334155' }}>
              <div style={{ color: '#94a3b8', fontSize: 12, fontWeight: 600, marginBottom: 12 }}>
                📊 Final Result
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {['sws', 'factories', 'shop_establishment', 'kspcb'].filter(d => d !== source).map(dept => {
                  const delivered = result.targets_delivered?.includes(dept)
                  const failed    = result.targets_failed?.includes(dept)
                  const skipped   = result.targets_skipped?.includes(dept)
                  return (
                    <div key={dept} style={{
                      padding: '8px 12px', borderRadius: 6, background: '#1e293b',
                      border: `1px solid ${delivered ? '#166534' : failed ? '#7f1d1d' : '#334155'}`,
                    }}>
                      <div style={{ fontSize: 16 }}>{DEPT_ICON[dept]}</div>
                      <div style={{ color: '#e2e8f0', fontSize: 11, fontWeight: 600, marginTop: 4 }}>
                        {dept.replace(/_/g, ' ').toUpperCase()}
                      </div>
                      <div style={{ fontSize: 11, marginTop: 4, color: delivered ? '#22c55e' : failed ? '#ef4444' : '#64748b' }}>
                        {delivered ? '✅ Updated' : failed ? '❌ Failed' : skipped ? '⏭️ Skipped' : '—'}
                      </div>
                    </div>
                  )
                })}
              </div>
              {result.conflict && (
                <div style={{ marginTop: 12, padding: '10px 12px', background: '#1a1428', borderRadius: 6, border: '1px solid #7c3aed' }}>
                  <div style={{ color: '#c084fc', fontSize: 12, fontWeight: 600 }}>⚡ Conflict Resolved</div>
                  <div style={{ color: '#94a3b8', fontSize: 11, marginTop: 4 }}>{result.conflict.reason}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
