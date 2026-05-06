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
            <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-1)' }}>Dead Letter Queue</h2>
            {items.length > 0 && <span className="badge badge-red">{items.length} failed</span>}
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3 }}>
            Updates that couldn't reach a department — retry when the system recovers
          </p>
        </div>
        {items.length > 0 && (
          <button onClick={replayAll} disabled={busy} className="btn btn-primary" style={{ fontSize: 12 }}>
            🔁 Replay All
          </button>
        )}
      </div>

      <div className="card-body">
        {/* Explainer */}
        <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#92400e', display: 'flex', gap: 8 }}>
          <span>💡</span>
          <span>When a department system goes offline, SyncBridge saves the failed update here instead of losing it. Once the system is back, click Replay to retry delivery.</span>
        </div>

        {items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 20px' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--accent)', marginBottom: 4 }}>No failed deliveries</div>
            <div style={{ fontSize: 12, color: 'var(--text-4)' }}>All syncs are reaching their targets</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {items.map((item, i) => (
              <div key={i} style={{ padding: '12px 14px', background: '#fff5f5', border: '1px solid #fecaca', borderRadius: 9 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', marginBottom: 3 }}>
                      {item.ubid}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                      Failed to reach <strong>{item.target?.replace(/_/g, ' ').toUpperCase()}</strong>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 3 }}>
                      {item.error} · Retry #{item.retry_count}
                    </div>
                  </div>
                  <button onClick={() => replay(item.event_id)} disabled={busy} className="btn btn-primary"
                    style={{ fontSize: 11, padding: '6px 12px' }}>
                    🔁 Retry
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
