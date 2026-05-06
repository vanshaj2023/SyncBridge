import React, { useEffect, useState } from 'react'
import { api } from '../api'

export default function DLQPanel() {
  const [items, setItems]   = useState([])
  const [loading, setLoading] = useState(false)

  const load = () => api.dlq().then(setItems).catch(() => {})
  useEffect(() => {
    load()
    const t = setInterval(load, 3000)
    return () => clearInterval(t)
  }, [])

  const replay = async (id) => {
    setLoading(true)
    await api.replayEvent(id)
    setTimeout(() => { load(); setLoading(false) }, 800)
  }
  const replayAll = async () => {
    setLoading(true)
    await api.replayAll()
    setTimeout(() => { load(); setLoading(false) }, 800)
  }

  return (
    <div style={{ background: '#1e293b', borderRadius: 10, border: '1px solid #334155', overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #334155', background: '#162032' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ color: '#e2e8f0', fontSize: 16, margin: 0, fontWeight: 600 }}>
              💀 Dead Letter Queue
              {items.length > 0 && (
                <span style={{ marginLeft: 8, background: '#7f1d1d', color: '#fca5a5', borderRadius: 12, padding: '1px 8px', fontSize: 12 }}>
                  {items.length}
                </span>
              )}
            </h2>
            <p style={{ color: '#64748b', fontSize: 12, margin: '4px 0 0' }}>
              Failed deliveries that couldn't reach a department. Can be replayed once the system recovers.
            </p>
          </div>
          {items.length > 0 && (
            <button onClick={replayAll} disabled={loading} style={{
              background: '#0369a1', color: '#fff', border: 'none', borderRadius: 6,
              padding: '7px 14px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 600,
            }}>
              {loading ? '⏳' : '🔁 Replay All'}
            </button>
          )}
        </div>
      </div>

      <div style={{ padding: 16 }}>
        {items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 20px' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>✅</div>
            <div style={{ color: '#22c55e', fontSize: 14, fontWeight: 600 }}>No failed deliveries</div>
            <div style={{ color: '#475569', fontSize: 12, marginTop: 4 }}>All syncs are reaching their targets</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ background: '#0f172a', borderRadius: 6, padding: '8px 12px', marginBottom: 4 }}>
              <div style={{ color: '#64748b', fontSize: 11 }}>
                💡 <strong style={{ color: '#94a3b8' }}>What is this?</strong> When a department system is unreachable, SyncBridge doesn't lose the update. It saves it here and retries when you click Replay.
              </div>
            </div>
            {items.map((item, i) => (
              <div key={i} style={{
                background: '#0f172a', border: '1px solid #7f1d1d',
                borderRadius: 8, padding: '10px 14px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ color: '#fca5a5', fontSize: 13, fontWeight: 600 }}>
                      {item.ubid}
                    </div>
                    <div style={{ color: '#64748b', fontSize: 11, marginTop: 2 }}>
                      Failed to reach <span style={{ color: '#e2e8f0' }}>{item.target?.replace(/_/g, ' ').toUpperCase()}</span>
                    </div>
                    <div style={{ color: '#475569', fontSize: 11, marginTop: 2 }}>
                      Error: {item.error} · Retry #{item.retry_count}
                    </div>
                  </div>
                  <button onClick={() => replay(item.event_id)} disabled={loading}
                    style={{
                      background: '#166534', color: '#fff', border: 'none', borderRadius: 6,
                      padding: '6px 12px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: 12,
                    }}>
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
