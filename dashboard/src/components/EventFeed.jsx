import React, { useEffect, useState } from 'react'
import { api } from '../api'

const METHOD_BADGE = { webhook: 'badge-blue', polling: 'badge-green', snapshot: 'badge-amber' }
const STATUS_BADGE = { success: 'badge-green', partial_success: 'badge-amber', failed: 'badge-red' }
const STATUS_LABEL = { success: 'Success', partial_success: 'Partial', failed: 'Failed' }

function Divider() {
  return <div style={{ height: 1, background: 'var(--border)', margin: '14px 0' }} />
}

function StepRow({ n, title, body, sub }) {
  return (
    <div style={{ display: 'flex', gap: 12 }}>
      <div style={{
        width: 20, height: 20, borderRadius: '50%', background: 'var(--surface-2)',
        border: '1px solid var(--border)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: 10, fontWeight: 600, color: 'var(--text-3)', flexShrink: 0,
      }}>{n}</div>
      <div style={{ paddingBottom: 10 }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-1)' }}>{title}</div>
        <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>{body}</div>
        {sub && <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 1 }}>{sub}</div>}
      </div>
    </div>
  )
}

export default function EventFeed() {
  const [events, setEvents] = useState([])
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    const load = () => api.events().then(setEvents).catch(() => {})
    load()
    const t = setInterval(load, 2000)
    return () => clearInterval(t)
  }, [])

  return (
    <section className="card">
      <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div className="section-title">Live Event Feed</div>
          <div className="section-sub">Click any row to see what happened step by step</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div className="live-dot" />
          <span style={{ fontSize: 11, color: 'var(--text-4)' }}>every 2s</span>
        </div>
      </div>

      <div className="card-body">
        {events.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px', border: '1px dashed var(--border)', borderRadius: 8 }}>
            <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 4 }}>No events yet</div>
            <div style={{ fontSize: 12, color: 'var(--text-4)' }}>Go to Try It Yourself or Scenarios to trigger a sync</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 500, overflowY: 'auto' }}>
            {events.map((e, i) => {
              const changes = (() => { try { return JSON.parse(e.changes || '{}') } catch { return {} } })()
              const isOpen  = expanded === i
              const method  = e.detection_method || 'webhook'

              return (
                <div key={i} style={{
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  background: 'var(--surface)',
                  overflow: 'hidden',
                  transition: 'box-shadow 0.15s',
                  boxShadow: isOpen ? 'var(--shadow-md)' : 'none',
                }}>
                  {/* Conflict bar */}
                  {e.conflict && (
                    <div style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', padding: '5px 14px', fontSize: 11, color: 'var(--text-2)' }}>
                      Conflict resolved — {e.conflict.resolution_policy} — <strong>{e.conflict.winner}</strong> wins
                    </div>
                  )}

                  {/* Main row */}
                  <div
                    style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
                    onClick={() => setExpanded(isOpen ? null : i)}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)' }}>{e.source?.toUpperCase()}</span>
                        <span style={{ color: 'var(--text-4)', fontSize: 12 }}>→</span>
                        <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{(e.targets_delivered || []).join(', ') || '—'}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                        {Object.entries(changes).map(([field, val]) => (
                          <span key={field} style={{ fontSize: 10, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 4, padding: '1px 6px', color: 'var(--text-3)' }}>
                            {field}: <span style={{ color: 'var(--text-2)' }}>"{String(val).slice(0, 30)}{String(val).length > 30 ? '…' : ''}"</span>
                          </span>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                      <span className={`badge ${STATUS_BADGE[e.final_status] || 'badge-gray'}`}>{STATUS_LABEL[e.final_status] || e.final_status}</span>
                      <span className={`badge ${METHOD_BADGE[method] || 'badge-gray'}`}>{method}</span>
                    </div>

                    <span style={{ color: 'var(--text-4)', fontSize: 11, marginLeft: 4 }}>{isOpen ? '▲' : '▼'}</span>
                  </div>

                  {/* Expanded detail */}
                  {isOpen && (
                    <div style={{ borderTop: '1px solid var(--border)', padding: '14px 18px', background: 'var(--surface-2)' }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
                        What happened
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <StepRow n={1} title="Change detected" body={`${e.source?.toUpperCase()} sent a change via ${method}`} sub={`UBID: ${e.ubid}`} />
                        <StepRow n={2} title="Fields extracted" body={`${Object.keys(changes).length} field(s) changed`} sub={Object.entries(changes).map(([k,v]) => `${k} = "${v}"`).join(', ')} />
                        <StepRow n={3} title={e.conflict ? 'Conflict detected' : 'No conflict'}
                          body={e.conflict ? `${e.conflict.resolution_policy} — ${e.conflict.winner} wins` : 'No competing updates in the conflict window'}
                          sub={e.conflict ? e.conflict.reason : undefined} />
                        <StepRow n={4} title="Schema translated" body="Field names mapped from source schema to each target schema" />
                        <StepRow n={5} title="Delivered" body={`Pushed to: ${(e.targets_delivered || []).join(', ') || 'none'}`} sub={e.targets_failed?.length ? `Failed: ${e.targets_failed.join(', ')}` : 'All targets acknowledged'} />
                        <StepRow n={6} title="Audit saved" body="Full trace saved to MongoDB" sub={`Event ID: ${e.event_id}`} />
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 4 }}>{e.timestamp?.replace('T', ' ').slice(0, 19)} UTC</div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
