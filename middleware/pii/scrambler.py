import hashlib, os

def _mode() -> str:
    return os.getenv("SCRAMBLE_MODE", "RAW").upper()

def _salt() -> str:
    return os.getenv("SCRAMBLE_SALT", "dev-salt")

def _h(value: str, length: int = 8) -> str:
    return hashlib.sha256(f"{_salt()}:{value}".encode()).hexdigest()[:length].upper()

def scramble_ubid(ubid: str) -> str:
    if _mode() == "RAW":
        return ubid
    return f"KA-SCRAM-{_h(ubid)}"

def scramble_address(address: str) -> str:
    if _mode() == "RAW":
        return address
    return f"Synthetic Plot {_h(address, 6)}, Bengaluru"

def scramble_phone(phone: str) -> str:
    if _mode() == "RAW":
        return phone
    n = int(hashlib.sha256(f"{_salt()}:{phone}".encode()).hexdigest(), 16) % (10 ** 9)
    return f"9{n:09d}"

def scramble_name(name: str) -> str:
    if _mode() == "RAW":
        return name
    return f"Business {_h(name, 4)}"
