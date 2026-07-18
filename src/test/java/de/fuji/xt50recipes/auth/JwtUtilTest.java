package de.fuji.xt50recipes.auth;

import de.fuji.xt50recipes.config.AppProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.*;

class JwtUtilTest {

    private static final String VALID_SECRET = "this-is-a-super-secret-key-for-tests-1234";
    private JwtUtil jwtUtil;

    @BeforeEach
    void setUp() {
        AppProperties props = new AppProperties(VALID_SECRET, 3600000L, "/tmp/images", "admin", "password", null);
        jwtUtil = new JwtUtil(props);
        ReflectionTestUtils.invokeMethod(jwtUtil, "init");
    }

    @Test
    void generateAndExtractUsername_roundtrip() {
        String token = jwtUtil.generateToken("testuser");
        assertThat(jwtUtil.extractUsername(token)).isEqualTo("testuser");
    }

    @Test
    void isValid_validToken_returnsTrue() {
        String token = jwtUtil.generateToken("testuser");
        assertThat(jwtUtil.isValid(token)).isTrue();
    }

    @Test
    void isValid_tamperedToken_returnsFalse() {
        String token = jwtUtil.generateToken("testuser");
        // Corrupt the signature part
        String tampered = token.substring(0, token.lastIndexOf('.') + 1) + "INVALIDSIGNATURE";
        assertThat(jwtUtil.isValid(tampered)).isFalse();
    }

    @Test
    void isValid_emptyString_returnsFalse() {
        assertThat(jwtUtil.isValid("")).isFalse();
    }

    @Test
    void isValid_randomString_returnsFalse() {
        assertThat(jwtUtil.isValid("not.a.token")).isFalse();
    }

    @Test
    void init_shortSecret_throwsIllegalState() {
        AppProperties shortProps = new AppProperties("short-key", 3600000L, "/tmp", "admin", "pwd", null);
        JwtUtil weakUtil = new JwtUtil(shortProps);
        assertThatThrownBy(() -> ReflectionTestUtils.invokeMethod(weakUtil, "init"))
                .isInstanceOf(IllegalStateException.class);
    }
}
