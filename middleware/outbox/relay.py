import asyncio, json, os
from deps import get_db, get_redis

RELAY_INTERVAL = 0.5

async def relay_loop():
    db = get_db()
    redis = get_redis()
    while True:
        try:
            async for doc in db["outbox"].find({"published": False}).limit(50):
                stream = doc.get("stream", "stream:sws_to_dept")
                payload = {
                    "event_id":         doc["event_id"],
                    "ubid":             doc["ubid"],
                    "source":           doc["source"],
                    "changes":          json.dumps(doc.get("changes", {})),
                    "old_snapshot":     json.dumps(doc.get("old_snapshot", {})),
                    "timestamp":        doc["timestamp"],
                    "detection_method": doc.get("detection_method", "webhook"),
                }
                await redis.xadd(stream, payload)
                await db["outbox"].update_one(
                    {"_id": doc["_id"]},
                    {"$set": {"published": True}}
                )
        except Exception as e:
            print(f"[Relay] error: {e}")
        await asyncio.sleep(RELAY_INTERVAL)

async def start_relay():
    asyncio.create_task(relay_loop())
