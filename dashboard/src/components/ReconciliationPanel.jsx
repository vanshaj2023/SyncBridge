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
    <section className="card">
      <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)' }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>Reconciliation</h2>
        <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>Scans all departments for records that drifted out of sync</p>
      </div>

      <div style={{ padding: '18px 22px' }}>
        <div style={{ background: 'var(--blue-bg)', border: '1px solid var(--blue-bd)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: 'var(--blue)', lineHeight: 1.5 }}>
          Fetches live state from all 4 departments, translates fields to canonical names, and compares. Detects drift even without a sync event.
        </div>

        <button onClick={run} disabled={running} className="btn btn-primary" style={{ width: '100%', padding: '11px', fontSize: 13, marginBottom: 14 }}>
          {running ? 'Scanning...' : 'Run Reconciliation Now'}
        </button>

        {lastRun && (
          <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-4)', marginBottom: 14 }}>Last scan at {lastRun}</div>
        )}

        {!hasRun ? (
          <div style={{ textAlign: 'center', padding: '28px 20px', border: '1px dashed var(--border)', borderRadius: 8 }}>
            <div style={{ fontSize: 12, color: 'var(--text-4)' }}>Click the button above to scan for drift</div>
          </div>
        ) : findings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '28px 20px' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--green-bg)', border: '1px solid var(--green-bd)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 7l3 3 6-6" stroke="var(--green)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-1)', marginBottom: 4 }}>All systems in sync</div>
            <div style={{ fontSize: 12, color: 'var(--text-4)' }}>No drift detected across any department</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflowY: 'auto' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--amber)', marginBottom: 4 }}>{findings.length} drift(s) detected</div>
            {findings.map((f, i) => (
              <div key={i} style={{ padding: '13px 15px', background: 'var(--amber-bg)', border: '1px solid var(--amber-bd)', borderRadius: 9 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)', fontFamily: 'monospace' }}>{f.ubid}</span>
                  <span className="badge badge-amber">{f.field}</span>
                </div>
                {Object.entries(f.values || {}).map(([dept, val]) => (
                  <div key={dept} style={{ display: 'flex', gap: 10, alignItems: 'baseline', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-3)', width: 130, flexShrink: 0 }}>{dept.replace(/_/g, ' ')}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-1)', fontFamily: 'monospace' }}>"{val}"</span>
                  </div>
                ))}
                <div style={{ fontSize: 10, color: 'var(--text-4)', marginTop: 8 }}>{f.detected_at?.slice(0, 19).replace('T', ' ')} UTC</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
