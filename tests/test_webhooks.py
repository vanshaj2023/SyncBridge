import pytest, os, sys
sys.path.insert(0, "middleware")
os.environ["REDIS_URL"] = "redis://localhost:6379"
os.environ["MONGO_URL"] = "mongodb://localhost:27017/syncbridge_test"
os.environ["SCRAMBLE_MODE"] = "RAW"

from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, MagicMock, patch

def get_test_app():
    from api.webhooks import router
    from fastapi import FastAPI
    app = FastAPI()
    app.include_router(router, prefix="/webhook")
    return app

def test_webhook_sws_returns_queued():
    mock_collection = MagicMock()
    mock_collection.insert_one = AsyncMock(return_value=MagicMock())
    mock_db = {"outbox": mock_collection}
    with patch("api.webhooks.get_db", return_value=mock_db):
        client = TestClient(get_test_app())
        resp = client.post("/webhook/sws", json={
            "ubid": "KA-001",
            "old": {},
            "new": {"registered_address": "12 MG Road"}
        })
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "queued"
    assert "event_id" in data
    assert len(data["event_id"]) == 36  # UUID format

def test_webhook_factories_uses_dept_to_sws_stream():
    mock_collection = MagicMock()
    mock_collection.insert_one = AsyncMock(return_value=MagicMock())
    mock_db = {"outbox": mock_collection}
    with patch("api.webhooks.get_db", return_value=mock_db):
        client = TestClient(get_test_app())
        resp = client.post("/webhook/factories", json={
            "ubid": "KA-002",
            "old": {},
            "new": {"factory_name": "ACME"}
        })
    assert resp.status_code == 200
    # Check insert_one was called with correct stream
    call_args = mock_collection.insert_one.call_args[0][0]
    assert call_args["stream"] == "stream:dept_to_sws"

def test_webhook_sws_uses_sws_to_dept_stream():
    mock_collection = MagicMock()
    mock_collection.insert_one = AsyncMock(return_value=MagicMock())
    mock_db = {"outbox": mock_collection}
    with patch("api.webhooks.get_db", return_value=mock_db):
        client = TestClient(get_test_app())
        resp = client.post("/webhook/sws", json={
            "ubid": "KA-003",
            "old": {},
            "new": {"registered_address": "New"}
        })
    assert resp.status_code == 200
    call_args = mock_collection.insert_one.call_args[0][0]
    assert call_args["stream"] == "stream:sws_to_dept"
