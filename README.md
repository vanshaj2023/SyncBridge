# SyncBridge

Two-way interoperability middleware for Karnataka's Single Window System (SWS) and legacy department systems.

## Quick Start

```bash
docker compose up --build -d
```

Open dashboard: http://localhost:3000
Middleware API: http://localhost:9000
API docs: http://localhost:9000/docs

## Architecture

```
SWS (webhook) ──────────────────────────────────────────┐
Factories (webhook) ─────────────────────────────────┐   │
Shop Establishment ──(polling every 10s)──────────┐  │   │
KSPCB ──────────────────(snapshot every 30s)──┐   │  │   │
                                              ↓   ↓  ↓   ↓
                                    ┌─── SyncBridge Middleware ───┐
                                    │  MongoDB Outbox → Redis      │
                                    │  Streams → Consumer          │
                                    │  Translate → Conflict Check  │
                                    │  → Idempotent Delivery       │
                                    │  → Audit Log                 │
                                    └──────────────────────────────┘
```

## Key Features

- **Two-way sync**: SWS ↔ 4 legacy systems
- **Three detection modes**: webhooks, polling, snapshot diff
- **Loop prevention**: X-SyncBridge-Origin header stops infinite loops
- **Conflict resolution**: SWS-priority policy with full audit trail
- **Idempotent delivery**: Replay-safe — same event twice = same result
- **Dead Letter Queue**: Failed deliveries are retryable from the dashboard
- **Reconciliation**: Periodic drift detection across all systems
- **Circuit breakers**: Failing departments isolated, auto-recover
- **PII protection**: SCRAMBLE_MODE=SCRAMBLED hashes all PII in logs

## Services

| Service | Port | Description |
|---|---|---|
| Dashboard | 3000 | Live monitoring UI |
| Middleware | 9000 | SyncBridge API |
| Mock SWS | 8000 | Single Window System (webhook) |
| Mock Factories | 8001 | Factories dept (webhook) |
| Mock Shop Establishment | 8002 | Shop Estab dept (polling) |
| Mock KSPCB | 8003 | KSPCB dept (snapshot) |
| Redis | 6379 | Event streams + idempotency |
| MongoDB | 27017 | Audit log + outbox + findings |

## Running Tests

```bash
pip install pytest pytest-asyncio fakeredis[aioredis] pyyaml motor httpx
python -m pytest tests/ -v
```

## Demo Script (for evaluators)

1. **Seed**: Click "Seed Test Business" in dashboard
2. **Propagation**: Watch EventFeed — 3 deliveries appear (factories, shop_establishment, kspcb)
3. **Conflict**: Click "Trigger Address Conflict" — see purple conflict row in feed
4. **DLQ**: Stop mock-kspcb container, trigger update, watch DLQ fill, restart, click Replay All
5. **Reconciliation**: Corrupt Factories via its API, click "Run Reconciliation", see drift detected
