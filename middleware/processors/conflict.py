import json, os
import redis.asyncio as aioredis
from deps import get_redis

WINDOW = int(os.getenv("CONFLICT_WINDOW_SECONDS", "5"))

async def check_conflict(event: dict, redis: aioredis.Redis | None = None) -> dict | None:
    r = redis or get_redis()
    changes: dict = json.loads(event.get("changes", "{}"))
    ubid = event["ubid"]
    source = event["source"]
    conflict = None

    for field in changes:
        key = f"inflight:{ubid}:{field}"
        existing_raw = await r.get(key)
        if existing_raw:
            existing = json.loads(existing_raw)
            if existing["source"] != source:
                winner = "SWS" if "SWS" in [source, existing["source"]] else source
                conflict = {
                    "competing_event_id": existing["event_id"],
                    "competing_source":   existing["source"],
                    "resolution_policy":  "SWS_PRIORITY",
                    "winner":             winner,
                    "reason": (
                        f"Conflict on field '{field}' between {source} and {existing['source']} "
                        f"within {WINDOW}s window. SWS-priority policy applied. Winner: {winner}."
                    ),
                }
        await r.setex(key, WINDOW, json.dumps({"event_id": event["event_id"], "source": source}))

    return conflict
