import json, os
from datetime import datetime, timezone
from fastapi import APIRouter
import httpx
from deps import get_redis

router = APIRouter()

DEPT_URLS = {
    "sws":                os.getenv("SWS_URL", "http://localhost:8000"),
    "factories":          os.getenv("FACTORIES_URL", "http://localhost:8001"),
    "shop_establishment": os.getenv("SHOP_ESTAB_URL", "http://localhost:8002"),
    "kspcb":              os.getenv("KSPCB_URL", "http://localhost:8003"),
}

@router.get("")
async def list_dlq():
    redis = get_redis()
    msgs = await redis.xrange("stream:dlq", count=100)
    return [{"msg_id": mid, **fields} for mid, fields in msgs]

async def _direct_deliver(fields: dict) -> bool:
    """Deliver a DLQ entry directly to its target department."""
    target = fields.get("target", "")
    ubid = fields.get("ubid", "")
    payload = json.loads(fields.get("payload", "{}"))
    url = DEPT_URLS.get(target)
    if not url:
        return False
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.put(
                f"{url}/business/{ubid}",
                json=payload,
                headers={"X-SyncBridge-Origin": fields.get("event_id", "dlq-replay")},
                timeout=5,
            )
            resp.raise_for_status()
            return True
        except Exception:
            return False

@router.post("/replay/{event_id}")
async def replay_event(event_id: str):
    redis = get_redis()
    msgs = await redis.xrange("stream:dlq", count=500)
    replayed = []
    for msg_id, fields in msgs:
        if fields.get("event_id") == event_id:
            success = await _direct_deliver(fields)
            if success:
                await redis.xdel("stream:dlq", msg_id)
                replayed.append(event_id)
    return {"replayed": replayed}

@router.post("/replay-all")
async def replay_all():
    redis = get_redis()
    msgs = await redis.xrange("stream:dlq", count=500)
    replayed = []
    for msg_id, fields in msgs:
        success = await _direct_deliver(fields)
        if success:
            await redis.xdel("stream:dlq", msg_id)
            replayed.append(fields["event_id"])
    return {"replayed_count": len(replayed), "replayed": replayed}
