from pathlib import Path
import yaml, os

def load_schemas(schema_dir: str) -> dict:
    schemas = {}
    for f in Path(schema_dir).glob("*.yaml"):
        with open(f) as fh:
            s = yaml.safe_load(fh)
            schemas[s["department"]] = s
    return schemas

def _build_reverse_map(field_map: dict) -> dict:
    return {v: k for k, v in field_map.items()}

def translate_event(changes: dict, source: str, target: str, schemas: dict) -> dict:
    source_schema = schemas.get(source, {})
    target_schema = schemas.get(target, {})
    if not target_schema:
        return {}

    source_field_map = source_schema.get("field_map", {})
    target_field_map = target_schema.get("field_map", {})
    target_transforms = target_schema.get("transforms", {})

    source_reverse = _build_reverse_map(source_field_map)
    result = {}
    for src_field, value in changes.items():
        canonical = source_reverse.get(src_field, src_field)
        target_field = target_field_map.get(canonical)
        if not target_field:
            continue
        value = _apply_transforms(value, canonical, target_transforms)
        result[target_field] = value
    return result

def _apply_transforms(value: str, canonical_field: str, transforms: dict) -> str:
    t = transforms.get(canonical_field, {})
    if t.get("uppercase"):
        value = value.upper()
    if t.get("strip_prefix") and isinstance(value, str) and value.startswith(t["strip_prefix"]):
        value = value[len(t["strip_prefix"]):]
    return value

_SCHEMA_DIR = os.path.join(os.path.dirname(__file__), "..", "config", "schemas")
SCHEMAS: dict = {}

def get_schemas() -> dict:
    global SCHEMAS
    if not SCHEMAS:
        SCHEMAS = load_schemas(_SCHEMA_DIR)
    return SCHEMAS

def get_targets(source: str) -> list[str]:
    return [d for d in ["sws", "factories", "shop_establishment", "kspcb"] if d != source]
