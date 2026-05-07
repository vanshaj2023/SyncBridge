import React, { useEffect, useState } from 'react'
import { api } from '../api'

const METHOD_BADGE = { webhook: 'badge-blue', polling: 'badge-green', snapshot: 'badge-amber' }
const STATUS_BADGE = { success: 'badge-green', partial_success: 'badge-amber', failed: 'badge-red' }
const STATUS_LABEL = { success: 'Success', partial_success: 'Partial', failed: 'Failed' }

function Step({ n, title, body, sub }) {
  return (
    <div style={{ display: 'flex', gap: 14 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
        <div style={{
          width: 22, height: 22, borderRadius: '50%',
          background: 'var(--surface)', border: '1px solid var(--border-2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, fontWeight: 600, color: 'var(--text-3)', flexShrink: 0,
        }}>{n}</div>
        {n < 6 && <div style={{ width: 1, flex: 1, background: 'var(--border)', minHeight: 16, marginTop: 4 }} />}
      </div>
      <div style={{ paddingBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-1)' }}>{title}</div>
        <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>{body}</div>
        {sub && <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 2, fontStyle: 'italic' }}>{sub}</div>}
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
      <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>Live Event Feed</h2>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>Click any row to see the full trace</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {events.length > 0 && <span className="badge badge-gray">{events.length} events</span>}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div className="live-dot" style={{ width: 5, height: 5 }} />
            <span style={{ fontSize: 11, color: 'var(--text-4)' }}>every 2s</span>
          </div>
        </div>
      </div>

      <div style={{ padding: '16px 20px' }}>
        {events.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '56px 20px' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="var(--border-2)" strokeWidth="1.5"/><path d="M8 5v3l2 2" stroke="var(--text-4)" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)', marginBottom: 4 }}>No events yet</div>
            <div style={{ fontSize: 12, color: 'var(--text-4)' }}>Go to Try It Yourself or Scenarios to trigger a sync</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 520, overflowY: 'auto', paddingRight: 4 }}>
            {events.map((e, i) => {
              const changes = (() => { try { return JSON.parse(e.changes || '{}') } catch { return {} } })()
              const isOpen  = expanded === i
              const method  = e.detection_method || 'webhook'

              return (
                <div key={i} style={{
                  border: '1px solid var(--border)',
                  borderRadius: 9,
                  background: 'var(--surface)',
                  overflow: 'hidden',
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                  boxShadow: isOpen ? 'var(--shadow-md)' : 'none',
                  ...(isOpen && { borderColor: 'var(--border-2)' }),
                }}>
                  {/* Conflict notice */}
                  {e.conflict && (
                    <div style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', padding: '5px 16px', fontSize: 11, color: 'var(--text-3)', fontWeight: 500 }}>
                      Conflict resolved — {e.conflict.resolution_policy} — {e.conflict.winner} wins
                    </div>
                  )}

                  {/* Row */}
                  <div style={{ padding: '11px 16px 11px 16px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', minWidth: 0 }}
                    onClick={() => setExpanded(isOpen ? null : i)}>

                    {/* Source → targets */}
                    <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>
                          {e.source?.toUpperCase()}
                        </span>
                        <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                          <path d="M1 4h10M7 1l3 3-3 3" stroke="var(--green)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
                          {(e.targets_delivered || []).join(', ') || '—'}
                        </span>
                        {(e.targets_failed || []).length > 0 && (
                          <span style={{ fontSize: 11, color: 'var(--red)' }}>· {e.targets_failed.join(', ')} failed</span>
                        )}
                      </div>
                      {/* Changed fields */}
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'nowrap', overflow: 'hidden' }}>
                        {Object.entries(changes).map(([field, val]) => (
                          <span key={field} style={{
                            fontSize: 10, background: 'var(--surface-2)',
                            border: '1px solid var(--border)', borderRadius: 4,
                            padding: '1px 7px', color: 'var(--text-3)', fontFamily: 'monospace',
                          }}>
                            {field}: "{String(val).slice(0, 28)}{String(val).length > 28 ? '…' : ''}"
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Right meta */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, flexShrink: 0 }}>
                      <span className={`badge ${STATUS_BADGE[e.final_status] || 'badge-gray'}`}>{STATUS_LABEL[e.final_status] || e.final_status}</span>
                      <span className={`badge ${METHOD_BADGE[method] || 'badge-gray'}`}>{method}</span>
                    </div>

                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ color: 'var(--text-4)', flexShrink: 0, transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'none' }}>
                      <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>

                  {/* Expanded trace */}
                  {isOpen && (
                    <div style={{ borderTop: '1px solid var(--border)', padding: '18px 20px 10px', background: 'var(--surface-2)' }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
                        Execution trace
                      </div>
                      <Step n={1} title="Change detected" body={`${e.source?.toUpperCase()} sent a change via ${method}`} sub={`UBID: ${e.ubid}`} />
                      <Step n={2} title="Fields extracted" body={`${Object.keys(changes).length} field(s) changed`} sub={Object.entries(changes).map(([k,v]) => `${k} = "${v}"`).join(' · ')} />
                      <Step n={3} title={e.conflict ? 'Conflict detected' : 'No conflict'}
                        body={e.conflict ? `${e.conflict.resolution_policy} applied — ${e.conflict.winner} wins` : 'No competing updates within the 5s conflict window'}
                        sub={e.conflict ? e.conflict.reason : undefined} />
                      <Step n={4} title="Schema translated" body="Field names mapped from source schema to each target's schema" sub="e.g. registered_address → factory_address for Factories dept" />
                      <Step n={5} title="Delivered" body={`Pushed to: ${(e.targets_delivered || []).join(', ') || 'none'}`} sub={e.targets_failed?.length ? `Failed: ${e.targets_failed.join(', ')}` : 'All targets acknowledged the write'} />
                      <Step n={6} title="Audit saved" body="Full trace persisted to MongoDB audit_log collection" sub={`Event ID: ${e.event_id}`} />
                      <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 4, paddingLeft: 36 }}>{e.timestamp?.replace('T', ' ').slice(0, 19)} UTC</div>
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
