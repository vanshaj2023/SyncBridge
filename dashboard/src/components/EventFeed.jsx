import React, { useEffect, useState } from 'react'
import { api } from '../api'

const STATUS_COLOR = { success: '#22c55e', partial_success: '#f59e0b', failed: '#ef4444' }
const STATUS_LABEL = { success: '✅ Success', partial_success: '⚠️ Partial', failed: '❌ Failed' }
const DEPT_ICON    = { sws: '🏛️', factories: '🏭', shop_establishment: '🏪', kspcb: '🌿' }
const METHOD_COLOR = { webhook: '#818cf8', polling: '#34d399', snapshot: '#fb923c' }

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
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h2 style={{ color: '#e2e8f0', fontSize: 16, margin: 0, fontWeight: 600 }}>Live Event Feed</h2>
          <p style={{ color: '#64748b', fontSize: 12, margin: '4px 0 0' }}>
            Every sync operation — what changed, where it came from, where it was delivered
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11, color: '#475569' }}>
          <span style={{ color: '#818cf8' }}>● Webhook</span>
          <span style={{ color: '#34d399' }}>● Polling</span>
          <span style={{ color: '#fb923c' }}>● Snapshot</span>
          <span style={{ marginLeft: 8 }}>Auto-refreshes every 2s</span>
        </div>
      </div>

      {events.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 20px', color: '#475569', background: '#1e293b', borderRadius: 8, border: '1px dashed #334155' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
          <div style={{ fontSize: 15, color: '#64748b', marginBottom: 6 }}>No events yet</div>
          <div style={{ fontSize: 12 }}>Go to <strong style={{ color: '#38bdf8' }}>Try It Yourself</strong> or <strong style={{ color: '#38bdf8' }}>Demo Scenarios</strong> to trigger a sync</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 520, overflowY: 'auto' }}>
          {events.map((e, i) => {
            const isOpen = expanded === i
            const changes = (() => { try { return JSON.parse(e.changes || '{}') } catch { return {} } })()
            return (
              <div key={i} style={{
                background: e.conflict ? '#1a1428' : '#1e293b',
                border: `1px solid ${e.conflict ? '#7c3aed' : '#334155'}`,
                borderRadius: 8,
                overflow: 'hidden',
                cursor: 'pointer',
              }} onClick={() => setExpanded(isOpen ? null : i)}>

                {/* Conflict stripe */}
                {e.conflict && (
                  <div style={{ background: '#7c3aed', padding: '3px 12px', fontSize: 11, color: '#e9d5ff' }}>
                    ⚡ CONFLICT DETECTED — {e.conflict.resolution_policy} applied — Winner: {e.conflict.winner}
                  </div>
                )}

                {/* Main row */}
                <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>

                  {/* Detection method badge */}
                  <span style={{
                    background: '#0f172a', border: `1px solid ${METHOD_COLOR[e.detection_method] || '#334155'}`,
                    color: METHOD_COLOR[e.detection_method] || '#94a3b8',
                    borderRadius: 4, padding: '2px 7px', fontSize: 10, whiteSpace: 'nowrap',
                  }}>
                    {e.detection_method || 'webhook'}
                  </span>

                  {/* Source → targets */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 14 }}>{DEPT_ICON[e.source?.toLowerCase()] || '🔲'}</span>
                      <span style={{ color: '#fb923c', fontSize: 13, fontWeight: 600 }}>
                        {e.source?.toUpperCase()}
                      </span>
                      <span style={{ color: '#475569' }}>propagated to</span>
                      {(e.targets_delivered || []).map(t => (
                        <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: '#0f172a', borderRadius: 4, padding: '2px 7px', fontSize: 11, color: '#22c55e' }}>
                          {DEPT_ICON[t] || '🔲'} {t.replace(/_/g, ' ')}
                        </span>
                      ))}
                      {(e.targets_failed || []).map(t => (
                        <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: '#0f172a', borderRadius: 4, padding: '2px 7px', fontSize: 11, color: '#ef4444' }}>
                          {DEPT_ICON[t] || '🔲'} {t.replace(/_/g, ' ')} ✗
                        </span>
                      ))}
                    </div>

                    {/* Changed fields summary */}
                    <div style={{ marginTop: 4, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {Object.entries(changes).map(([field, val]) => (
                        <span key={field} style={{ fontSize: 10, color: '#64748b', background: '#0f172a', borderRadius: 3, padding: '1px 6px' }}>
                          {field}: <span style={{ color: '#94a3b8' }}>"{String(val).slice(0, 30)}{String(val).length > 30 ? '…' : ''}"</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Right side */}
                  <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <div style={{ color: STATUS_COLOR[e.final_status] || '#94a3b8', fontSize: 12, fontWeight: 600 }}>
                      {STATUS_LABEL[e.final_status] || e.final_status}
                    </div>
                    <div style={{ color: '#475569', fontSize: 11, marginTop: 2 }}>
                      {e.timestamp?.slice(11, 19)} UTC
                    </div>
                    <div style={{ color: '#334155', fontSize: 10, marginTop: 2 }}>
                      {isOpen ? '▲ hide' : '▼ details'}
                    </div>
                  </div>
                </div>

                {/* Expanded detail — step-by-step what happened */}
                {isOpen && (
                  <div style={{ borderTop: '1px solid #334155', padding: '12px 14px', background: '#0f172a' }}>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 10, fontWeight: 600 }}>
                      What happened behind the scenes:
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

                      <Step n={1} title="Change detected"
                        desc={`${e.source?.toUpperCase()} sent a change via ${e.detection_method || 'webhook'}`}
                        detail={`UBID: ${e.ubid}`} color="#818cf8" />

                      <Step n={2} title="Fields extracted"
                        desc={`${Object.keys(changes).length} field(s) changed`}
                        detail={Object.entries(changes).map(([k,v]) => `${k} = "${v}"`).join(', ')}
                        color="#34d399" />

                      {e.conflict ? (
                        <Step n={3} title="⚡ Conflict detected!"
                          desc={`Same field updated by 2 sources within conflict window`}
                          detail={e.conflict.reason}
                          color="#c084fc" />
                      ) : (
                        <Step n={3} title="No conflict"
                          desc="No competing updates detected in conflict window"
                          detail="Proceeding with delivery"
                          color="#22c55e" />
                      )}

                      <Step n={4} title="Schema translated"
                        desc="Field names converted from source schema to each target's schema"
                        detail={`e.g. "registered_address" → "factory_address" (for Factories)`}
                        color="#fb923c" />

                      <Step n={5} title="Delivered"
                        desc={`Pushed to: ${(e.targets_delivered || []).join(', ') || 'none'}`}
                        detail={e.targets_failed?.length ? `Failed: ${e.targets_failed.join(', ')}` : 'All targets acknowledged the write'}
                        color={STATUS_COLOR[e.final_status] || '#94a3b8'} />

                      <Step n={6} title="Audit logged"
                        desc="Full trace saved to MongoDB audit_log collection"
                        detail={`Event ID: ${e.event_id}`}
                        color="#64748b" />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Step({ n, title, desc, detail, color }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <div style={{
        width: 22, height: 22, borderRadius: '50%', background: color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, color: '#0f172a', fontWeight: 700, flexShrink: 0,
      }}>{n}</div>
      <div>
        <div style={{ fontSize: 12, color: '#e2e8f0', fontWeight: 600 }}>{title}</div>
        <div style={{ fontSize: 11, color: '#64748b' }}>{desc}</div>
        {detail && <div style={{ fontSize: 11, color: '#475569', marginTop: 2, fontStyle: 'italic' }}>{detail}</div>}
      </div>
    </div>
  )
}
