package de.fuji.xt50recipes.recipe;

import com.fasterxml.jackson.databind.ObjectMapper;
import de.fuji.xt50recipes.auth.AppUserDetailsService;
import de.fuji.xt50recipes.auth.JwtUtil;
import de.fuji.xt50recipes.config.AppProperties;
import org.junit.jupiter.api.Test;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(value = RecipeController.class, excludeAutoConfiguration = UserDetailsServiceAutoConfiguration.class)
@EnableConfigurationProperties(AppProperties.class)
class RecipeControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    @MockBean RecipeService recipeService;
    @MockBean RecipeExportService recipeExportService;
    @MockBean JwtUtil jwtUtil;
    @MockBean AppUserDetailsService userDetailsService;

    @Test
    @WithMockUser
    void list_authenticated_returnsOk() throws Exception {
        when(recipeService.findAll(null, null, false, null)).thenReturn(List.of());
        mockMvc.perform(get("/api/recipes"))
                .andExpect(status().isOk())
                .andExpect(content().json("[]"));
    }

    @Test
    void list_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/recipes"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser
    void get_unknownId_returns404() throws Exception {
        UUID id = UUID.randomUUID();
        when(recipeService.findById(id)).thenThrow(new RecipeNotFoundException(id));
        mockMvc.perform(get("/api/recipes/{id}", id))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser
    void create_validRequest_returns201WithName() throws Exception {
        when(recipeService.create(any())).thenReturn(sampleResponse());
        mockMvc.perform(post("/api/recipes")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(sampleRequest())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Test Recipe"));
    }

    @Test
    @WithMockUser
    void create_missingName_returns400() throws Exception {
        String body = """
                {"filmSimulation":"PROVIA","dynamicRange":"DR100","highlightTone":0,
                 "shadowTone":0,"color":0,"sharpness":0,"noiseReduction":0,
                 "grainStrength":"OFF","colorChromeEffect":"OFF","colorChromeFxBlue":"OFF",
                 "whiteBalanceMode":"AUTO","tags":[]}
                """;
        mockMvc.perform(post("/api/recipes")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
                .andExpect(status().isBadRequest());
    }

    private RecipeRequest sampleRequest() {
        return new RecipeRequest(
                "Test Recipe", FilmSimulation.PROVIA, DynamicRange.DR100,
                0.0, 0.0, 0, 0, 0, GrainStrength.OFF, null,
                EffectStrength.OFF, EffectStrength.OFF, WhiteBalanceMode.AUTO,
                0, 0, null, 0, null, null,
                null, null, null, null, null, List.of(), null, false, null
        );
    }

    private RecipeResponse sampleResponse() {
        return new RecipeResponse(
                UUID.randomUUID(), "Test Recipe", FilmSimulation.PROVIA, DynamicRange.DR100,
                0.0, 0.0, 0, 0, 0, GrainStrength.OFF, null,
                EffectStrength.OFF, EffectStrength.OFF, WhiteBalanceMode.AUTO,
                0, 0, null, 0, null, null,
                null, null, null, null, null, List.of(), null, false, false, null, List.of(),
                Instant.now(), Instant.now()
        );
    }
}
