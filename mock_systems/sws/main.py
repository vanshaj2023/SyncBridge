import asyncio, os, httpx
from fastapi import FastAPI, Request

app = FastAPI(title="Mock SWS")
db: dict = {}
WEBHOOK_URL = os.getenv("SYNCBRIDGE_WEBHOOK_URL")

@app.get("/health")
def health():
    return {"status": "ok", "system": "sws"}

@app.get("/state")
def get_state():
    return db

@app.get("/business/{ubid}")
def get_business(ubid: str):
    return db.get(ubid, {})

@app.put("/business/{ubid}")
async def update_business(ubid: str, payload: dict, request: Request):
    is_bridge = request.headers.get("X-SyncBridge-Origin") is not None
    old = db.get(ubid, {}).copy()
    db[ubid] = {**old, **payload}
    if WEBHOOK_URL and not is_bridge:
        asyncio.create_task(_notify(ubid, old, db[ubid]))
    return db[ubid]

async def _notify(ubid: str, old: dict, new: dict):
    async with httpx.AsyncClient() as client:
        try:
            await client.post(WEBHOOK_URL, json={"ubid": ubid, "old": old, "new": new}, timeout=5)
        except Exception as e:
            print(f"[SWS] webhook failed: {e}")
