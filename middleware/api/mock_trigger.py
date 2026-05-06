import httpx, os
from fastapi import APIRouter

router = APIRouter()

DEPT_URLS = {
    "sws":                os.getenv("SWS_URL", "http://localhost:8000"),
    "factories":          os.getenv("FACTORIES_URL", "http://localhost:8001"),
    "shop_establishment": os.getenv("SHOP_ESTAB_URL", "http://localhost:8002"),
    "kspcb":              os.getenv("KSPCB_URL", "http://localhost:8003"),
}

@router.post("/{source}/{ubid}")
async def trigger_update(source: str, ubid: str, payload: dict):
    url = DEPT_URLS.get(source)
    if not url:
        return {"error": f"unknown source: {source}"}
    async with httpx.AsyncClient() as client:
        resp = await client.put(f"{url}/business/{ubid}", json=payload, timeout=5)
        return {"triggered": source, "ubid": ubid, "status": resp.status_code}
