import pytest, asyncio, sys, os, json
sys.path.insert(0, "middleware")
os.environ["CONFLICT_WINDOW_SECONDS"] = "5"
import fakeredis.aioredis as fakeredis

@pytest.fixture
def fake_redis():
    return fakeredis.FakeRedis(decode_responses=True)

@pytest.mark.asyncio
async def test_no_conflict_first_event(fake_redis):
    from processors.conflict import check_conflict
    result = await check_conflict(
        {"event_id": "e1", "ubid": "KA-001", "changes": json.dumps({"registered_address": "A"}), "source": "SWS"},
        redis=fake_redis
    )
    assert result is None

@pytest.mark.asyncio
async def test_conflict_same_field_different_source(fake_redis):
    from processors.conflict import check_conflict
    await check_conflict(
        {"event_id": "e1", "ubid": "KA-001", "changes": json.dumps({"registered_address": "A"}), "source": "SWS"},
        redis=fake_redis
    )
    result = await check_conflict(
        {"event_id": "e2", "ubid": "KA-001", "changes": json.dumps({"registered_address": "B"}), "source": "FACTORIES"},
        redis=fake_redis
    )
    assert result is not None
    assert result["winner"] == "SWS"
    assert result["resolution_policy"] == "SWS_PRIORITY"

@pytest.mark.asyncio
async def test_no_conflict_same_source(fake_redis):
    from processors.conflict import check_conflict
    await check_conflict(
        {"event_id": "e1", "ubid": "KA-001", "changes": json.dumps({"registered_address": "A"}), "source": "SWS"},
        redis=fake_redis
    )
    result = await check_conflict(
        {"event_id": "e2", "ubid": "KA-001", "changes": json.dumps({"registered_address": "B"}), "source": "SWS"},
        redis=fake_redis
    )
    assert result is None
