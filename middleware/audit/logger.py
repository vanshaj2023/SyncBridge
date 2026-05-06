import uuid
from datetime import datetime, timezone
from deps import get_db

def _now() -> str:
    return datetime.now(timezone.utc).isoformat()

async def log_audit(event: dict, translated: dict, conflict: dict | None, delivery_status: dict):
    db = get_db()
    delivered = [d for d, s in delivery_status.items() if s.startswith("delivered")]
    failed    = [d for d, s in delivery_status.items() if s.startswith("failed")]
    skipped   = [d for d, s in delivery_status.items() if s.startswith("skipped")]

    if len(failed) > 0 and len(delivered) == 0:
        final = "failed"
    elif len(failed) > 0:
        final = "partial_success"
    else:
        final = "success"

    doc = {
        "_id":               str(uuid.uuid4()),
        "event_id":          event.get("event_id"),
        "ubid":              event.get("ubid"),
        "source":            event.get("source"),
        "changes":           event.get("changes", "{}"),
        "detection_method":  event.get("detection_method"),
        "targets_attempted": list(translated.keys()),
        "targets_delivered": delivered,
        "targets_failed":    failed,
        "targets_skipped":   skipped,
        "delivery_status":   delivery_status,
        "conflict":          conflict,
        "final_status":      final,
        "timestamp":         _now(),
    }
    await db["audit_log"].insert_one(doc)
