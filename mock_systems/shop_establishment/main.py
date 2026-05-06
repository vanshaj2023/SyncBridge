from fastapi import FastAPI

app = FastAPI(title="Mock Shop Establishment")
db: dict = {}

@app.get("/health")
def health():
    return {"status": "ok", "system": "shop_establishment"}

@app.get("/state")
def get_state():
    return db

@app.get("/business/{ubid}")
def get_business(ubid: str):
    return db.get(ubid, {})

@app.put("/business/{ubid}")
def update_business(ubid: str, payload: dict):
    db[ubid] = {**db.get(ubid, {}), **payload}
    return db[ubid]
