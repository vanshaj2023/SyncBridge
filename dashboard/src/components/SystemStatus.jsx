import React, { useEffect, useState } from 'react'
import { api } from '../api'

const CB_COLOR = { closed: '#22c55e', open: '#ef4444', half_open: '#f59e0b' }

export default function SystemStatus() {
  const [status, setStatus] = useState({})

  useEffect(() => {
    const load = () => api.status().then(setStatus).catch(() => {})
    load()
    const t = setInterval(load, 3000)
    return () => clearInterval(t)
  }, [])

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ color: '#94a3b8', marginBottom: 12, fontSize: 14, textTransform: 'uppercase' }}>
        System Status
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {Object.entries(status).map(([dept, info]) => (
          <div key={dept} style={{
            background: '#1e293b', borderRadius: 6, padding: '8px 12px',
            border: `1px solid ${info.reachable ? '#334155' : '#7f1d1d'}`,
          }}>
            <div style={{ fontWeight: 'bold', color: '#e2e8f0', fontSize: 13 }}>
              {dept.replace(/_/g, ' ').toUpperCase()}
            </div>
            <div style={{ fontSize: 12, marginTop: 4 }}>
              <span style={{ color: info.reachable ? '#22c55e' : '#ef4444' }}>
                {info.reachable ? '● Online' : '● Offline'}
              </span>
              {' '}
              <span style={{ color: CB_COLOR[info.circuit] || '#94a3b8', fontSize: 11 }}>
                [{info.circuit}]
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
