import React from 'react'
import EventFeed from './components/EventFeed'
import SystemStatus from './components/SystemStatus'
import ConflictTrigger from './components/ConflictTrigger'
import DLQPanel from './components/DLQPanel'
import ReconciliationPanel from './components/ReconciliationPanel'

const card = {
  background: '#1e293b',
  borderRadius: 8,
  border: '1px solid #334155',
}

export default function App() {
  return (
    <div style={{ minHeight: '100vh', padding: 16 }}>
      <div style={{ textAlign: 'center', padding: '16px 0 24px' }}>
        <h1 style={{ color: '#7dd3fc', fontSize: 22, fontWeight: 'bold' }}>
          SyncBridge
        </h1>
        <p style={{ color: '#64748b', fontSize: 13 }}>
          Two-way interoperability for Karnataka's SWS + Legacy Systems
        </p>
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 12,
        maxWidth: 1200,
        margin: '0 auto',
      }}>
        <div style={card}><SystemStatus /></div>
        <div style={card}><ConflictTrigger /></div>
        <div style={{ ...card, gridColumn: '1 / -1' }}><EventFeed /></div>
        <div style={card}><DLQPanel /></div>
        <div style={card}><ReconciliationPanel /></div>
      </div>
    </div>
  )
}
