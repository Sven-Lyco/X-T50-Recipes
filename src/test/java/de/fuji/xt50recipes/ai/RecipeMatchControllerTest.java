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
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(value = RecipeMatchController.class, excludeAutoConfiguration = UserDetailsServiceAutoConfiguration.class)
@EnableConfigurationProperties(AppProperties.class)
class RecipeMatchControllerTest {

    @Autowired MockMvc mockMvc;

    @MockBean RecipeMatchService recipeMatchService;
    @MockBean JwtUtil jwtUtil;
    @MockBean AppUserDetailsService userDetailsService;

    @Test
    @WithMockUser
    void match_success_returns200() throws Exception {
        when(recipeMatchService.match(any(), anyString(), any(), anyBoolean())).thenReturn(List.of());

        mockMvc.perform(multipart("/api/match")
                .file(new MockMultipartFile("image", "photo.jpg", MediaType.IMAGE_JPEG_VALUE, new byte[100]))
                .with(csrf()))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser
    void match_emptyImage_returns400() throws Exception {
        mockMvc.perform(multipart("/api/match")
                .file(new MockMultipartFile("image", "photo.jpg", MediaType.IMAGE_JPEG_VALUE, new byte[0]))
                .with(csrf()))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser
    void match_aiException_returns502() throws Exception {
        when(recipeMatchService.match(any(), anyString(), any(), anyBoolean()))
                .thenThrow(new AiSuggestionException("AI error"));

        mockMvc.perform(multipart("/api/match")
                .file(new MockMultipartFile("image", "photo.jpg", MediaType.IMAGE_JPEG_VALUE, new byte[100]))
                .with(csrf()))
                .andExpect(status().isBadGateway());
    }
}
