import asyncio, json, os
import redis.asyncio as aioredis
from deps import get_redis, get_db
from processors.translator import get_schemas, translate_event, get_targets
from processors.conflict import check_conflict
from processors.delivery import deliver

STREAMS = ["stream:sws_to_dept", "stream:dept_to_sws"]
GROUP = "syncbridge-workers"
CONSUMER = "worker-1"

async def _ensure_groups(redis: aioredis.Redis):
    for stream in STREAMS:
        try:
            await redis.xgroup_create(stream, GROUP, id="0", mkstream=True)
        except Exception:
            pass  # group already exists

async def consume_loop():
    redis = get_redis()
    await _ensure_groups(redis)
    schemas = get_schemas()

    while True:
        try:
            results = await redis.xreadgroup(
                GROUP, CONSUMER,
                {s: ">" for s in STREAMS},
                count=20,
                block=1000,
            )
            for stream_name, messages in (results or []):
                for msg_id, fields in messages:
                    await _handle(stream_name, msg_id, fields, redis, schemas)
        except Exception as e:
            print(f"[Consumer] error: {e}")
            await asyncio.sleep(1)

async def _handle(stream_name: str, msg_id: str, fields: dict,
                  redis: aioredis.Redis, schemas: dict):
    try:
        from audit.logger import log_audit
        changes: dict = json.loads(fields.get("changes", "{}"))
        source = fields["source"].lower()
        targets = get_targets(source)

        translated = {}
        for target in targets:
            t = translate_event(changes, source=source, target=target, schemas=schemas)
            if t:
                translated[target] = t

        conflict = await check_conflict(fields, redis=redis)
        delivery_status = await deliver(fields, translated, conflict)
        await log_audit(fields, translated, conflict, delivery_status)
        await redis.xack(stream_name, GROUP, msg_id)
    except Exception as e:
        print(f"[Consumer] failed msg {msg_id}: {e}")

async def start_consumer():
    asyncio.create_task(consume_loop())
