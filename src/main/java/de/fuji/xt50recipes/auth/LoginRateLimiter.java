package de.fuji.xt50recipes.auth;

import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class LoginRateLimiter {

    private static final int MAX_ATTEMPTS = 5;
    private static final Duration LOCKOUT = Duration.ofMinutes(15);

    private record Attempt(int count, Instant lockedUntil) {}

    private final ConcurrentHashMap<String, Attempt> store = new ConcurrentHashMap<>();

    public boolean isBlocked(String ip) {
        Attempt a = store.get(ip);
        if (a == null || a.lockedUntil() == null) return false;
        if (Instant.now().isBefore(a.lockedUntil())) return true;
        store.remove(ip);
        return false;
    }

    public void recordFailure(String ip) {
        store.compute(ip, (k, a) -> {
            int count = (a == null ? 0 : a.count()) + 1;
            Instant lockUntil = count >= MAX_ATTEMPTS ? Instant.now().plus(LOCKOUT) : null;
            return new Attempt(count, lockUntil);
        });
    }

    public void recordSuccess(String ip) {
        store.remove(ip);
    }
}
