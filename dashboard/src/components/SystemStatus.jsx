import React, { useEffect, useState } from 'react'
import { api } from '../api'

const DEPTS = {
  sws:                { label: 'Single Window System',   desc: 'Primary government portal',      detection: 'Webhook'        },
  factories:          { label: 'Dept. of Factories',     desc: 'Industrial & factory licenses',  detection: 'Webhook'        },
  shop_establishment: { label: 'Shop & Establishment',   desc: 'Shop & trade licenses',          detection: 'Polling / 10s'  },
  kspcb:              { label: 'Pollution Control Board',desc: 'Environmental compliance',        detection: 'Snapshot / 30s' },
}
const CB_LABEL = { closed: 'Healthy', open: 'Open', half_open: 'Recovering' }
const CB_BADGE = { closed: 'badge-green', open: 'badge-red', half_open: 'badge-amber' }

export default function SystemStatus() {
  const [status, setStatus] = useState({})

  useEffect(() => {
    const load = () => api.status().then(setStatus).catch(() => {})
    load()
    const t = setInterval(load, 3000)
    return () => clearInterval(t)
  }, [])

  const entries = Object.keys(status).length
    ? Object.entries(status)
    : Object.keys(DEPTS).map(k => [k, null])

  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>Connected Systems</h2>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>Real-time health of all department integrations</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-4)' }}>
          <div className="live-dot" style={{ width: 5, height: 5 }} />
          Refreshes every 3s
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {entries.map(([dept, info], i) => {
          const meta   = DEPTS[dept] || { label: dept, desc: '', detection: '—' }
          const online = info?.reachable ?? null
          const cb     = info?.circuit   || 'closed'
          const loading = info === null

          return (
            <div key={dept} className="card card-lift" style={{ padding: '18px 20px', animationDelay: `${i * 0.05}s` }}>
              {loading ? (
                <>
                  <div className="skeleton" style={{ height: 12, width: '60%', marginBottom: 8 }} />
                  <div className="skeleton" style={{ height: 10, width: '80%', marginBottom: 16 }} />
                  <div className="skeleton" style={{ height: 10, width: '40%' }} />
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{
                        width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                        background: online === false ? 'var(--red)' : online ? 'var(--green)' : 'var(--border-2)',
                        animation: online ? 'pulse 2s ease-in-out infinite' : 'none',
                      }} />
                      <span style={{ fontSize: 11, fontWeight: 500, color: online === false ? 'var(--red)' : online ? 'var(--green)' : 'var(--text-4)' }}>
                        {online === false ? 'Offline' : online ? 'Online' : '—'}
                      </span>
                    </div>
                    <span className={`badge ${CB_BADGE[cb] || 'badge-gray'}`}>{CB_LABEL[cb] || cb}</span>
                  </div>

                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', letterSpacing: '-0.01em', marginBottom: 3 }}>{meta.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-4)', marginBottom: 14 }}>{meta.desc}</div>

                  <div style={{ paddingTop: 12, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Detection</span>
                    <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-2)' }}>{meta.detection}</span>
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
