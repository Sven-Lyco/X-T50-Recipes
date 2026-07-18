package de.fuji.xt50recipes.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
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

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AiSuggestionServiceTest {

    @Mock RestTemplate restTemplate;

    ObjectMapper objectMapper = new ObjectMapper();
    AiSuggestionService service;

    private static final byte[] JPEG_BYTES = new byte[]{
            (byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0, 16, 0, 0, 0, 0
    };

    @BeforeEach
    void setUp() {
        service = new AiSuggestionService(restTemplate, objectMapper);
        ReflectionTestUtils.setField(service, "apiKey", "test-api-key");
    }

    private String buildAnthropicResponse(Map<String, Object> aiFields) throws Exception {
        String innerJson = objectMapper.writeValueAsString(aiFields);
        return objectMapper.writeValueAsString(Map.of(
                "content", List.of(Map.of("type", "text", "text", innerJson))
        ));
    }

    private Map<String, Object> aiFields(String name, String filmSim) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("name", name);
        m.put("filmSimulation", filmSim);
        m.put("dynamicRange", "DR200");
        m.put("highlightTone", -0.5);
        m.put("shadowTone", 0.5);
        m.put("color", 1);
        m.put("sharpness", -1);
        m.put("noiseReduction", -2);
        m.put("grainStrength", "WEAK");
        m.put("grainSize", "SMALL");
        m.put("colorChromeEffect", "WEAK");
        m.put("colorChromeFxBlue", "OFF");
        m.put("whiteBalanceMode", "DAYLIGHT");
        m.put("wbShiftRed", 1);
        m.put("wbShiftBlue", -1);
        m.put("colorTempKelvin", null);
        m.put("clarity", 0);
        m.put("description", "Nice recipe.");
        return m;
    }

    @Test
    void suggest_happyPath_parsesRecipeRequest() throws Exception {
        String responseBody = buildAnthropicResponse(aiFields("Golden Hour", "CLASSIC_CHROME"));
        when(restTemplate.postForEntity(eq(AiConstants.ANTHROPIC_URL), any(), eq(String.class)))
                .thenReturn(ResponseEntity.ok(responseBody));

        var result = service.suggest(
                List.of(new AiSuggestionService.ImageInput(JPEG_BYTES, "image/jpeg")),
                "warm look", "claude-sonnet-4-6"
        );

        assertThat(result.name()).isEqualTo("Golden Hour");
        assertThat(result.filmSimulation().name()).isEqualTo("CLASSIC_CHROME");
        assertThat(result.aiGenerated()).isTrue();
    }

    @Test
    void suggest_unknownFilmSimulation_fallsBackToProvia() throws Exception {
        String responseBody = buildAnthropicResponse(aiFields("Test", "NONEXISTENT_SIM"));
        when(restTemplate.postForEntity(eq(AiConstants.ANTHROPIC_URL), any(), eq(String.class)))
                .thenReturn(ResponseEntity.ok(responseBody));

        var result = service.suggest(
                List.of(new AiSuggestionService.ImageInput(JPEG_BYTES, "image/jpeg")),
                null, null
        );

        assertThat(result.filmSimulation().name()).isEqualTo("PROVIA");
    }

    @Test
    void suggest_blankName_defaultsToKiRecipe() throws Exception {
        String responseBody = buildAnthropicResponse(aiFields("", "PROVIA"));
        when(restTemplate.postForEntity(eq(AiConstants.ANTHROPIC_URL), any(), eq(String.class)))
                .thenReturn(ResponseEntity.ok(responseBody));

        var result = service.suggest(
                List.of(new AiSuggestionService.ImageInput(JPEG_BYTES, "image/jpeg")),
                null, "claude-opus-4-8"
        );

        assertThat(result.name()).isEqualTo("KI-Recipe");
    }

    @Test
    void suggest_httpError_throwsAiSuggestionException() {
        when(restTemplate.postForEntity(eq(AiConstants.ANTHROPIC_URL), any(), eq(String.class)))
                .thenThrow(HttpClientErrorException.create(
                        HttpStatus.UNAUTHORIZED, "Unauthorized",
                        org.springframework.http.HttpHeaders.EMPTY, null, null));

        assertThatThrownBy(() -> service.suggest(
                List.of(new AiSuggestionService.ImageInput(JPEG_BYTES, "image/jpeg")),
                null, null))
                .isInstanceOf(AiSuggestionException.class)
                .hasMessageContaining("Anthropic API Fehler");
    }

    @Test
    void suggest_unsupportedMimeType_throwsAiSuggestionException() {
        byte[] textBytes = "not-an-image".getBytes();

        assertThatThrownBy(() -> service.suggest(
                List.of(new AiSuggestionService.ImageInput(textBytes, "text/plain")),
                null, null))
                .isInstanceOf(AiSuggestionException.class)
                .hasMessageContaining("Format nicht unterstützt");
    }
}
