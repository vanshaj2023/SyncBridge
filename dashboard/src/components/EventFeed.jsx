import React, { useEffect, useState } from 'react'
import { api } from '../api'

const ICON   = { sws: '🏛️', factories: '🏭', shop_establishment: '🏪', kspcb: '🌿' }
const METHOD = { webhook: { label: 'Webhook',  badge: 'badge-blue'   },
                 polling:  { label: 'Polling',  badge: 'badge-green'  },
                 snapshot: { label: 'Snapshot', badge: 'badge-amber'  } }
const STATUS = { success:         { label: 'Success',  badge: 'badge-green'  },
                 partial_success: { label: 'Partial',  badge: 'badge-amber'  },
                 failed:          { label: 'Failed',   badge: 'badge-red'    } }

function Steps({ e, changes }) {
  const steps = [
    { n: 1, title: 'Change detected',   color: '#2563eb',
      body: `${e.source?.toUpperCase()} sent a change via ${e.detection_method || 'webhook'}`,
      sub: `UBID: ${e.ubid}` },
    { n: 2, title: 'Fields extracted',  color: '#7c3aed',
      body: `${Object.keys(changes).length} field(s) changed`,
      sub: Object.entries(changes).map(([k,v]) => `${k} = "${v}"`).join(' · ') },
    { n: 3, title: e.conflict ? '⚡ Conflict detected' : 'No conflict', color: e.conflict ? '#7c3aed' : '#16a34a',
      body: e.conflict ? `${e.conflict.resolution_policy} applied — ${e.conflict.winner} wins` : 'No competing updates in the conflict window',
      sub: e.conflict ? e.conflict.reason : 'Proceeding with delivery' },
    { n: 4, title: 'Schema translated', color: '#d97706',
      body: 'Field names mapped from source schema to each target schema',
      sub: 'e.g. registered_address → factory_address (Factories)' },
    { n: 5, title: 'Delivered',         color: '#16a34a',
      body: `Pushed to: ${(e.targets_delivered || []).join(', ') || 'none'}`,
      sub: (e.targets_failed?.length ? `Failed: ${e.targets_failed.join(', ')}` : 'All targets acknowledged') },
    { n: 6, title: 'Audit saved',       color: '#94a3b8',
      body: 'Full trace saved to MongoDB audit_log collection',
      sub: `Event ID: ${e.event_id}` },
  ]

  return (
    <div style={{ padding: '16px 20px', background: 'var(--surface-2)', borderTop: '1px solid var(--border)' }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 12 }}>
        What happened behind the scenes
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {steps.map(s => (
          <div key={s.n} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{
              width: 24, height: 24, borderRadius: '50%', background: s.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, color: '#fff', fontWeight: 700, flexShrink: 0, marginTop: 1,
            }}>{s.n}</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)' }}>{s.title}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{s.body}</div>
              {s.sub && <div style={{ fontSize: 11, color: 'var(--text-4)', fontStyle: 'italic', marginTop: 1 }}>{s.sub}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function EventFeed() {
  const [events, setEvents]     = useState([])
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    const load = () => api.events().then(setEvents).catch(() => {})
    load()
    const t = setInterval(load, 2000)
    return () => clearInterval(t)
  }, [])

  return (
    <section className="card">
      {/* Header */}
      <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-1)' }}>Live Event Feed</h2>
            {events.length > 0 && (
              <span className="badge badge-green">{events.length} events</span>
            )}
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
            Every sync operation — click any row to see what happened step by step
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, fontSize: 11, color: 'var(--text-4)' }}>
          <span className="badge badge-blue">Webhook</span>
          <span className="badge badge-green">Polling</span>
          <span className="badge badge-amber">Snapshot</span>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '16px 20px' }}>
        {events.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '52px 20px',
            border: '2px dashed var(--border)', borderRadius: 10, color: 'var(--text-4)',
          }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>
            <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-3)', marginBottom: 6 }}>No events yet</div>
            <div style={{ fontSize: 12 }}>Head to <strong style={{ color: 'var(--accent)' }}>Try It Yourself</strong> or <strong style={{ color: 'var(--accent)' }}>Demo Scenarios</strong> to trigger a sync</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 480, overflowY: 'auto' }}>
            {events.map((e, i) => {
              const changes = (() => { try { return JSON.parse(e.changes || '{}') } catch { return {} } })()
              const method  = METHOD[e.detection_method] || { label: e.detection_method, badge: 'badge-blue' }
              const st      = STATUS[e.final_status]    || { label: e.final_status, badge: 'badge-blue' }
              const isOpen  = expanded === i

              return (
                <div key={i} className="slide-in" style={{
                  border: `1px solid ${e.conflict ? '#c4b5fd' : 'var(--border)'}`,
                  background: e.conflict ? '#faf5ff' : 'var(--surface)',
                  borderRadius: 10, overflow: 'hidden',
                  boxShadow: isOpen ? 'var(--shadow)' : 'var(--shadow-sm)',
                  transition: 'box-shadow 0.2s',
                  animationDelay: `${i * 0.04}s`,
                }}>
                  {/* Conflict banner */}
                  {e.conflict && (
                    <div style={{ background: '#7c3aed', padding: '5px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12 }}>⚡</span>
                      <span style={{ fontSize: 11, color: '#fff', fontWeight: 500 }}>
                        Conflict resolved — {e.conflict.resolution_policy} — {e.conflict.winner} wins
                      </span>
                    </div>
                  )}

                  {/* Main row */}
                  <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}
                    onClick={() => setExpanded(isOpen ? null : i)}>

                    {/* Source icon */}
                    <div style={{
                      width: 38, height: 38, borderRadius: 9, background: 'var(--surface-2)',
                      border: '1px solid var(--border)', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: 18, flexShrink: 0,
                    }}>
                      {ICON[e.source?.toLowerCase()] || '🔲'}
                    </div>

                    {/* Main info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>
                          {e.source?.toUpperCase()}
                        </span>
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M2 7h10M8 3l4 4-4 4" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        {(e.targets_delivered || []).map(t => (
                          <span key={t} style={{ fontSize: 11, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 3 }}>
                            {ICON[t]} {t.replace(/_/g, ' ')}
                          </span>
                        ))}
                        {(e.targets_failed || []).map(t => (
                          <span key={t} style={{ fontSize: 11, color: 'var(--red)', display: 'flex', alignItems: 'center', gap: 3 }}>
                            {ICON[t]} {t.replace(/_/g, ' ')} ✗
                          </span>
                        ))}
                      </div>

                      {/* Changed fields */}
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                        {Object.entries(changes).map(([field, val]) => (
                          <span key={field} style={{
                            fontSize: 10, background: 'var(--surface-2)', border: '1px solid var(--border)',
                            borderRadius: 4, padding: '1px 7px', color: 'var(--text-3)',
                          }}>
                            {field}: <strong style={{ color: 'var(--text-2)' }}>"{String(val).slice(0, 28)}{String(val).length > 28 ? '…' : ''}"</strong>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Right side */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, flexShrink: 0 }}>
                      <span className={`badge ${st.badge}`}>{st.label}</span>
                      <span className={`badge ${method.badge}`}>{method.label}</span>
                      <span style={{ fontSize: 10, color: 'var(--text-4)' }}>{e.timestamp?.slice(11, 19)} UTC</span>
                    </div>

                    {/* Expand chevron */}
                    <div style={{ color: 'var(--text-4)', fontSize: 12, marginLeft: 4 }}>
                      {isOpen ? '▲' : '▼'}
                    </div>
                  </div>

                  {/* Expanded steps */}
                  {isOpen && <Steps e={e} changes={changes} />}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
