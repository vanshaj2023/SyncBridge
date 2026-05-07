import json, os, time
import httpx
import redis.asyncio as aioredis
from deps import get_redis, get_db
from processors.circuit_breaker import get_breaker
from processors.dept_registry import get_dept_urls
from pii.scrambler import scramble_payload

DEPT_URLS = get_dept_urls()

# After delivering to polled/snapshot depts, update the snapshot baseline
# so the poller doesn't re-emit bridge-originated writes as new events (loop prevention)
SNAPSHOT_KEYS = {
    "shop_establishment": "snapshot:shop_establishment",
    "kspcb":              "snapshot:kspcb",
}

async def deliver(event: dict, translated: dict, conflict: dict | None,
                  redis: aioredis.Redis | None = None) -> dict:
    r = redis or get_redis()
    db = get_db()
    event_id = event["event_id"]
    status: dict[str, str] = {}

    if conflict and conflict["winner"].upper() != event["source"].upper():
        return {dept: "skipped_conflict_loser" for dept in translated}

    async with httpx.AsyncClient() as client:
        for dept, payload in translated.items():
            idem_key = f"processed:{event_id}:{dept}"

            if await r.exists(idem_key):
                status[dept] = "skipped_idempotent"
                continue

            breaker = get_breaker(dept)
            if not breaker.can_pass():
                status[dept] = "skipped_circuit_open"
                await _send_to_dlq(r, event, dept, payload, "circuit_open")
                continue

            t0 = time.monotonic()
            try:
                url = f"{DEPT_URLS[dept]}/business/{event['ubid']}"
                resp = await client.put(
                    url,
                    json=scramble_payload(payload),
                    headers={"X-SyncBridge-Origin": event_id},
                    timeout=5,
                )
                resp.raise_for_status()
                latency_ms = int((time.monotonic() - t0) * 1000)
                await r.setex(idem_key, 86400, "1")
                breaker.record_success()
                status[dept] = f"delivered:{latency_ms}ms"
                # Update snapshot baseline so poller/snapshotter won't re-emit this write
                if dept in SNAPSHOT_KEYS:
                    raw = await r.get(SNAPSHOT_KEYS[dept])
                    snap = json.loads(raw) if raw else {}
                    snap[event["ubid"]] = {**snap.get(event["ubid"], {}), **payload}
                    await r.set(SNAPSHOT_KEYS[dept], json.dumps(snap))
            except Exception as e:
                latency_ms = int((time.monotonic() - t0) * 1000)
                breaker.record_failure()
                status[dept] = f"failed:{type(e).__name__}"
                await _send_to_dlq(r, event, dept, payload, str(e)[:200])

    return status

async def _send_to_dlq(redis: aioredis.Redis, event: dict, dept: str, payload: dict, error: str):
    await redis.xadd("stream:dlq", {
        "event_id":    event["event_id"],
        "ubid":        event["ubid"],
        "source":      event["source"],
        "target":      dept,
        "payload":     json.dumps(payload),
        "error":       error,
        "retry_count": str(int(event.get("retry_count", "0"))),
    })
