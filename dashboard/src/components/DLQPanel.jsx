import React, { useEffect, useState } from 'react'
import { api } from '../api'

export default function DLQPanel() {
  const [items, setItems] = useState([])

  const load = () => api.dlq().then(setItems).catch(() => {})
  useEffect(() => {
    load()
    const t = setInterval(load, 3000)
    return () => clearInterval(t)
  }, [])

  const replay = async (id) => { await api.replayEvent(id); setTimeout(load, 500) }
  const replayAll = async () => { await api.replayAll(); setTimeout(load, 500) }

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ color: '#94a3b8', marginBottom: 8, fontSize: 14, textTransform: 'uppercase' }}>
        Dead Letter Queue ({items.length})
      </h2>
      {items.length > 0 && (
        <button onClick={replayAll} style={{
          background: '#0369a1', color: '#fff', border: 'none', borderRadius: 4,
          padding: '6px 12px', cursor: 'pointer', fontFamily: 'monospace', fontSize: 12, marginBottom: 8,
        }}>
          Replay All ({items.length})
        </button>
      )}
      {items.length === 0 && (
        <p style={{ color: '#64748b', fontSize: 12 }}>No failed deliveries.</p>
      )}
      {items.map((item, i) => (
        <div key={i} style={{
          background: '#1e293b', border: '1px solid #7f1d1d',
          borderRadius: 6, padding: '8px 12px', marginBottom: 6,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#fca5a5', fontSize: 12 }}>
              {item.ubid} → {item.target}
            </span>
            <button onClick={() => replay(item.event_id)} style={{
              background: '#166534', color: '#fff', border: 'none', borderRadius: 4,
              padding: '2px 8px', cursor: 'pointer', fontSize: 11,
            }}>
              Replay
            </button>
          </div>
          <div style={{ color: '#64748b', fontSize: 11, marginTop: 4 }}>
            {item.error} · retry #{item.retry_count}
          </div>
        </div>
      ))}
    </div>
  )
}
