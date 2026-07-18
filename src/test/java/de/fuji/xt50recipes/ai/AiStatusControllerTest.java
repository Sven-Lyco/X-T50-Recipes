package de.fuji.xt50recipes.ai;

import de.fuji.xt50recipes.auth.AppUserDetailsService;
import de.fuji.xt50recipes.auth.JwtUtil;
import de.fuji.xt50recipes.config.AppProperties;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(value = AiStatusController.class, excludeAutoConfiguration = UserDetailsServiceAutoConfiguration.class)
@EnableConfigurationProperties(AppProperties.class)
class AiStatusControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired AiStatusController aiStatusController;

    @MockBean JwtUtil jwtUtil;
    @MockBean AppUserDetailsService userDetailsService;

    @Test
    @WithMockUser
    void aiStatus_noKey_returnsFalse() throws Exception {
        ReflectionTestUtils.setField(aiStatusController, "apiKey", "");
        mockMvc.perform(get("/api/ai-status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.available").value(false));
    }

    @Test
    @WithMockUser
    void aiStatus_withKey_returnsTrue() throws Exception {
        ReflectionTestUtils.setField(aiStatusController, "apiKey", "sk-ant-test-key");
        mockMvc.perform(get("/api/ai-status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.available").value(true));
    }

    @Test
    void aiStatus_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/ai-status"))
                .andExpect(status().isUnauthorized());
    }
}
