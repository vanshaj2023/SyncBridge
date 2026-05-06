import React, { useState } from 'react'
import { api } from '../api'

const UBID = 'KA-2024-MFG-00123'

const scenarios = [
  {
    label: '🌱 Seed Test Business',
    color: '#0369a1',
    fires: [
      { source: 'sws', payload: { registered_address: '12 MG Road Bengaluru', business_name: 'Acme Manufacturing', phone: '+919876543210' } },
    ],
  },
  {
    label: '⚡ Trigger Address Conflict',
    color: '#7c3aed',
    fires: [
      { source: 'sws',       payload: { registered_address: 'SWS Address — Brigade Road' } },
      { source: 'factories', payload: { factory_address:    'Factories Address — MG Road' } },
    ],
  },
  {
    label: '⚡ Trigger Signatory Conflict',
    color: '#be185d',
    fires: [
      { source: 'sws',       payload: { authorized_signatory: 'SWS Officer' } },
      { source: 'factories', payload: { signatory_name:       'Factories Officer' } },
    ],
  },
]

export default function ConflictTrigger() {
  const [log, setLog] = useState([])

  const fire = async (scenario) => {
    const results = await Promise.all(
      scenario.fires.map(({ source, payload }) => api.trigger(source, UBID, payload))
    )
    setLog(prev => [
      `[${new Date().toLocaleTimeString()}] ${scenario.label} → ${JSON.stringify(results)}`,
      ...prev.slice(0, 9)
    ])
  }

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ color: '#94a3b8', marginBottom: 12, fontSize: 14, textTransform: 'uppercase' }}>
        Demo Controls
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {scenarios.map(s => (
          <button key={s.label} onClick={() => fire(s)} style={{
            background: s.color, color: '#fff', border: 'none', borderRadius: 6,
            padding: '10px 16px', cursor: 'pointer', fontFamily: 'monospace', fontSize: 13,
          }}>
            {s.label}
          </button>
        ))}
      </div>
      <div style={{ marginTop: 12, fontSize: 11, color: '#64748b', wordBreak: 'break-all' }}>
        {log.map((l, i) => <div key={i} style={{ marginBottom: 4 }}>{l}</div>)}
      </div>
    </div>
  )
}
