package de.fuji.xt50recipes.auth;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class LoginRateLimiterTest {

    private LoginRateLimiter rateLimiter;

    @BeforeEach
    void setUp() {
        rateLimiter = new LoginRateLimiter();
    }

    @Test
    void isBlocked_initially_returnsFalse() {
        assertThat(rateLimiter.isBlocked("192.168.1.1")).isFalse();
    }

    @Test
    void isBlocked_afterFourFailures_notBlocked() {
        for (int i = 0; i < 4; i++) {
            rateLimiter.recordFailure("1.2.3.4");
        }
        assertThat(rateLimiter.isBlocked("1.2.3.4")).isFalse();
    }

    @Test
    void isBlocked_afterFiveFailures_blocked() {
        for (int i = 0; i < 5; i++) {
            rateLimiter.recordFailure("1.2.3.4");
        }
        assertThat(rateLimiter.isBlocked("1.2.3.4")).isTrue();
    }

    @Test
    void recordSuccess_afterBlock_clearsBlock() {
        for (int i = 0; i < 5; i++) {
            rateLimiter.recordFailure("1.2.3.4");
        }
        rateLimiter.recordSuccess("1.2.3.4");
        assertThat(rateLimiter.isBlocked("1.2.3.4")).isFalse();
    }

    @Test
    void isBlocked_differentIps_independentCounters() {
        for (int i = 0; i < 5; i++) {
            rateLimiter.recordFailure("10.0.0.1");
        }
        assertThat(rateLimiter.isBlocked("10.0.0.2")).isFalse();
    }

    @Test
    void recordSuccess_unknownIp_doesNotThrow() {
        rateLimiter.recordSuccess("unknown-ip");
        assertThat(rateLimiter.isBlocked("unknown-ip")).isFalse();
    }
}
