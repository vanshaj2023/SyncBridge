import React, { useState, useEffect } from 'react'
import { api } from '../api'

const DEPT_ICON = { sws: '🏛️', factories: '🏭', shop_establishment: '🏪', kspcb: '🌿' }

export default function ReconciliationPanel() {
  const [findings, setFindings] = useState([])
  const [running, setRunning]   = useState(false)
  const [lastRun, setLastRun]   = useState(null)
  const [hasRun, setHasRun]     = useState(false)

  useEffect(() => { api.findings().then(setFindings).catch(() => {}) }, [])

  const run = async () => {
    setRunning(true)
    try {
      const result = await api.reconcile()
      setFindings(result.items || [])
      setLastRun(new Date().toLocaleTimeString('en-GB', { hour12: false }))
      setHasRun(true)
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-1)' }}>Reconciliation</h2>
        <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3 }}>
          Scans all departments for records that drifted out of sync — even without a sync event
        </p>
      </div>

      <div className="card-body">
        {/* Explainer */}
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#166534', display: 'flex', gap: 8 }}>
          <span>💡</span>
          <span>Fetches live state from all 4 departments, translates to canonical field names, and compares. Finds drift even when no sync event was triggered — e.g. a database edit made directly.</span>
        </div>

        <button onClick={run} disabled={running} className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center', padding: '11px', fontSize: 13, borderRadius: 9, marginBottom: 16 }}>
          {running ? '⏳ Scanning all departments…' : '▶ Run Reconciliation Now'}
        </button>

        {lastRun && (
          <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-4)', marginBottom: 14 }}>
            Last scanned at {lastRun}
          </div>
        )}

        {!hasRun ? (
          <div style={{ textAlign: 'center', padding: '24px 20px', border: '2px dashed var(--border)', borderRadius: 10 }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🔍</div>
            <div style={{ fontSize: 12, color: 'var(--text-4)' }}>Click the button above to scan for drift</div>
          </div>
        ) : findings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '28px 20px' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--accent)', marginBottom: 4 }}>All systems in sync</div>
            <div style={{ fontSize: 12, color: 'var(--text-4)' }}>No drift detected across any department</div>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span className="badge badge-amber">⚠ {findings.length} drift{findings.length > 1 ? 's' : ''} found</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 340, overflowY: 'auto' }}>
              {findings.map((f, i) => (
                <div key={i} style={{ padding: '12px 14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 9 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>{f.ubid}</span>
                    <span className="badge badge-amber">field: {f.field}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {Object.entries(f.values || {}).map(([dept, val]) => (
                      <div key={dept} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontSize: 14 }}>{DEPT_ICON[dept] || '🔲'}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-3)', width: 130 }}>{dept.replace(/_/g, ' ')}</span>
                        <span style={{ fontSize: 12, color: 'var(--text-1)', fontFamily: 'monospace', fontWeight: 500 }}>"{val}"</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-4)', marginTop: 8 }}>
                    Detected {f.detected_at?.slice(0, 19).replace('T', ' ')} UTC
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
