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
    <div className="card">
      <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="section-title">Dead Letter Queue</div>
            {items.length > 0 && <span className="badge badge-red">{items.length}</span>}
          </div>
          <div className="section-sub">Failed deliveries — retry when the system recovers</div>
        </div>
        {items.length > 0 && (
          <button onClick={replayAll} disabled={busy} className="btn btn-primary" style={{ fontSize: 12 }}>
            Replay All
          </button>
        )}
      </div>

      <div className="card-body">
        <div style={{ background: 'var(--amber-bg)', border: '1px solid var(--amber-bd)', borderRadius: 7, padding: '9px 12px', marginBottom: 14, fontSize: 12, color: 'var(--amber)' }}>
          When a department is unreachable, SyncBridge saves the update here instead of losing it. Replay once the system is back.
        </div>

        {items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 20px' }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--accent)', marginBottom: 4 }}>No failed deliveries</div>
            <div style={{ fontSize: 12, color: 'var(--text-4)' }}>All syncs are reaching their targets</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {items.map((item, i) => (
              <div key={i} style={{ padding: '11px 13px', background: 'var(--red-bg)', border: '1px solid var(--red-bd)', borderRadius: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)', marginBottom: 2 }}>{item.ubid}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Failed to reach <strong>{item.target?.replace(/_/g, ' ')}</strong></div>
                    <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 2 }}>{item.error} · Retry #{item.retry_count}</div>
                  </div>
                  <button onClick={() => replay(item.event_id)} disabled={busy} className="btn btn-primary" style={{ fontSize: 11, padding: '5px 10px' }}>
                    Retry
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
