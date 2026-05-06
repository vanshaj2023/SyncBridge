from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from outbox.relay import start_relay
from detectors.poller import start_poller
from detectors.snapshotter import start_snapshotter
from consumers.stream_consumer import start_consumer
from api.webhooks import router as webhooks_router
from api.audit import router as audit_router
from api.dlq import router as dlq_router
from api.reconcile import router as reconcile_router
from api.mock_trigger import router as trigger_router
from api.status import router as status_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    await start_relay()
    await start_poller()
    await start_snapshotter()
    await start_consumer()
    yield

app = FastAPI(title="SyncBridge Middleware", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(webhooks_router,  prefix="/webhook",      tags=["Webhooks"])
app.include_router(audit_router,     prefix="/audit",        tags=["Audit"])
app.include_router(dlq_router,       prefix="/dlq",          tags=["DLQ"])
app.include_router(reconcile_router, prefix="/reconcile",    tags=["Reconciliation"])
app.include_router(trigger_router,   prefix="/mock-trigger", tags=["Demo"])
app.include_router(status_router,    prefix="/status",       tags=["Status"])

@app.get("/health")
def health():
    return {"status": "ok", "service": "syncbridge-middleware"}
