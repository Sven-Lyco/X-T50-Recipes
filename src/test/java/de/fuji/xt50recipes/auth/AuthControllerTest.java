package de.fuji.xt50recipes.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import de.fuji.xt50recipes.config.AppProperties;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import org.springframework.security.test.context.support.WithMockUser;

@WebMvcTest(value = AuthController.class, excludeAutoConfiguration = UserDetailsServiceAutoConfiguration.class)
@EnableConfigurationProperties(AppProperties.class)
class AuthControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    @MockBean AuthenticationManager authenticationManager;
    @MockBean JwtUtil jwtUtil;
    @MockBean LoginRateLimiter rateLimiter;
    @MockBean AppUserDetailsService userDetailsService;

    private String loginBody(String user, String pass) throws Exception {
        return objectMapper.writeValueAsString(new AuthController.LoginRequest(user, pass));
    }

    @Test
    @WithMockUser
    void login_validCredentials_returns200WithSetCookie() throws Exception {
        when(rateLimiter.isBlocked(any())).thenReturn(false);
        var auth = UsernamePasswordAuthenticationToken.authenticated("admin", null, java.util.List.of());
        when(authenticationManager.authenticate(any())).thenReturn(auth);
        when(jwtUtil.generateToken("admin")).thenReturn("fake-jwt-token");

        mockMvc.perform(post("/api/auth/login").with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginBody("admin", "password")))
                .andExpect(status().isOk())
                .andExpect(header().exists(HttpHeaders.SET_COOKIE));
    }

    @Test
    @WithMockUser
    void login_wrongCredentials_returns401() throws Exception {
        when(rateLimiter.isBlocked(any())).thenReturn(false);
        when(authenticationManager.authenticate(any())).thenThrow(new BadCredentialsException("bad"));

        mockMvc.perform(post("/api/auth/login").with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginBody("admin", "wrongpass")))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser
    void login_rateLimited_returns429() throws Exception {
        when(rateLimiter.isBlocked(any())).thenReturn(true);

        mockMvc.perform(post("/api/auth/login").with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginBody("admin", "password")))
                .andExpect(status().isTooManyRequests());
    }

    @Test
    @WithMockUser
    void logout_returns200WithClearedCookie() throws Exception {
        mockMvc.perform(post("/api/auth/logout").with(csrf()))
                .andExpect(status().isOk())
                .andExpect(header().exists(HttpHeaders.SET_COOKIE));
    }
}
