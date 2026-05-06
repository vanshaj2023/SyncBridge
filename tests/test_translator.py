import pytest, os, sys
sys.path.insert(0, "middleware")
os.environ.setdefault("SCRAMBLE_MODE", "RAW")

from processors.translator import translate_event, load_schemas

SCHEMA_DIR = "middleware/config/schemas"

def test_sws_to_factories_translates_address():
    schemas = load_schemas(SCHEMA_DIR)
    changes = {"registered_address": "45 Brigade Road"}
    result = translate_event(changes, source="sws", target="factories", schemas=schemas)
    assert result == {"factory_address": "45 BRIGADE ROAD"}

def test_sws_to_factories_strips_phone_prefix():
    schemas = load_schemas(SCHEMA_DIR)
    changes = {"phone": "+919876543210"}
    result = translate_event(changes, source="sws", target="factories", schemas=schemas)
    assert result == {"contact_number": "9876543210"}

def test_sws_to_shop_estab_translates_name():
    schemas = load_schemas(SCHEMA_DIR)
    changes = {"business_name": "Acme Corp"}
    result = translate_event(changes, source="sws", target="shop_establishment", schemas=schemas)
    assert result == {"establishment_nm": "Acme Corp"}

def test_unknown_field_is_dropped():
    schemas = load_schemas(SCHEMA_DIR)
    changes = {"nonexistent_field": "value"}
    result = translate_event(changes, source="sws", target="factories", schemas=schemas)
    assert result == {}

def test_factories_to_sws_reverse_translates():
    schemas = load_schemas(SCHEMA_DIR)
    changes = {"factory_address": "45 MG Road"}
    result = translate_event(changes, source="factories", target="sws", schemas=schemas)
    assert result == {"registered_address": "45 MG Road"}
