import json, os
import redis.asyncio as aioredis
from deps import get_redis

WINDOW = int(os.getenv("CONFLICT_WINDOW_SECONDS", "5"))
# Supported values: SWS_PRIORITY | LATEST_WRITE | MANUAL
CONFLICT_POLICY = os.getenv("CONFLICT_POLICY", "SWS_PRIORITY").upper()

def _resolve_winner(source: str, existing_source: str, field: str) -> tuple[str, str]:
    """Return (winner, reason) based on configured policy."""
    if CONFLICT_POLICY == "SWS_PRIORITY":
        winner = "SWS" if "SWS" in [source.upper(), existing_source.upper()] else source
        reason = (
            f"Conflict on field '{field}' between {source} and {existing_source} "
            f"within {WINDOW}s window. SWS_PRIORITY policy: SWS is source of truth. Winner: {winner}."
        )
    elif CONFLICT_POLICY == "LATEST_WRITE":
        winner = source  # current event is the newer write
        reason = (
            f"Conflict on field '{field}' between {source} and {existing_source} "
            f"within {WINDOW}s window. LATEST_WRITE policy: most recent update wins. Winner: {winner}."
        )
    elif CONFLICT_POLICY == "MANUAL":
        winner = "PENDING_REVIEW"
        reason = (
            f"Conflict on field '{field}' between {source} and {existing_source} "
            f"within {WINDOW}s window. MANUAL policy: flagged for human review. No auto-resolution."
        )
    else:
        winner = source
        reason = f"Unknown policy '{CONFLICT_POLICY}', defaulting to latest write. Winner: {winner}."
    return winner, reason

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
            if existing["source"].upper() != source.upper():
                winner, reason = _resolve_winner(source, existing["source"], field)
                conflict = {
                    "competing_event_id": existing["event_id"],
                    "competing_source":   existing["source"],
                    "resolution_policy":  CONFLICT_POLICY,
                    "winner":             winner,
                    "reason":             reason,
                }
        await r.setex(key, WINDOW, json.dumps({"event_id": event["event_id"], "source": source}))

    return conflict
