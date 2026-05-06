import React, { useEffect, useState } from 'react'
import { api } from '../api'

const DEPT_META = {
  sws:                { label: 'Single Window System (SWS)', icon: '🏛️', desc: 'Main government portal', detection: 'Webhook' },
  factories:          { label: 'Dept. of Factories',         icon: '🏭', desc: 'Factory & industrial licenses', detection: 'Webhook' },
  shop_establishment: { label: 'Shop & Establishment',       icon: '🏪', desc: 'Shop licenses', detection: 'Polling (10s)' },
  kspcb:              { label: 'Pollution Control Board',    icon: '🌿', desc: 'Environmental compliance', detection: 'Snapshot (30s)' },
}

const CB_COLOR   = { closed: '#22c55e', open: '#ef4444', half_open: '#f59e0b' }
const CB_LABEL   = { closed: 'Healthy', open: 'Tripped', half_open: 'Recovering' }

export default function SystemStatus() {
  const [status, setStatus] = useState({})

  useEffect(() => {
    const load = () => api.status().then(setStatus).catch(() => {})
    load()
    const t = setInterval(load, 3000)
    return () => clearInterval(t)
  }, [])

  const depts = Object.entries(status)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h2 style={{ color: '#e2e8f0', fontSize: 16, margin: 0, fontWeight: 600 }}>System Status</h2>
          <p style={{ color: '#64748b', fontSize: 12, margin: '4px 0 0' }}>
            Live health of all connected department systems
          </p>
        </div>
        <span style={{ fontSize: 11, color: '#475569' }}>Auto-refreshes every 3s</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
        {depts.length === 0
          ? [1,2,3,4].map(i => (
              <div key={i} style={{ background: '#1e293b', borderRadius: 8, padding: 16, border: '1px solid #334155', opacity: 0.5 }}>
                <div style={{ color: '#475569', fontSize: 13 }}>Loading...</div>
              </div>
            ))
          : depts.map(([dept, info]) => {
              const meta = DEPT_META[dept] || { label: dept, icon: '🔲', desc: '', detection: '—' }
              const online = info.reachable
              const cb = info.circuit || 'closed'
              return (
                <div key={dept} style={{
                  background: '#1e293b',
                  borderRadius: 8,
                  padding: 16,
                  border: `1px solid ${online ? '#334155' : '#7f1d1d'}`,
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  {/* Online indicator stripe */}
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                    background: online ? '#22c55e' : '#ef4444',
                  }} />

                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 20, marginBottom: 6 }}>{meta.icon}</div>
                      <div style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600 }}>{meta.label}</div>
                      <div style={{ color: '#64748b', fontSize: 11, marginTop: 2 }}>{meta.desc}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: online ? '#22c55e' : '#ef4444', fontSize: 12, fontWeight: 600 }}>
                        {online ? '● Online' : '● Offline'}
                      </div>
                      <div style={{ color: CB_COLOR[cb], fontSize: 11, marginTop: 4 }}>
                        Circuit: {CB_LABEL[cb] || cb}
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: 10, display: 'flex', gap: 6 }}>
                    <span style={{ background: '#0f172a', borderRadius: 4, padding: '2px 8px', fontSize: 10, color: '#64748b' }}>
                      Change detection: {meta.detection}
                    </span>
                  </div>
                </div>
              )
            })
        }
      </div>
    </div>
  )
}
