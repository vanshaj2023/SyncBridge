import pytest, os, sys
sys.path.insert(0, "middleware")

def test_scramble_ubid_is_deterministic():
    os.environ["SCRAMBLE_SALT"] = "test-salt"
    os.environ["SCRAMBLE_MODE"] = "SCRAMBLED"
    import importlib
    import middleware.pii.scrambler as mod
    importlib.reload(mod)
    from middleware.pii.scrambler import scramble_ubid
    assert scramble_ubid("KA-001") == scramble_ubid("KA-001")
    assert scramble_ubid("KA-001") != "KA-001"
    assert scramble_ubid("KA-001").startswith("KA-SCRAM-")

def test_raw_mode_returns_original():
    os.environ["SCRAMBLE_MODE"] = "RAW"
    import importlib
    import middleware.pii.scrambler as mod
    importlib.reload(mod)
    from middleware.pii.scrambler import scramble_ubid, scramble_address
    assert scramble_ubid("KA-001") == "KA-001"
    assert scramble_address("12 MG Road") == "12 MG Road"

def test_different_inputs_produce_different_hashes():
    os.environ["SCRAMBLE_SALT"] = "test-salt"
    os.environ["SCRAMBLE_MODE"] = "SCRAMBLED"
    import importlib
    import middleware.pii.scrambler as mod
    importlib.reload(mod)
    from middleware.pii.scrambler import scramble_ubid
    assert scramble_ubid("KA-001") != scramble_ubid("KA-002")
