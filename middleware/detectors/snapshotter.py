import asyncio, uuid, json, os
import httpx
from datetime import datetime, timezone
from deps import get_redis

KSPCB_URL = os.getenv("KSPCB_URL", "http://localhost:8003")
SNAPSHOT_INTERVAL = int(os.getenv("SNAPSHOT_INTERVAL_SECONDS", "30"))
BOOTSTRAP_KEY = "bootstrap:kspcb"
SNAPSHOT_KEY = "snapshot:kspcb"

def _now() -> str:
    return datetime.now(timezone.utc).isoformat()

async def snapshot_loop():
    redis = get_redis()
    async with httpx.AsyncClient() as client:
        while True:
            try:
                resp = await client.get(f"{KSPCB_URL}/state", timeout=5)
                current: dict = resp.json()

                if not await redis.exists(BOOTSTRAP_KEY):
                    await redis.set(SNAPSHOT_KEY, json.dumps(current))
                    await redis.set(BOOTSTRAP_KEY, "1")
                    print("[Snapshotter] Bootstrap complete")
                    await asyncio.sleep(SNAPSHOT_INTERVAL)
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
                            "source":           "KSPCB",
                            "changes":          json.dumps(changes),
                            "old_snapshot":     json.dumps(old),
                            "timestamp":        _now(),
                            "detection_method": "snapshot",
                        }
                        await redis.xadd("stream:dept_to_sws", event)

                await redis.set(SNAPSHOT_KEY, json.dumps(current))
            except Exception as e:
                print(f"[Snapshotter] error: {e}")
            await asyncio.sleep(SNAPSHOT_INTERVAL)

async def start_snapshotter():
    asyncio.create_task(snapshot_loop())
