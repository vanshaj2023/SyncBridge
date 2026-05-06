import os
from pathlib import Path
import yaml

_CONFIG_PATH = Path(__file__).parent.parent / "config" / "departments.yaml"

def _load() -> list[dict]:
    with open(_CONFIG_PATH) as f:
        return yaml.safe_load(f)["departments"]

def get_dept_urls() -> dict[str, str]:
    """Return {dept_name: resolved_url} from departments.yaml + env vars."""
    return {
        d["name"]: os.getenv(d["url_env"], f"http://localhost:800{i}")
        for i, d in enumerate(_load())
    }

def get_all_dept_names() -> list[str]:
    return [d["name"] for d in _load()]

def get_targets(source: str) -> list[str]:
    return [name for name in get_all_dept_names() if name != source.lower()]
