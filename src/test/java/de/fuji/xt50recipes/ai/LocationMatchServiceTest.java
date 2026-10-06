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
class LocationMatchServiceTest {

    @Mock RestTemplate restTemplate;
    @Mock RecipeRepository recipeRepository;

    ObjectMapper objectMapper = new ObjectMapper();
    LocationMatchService service;

    @BeforeEach
    void setUp() {
        service = new LocationMatchService(restTemplate, objectMapper, recipeRepository);
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

    private String matchesJson(UUID... ids) throws Exception {
        return objectMapper.writeValueAsString(Map.of(
                "matches", java.util.Arrays.stream(ids)
                        .map(id -> Map.of("id", id.toString(), "reason", "Passt zum Licht."))
                        .toList()
        ));
    }

    @Test
    void match_noRecipes_returnsEmpty() {
        when(recipeRepository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of());

        List<RecipeMatchResponse> result = service.match("Island", List.of(), List.of(), null, false);

        assertThat(result).isEmpty();
    }

    @Test
    void match_happyPath_returnsParsedMatches() throws Exception {
        UUID id1 = UUID.randomUUID();
        UUID id2 = UUID.randomUUID();
        when(recipeRepository.findAllByOrderByCreatedAtDesc())
                .thenReturn(List.of(minimalRecipe(id1, "Recipe A"), minimalRecipe(id2, "Recipe B")));

        String responseBody = objectMapper.writeValueAsString(Map.of(
                "content", List.of(Map.of("type", "text", "text", matchesJson(id1, id2)))
        ));
        when(restTemplate.postForEntity(eq(AiConstants.ANTHROPIC_URL), any(), eq(String.class)))
                .thenReturn(ResponseEntity.ok(responseBody));

        List<RecipeMatchResponse> result = service.match(
                "Island im September", List.of("Landschaft"), List.of("Nebel & diffuses Licht"),
                "claude-sonnet-5-5", false);

        assertThat(result).hasSize(2);
        assertThat(result.get(0).name()).isEqualTo("Recipe A");
        assertThat(result.get(0).reason()).isEqualTo("Passt zum Licht.");
    }

    @Test
    void match_thinkingBlockBeforeText_returnsParsedMatches() throws Exception {
        UUID id1 = UUID.randomUUID();
        Recipe r1 = minimalRecipe(id1, "Slot Recipe");
        r1.setCameraSlot(CameraSlot.C1);
        when(recipeRepository.findByCameraSlotIsNotNullOrderByCameraSlot()).thenReturn(List.of(r1));

        String responseBody = objectMapper.writeValueAsString(Map.of(
                "stop_reason", "end_turn",
                "content", List.of(
                        Map.of("type", "thinking", "thinking", "", "signature", "abc"),
                        Map.of("type", "text", "text", matchesJson(id1))
                )
        ));
        when(restTemplate.postForEntity(eq(AiConstants.ANTHROPIC_URL), any(), eq(String.class)))
                .thenReturn(ResponseEntity.ok(responseBody));

        List<RecipeMatchResponse> result = service.match("Kyoto", null, null, "claude-opus-5-5", true);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).cameraSlot()).isEqualTo("C1");
    }

    @Test
    void match_unknownAndInvalidIds_areSkipped() throws Exception {
        UUID id1 = UUID.randomUUID();
        when(recipeRepository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of(minimalRecipe(id1, "Recipe A")));

        String innerJson = objectMapper.writeValueAsString(Map.of(
                "matches", List.of(
                        Map.of("id", UUID.randomUUID().toString(), "reason", "unbekannt"),
                        Map.of("id", "not-a-uuid", "reason", "ungültig"),
                        Map.of("id", id1.toString(), "reason", "Passt.")
                )
        ));
        String responseBody = objectMapper.writeValueAsString(Map.of(
                "content", List.of(Map.of("type", "text", "text", innerJson))
        ));
        when(restTemplate.postForEntity(eq(AiConstants.ANTHROPIC_URL), any(), eq(String.class)))
                .thenReturn(ResponseEntity.ok(responseBody));

        List<RecipeMatchResponse> result = service.match("Toskana", List.of(), List.of(), null, false);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).id()).isEqualTo(id1);
    }

    @Test
    void match_responseWithoutText_throwsAiSuggestionException() throws Exception {
        when(recipeRepository.findAllByOrderByCreatedAtDesc())
                .thenReturn(List.of(minimalRecipe(UUID.randomUUID(), "Recipe")));

        String responseBody = objectMapper.writeValueAsString(Map.of(
                "stop_reason", "max_tokens",
                "content", List.of(Map.of("type", "thinking", "thinking", "", "signature", "abc"))
        ));
        when(restTemplate.postForEntity(eq(AiConstants.ANTHROPIC_URL), any(), eq(String.class)))
                .thenReturn(ResponseEntity.ok(responseBody));

        assertThatThrownBy(() -> service.match("Island", List.of(), List.of(), null, false))
                .isInstanceOf(AiSuggestionException.class)
                .hasMessageContaining("abgeschnitten");
    }

    @Test
    void match_httpError_throwsAiSuggestionException() {
        when(recipeRepository.findAllByOrderByCreatedAtDesc())
                .thenReturn(List.of(minimalRecipe(UUID.randomUUID(), "Recipe")));
        when(restTemplate.postForEntity(eq(AiConstants.ANTHROPIC_URL), any(), eq(String.class)))
                .thenThrow(HttpClientErrorException.create(
                        HttpStatus.TOO_MANY_REQUESTS, "Rate limited",
                        org.springframework.http.HttpHeaders.EMPTY, null, null));

        assertThatThrownBy(() -> service.match("Island", List.of(), List.of(), null, false))
                .isInstanceOf(AiSuggestionException.class)
                .hasMessageContaining("Anthropic API Fehler");
    }
}
