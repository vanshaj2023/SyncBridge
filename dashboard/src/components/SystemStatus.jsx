import React, { useEffect, useState } from 'react'
import { api } from '../api'

const DEPTS = {
  sws:                { label: 'Single Window System',  sub: 'Webhook detection'    },
  factories:          { label: 'Dept. of Factories',    sub: 'Webhook detection'    },
  shop_establishment: { label: 'Shop & Establishment',  sub: 'Polling every 10s'   },
  kspcb:              { label: 'Pollution Control Board', sub: 'Snapshot every 30s' },
}

const CB_BADGE = { closed: 'badge-green', open: 'badge-red', half_open: 'badge-amber' }
const CB_LABEL = { closed: 'Healthy', open: 'Circuit open', half_open: 'Recovering' }

export default function SystemStatus() {
  const [status, setStatus] = useState({})

  useEffect(() => {
    const load = () => api.status().then(setStatus).catch(() => {})
    load()
    const t = setInterval(load, 3000)
    return () => clearInterval(t)
  }, [])

  const entries = Object.entries(status).length
    ? Object.entries(status)
    : Object.keys(DEPTS).map(k => [k, null])

  return (
    <section>
      <div style={{ marginBottom: 14 }}>
        <div className="section-title">Connected Systems</div>
        <div className="section-sub">Live health of all department integrations</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {entries.map(([dept, info]) => {
          const meta   = DEPTS[dept] || { label: dept, sub: '' }
          const online = info?.reachable ?? null
          const cb     = info?.circuit || 'closed'

          return (
            <div key={dept} className="card" style={{ padding: '16px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%', marginTop: 4,
                  background: online === false ? 'var(--red)' : online ? 'var(--accent)' : 'var(--border-2)',
                  animation: online ? 'blink 2s ease-in-out infinite' : 'none',
                  flexShrink: 0,
                }} />
                <span className={`badge ${CB_BADGE[cb] || 'badge-gray'}`}>{CB_LABEL[cb] || cb}</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', marginBottom: 3 }}>{meta.label}</div>
              <div style={{ fontSize: 11, color: 'var(--text-4)' }}>{meta.sub}</div>
              <div style={{ marginTop: 12, fontSize: 11, color: online === false ? 'var(--red)' : online ? 'var(--accent)' : 'var(--text-4)', fontWeight: 500 }}>
                {online === false ? 'Offline' : online ? 'Online' : 'Connecting...'}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
