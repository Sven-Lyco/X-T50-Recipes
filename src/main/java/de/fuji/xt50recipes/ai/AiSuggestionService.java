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

import com.drew.imaging.ImageMetadataReader;
import com.drew.metadata.Metadata;
import com.drew.metadata.exif.ExifSubIFDDirectory;
import com.drew.metadata.exif.ExifIFD0Directory;

import java.io.ByteArrayInputStream;
import java.util.ArrayList;
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
        boolean modelValid = model != null && ALLOWED_MODELS.contains(model);
        String resolvedModel = modelValid ? model : DEFAULT_MODEL;
        if (!modelValid && model != null && !model.isBlank()) {
            log.warn("Requested model '{}' not in allowed list, falling back to default '{}'", model, DEFAULT_MODEL);
        }
        log.info("AI suggest called: imageCount={}, model={}, apiKeySet={}",
                images.size(), resolvedModel, apiKey != null && !apiKey.isBlank());

        for (int i = 0; i < images.size(); i++) {
            log.info("Image[{}]: sizeBytes={}, declaredMime={}", i, images.get(i).bytes().length, images.get(i).mimeType());
        }

        String exifContext = extractExifContext(images);
        if (exifContext != null) {
            log.info("EXIF context found for {} image(s)", images.size());
            log.debug("EXIF context: {}", exifContext);
        } else {
            log.info("No EXIF data found in uploaded images");
        }

        String prompt = buildPrompt(userDescription, images.size(), exifContext);
        log.debug("Prompt length={} chars, userDescription present={}", prompt.length(), userDescription != null && !userDescription.isBlank());

        List<Map<String, Object>> content = new java.util.ArrayList<>();
        for (int i = 0; i < images.size(); i++) {
            ImageInput img = images.get(i);
            String base64 = Base64.getEncoder().encodeToString(img.bytes());
            String detectedMime = detectMimeType(img.bytes(), img.mimeType());
            log.info("Image[{}] mimeType declared={}, detected={}", i, img.mimeType(), detectedMime);
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
            ResponseEntity<String> response = restTemplate.postForEntity(ANTHROPIC_URL, request, String.class);
            long durationMs = System.currentTimeMillis() - startMs;
            log.info("Anthropic API responded: status={}, durationMs={}", response.getStatusCode(), durationMs);
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

            String parsedName = json.path("name").asText("");
            String parsedFilmSim = json.path("filmSimulation").asText("PROVIA");
            String parsedDynRange = json.path("dynamicRange").asText("DR100");
            boolean hasDescription = !json.path("description").isMissingNode() && !json.path("description").isNull();
            log.info("AI response parsed successfully: name='{}', filmSimulation={}, dynamicRange={}, hasDescription={}",
                    parsedName, parsedFilmSim, parsedDynRange, hasDescription);

            return new RecipeRequest(
                    parsedName,
                    FilmSimulation.valueOf(parsedFilmSim),
                    DynamicRange.valueOf(parsedDynRange),
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
                    hasDescription ? json.path("description").asText() : null,
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

    private static String extractExifContext(List<ImageInput> images) {
        List<String> parts = new ArrayList<>();
        for (ImageInput img : images) {
            try {
                Metadata metadata = ImageMetadataReader.readMetadata(new ByteArrayInputStream(img.bytes()));
                List<String> fields = new ArrayList<>();

                ExifSubIFDDirectory sub = metadata.getFirstDirectoryOfType(ExifSubIFDDirectory.class);
                if (sub != null) {
                    if (sub.containsTag(ExifSubIFDDirectory.TAG_ISO_EQUIVALENT))
                        fields.add("ISO " + sub.getInt(ExifSubIFDDirectory.TAG_ISO_EQUIVALENT));
                    if (sub.containsTag(ExifSubIFDDirectory.TAG_EXPOSURE_TIME))
                        fields.add("Belichtung " + sub.getDescription(ExifSubIFDDirectory.TAG_EXPOSURE_TIME));
                    if (sub.containsTag(ExifSubIFDDirectory.TAG_FNUMBER))
                        fields.add("Blende " + sub.getDescription(ExifSubIFDDirectory.TAG_FNUMBER));
                    if (sub.containsTag(ExifSubIFDDirectory.TAG_FOCAL_LENGTH))
                        fields.add("Brennweite " + sub.getDescription(ExifSubIFDDirectory.TAG_FOCAL_LENGTH));
                    if (sub.containsTag(ExifSubIFDDirectory.TAG_WHITE_BALANCE_MODE))
                        fields.add("WB " + sub.getDescription(ExifSubIFDDirectory.TAG_WHITE_BALANCE_MODE));
                    if (sub.containsTag(ExifSubIFDDirectory.TAG_EXPOSURE_BIAS))
                        fields.add("Belichtungskorrektur " + sub.getDescription(ExifSubIFDDirectory.TAG_EXPOSURE_BIAS));
                }

                ExifIFD0Directory ifd0 = metadata.getFirstDirectoryOfType(ExifIFD0Directory.class);
                if (ifd0 != null && ifd0.containsTag(ExifIFD0Directory.TAG_MODEL)) {
                    fields.add(0, "Kamera: " + ifd0.getString(ExifIFD0Directory.TAG_MODEL));
                }

                if (!fields.isEmpty()) parts.add(String.join(", ", fields));
            } catch (Exception e) {
                log.debug("EXIF extraction failed for image: {}", e.getMessage());
            }
        }
        return parts.isEmpty() ? null : String.join(" | ", parts);
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
