import React, { useEffect, useState } from 'react'
import { api } from '../api'

export default function DLQPanel() {
  const [items, setItems] = useState([])
  const [busy, setBusy]   = useState(false)

  const load = () => api.dlq().then(setItems).catch(() => {})
  useEffect(() => { load(); const t = setInterval(load, 3000); return () => clearInterval(t) }, [])

  const replay    = async (id) => { setBusy(true); await api.replayEvent(id); setTimeout(() => { load(); setBusy(false) }, 800) }
  const replayAll = async ()   => { setBusy(true); await api.replayAll();     setTimeout(() => { load(); setBusy(false) }, 800) }

  return (
    <section className="card">
      <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>Dead Letter Queue</h2>
            {items.length > 0 && <span className="badge badge-red">{items.length}</span>}
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-3)' }}>Failed deliveries — replay when the system recovers</p>
        </div>
        {items.length > 0 && (
          <button onClick={replayAll} disabled={busy} className="btn btn-primary" style={{ fontSize: 12 }}>
            Replay All
          </button>
        )}
      </div>

      <div style={{ padding: '18px 22px' }}>
        <div style={{ background: 'var(--amber-bg)', border: '1px solid var(--amber-bd)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: 'var(--amber)', lineHeight: 1.5 }}>
          When a department is unreachable, SyncBridge saves the update here instead of losing it. Replay once the system is back online.
        </div>

        {items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--green-bg)', border: '1px solid var(--green-bd)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8l4 4 6-6" stroke="var(--green)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-1)', marginBottom: 4 }}>No failed deliveries</div>
            <div style={{ fontSize: 12, color: 'var(--text-4)' }}>All syncs are reaching their targets</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {items.map((item, i) => (
              <div key={i} style={{ padding: '13px 15px', background: 'var(--red-bg)', border: '1px solid var(--red-bd)', borderRadius: 9 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)', marginBottom: 3, fontFamily: 'monospace' }}>{item.ubid}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-2)' }}>Failed to reach <strong>{item.target?.replace(/_/g, ' ')}</strong></div>
                    <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 3 }}>{item.error} · Retry #{item.retry_count}</div>
                  </div>
                  <button onClick={() => replay(item.event_id)} disabled={busy} className="btn btn-secondary" style={{ fontSize: 11, padding: '5px 11px', flexShrink: 0 }}>
                    Retry
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
