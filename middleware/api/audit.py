from fastapi import APIRouter, Query
from deps import get_db

router = APIRouter()

@router.get("/events")
async def list_events(limit: int = Query(50, le=200)):
    db = get_db()
    docs = await db["audit_log"].find().sort("timestamp", -1).to_list(limit)
    for d in docs:
        d.pop("_id", None)
    return docs

@router.get("/events/{ubid}")
async def events_by_ubid(ubid: str):
    db = get_db()
    docs = await db["audit_log"].find({"ubid": ubid}).sort("timestamp", -1).to_list(100)
    for d in docs:
        d.pop("_id", None)
    return docs

@router.get("/conflicts")
async def list_conflicts(limit: int = Query(50, le=200)):
    db = get_db()
    docs = await db["audit_log"].find(
        {"conflict": {"$ne": None}}
    ).sort("timestamp", -1).to_list(limit)
    for d in docs:
        d.pop("_id", None)
    return docs
