import asyncio, uuid, json, os
import httpx
from datetime import datetime, timezone
from deps import get_redis, get_db

SHOP_URL = os.getenv("SHOP_ESTAB_URL", "http://localhost:8002")
POLL_INTERVAL = int(os.getenv("POLL_INTERVAL_SECONDS", "10"))
BOOTSTRAP_KEY = "bootstrap:shop_establishment"
SNAPSHOT_KEY = "snapshot:shop_establishment"

def _now() -> str:
    return datetime.now(timezone.utc).isoformat()

async def poll_loop():
    redis = get_redis()
    async with httpx.AsyncClient() as client:
        while True:
            try:
                resp = await client.get(f"{SHOP_URL}/state", timeout=5)
                current: dict = resp.json()

                if not await redis.exists(BOOTSTRAP_KEY):
                    await redis.set(SNAPSHOT_KEY, json.dumps(current))
                    await redis.set(BOOTSTRAP_KEY, "1")
                    print("[Poller] Bootstrap complete — baseline stored, no events emitted")
                    await asyncio.sleep(POLL_INTERVAL)
                    continue

                raw = await redis.get(SNAPSHOT_KEY)
                previous: dict = json.loads(raw) if raw else {}

                for ubid, fields in current.items():
                    old = previous.get(ubid, {})
                    changes = {f: v for f, v in fields.items() if old.get(f) != v}
                    if changes:
                        event = {
                            "event_id":         str(uuid.uuid4()),
                            "ubid":             ubid,
                            "source":           "SHOP_ESTABLISHMENT",
                            "changes":          json.dumps(changes),
                            "old_snapshot":     json.dumps(old),
                            "timestamp":        _now(),
                            "detection_method": "polling",
                        }
                        await redis.xadd("stream:dept_to_sws", event)

                await redis.set(SNAPSHOT_KEY, json.dumps(current))
            except Exception as e:
                print(f"[Poller] error: {e}")
            await asyncio.sleep(POLL_INTERVAL)

async def start_poller():
    asyncio.create_task(poll_loop())
