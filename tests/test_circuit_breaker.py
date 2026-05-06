import pytest, time, sys
sys.path.insert(0, "middleware")
from processors.circuit_breaker import CircuitBreaker

def test_starts_closed():
    cb = CircuitBreaker(failure_threshold=3, cooldown_s=1)
    assert cb.can_pass() is True

def test_opens_after_threshold_failures():
    cb = CircuitBreaker(failure_threshold=3, cooldown_s=60)
    cb.record_failure()
    cb.record_failure()
    assert cb.can_pass() is True
    cb.record_failure()
    assert cb.can_pass() is False

def test_half_opens_after_cooldown():
    cb = CircuitBreaker(failure_threshold=2, cooldown_s=0)
    cb.record_failure()
    cb.record_failure()
    assert cb.can_pass() is False
    time.sleep(0.05)
    assert cb.can_pass() is True  # transitions to half_open

def test_closes_after_success_in_half_open():
    cb = CircuitBreaker(failure_threshold=2, cooldown_s=0)
    cb.record_failure()
    cb.record_failure()
    time.sleep(0.05)
    cb.can_pass()  # transitions to half_open
    cb.record_success()
    assert cb.state == "closed"
    assert cb.failures == 0
