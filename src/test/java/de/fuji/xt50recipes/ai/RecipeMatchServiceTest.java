package de.fuji.xt50recipes.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import de.fuji.xt50recipes.recipe.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RecipeMatchServiceTest {

    @Mock RestTemplate restTemplate;
    @Mock RecipeRepository recipeRepository;

    ObjectMapper objectMapper = new ObjectMapper();
    RecipeMatchService service;

    private static final byte[] JPEG_BYTES = new byte[]{
            (byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0, 16, 0, 0, 0, 0
    };

    @BeforeEach
    void setUp() {
        service = new RecipeMatchService(restTemplate, objectMapper, recipeRepository);
        ReflectionTestUtils.setField(service, "apiKey", "test-api-key");
    }

    private Recipe minimalRecipe(UUID id, String name) {
        Recipe r = new Recipe();
        r.setId(id);
        r.setName(name);
        r.setFilmSimulation(FilmSimulation.PROVIA);
        r.setDynamicRange(DynamicRange.DR100);
        r.setHighlightTone(0.0); r.setShadowTone(0.0);
        r.setColor(0); r.setSharpness(0); r.setNoiseReduction(0);
        r.setGrainStrength(GrainStrength.OFF);
        r.setColorChromeEffect(EffectStrength.OFF); r.setColorChromeFxBlue(EffectStrength.OFF);
        r.setWhiteBalanceMode(WhiteBalanceMode.AUTO);
        r.setTags(new String[0]);
        return r;
    }

    @Test
    void match_noRecipes_returnsEmpty() {
        when(recipeRepository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of());

        List<RecipeMatchResponse> result = service.match(JPEG_BYTES, "image/jpeg", null, false);

        assertThat(result).isEmpty();
    }

    @Test
    void match_happyPath_returnsParsedMatches() throws Exception {
        UUID id1 = UUID.randomUUID();
        UUID id2 = UUID.randomUUID();
        Recipe r1 = minimalRecipe(id1, "Recipe A");
        Recipe r2 = minimalRecipe(id2, "Recipe B");
        when(recipeRepository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of(r1, r2));

        String innerJson = objectMapper.writeValueAsString(Map.of(
                "matches", List.of(
                        Map.of("id", id1.toString(), "reason", "Great for portraits."),
                        Map.of("id", id2.toString(), "reason", "Good contrast.")
                )
        ));
        String responseBody = objectMapper.writeValueAsString(Map.of(
                "content", List.of(Map.of("type", "text", "text", innerJson))
        ));
        when(restTemplate.postForEntity(eq(AiConstants.ANTHROPIC_URL), any(), eq(String.class)))
                .thenReturn(ResponseEntity.ok(responseBody));

        List<RecipeMatchResponse> result = service.match(JPEG_BYTES, "image/jpeg", "claude-sonnet-4-6", false);

        assertThat(result).hasSize(2);
        assertThat(result.get(0).name()).isEqualTo("Recipe A");
        assertThat(result.get(0).reason()).isEqualTo("Great for portraits.");
    }

    @Test
    void match_onlySlots_queriesSlottedRecipes() throws Exception {
        UUID id1 = UUID.randomUUID();
        Recipe r1 = minimalRecipe(id1, "Slot Recipe");
        r1.setCameraSlot(CameraSlot.C1);
        when(recipeRepository.findByCameraSlotIsNotNullOrderByCameraSlot()).thenReturn(List.of(r1));

        String innerJson = objectMapper.writeValueAsString(Map.of(
                "matches", List.of(Map.of("id", id1.toString(), "reason", "Best match."))
        ));
        String responseBody = objectMapper.writeValueAsString(Map.of(
                "content", List.of(Map.of("type", "text", "text", innerJson))
        ));
        when(restTemplate.postForEntity(eq(AiConstants.ANTHROPIC_URL), any(), eq(String.class)))
                .thenReturn(ResponseEntity.ok(responseBody));

        List<RecipeMatchResponse> result = service.match(JPEG_BYTES, "image/jpeg", null, true);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).cameraSlot()).isEqualTo("C1");
    }

    @Test
    void match_httpError_throwsAiSuggestionException() {
        UUID id = UUID.randomUUID();
        when(recipeRepository.findAllByOrderByCreatedAtDesc())
                .thenReturn(List.of(minimalRecipe(id, "Recipe")));
        when(restTemplate.postForEntity(eq(AiConstants.ANTHROPIC_URL), any(), eq(String.class)))
                .thenThrow(HttpClientErrorException.create(
                        HttpStatus.TOO_MANY_REQUESTS, "Rate limited",
                        org.springframework.http.HttpHeaders.EMPTY, null, null));

        assertThatThrownBy(() -> service.match(JPEG_BYTES, "image/jpeg", null, false))
                .isInstanceOf(AiSuggestionException.class)
                .hasMessageContaining("Anthropic API Fehler");
    }
}
