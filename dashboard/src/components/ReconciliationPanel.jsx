import React, { useState, useEffect } from 'react'
import { api } from '../api'

const DEPT_ICON = { sws: '🏛️', factories: '🏭', shop_establishment: '🏪', kspcb: '🌿' }

export default function ReconciliationPanel() {
  const [findings, setFindings] = useState([])
  const [running, setRunning]   = useState(false)
  const [lastRun, setLastRun]   = useState(null)

  useEffect(() => {
    api.findings().then(setFindings).catch(() => {})
  }, [])

  const run = async () => {
    setRunning(true)
    try {
      const result = await api.reconcile()
      setFindings(result.items || [])
      setLastRun(new Date().toLocaleTimeString())
    } finally {
      setRunning(false)
    }
  }

  return (
    <div style={{ background: '#1e293b', borderRadius: 10, border: '1px solid #334155', overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #334155', background: '#162032' }}>
        <h2 style={{ color: '#e2e8f0', fontSize: 16, margin: 0, fontWeight: 600 }}>🔍 Reconciliation</h2>
        <p style={{ color: '#64748b', fontSize: 12, margin: '4px 0 0' }}>
          Scans all departments and finds records that are out of sync — even if no event was triggered.
        </p>
      </div>

      <div style={{ padding: 16 }}>

        {/* What is reconciliation */}
        <div style={{ background: '#0f172a', borderRadius: 6, padding: '10px 14px', marginBottom: 14, border: '1px solid #1e3a5f' }}>
          <div style={{ color: '#64748b', fontSize: 11 }}>
            💡 <strong style={{ color: '#94a3b8' }}>What does this do?</strong> It fetches the current state from all 4 departments,
            translates every field to canonical names, and compares them. If Factories has a different address than SWS — even if no sync was triggered — this finds it.
          </div>
        </div>

        <button onClick={run} disabled={running} style={{
          background: running ? '#334155' : '#065f46', color: '#fff', border: 'none',
          borderRadius: 8, padding: '10px 18px', cursor: running ? 'not-allowed' : 'pointer',
          fontSize: 13, fontWeight: 600, width: '100%', marginBottom: 14, transition: 'background 0.15s',
        }}>
          {running ? '⏳ Scanning all departments...' : '▶ Run Reconciliation Now'}
        </button>

        {lastRun && (
          <div style={{ color: '#475569', fontSize: 11, marginBottom: 12, textAlign: 'center' }}>
            Last run at {lastRun}
          </div>
        )}

        {findings.length === 0 && lastRun ? (
          <div style={{ textAlign: 'center', padding: '24px 20px' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>✅</div>
            <div style={{ color: '#22c55e', fontSize: 14, fontWeight: 600 }}>All systems in sync</div>
            <div style={{ color: '#475569', fontSize: 12, marginTop: 4 }}>No drift detected across any department</div>
          </div>
        ) : findings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 20px', color: '#475569', fontSize: 12 }}>
            Click the button to scan for drift
          </div>
        ) : (
          <div>
            <div style={{ color: '#f59e0b', fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
              ⚠️ {findings.length} drift(s) found
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflowY: 'auto' }}>
              {findings.map((f, i) => (
                <div key={i} style={{
                  background: '#0f172a', border: '1px solid #92400e',
                  borderRadius: 8, padding: '12px 14px',
                }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ color: '#fbbf24', fontSize: 13, fontWeight: 600 }}>
                      {f.ubid}
                    </span>
                    <span style={{ background: '#92400e', borderRadius: 4, padding: '1px 8px', fontSize: 10, color: '#fde68a' }}>
                      field: {f.field}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {Object.entries(f.values || {}).map(([dept, val]) => (
                      <div key={dept} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontSize: 14 }}>{DEPT_ICON[dept] || '🔲'}</span>
                        <span style={{ color: '#64748b', fontSize: 11, width: 120 }}>
                          {dept.replace(/_/g, ' ')}:
                        </span>
                        <span style={{ color: '#e2e8f0', fontSize: 11, fontFamily: 'monospace' }}>
                          "{val}"
                        </span>
                      </div>
                    ))}
                  </div>
                  <div style={{ color: '#475569', fontSize: 10, marginTop: 8 }}>
                    Detected at {f.detected_at?.slice(11, 19)} UTC
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
