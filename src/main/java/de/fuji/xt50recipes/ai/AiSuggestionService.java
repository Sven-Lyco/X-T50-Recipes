package de.fuji.xt50recipes.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import de.fuji.xt50recipes.recipe.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.util.Base64;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiSuggestionService {

    private static final String ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
    private static final String DEFAULT_MODEL = "claude-sonnet-4-6";
    private static final java.util.Set<String> ALLOWED_MODELS = java.util.Set.of(
            "claude-haiku-4-5-20251001",
            "claude-sonnet-4-6",
            "claude-opus-4-8"
    );

    @Value("${app.anthropic-api-key}")
    private String apiKey;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public record ImageInput(byte[] bytes, String mimeType) {}

    public RecipeRequest suggest(List<ImageInput> images, String userDescription, String model) {
        String resolvedModel = (model != null && ALLOWED_MODELS.contains(model)) ? model : DEFAULT_MODEL;
        log.info("AI suggest called: imageCount={}, model={}, apiKeySet={}",
                images.size(), resolvedModel, apiKey != null && !apiKey.isBlank());

        String prompt = buildPrompt(userDescription, images.size());

        List<Map<String, Object>> content = new java.util.ArrayList<>();
        for (ImageInput img : images) {
            String base64 = Base64.getEncoder().encodeToString(img.bytes());
            String detectedMime = detectMimeType(img.bytes(), img.mimeType());
            log.debug("Image mimeType declared={}, detected={}", img.mimeType(), detectedMime);
            content.add(Map.of("type", "image", "source", Map.of(
                    "type", "base64",
                    "media_type", detectedMime,
                    "data", base64
            )));
        }
        content.add(Map.of("type", "text", "text", prompt));

        Map<String, Object> body = Map.of(
                "model", resolvedModel,
                "max_tokens", 2048,
                "messages", List.of(Map.of("role", "user", "content", content))
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-api-key", apiKey);
        headers.set("anthropic-version", "2023-06-01");

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
        try {
            log.info("Sending request to Anthropic API, model={}", resolvedModel);
            ResponseEntity<String> response = restTemplate.postForEntity(ANTHROPIC_URL, request, String.class);
            log.info("Anthropic API responded with status={}", response.getStatusCode());
            log.debug("Anthropic API response body: {}", response.getBody());
            return parseResponse(response.getBody());
        } catch (HttpStatusCodeException e) {
            log.error("Anthropic API error: status={}, body={}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new AiSuggestionException("Anthropic API Fehler " + e.getStatusCode() + ": " + e.getResponseBodyAsString());
        }
    }

    private RecipeRequest parseResponse(String responseBody) {
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            String text = root.at("/content/0/text").asText();
            log.info("Parsing AI response, raw text length={}", text.length());
            log.debug("AI response text: {}", text);

            // Strip possible markdown code fences
            text = text.replaceAll("(?s)```json\\s*", "").replaceAll("(?s)```\\s*", "").trim();

            JsonNode json = objectMapper.readTree(text);

            return new RecipeRequest(
                    json.path("name").asText(""),
                    FilmSimulation.valueOf(json.path("filmSimulation").asText("PROVIA")),
                    DynamicRange.valueOf(json.path("dynamicRange").asText("DR100")),
                    json.path("highlightTone").asDouble(0),
                    json.path("shadowTone").asDouble(0),
                    json.path("color").asInt(0),
                    json.path("sharpness").asInt(0),
                    json.path("noiseReduction").asInt(0),
                    GrainStrength.valueOf(json.path("grainStrength").asText("OFF")),
                    json.path("grainSize").isNull() || json.path("grainSize").isMissingNode() ? null
                            : GrainSize.valueOf(json.path("grainSize").asText("SMALL")),
                    EffectStrength.valueOf(json.path("colorChromeEffect").asText("OFF")),
                    EffectStrength.valueOf(json.path("colorChromeFxBlue").asText("OFF")),
                    WhiteBalanceMode.valueOf(json.path("whiteBalanceMode").asText("AUTO")),
                    json.path("wbShiftRed").asInt(0),
                    json.path("wbShiftBlue").asInt(0),
                    json.path("colorTempKelvin").isNull() || json.path("colorTempKelvin").isMissingNode() ? null
                            : json.path("colorTempKelvin").asInt(5200),
                    json.path("clarity").asInt(0),
                    null,
                    null,
                    null,
                    null,
                    null,
                    json.path("description").isMissingNode() || json.path("description").isNull() ? null
                            : json.path("description").asText(),
                    null,
                    List.of(),
                    null,
                    true
            );
        } catch (Exception e) {
            log.error("Failed to parse AI response: {}", e.getMessage(), e);
            throw new AiSuggestionException("KI-Antwort konnte nicht verarbeitet werden: " + e.getMessage());
        }
    }

    private static String detectMimeType(byte[] bytes, String fallback) {
        if (bytes.length >= 4) {
            // JPEG: FF D8 FF
            if ((bytes[0] & 0xFF) == 0xFF && (bytes[1] & 0xFF) == 0xD8 && (bytes[2] & 0xFF) == 0xFF) {
                return "image/jpeg";
            }
            // PNG: 89 50 4E 47
            if ((bytes[0] & 0xFF) == 0x89 && bytes[1] == 'P' && bytes[2] == 'N' && bytes[3] == 'G') {
                return "image/png";
            }
            // GIF: 47 49 46 38
            if (bytes[0] == 'G' && bytes[1] == 'I' && bytes[2] == 'F' && bytes[3] == '8') {
                return "image/gif";
            }
            // WebP: RIFF????WEBP
            if (bytes[0] == 'R' && bytes[1] == 'I' && bytes[2] == 'F' && bytes[3] == 'F'
                    && bytes.length >= 12
                    && bytes[8] == 'W' && bytes[9] == 'E' && bytes[10] == 'B' && bytes[11] == 'P') {
                return "image/webp";
            }
        }
        return fallback;
    }

    private String buildPrompt(String userDescription, int imageCount) {
        String extra = (userDescription != null && !userDescription.isBlank())
                ? "\nZusätzlicher Hinweis: " + userDescription
                : "";
        String imageNote = imageCount > 1
                ? "Analysiere alle " + imageCount + " Bilder gemeinsam und leite daraus ein einheitliches Recipe ab, das den gemeinsamen Look am besten einfängt."
                : "Analysiere das Bild und empfehle Recipe-Einstellungen, die den Look des Bildes auf der X-T50 nachbilden würden.";

        return """
                Du bist ein Experte für Fujifilm X-T50 Film-Simulation-Recipes.
                """ + imageNote + extra + """

                Antworte AUSSCHLIESSLICH mit einem JSON-Objekt ohne Erklärungen. Gültige Werte:

                name: Kreativer, prägnanter Name auf Englisch (1-4 Wörter, z.B. "Golden Hour", "Rainy Day Blues", "Cinema Black")
                filmSimulation: PROVIA | VELVIA | ASTIA | CLASSIC_CHROME | CLASSIC_NEGATIVE | REALA_ACE | PRO_NEG_HI | PRO_NEG_STD | NOSTALGIC_NEG | ETERNA | ETERNA_BLEACH_BYPASS | ACROS | ACROS_YE | ACROS_R | ACROS_G | MONOCHROME | MONOCHROME_YE | MONOCHROME_R | MONOCHROME_G | SEPIA
                dynamicRange: DR_AUTO | DR100 | DR200 | DR400
                highlightTone: Dezimalzahl -2.0 bis 4.0 in 0.5-Schritten
                shadowTone: Dezimalzahl -2.0 bis 4.0 in 0.5-Schritten
                color: Integer -4 bis 4
                sharpness: Integer -4 bis 4
                noiseReduction: Integer -4 bis 4
                grainStrength: OFF | WEAK | STRONG
                grainSize: SMALL | LARGE (null wenn grainStrength=OFF)
                colorChromeEffect: OFF | WEAK | STRONG
                colorChromeFxBlue: OFF | WEAK | STRONG
                whiteBalanceMode: AUTO | DAYLIGHT | SHADE | INCANDESCENT | FLUORESCENT_1 | FLUORESCENT_2 | FLUORESCENT_3 | UNDERWATER | COLOR_TEMP
                wbShiftRed: Integer -9 bis 9
                wbShiftBlue: Integer -9 bis 9
                colorTempKelvin: Integer 2500-10000 (nur wenn whiteBalanceMode=COLOR_TEMP, sonst null)
                clarity: Integer -5 bis 5
                description: Begründung auf Deutsch (3-5 Sätze) warum diese Einstellungen zum Look passen – Filmsimulation, Tonkurven, Farbe. Sachlich und informativ.
                """;
    }
}
