import httpx, os
from fastapi import APIRouter
from processors.circuit_breaker import all_breaker_states

router = APIRouter()

DEPT_URLS = {
    "sws":                os.getenv("SWS_URL", "http://localhost:8000"),
    "factories":          os.getenv("FACTORIES_URL", "http://localhost:8001"),
    "shop_establishment": os.getenv("SHOP_ESTAB_URL", "http://localhost:8002"),
    "kspcb":              os.getenv("KSPCB_URL", "http://localhost:8003"),
}

@router.get("")
async def system_status():
    breakers = all_breaker_states()
    statuses = {}
    async with httpx.AsyncClient() as client:
        for dept, url in DEPT_URLS.items():
            try:
                resp = await client.get(f"{url}/health", timeout=3)
                statuses[dept] = {
                    "reachable": resp.status_code == 200,
                    "circuit":   breakers.get(dept, "closed"),
                }
            except Exception:
                statuses[dept] = {
                    "reachable": False,
                    "circuit":   breakers.get(dept, "closed"),
                }
    return statuses
