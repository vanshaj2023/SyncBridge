import asyncio, os, httpx
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017/syncbridge")
WEBHOOK_URL = os.getenv("SYNCBRIDGE_WEBHOOK_URL")

mongo = AsyncIOMotorClient(MONGO_URL)
col = mongo.get_default_database()["sws_businesses"]

@asynccontextmanager
async def lifespan(app: FastAPI):
    await col.create_index("ubid", unique=True)
    yield

app = FastAPI(title="Mock SWS", lifespan=lifespan)

async def _get(ubid: str) -> dict:
    doc = await col.find_one({"ubid": ubid}, {"_id": 0})
    return {k: v for k, v in doc.items() if k != "ubid"} if doc else {}

async def _set(ubid: str, data: dict):
    await col.update_one({"ubid": ubid}, {"$set": data}, upsert=True)

@app.get("/health")
def health():
    return {"status": "ok", "system": "sws"}

@app.get("/state")
async def get_state():
    docs = await col.find({}, {"_id": 0}).to_list(None)
    return {d.pop("ubid"): d for d in docs}

@app.get("/business/{ubid}")
async def get_business(ubid: str):
    return await _get(ubid)

@app.put("/business/{ubid}")
async def update_business(ubid: str, payload: dict, request: Request):
    is_bridge = request.headers.get("X-SyncBridge-Origin") is not None
    old = await _get(ubid)
    new = {**old, **payload}
    await _set(ubid, new)
    if WEBHOOK_URL and not is_bridge:
        asyncio.create_task(_notify(ubid, old, new))
    return new

async def _notify(ubid: str, old: dict, new: dict):
    async with httpx.AsyncClient() as client:
        try:
            await client.post(WEBHOOK_URL, json={"ubid": ubid, "old": old, "new": new}, timeout=5)
        except Exception as e:
            print(f"[SWS] webhook failed: {e}")
