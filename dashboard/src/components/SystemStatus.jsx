import React, { useEffect, useState } from 'react'
import { api } from '../api'

const DEPTS = {
  sws:                { label: 'Single Window System',    short: 'SWS',     icon: '🏛️', desc: 'Main government portal', detection: 'Webhook',         color: '#2563eb' },
  factories:          { label: 'Dept. of Factories',      short: 'Factories', icon: '🏭', desc: 'Factory & industrial licenses', detection: 'Webhook',   color: '#7c3aed' },
  shop_establishment: { label: 'Shop & Establishment',    short: 'Shop Est.', icon: '🏪', desc: 'Shop licenses',          detection: 'Polling (10s)',  color: '#d97706' },
  kspcb:              { label: 'Pollution Control Board', short: 'KSPCB',   icon: '🌿', desc: 'Environmental compliance', detection: 'Snapshot (30s)', color: '#16a34a' },
}

const CB = {
  closed:    { label: 'Healthy',    badge: 'badge-green' },
  open:      { label: 'Tripped',    badge: 'badge-red'   },
  half_open: { label: 'Recovering', badge: 'badge-amber' },
}

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
    <section>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-1)' }}>Connected Systems</h2>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>Real-time health of all department integrations</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-4)' }}>
          <div className="live-dot" />
          Refreshes every 3s
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {(depts.length ? depts : Object.keys(DEPTS).map(k => [k, null])).map(([dept, info]) => {
          const meta    = DEPTS[dept] || { label: dept, icon: '🔲', desc: '', detection: '—', color: '#94a3b8' }
          const online  = info?.reachable ?? null
          const cb      = info?.circuit || 'closed'
          const cbMeta  = CB[cb] || CB.closed

          return (
            <div key={dept} className="card" style={{ overflow: 'hidden', transition: 'box-shadow 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-lg)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}
            >
              {/* Top color bar */}
              <div style={{ height: 4, background: online === false ? 'var(--red)' : online ? meta.color : 'var(--border)' }} />

              <div style={{ padding: '16px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10, fontSize: 20,
                    background: `${meta.color}12`, border: `1px solid ${meta.color}22`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{meta.icon}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{
                      width: 7, height: 7, borderRadius: '50%',
                      background: online === false ? 'var(--red)' : online ? 'var(--accent)' : 'var(--border-2)',
                      animation: online ? 'pulse-dot 1.5s ease-in-out infinite' : 'none',
                    }} />
                    <span style={{ fontSize: 11, fontWeight: 500, color: online === false ? 'var(--red)' : online ? 'var(--accent)' : 'var(--text-4)' }}>
                      {online === false ? 'Offline' : online ? 'Online' : '—'}
                    </span>
                  </div>
                </div>

                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', marginBottom: 2 }}>{meta.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-4)', marginBottom: 12 }}>{meta.desc}</div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: 'var(--text-4)' }}>Detection</span>
                    <span style={{ fontSize: 11, color: 'var(--text-2)', fontWeight: 500 }}>{meta.detection}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: 'var(--text-4)' }}>Circuit</span>
                    <span className={`badge ${cbMeta.badge}`}>{cbMeta.label}</span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
