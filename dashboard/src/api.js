const BASE = import.meta.env.VITE_MIDDLEWARE_URL || (window.location.hostname === 'localhost' ? 'http://localhost:9000' : '/api')

export const api = {
  events:      () => fetch(`${BASE}/audit/events?limit=50`).then(r => r.json()),
  conflicts:   () => fetch(`${BASE}/audit/conflicts?limit=20`).then(r => r.json()),
  dlq:         () => fetch(`${BASE}/dlq`).then(r => r.json()),
  status:      () => fetch(`${BASE}/status`).then(r => r.json()),
  findings:    () => fetch(`${BASE}/reconcile/findings?limit=20`).then(r => r.json()),
  reconcile:   () => fetch(`${BASE}/reconcile/now`, { method: 'POST' }).then(r => r.json()),
  replayEvent: (id) => fetch(`${BASE}/dlq/replay/${id}`, { method: 'POST' }).then(r => r.json()),
  replayAll:   () => fetch(`${BASE}/dlq/replay-all`, { method: 'POST' }).then(r => r.json()),
  trigger:     (source, ubid, payload) =>
    fetch(`${BASE}/mock-trigger/${source}/${ubid}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(r => r.json()),
}
