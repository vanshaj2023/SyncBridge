import httpx, os
from datetime import datetime, timezone
from processors.translator import translate_event, load_schemas
from processors.dept_registry import get_dept_urls
from deps import get_db

DEPT_URLS = get_dept_urls()
CANONICAL_FIELDS = ["registered_address", "business_name", "authorized_signatory", "phone"]

def find_discrepancies(states: dict, schemas: dict) -> list[dict]:
    all_ubids: set = set()
    for dept_state in states.values():
        all_ubids.update(dept_state.keys())

    discrepancies = []
    for ubid in all_ubids:
        canonical_per_dept: dict[str, dict] = {}
        for dept, dept_state in states.items():
            record = dept_state.get(ubid, {})
            canonical = translate_event(record, source=dept, target="sws", schemas=schemas)
            canonical_per_dept[dept] = canonical

        for field in CANONICAL_FIELDS:
            values = {
                dept: c.get(field)
                for dept, c in canonical_per_dept.items()
                if c.get(field) is not None
            }
            unique = set(values.values())
            if len(unique) > 1:
                discrepancies.append({
                    "ubid":        ubid,
                    "field":       field,
                    "values":      values,
                    "detected_at": datetime.now(timezone.utc).isoformat(),
                })
    return discrepancies

async def run_reconciliation(schemas: dict | None = None) -> list[dict]:
    if schemas is None:
        schemas = load_schemas(
            os.path.join(os.path.dirname(__file__), "..", "config", "schemas")
        )
    states: dict[str, dict] = {}
    async with httpx.AsyncClient() as client:
        for dept, url in DEPT_URLS.items():
            try:
                resp = await client.get(f"{url}/state", timeout=5)
                states[dept] = resp.json()
            except Exception as e:
                print(f"[Reconciler] could not reach {dept}: {e}")
                states[dept] = {}

    discrepancies = find_discrepancies(states, schemas)
    if discrepancies:
        db = get_db()
        await db["reconciliation_findings"].insert_many([dict(d) for d in discrepancies])
        # insert_many mutates the dicts with _id; return clean copies
    return discrepancies
