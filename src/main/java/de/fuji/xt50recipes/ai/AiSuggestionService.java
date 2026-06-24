package de.fuji.xt50recipes.ai;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
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


    @Value("${app.anthropic-api-key}")
    private String apiKey;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public record ImageInput(byte[] bytes, String mimeType) {}

    public RecipeRequest suggest(List<ImageInput> images, String userDescription, String model) {
        boolean modelValid = model != null && AiConstants.ALLOWED_MODELS.contains(model);
        String resolvedModel = modelValid ? model : AiConstants.DEFAULT_MODEL;
        if (!modelValid && model != null && !model.isBlank()) {
            log.warn("Requested model '{}' not in allowed list, falling back to default '{}'", model, AiConstants.DEFAULT_MODEL);
        }
        log.info("AI suggest called: imageCount={}, model={}, apiKeySet={}",
                images.size(), resolvedModel, apiKey != null && !apiKey.isBlank());

        for (int i = 0; i < images.size(); i++) {
            log.info("Image[{}]: sizeBytes={}, declaredMime={}", i, images.get(i).bytes().length, images.get(i).mimeType());
        }

        String exifContext = ImageUtils.extractExifContext(images.stream().map(ImageInput::bytes).toList());
        if (exifContext != null) {
            log.info("EXIF context found for {} image(s)", images.size());
            log.debug("EXIF context: {}", exifContext);
        } else {
            log.info("No EXIF data found in uploaded images");
        }

        String prompt = buildPrompt(userDescription, images.size(), exifContext);
        log.info("AI suggest: prompt ({} chars):\n{}", prompt.length(), prompt);

        List<Map<String, Object>> content = new java.util.ArrayList<>();
        for (int i = 0; i < images.size(); i++) {
            ImageInput img = images.get(i);
            String detectedMime = ImageUtils.detectMimeType(img.bytes(), img.mimeType());
            log.info("Image[{}] mimeType declared={}, detected={}", i, img.mimeType(), detectedMime);
            if (!AiConstants.SUPPORTED_IMAGE_TYPES.contains(detectedMime)) {
                throw new AiSuggestionException(
                        "Bild " + (i + 1) + ": Format nicht unterstützt (" + detectedMime + "). Bitte JPEG, PNG, GIF oder WebP verwenden.");
            }
            String base64 = Base64.getEncoder().encodeToString(img.bytes());
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
            long startMs = System.currentTimeMillis();
            ResponseEntity<String> response = restTemplate.postForEntity(AiConstants.ANTHROPIC_URL, request, String.class);
            long durationMs = System.currentTimeMillis() - startMs;
            log.info("Anthropic API responded: status={}, durationMs={}", response.getStatusCode(), durationMs);
            log.debug("Anthropic API response body: {}", response.getBody());
            return parseResponse(response.getBody());
        } catch (HttpStatusCodeException e) {
            log.error("Anthropic API error: status={}, body={}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new AiSuggestionException("Anthropic API Fehler " + e.getStatusCode() + ": " + e.getResponseBodyAsString());
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record AiRecipeResponse(
            String name,
            String filmSimulation,
            String dynamicRange,
            Double highlightTone,
            Double shadowTone,
            Integer color,
            Integer sharpness,
            Integer noiseReduction,
            String grainStrength,
            String grainSize,
            String colorChromeEffect,
            String colorChromeFxBlue,
            String whiteBalanceMode,
            Integer wbShiftRed,
            Integer wbShiftBlue,
            Integer colorTempKelvin,
            Integer clarity,
            String description
    ) {}

    private RecipeRequest parseResponse(String responseBody) {
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            String text = root.at("/content/0/text").asText();
            log.info("Parsing AI response, raw text length={}", text.length());
            log.debug("AI response text: {}", text);

            text = text.replaceAll("(?s)```json\\s*", "").replaceAll("(?s)```\\s*", "").trim();

            AiRecipeResponse ai = parseAiResponse(text);
            log.info("AI response parsed: name='{}', filmSimulation={}, dynamicRange={}, hasDescription={}",
                    ai.name(), ai.filmSimulation(), ai.dynamicRange(), ai.description() != null);

            return new RecipeRequest(
                    ai.name() != null && !ai.name().isBlank() ? ai.name() : "KI-Recipe",
                    safeEnum(ai.filmSimulation(), FilmSimulation.class, FilmSimulation.PROVIA),
                    safeEnum(ai.dynamicRange(), DynamicRange.class, DynamicRange.DR100),
                    ai.highlightTone() != null ? ai.highlightTone() : 0.0,
                    ai.shadowTone() != null ? ai.shadowTone() : 0.0,
                    ai.color() != null ? ai.color() : 0,
                    ai.sharpness() != null ? ai.sharpness() : 0,
                    ai.noiseReduction() != null ? ai.noiseReduction() : 0,
                    safeEnum(ai.grainStrength(), GrainStrength.class, GrainStrength.OFF),
                    ai.grainSize() != null ? safeEnum(ai.grainSize(), GrainSize.class, GrainSize.SMALL) : null,
                    safeEnum(ai.colorChromeEffect(), EffectStrength.class, EffectStrength.OFF),
                    safeEnum(ai.colorChromeFxBlue(), EffectStrength.class, EffectStrength.OFF),
                    safeEnum(ai.whiteBalanceMode(), WhiteBalanceMode.class, WhiteBalanceMode.AUTO),
                    ai.wbShiftRed(),
                    ai.wbShiftBlue(),
                    ai.colorTempKelvin(),
                    ai.clarity(),
                    null, null, null, null, null,
                    ai.description(),
                    null,
                    List.of(),
                    null,
                    true,
                    null
            );
        } catch (Exception e) {
            log.error("Failed to parse AI response: {}", e.getMessage(), e);
            throw new AiSuggestionException("KI-Antwort konnte nicht verarbeitet werden: " + e.getMessage());
        }
    }

    private AiRecipeResponse parseAiResponse(String text) throws Exception {
        try {
            return objectMapper.treeToValue(objectMapper.readTree(text), AiRecipeResponse.class);
        } catch (Exception e) {
            log.warn("Initial JSON parse failed (likely unescaped quotes in description), trying fallback: {}", e.getMessage());
            return parseWithDescriptionFallback(text);
        }
    }

    private AiRecipeResponse parseWithDescriptionFallback(String text) throws Exception {
        // description is always the last JSON field — extract it positionally to survive unescaped quotes
        String extractedDescription = null;
        String cleanedText = text;

        int descKeyIdx = text.lastIndexOf("\"description\"");
        if (descKeyIdx >= 0) {
            int colonIdx = text.indexOf(':', descKeyIdx);
            int openQuoteIdx = text.indexOf('"', colonIdx + 1);
            int closingBrace = text.lastIndexOf('}');
            if (openQuoteIdx >= 0 && closingBrace > openQuoteIdx) {
                // Skip whitespace backward from } — the first non-whitespace char must be "
                // for description to be the last field (as the prompt enforces).
                // If it's not ", description isn't last and we can't extract reliably.
                int ptr = closingBrace - 1;
                while (ptr > openQuoteIdx && Character.isWhitespace(text.charAt(ptr))) ptr--;
                if (ptr > openQuoteIdx && text.charAt(ptr) == '"') {
                    extractedDescription = text.substring(openQuoteIdx + 1, ptr);
                    cleanedText = text.substring(0, descKeyIdx).replaceAll(",?\\s*$", "") + "\n}";
                    log.info("Description extracted positionally ({} chars), retrying JSON parse", extractedDescription.length());
                } else {
                    log.warn("Description is not the last JSON field; description will be null in parsed result");
                }
            }
        }

        AiRecipeResponse base = objectMapper.treeToValue(objectMapper.readTree(cleanedText), AiRecipeResponse.class);
        return new AiRecipeResponse(
                base.name(), base.filmSimulation(), base.dynamicRange(),
                base.highlightTone(), base.shadowTone(), base.color(),
                base.sharpness(), base.noiseReduction(), base.grainStrength(),
                base.grainSize(), base.colorChromeEffect(), base.colorChromeFxBlue(),
                base.whiteBalanceMode(), base.wbShiftRed(), base.wbShiftBlue(),
                base.colorTempKelvin(), base.clarity(), extractedDescription
        );
    }

    private static <E extends Enum<E>> E safeEnum(String value, Class<E> cls, E fallback) {
        if (value == null || value.isBlank()) return fallback;
        try {
            return Enum.valueOf(cls, value);
        } catch (IllegalArgumentException e) {
            log.warn("Unknown {} value '{}', falling back to {}", cls.getSimpleName(), value, fallback);
            return fallback;
        }
    }

    private String buildPrompt(String userDescription, int imageCount, String exifContext) {
        String extra = (userDescription != null && !userDescription.isBlank())
                ? "\nZusätzlicher Hinweis des Nutzers: " + userDescription
                : "";
        String exif = (exifContext != null)
                ? "\nEXIF-Metadaten der Aufnahme: " + exifContext
                : "";
        String imageNote = imageCount > 1
                ? "Analysiere alle " + imageCount + " Bilder gemeinsam und leite daraus ein einheitliches Recipe ab, das den gemeinsamen Look am besten einfängt."
                : "Analysiere das Bild und empfehle Recipe-Einstellungen, die den Look des Bildes auf der X-T50 nachbilden würden.";

        return """
                Du bist ein Experte für Fujifilm X-T50 Film-Simulation-Recipes.
                """ + imageNote + exif + extra + """

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
