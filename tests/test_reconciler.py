import pytest, sys, os
sys.path.insert(0, "middleware")
os.environ.update({
    "SWS_URL": "http://sws", "FACTORIES_URL": "http://factories",
    "SHOP_ESTAB_URL": "http://shop", "KSPCB_URL": "http://kspcb",
    "SCRAMBLE_MODE": "RAW",
})
from processors.translator import load_schemas
from reconciliation.reconciler import find_discrepancies

SCHEMAS = load_schemas("middleware/config/schemas")

def test_detects_address_drift():
    states = {
        "sws":                {"KA-001": {"registered_address": "12 MG Road", "business_name": "Acme"}},
        "factories":          {"KA-001": {"factory_address": "99 DRIFT ROAD", "factory_name": "Acme"}},
        "shop_establishment": {"KA-001": {"shop_addr": "12 MG Road", "establishment_nm": "Acme"}},
        "kspcb":              {"KA-001": {"site_location": "12 MG Road", "unit_name": "Acme"}},
    }
    discrepancies = find_discrepancies(states, SCHEMAS)
    assert len(discrepancies) == 1
    assert discrepancies[0]["field"] == "registered_address"
    assert discrepancies[0]["ubid"] == "KA-001"

def test_no_discrepancy_when_synced():
    states = {
        "sws":                {"KA-001": {"registered_address": "12 MG Road"}},
        "factories":          {"KA-001": {"factory_address": "12 MG Road"}},
        "shop_establishment": {"KA-001": {"shop_addr": "12 MG Road"}},
        "kspcb":              {"KA-001": {"site_location": "12 MG Road"}},
    }
    discrepancies = find_discrepancies(states, SCHEMAS)
    assert discrepancies == []
