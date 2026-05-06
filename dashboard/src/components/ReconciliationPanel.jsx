import React, { useState, useEffect } from 'react'
import { api } from '../api'

export default function ReconciliationPanel() {
  const [findings, setFindings] = useState([])
  const [running, setRunning] = useState(false)

  useEffect(() => {
    api.findings().then(setFindings).catch(() => {})
  }, [])

  const run = async () => {
    setRunning(true)
    try {
      const result = await api.reconcile()
      setFindings(result.items || [])
    } finally {
      setRunning(false)
    }
  }

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ color: '#94a3b8', marginBottom: 8, fontSize: 14, textTransform: 'uppercase' }}>
        Reconciliation
      </h2>
      <button onClick={run} disabled={running} style={{
        background: running ? '#334155' : '#065f46', color: '#fff', border: 'none',
        borderRadius: 4, padding: '6px 14px', cursor: running ? 'not-allowed' : 'pointer',
        fontFamily: 'monospace', fontSize: 12, marginBottom: 10,
      }}>
        {running ? 'Running...' : '▶ Run Reconciliation Now'}
      </button>
      {findings.length === 0
        ? <p style={{ color: '#22c55e', fontSize: 12 }}>✓ No drift detected.</p>
        : findings.map((f, i) => (
          <div key={i} style={{
            background: '#1e293b', border: '1px solid #92400e',
            borderRadius: 6, padding: '8px 12px', marginBottom: 6,
          }}>
            <div style={{ color: '#fbbf24', fontSize: 12 }}>
              ⚠ {f.ubid} · <strong>{f.field}</strong>
            </div>
            <div style={{ marginTop: 4 }}>
              {Object.entries(f.values || {}).map(([dept, val]) => (
                <div key={dept} style={{ color: '#94a3b8', fontSize: 11 }}>
                  {dept}: <span style={{ color: '#e2e8f0' }}>{val}</span>
                </div>
              ))}
            </div>
          </div>
        ))
      }
    </div>
  )
}
