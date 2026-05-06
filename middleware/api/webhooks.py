import uuid, os
from datetime import datetime, timezone
from fastapi import APIRouter
from deps import get_db

router = APIRouter()

def _now() -> str:
    return datetime.now(timezone.utc).isoformat()

@router.post("/{source}")
async def receive_webhook(source: str, payload: dict):
    changes = {}
    old = payload.get("old", {})
    new = payload.get("new", {})
    for field, value in new.items():
        if old.get(field) != value:
            changes[field] = value

    stream = "stream:dept_to_sws" if source.lower() != "sws" else "stream:sws_to_dept"
    event = {
        "event_id":        str(uuid.uuid4()),
        "ubid":            payload["ubid"],
        "source":          source.upper(),
        "changes":         changes,
        "old_snapshot":    old,
        "timestamp":       _now(),
        "detection_method": "webhook",
        "published":       False,
        "stream":          stream,
    }
    db = get_db()
    await db["outbox"].insert_one(event)
    return {"status": "queued", "event_id": event["event_id"]}
