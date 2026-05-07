import React, { useState, useEffect } from 'react'
import { api } from '../api'

export default function ReconciliationPanel() {
  const [findings, setFindings] = useState([])
  const [running, setRunning]   = useState(false)
  const [hasRun, setHasRun]     = useState(false)
  const [lastRun, setLastRun]   = useState(null)

  useEffect(() => { api.findings().then(setFindings).catch(() => {}) }, [])

  const run = async () => {
    setRunning(true)
    try {
      const result = await api.reconcile()
      setFindings(result.items || [])
      setLastRun(new Date().toLocaleTimeString())
      setHasRun(true)
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="section-title">Reconciliation</div>
        <div className="section-sub">Scans all departments for records that drifted out of sync</div>
      </div>

      <div className="card-body">
        <div style={{ background: 'var(--accent-bg)', border: '1px solid var(--accent-bd)', borderRadius: 7, padding: '9px 12px', marginBottom: 14, fontSize: 12, color: 'var(--accent)' }}>
          Fetches live state from all 4 departments, translates fields to canonical names, and compares. Detects drift even without a sync event.
        </div>

        <button onClick={run} disabled={running} className="btn btn-primary" style={{ width: '100%', padding: '10px', fontSize: 13, marginBottom: 14 }}>
          {running ? 'Scanning...' : 'Run Reconciliation Now'}
        </button>

        {lastRun && <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-4)', marginBottom: 12 }}>Last run at {lastRun}</div>}

        {!hasRun ? (
          <div style={{ textAlign: 'center', padding: '24px', border: '1px dashed var(--border)', borderRadius: 8 }}>
            <div style={{ fontSize: 12, color: 'var(--text-4)' }}>Click the button above to scan for drift</div>
          </div>
        ) : findings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px' }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--accent)', marginBottom: 4 }}>All systems in sync</div>
            <div style={{ fontSize: 12, color: 'var(--text-4)' }}>No drift detected</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflowY: 'auto' }}>
            <div style={{ fontSize: 11, color: 'var(--amber)', fontWeight: 500, marginBottom: 4 }}>{findings.length} drift(s) found</div>
            {findings.map((f, i) => (
              <div key={i} style={{ padding: '11px 13px', background: 'var(--amber-bg)', border: '1px solid var(--amber-bd)', borderRadius: 8 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)' }}>{f.ubid}</span>
                  <span className="badge badge-amber">{f.field}</span>
                </div>
                {Object.entries(f.values || {}).map(([dept, val]) => (
                  <div key={dept} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 3 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-3)', width: 130 }}>{dept.replace(/_/g, ' ')}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-1)', fontFamily: 'monospace' }}>"{val}"</span>
                  </div>
                ))}
                <div style={{ fontSize: 10, color: 'var(--text-4)', marginTop: 6 }}>{f.detected_at?.slice(0,19).replace('T',' ')} UTC</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
