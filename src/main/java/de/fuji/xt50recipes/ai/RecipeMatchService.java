package de.fuji.xt50recipes.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import de.fuji.xt50recipes.recipe.Recipe;
import de.fuji.xt50recipes.recipe.RecipeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class RecipeMatchService {

    @Value("${app.anthropic-api-key}")
    private String apiKey;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final RecipeRepository recipeRepository;

    @Transactional(readOnly = true)
    public List<RecipeMatchResponse> match(byte[] imageBytes, String mimeType, String model, boolean onlySlots) {
        boolean modelValid = model != null && AiConstants.ALLOWED_MODELS.contains(model);
        String resolvedModel = modelValid ? model : AiConstants.DEFAULT_MODEL;

        List<Recipe> allRecipes = onlySlots
                ? recipeRepository.findByCameraSlotIsNotNullOrderByCameraSlot()
                : recipeRepository.findAllByOrderByCreatedAtDesc();
        if (allRecipes.isEmpty()) {
            return List.of();
        }
        log.info("Recipe match: {} recipes loaded, model={}", allRecipes.size(), resolvedModel);

        String recipeList = formatRecipes(allRecipes);
        String exifContext = ImageUtils.extractExifContext(imageBytes);
        String detectedMime = ImageUtils.detectMimeType(imageBytes, mimeType);
        if (!AiConstants.SUPPORTED_IMAGE_TYPES.contains(detectedMime)) {
            throw new AiSuggestionException(
                    "Format nicht unterstützt (" + detectedMime + "). Bitte JPEG, PNG, GIF oder WebP verwenden.");
        }

        log.info("Recipe match: imageSize={}bytes, mimeType={}, onlySlots={}, exif={}",
                imageBytes.length, detectedMime, onlySlots, exifContext != null ? exifContext : "none");
        log.info("Recipe match: recipe list ({} recipes, {} chars):\n{}", allRecipes.size(), recipeList.length(), recipeList);

        String prompt = buildPrompt(recipeList, exifContext);
        log.info("Recipe match: prompt ({} chars):\n{}", prompt.length(), prompt);

        String base64 = Base64.getEncoder().encodeToString(imageBytes);

        List<Map<String, Object>> content = List.of(
                Map.of("type", "image", "source", Map.of(
                        "type", "base64",
                        "media_type", detectedMime,
                        "data", base64
                )),
                Map.of("type", "text", "text", prompt)
        );

        Map<String, Object> body = Map.of(
                "model", resolvedModel,
                "max_tokens", 1024,
                "messages", List.of(Map.of("role", "user", "content", content))
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-api-key", apiKey);
        headers.set("anthropic-version", "2023-06-01");

        try {
            long start = System.currentTimeMillis();
            ResponseEntity<String> response = restTemplate.postForEntity(
                    AiConstants.ANTHROPIC_URL, new HttpEntity<>(body, headers), String.class
            );
            log.info("Recipe match: Anthropic responded in {}ms, status={}", System.currentTimeMillis() - start, response.getStatusCode());
            return parseResponse(response.getBody(), allRecipes);
        } catch (HttpStatusCodeException e) {
            log.error("Anthropic API error: status={}, body={}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new AiSuggestionException("Anthropic API Fehler " + e.getStatusCode() + ": " + e.getResponseBodyAsString());
        }
    }

    private List<RecipeMatchResponse> parseResponse(String responseBody, List<Recipe> allRecipes) {
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            String text = root.at("/content/0/text").asText();
            text = text.replaceAll("(?s)```json\\s*", "").replaceAll("(?s)```\\s*", "").trim();
            log.debug("Match response text: {}", text);

            JsonNode json = objectMapper.readTree(text);

            Map<UUID, Recipe> byId = new HashMap<>();
            for (Recipe r : allRecipes) byId.put(r.getId(), r);

            List<RecipeMatchResponse> result = new ArrayList<>();
            for (JsonNode match : json.path("matches")) {
                String idStr = match.path("id").asText();
                String reason = match.path("reason").asText();
                try {
                    Recipe r = byId.get(UUID.fromString(idStr));
                    if (r == null) { log.warn("Match response contained unknown ID: {}", idStr); continue; }
                    String preview = r.getImages().isEmpty() ? null : r.getImages().get(0).getFilename();
                    String slot = r.getCameraSlot() != null ? r.getCameraSlot().name() : null;
                    result.add(new RecipeMatchResponse(r.getId(), r.getName(), r.getFilmSimulation().name(), preview, slot, reason));
                } catch (IllegalArgumentException e) {
                    log.warn("Invalid UUID in match response: {}", idStr);
                }
            }
            log.info("Recipe match: {} matches parsed", result.size());
            return result;
        } catch (Exception e) {
            log.error("Failed to parse match response: {}", e.getMessage(), e);
            throw new AiSuggestionException("Match-Antwort konnte nicht verarbeitet werden: " + e.getMessage());
        }
    }

    private static String formatRecipes(List<Recipe> recipes) {
        StringBuilder sb = new StringBuilder();
        for (Recipe r : recipes) {
            sb.append("ID=").append(r.getId())
              .append(" | \"").append(r.getName()).append("\"")
              .append(" | Sim=").append(r.getFilmSimulation())
              .append(" | HL=").append(r.getHighlightTone())
              .append(" | SH=").append(r.getShadowTone())
              .append(" | Color=").append(r.getColor())
              .append(" | Grain=").append(r.getGrainStrength())
              .append(" | CCE=").append(r.getColorChromeEffect())
              .append(" | WBR=").append(r.getWbShiftRed())
              .append(" | WBB=").append(r.getWbShiftBlue())
              .append(" | DR=").append(r.getDynamicRange())
              .append(" | Clarity=").append(r.getClarity())
              .append("\n");
        }
        return sb.toString();
    }

    private static String buildPrompt(String recipeList, String exifContext) {
        String exif = exifContext != null ? "\nTechnische Metadaten des Referenzfotos: " + exifContext + "\n" : "";
        return """
                Du bist ein Experte für Fujifilm X-T50 Kamera-Einstellungen.

                Das hochgeladene Foto zeigt das Motiv oder die Szene, die ich mit meiner X-T50 fotografieren möchte.

                Analysiere das Motiv anhand von:
                - Lichtstimmung: Tageszeit, Qualität des Lichts (hart/weich, warm/kühl, kontrastreich/flach)
                - Motiv und Kontext (Portrait, Landschaft, Street, Architektur, Innenraum, Natur, …)
                - Atmosphäre und gewünschte Bildstimmung
                - Herausforderungen (Gegenlicht, flaches Licht, hoher Kontrast, …)
                """ + exif + """

                Meine verfügbaren Kamera-Einstellungen:
                """ + recipeList + """

                Empfehle die 3 Kamera-Einstellungen, die für dieses Motiv den besten Look erzeugen würden.
                Erkläre jeweils in 1-2 Sätzen auf Deutsch, warum genau diese Einstellung für dieses Motiv
                und diese Lichtsituation passt.

                Antworte AUSSCHLIESSLICH mit folgendem JSON ohne weitere Erklärungen:
                {"matches": [
                  {"id": "<exakte UUID aus der Liste>", "reason": "<1-2 Sätze auf Deutsch warum diese Einstellung für das Motiv passt>"},
                  {"id": "<exakte UUID>", "reason": "..."},
                  {"id": "<exakte UUID>", "reason": "..."}
                ]}
                """;
    }

}
