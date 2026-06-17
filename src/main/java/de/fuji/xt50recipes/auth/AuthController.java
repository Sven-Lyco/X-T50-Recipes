package de.fuji.xt50recipes.auth;

import de.fuji.xt50recipes.config.AppProperties;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final AppProperties appProperties;
    private final LoginRateLimiter rateLimiter;

    @PostMapping("/login")
    public ResponseEntity<Void> login(@RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        String ip = clientIp(httpRequest);
        if (rateLimiter.isBlocked(ip)) {
            log.warn("Login blocked due to rate limit: ip={}", ip);
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).build();
        }
        try {
            Authentication auth = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.username(), request.password())
            );
            rateLimiter.recordSuccess(ip);
            log.info("Login successful: user={}, ip={}", auth.getName(), ip);
            String token = jwtUtil.generateToken(auth.getName());
            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, jwtCookie(token, httpRequest.isSecure(),
                            appProperties.jwtExpirationMs() / 1000).toString())
                    .build();
        } catch (AuthenticationException e) {
            rateLimiter.recordFailure(ip);
            log.warn("Login failed: user={}, ip={}", request.username(), ip);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest httpRequest) {
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, jwtCookie("", httpRequest.isSecure(), 0).toString())
                .build();
    }

    private ResponseCookie jwtCookie(String value, boolean secure, long maxAge) {
        return ResponseCookie.from("jwt", value)
                .httpOnly(true)
                .secure(secure)
                .sameSite("Strict")
                .path("/")
                .maxAge(maxAge)
                .build();
    }

    private String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    public record LoginRequest(String username, String password) {}
}
