import pytest, asyncio, sys, os, json
sys.path.insert(0, "middleware")
os.environ.update({
    "SWS_URL": "http://mock-sws:8000",
    "FACTORIES_URL": "http://mock-factories:8001",
    "SHOP_ESTAB_URL": "http://mock-shop-establishment:8002",
    "KSPCB_URL": "http://mock-kspcb:8003",
    "SCRAMBLE_MODE": "RAW",
})
import fakeredis.aioredis as fakeredis
from unittest.mock import AsyncMock, patch, MagicMock

@pytest.fixture
def fake_redis():
    return fakeredis.FakeRedis(decode_responses=True)

@pytest.mark.asyncio
async def test_skips_delivery_if_conflict_loser(fake_redis):
    from processors.delivery import deliver
    event = {"event_id": "e1", "ubid": "KA-001", "source": "FACTORIES"}
    conflict = {"winner": "SWS"}
    translated = {"sws": {"registered_address": "New Address"}}
    with patch("processors.delivery.get_redis", return_value=fake_redis):
        with patch("processors.delivery.get_db"):
            status = await deliver(event, translated, conflict)
    assert status["sws"] == "skipped_conflict_loser"

@pytest.mark.asyncio
async def test_skips_already_delivered_idempotent(fake_redis):
    from processors.delivery import deliver
    event = {"event_id": "e1", "ubid": "KA-001", "source": "SWS"}
    await fake_redis.setex("processed:e1:factories", 86400, "1")
    translated = {"factories": {"factory_address": "X"}}
    with patch("processors.delivery.get_redis", return_value=fake_redis):
        with patch("processors.delivery.get_db"):
            status = await deliver(event, translated, None)
    assert status["factories"] == "skipped_idempotent"
