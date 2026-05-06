import React, { useEffect, useState } from 'react'
import { api } from '../api'

const STATUS_COLOR = {
  success: '#22c55e',
  partial_success: '#f59e0b',
  failed: '#ef4444',
}

export default function EventFeed() {
  const [events, setEvents] = useState([])

  useEffect(() => {
    const load = () => api.events().then(setEvents).catch(() => {})
    load()
    const t = setInterval(load, 2000)
    return () => clearInterval(t)
  }, [])

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ color: '#94a3b8', marginBottom: 12, fontSize: 14, textTransform: 'uppercase' }}>
        Live Event Feed
      </h2>
      <div style={{ overflowY: 'auto', maxHeight: 340 }}>
        {events.length === 0 && (
          <p style={{ color: '#64748b' }}>No events yet. Trigger an update.</p>
        )}
        {events.map((e, i) => (
          <div key={i} style={{
            background: e.conflict ? '#1e1b2e' : '#1e293b',
            border: `1px solid ${e.conflict ? '#7c3aed' : '#334155'}`,
            borderRadius: 6, padding: '8px 12px', marginBottom: 6,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ color: '#7dd3fc', fontSize: 12 }}>{e.ubid}</span>
              <span style={{ color: '#94a3b8', fontSize: 11 }}>{e.timestamp?.slice(11, 19)}</span>
            </div>
            <div style={{ fontSize: 12, color: '#cbd5e1' }}>
              <span style={{ color: '#fb923c' }}>{e.source}</span>
              {' → '}
              <span>{e.targets_delivered?.join(', ') || '—'}</span>
              <span style={{ float: 'right', color: STATUS_COLOR[e.final_status] || '#94a3b8' }}>
                {e.final_status}
              </span>
            </div>
            {e.conflict && (
              <div style={{ marginTop: 4, fontSize: 11, color: '#c084fc' }}>
                ⚡ CONFLICT — {e.conflict.reason}
              </div>
            )}
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
              via {e.detection_method}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
