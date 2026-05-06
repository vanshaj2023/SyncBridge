from fastapi import APIRouter
from reconciliation.reconciler import run_reconciliation
from deps import get_db

router = APIRouter()

@router.post("/now")
async def reconcile_now():
    discrepancies = await run_reconciliation()
    return {"discrepancies_found": len(discrepancies), "items": discrepancies}

@router.get("/findings")
async def get_findings(limit: int = 50):
    db = get_db()
    docs = await db["reconciliation_findings"].find().sort("detected_at", -1).to_list(limit)
    for d in docs:
        d.pop("_id", None)
    return docs
