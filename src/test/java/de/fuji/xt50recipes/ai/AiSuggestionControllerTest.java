package de.fuji.xt50recipes.ai;

import de.fuji.xt50recipes.auth.AppUserDetailsService;
import de.fuji.xt50recipes.auth.JwtUtil;
import de.fuji.xt50recipes.config.AppProperties;
import de.fuji.xt50recipes.recipe.*;
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
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(value = AiSuggestionController.class, excludeAutoConfiguration = UserDetailsServiceAutoConfiguration.class)
@EnableConfigurationProperties(AppProperties.class)
class AiSuggestionControllerTest {

    @Autowired MockMvc mockMvc;

    @MockBean AiSuggestionService aiSuggestionService;
    @MockBean JwtUtil jwtUtil;
    @MockBean AppUserDetailsService userDetailsService;

    private RecipeRequest sampleRecipeRequest() {
        return new RecipeRequest(
                "KI-Recipe", FilmSimulation.PROVIA, DynamicRange.DR100,
                0.0, 0.0, 0, 0, 0, GrainStrength.OFF, null,
                EffectStrength.OFF, EffectStrength.OFF, WhiteBalanceMode.AUTO,
                0, 0, null, 0, null, null, null, null, null, null, null,
                List.of(), null, true, null
        );
    }

    @Test
    @WithMockUser
    void suggest_noImages_returns400() throws Exception {
        mockMvc.perform(multipart("/api/suggest").with(csrf()))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser
    void suggest_tooManyImages_returns400() throws Exception {
        mockMvc.perform(multipart("/api/suggest")
                .file(new MockMultipartFile("images", "a.jpg", MediaType.IMAGE_JPEG_VALUE, new byte[1]))
                .file(new MockMultipartFile("images", "b.jpg", MediaType.IMAGE_JPEG_VALUE, new byte[1]))
                .file(new MockMultipartFile("images", "c.jpg", MediaType.IMAGE_JPEG_VALUE, new byte[1]))
                .file(new MockMultipartFile("images", "d.jpg", MediaType.IMAGE_JPEG_VALUE, new byte[1]))
                .file(new MockMultipartFile("images", "e.jpg", MediaType.IMAGE_JPEG_VALUE, new byte[1]))
                .file(new MockMultipartFile("images", "f.jpg", MediaType.IMAGE_JPEG_VALUE, new byte[1]))
                .with(csrf()))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser
    void suggest_success_returns200WithRecipeRequest() throws Exception {
        when(aiSuggestionService.suggest(any(), anyString(), anyString())).thenReturn(sampleRecipeRequest());

        mockMvc.perform(multipart("/api/suggest")
                .file(new MockMultipartFile("images", "photo.jpg", MediaType.IMAGE_JPEG_VALUE, new byte[100]))
                .param("description", "warm look")
                .param("model", "claude-sonnet-4-6")
                .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("KI-Recipe"));
    }

    @Test
    @WithMockUser
    void suggest_aiException_returns502() throws Exception {
        when(aiSuggestionService.suggest(any(), any(), any()))
                .thenThrow(new AiSuggestionException("API error"));

        mockMvc.perform(multipart("/api/suggest")
                .file(new MockMultipartFile("images", "photo.jpg", MediaType.IMAGE_JPEG_VALUE, new byte[100]))
                .with(csrf()))
                .andExpect(status().isBadGateway());
    }
}
