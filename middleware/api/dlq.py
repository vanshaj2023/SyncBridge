import json
from datetime import datetime, timezone
from fastapi import APIRouter
from deps import get_redis

router = APIRouter()

@router.get("")
async def list_dlq():
    redis = get_redis()
    msgs = await redis.xrange("stream:dlq", count=100)
    return [{"msg_id": mid, **fields} for mid, fields in msgs]

@router.post("/replay/{event_id}")
async def replay_event(event_id: str):
    redis = get_redis()
    msgs = await redis.xrange("stream:dlq", count=500)
    replayed = []
    for msg_id, fields in msgs:
        if fields.get("event_id") == event_id:
            retry = int(fields.get("retry_count", "0")) + 1
            payload = json.loads(fields.get("payload", "{}"))
            await redis.xadd("stream:dept_to_sws", {
                "event_id":         fields["event_id"],
                "ubid":             fields["ubid"],
                "source":           fields["source"],
                "changes":          json.dumps(payload),
                "old_snapshot":     "{}",
                "timestamp":        datetime.now(timezone.utc).isoformat(),
                "detection_method": "dlq_replay",
                "retry_count":      str(retry),
            })
            await redis.xdel("stream:dlq", msg_id)
            replayed.append(event_id)
    return {"replayed": replayed}

@router.post("/replay-all")
async def replay_all():
    redis = get_redis()
    msgs = await redis.xrange("stream:dlq", count=500)
    replayed = []
    for msg_id, fields in msgs:
        retry = int(fields.get("retry_count", "0")) + 1
        payload = json.loads(fields.get("payload", "{}"))
        await redis.xadd("stream:dept_to_sws", {
            "event_id":         fields["event_id"],
            "ubid":             fields["ubid"],
            "source":           fields["source"],
            "changes":          json.dumps(payload),
            "old_snapshot":     "{}",
            "timestamp":        datetime.now(timezone.utc).isoformat(),
            "detection_method": "dlq_replay",
            "retry_count":      str(retry),
        })
        await redis.xdel("stream:dlq", msg_id)
        replayed.append(fields["event_id"])
    return {"replayed_count": len(replayed), "replayed": replayed}
