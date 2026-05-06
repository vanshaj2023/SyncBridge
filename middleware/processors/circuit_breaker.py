import time

class CircuitBreaker:
    def __init__(self, failure_threshold: int = 5, cooldown_s: float = 30):
        self.failure_threshold = failure_threshold
        self.cooldown_s = cooldown_s
        self.state = "closed"
        self.failures = 0
        self.opened_at: float | None = None

    def can_pass(self) -> bool:
        if self.state == "closed":
            return True
        if self.state == "open":
            if time.time() - self.opened_at > self.cooldown_s:
                self.state = "half_open"
                return True
            return False
        return True  # half_open

    def record_success(self):
        self.failures = 0
        self.state = "closed"
        self.opened_at = None

    def record_failure(self):
        self.failures += 1
        if self.failures >= self.failure_threshold:
            self.state = "open"
            self.opened_at = time.time()


_breakers: dict[str, CircuitBreaker] = {}

def get_breaker(dept: str) -> CircuitBreaker:
    if dept not in _breakers:
        _breakers[dept] = CircuitBreaker()
    return _breakers[dept]

def all_breaker_states() -> dict[str, str]:
    return {dept: cb.state for dept, cb in _breakers.items()}
