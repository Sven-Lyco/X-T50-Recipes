package de.fuji.xt50recipes.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import de.fuji.xt50recipes.recipe.Recipe;
import de.fuji.xt50recipes.recipe.RecipeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class LocationMatchService {

    @Value("${app.anthropic-api-key}")
    private String apiKey;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final RecipeRepository recipeRepository;

    @Transactional(readOnly = true)
    public List<RecipeMatchResponse> match(String location, List<String> primarySubjects, List<String> secondarySubjects, String model, boolean onlySlots) {
        boolean modelValid = model != null && AiConstants.ALLOWED_MODELS.contains(model);
        String resolvedModel = modelValid ? model : AiConstants.DEFAULT_MODEL;

        List<Recipe> allRecipes = onlySlots
                ? recipeRepository.findByCameraSlotIsNotNullOrderByCameraSlot()
                : recipeRepository.findAllByOrderByCreatedAtDesc();
        if (allRecipes.isEmpty()) {
            return List.of();
        }
        log.info("Location match: {} recipes, model={}, onlySlots={}, location={}",
                allRecipes.size(), resolvedModel, onlySlots, location);

        String recipeList = formatRecipes(allRecipes);
        String prompt = buildPrompt(location, primarySubjects, secondarySubjects, recipeList);

        Map<String, Object> body = Map.of(
                "model", resolvedModel,
                "max_tokens", 1024,
                "messages", List.of(Map.of("role", "user", "content", prompt))
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
            log.info("Location match: Anthropic responded in {}ms", System.currentTimeMillis() - start);
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
            log.debug("Location match response: {}", text);

            JsonNode json = objectMapper.readTree(text);

            Map<UUID, Recipe> byId = new HashMap<>();
            for (Recipe r : allRecipes) byId.put(r.getId(), r);

            List<RecipeMatchResponse> result = new ArrayList<>();
            for (JsonNode match : json.path("matches")) {
                String idStr = match.path("id").asText();
                String reason = match.path("reason").asText();
                try {
                    Recipe r = byId.get(UUID.fromString(idStr));
                    if (r == null) { log.warn("Location match: unknown ID {}", idStr); continue; }
                    String preview = r.getImages().isEmpty() ? null : r.getImages().get(0).getFilename();
                    String slot = r.getCameraSlot() != null ? r.getCameraSlot().name() : null;
                    result.add(new RecipeMatchResponse(r.getId(), r.getName(), r.getFilmSimulation().name(), preview, slot, reason));
                } catch (IllegalArgumentException e) {
                    log.warn("Invalid UUID in location match response: {}", idStr);
                }
            }
            log.info("Location match: {} matches parsed", result.size());
            return result;
        } catch (Exception e) {
            log.error("Failed to parse location match response: {}", e.getMessage(), e);
            throw new AiSuggestionException("Antwort konnte nicht verarbeitet werden: " + e.getMessage());
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

    private static String buildPrompt(String location, List<String> primarySubjects, List<String> secondarySubjects, String recipeList) {
        StringBuilder subjectLines = new StringBuilder();
        if (primarySubjects != null && !primarySubjects.isEmpty()) {
            subjectLines.append("Hauptmotive (höchste Priorität): ").append(String.join(", ", primarySubjects)).append("\n");
        }
        if (secondarySubjects != null && !secondarySubjects.isEmpty()) {
            subjectLines.append("Nebenmotive: ").append(String.join(", ", secondarySubjects)).append("\n");
        }
        return "Du bist ein Experte für Fujifilm X-T50 Kamera-Einstellungen und Reisefotografie.\n\n"
                + "Der Nutzer plant eine Reise und möchte passende Kamera-Einstellungen (Film-Simulation-Recipes) wählen.\n\n"
                + "Reiseziel: " + location + "\n"
                + subjectLines
                + """
                Analysiere das typische fotografische Profil dieses Reiseziels:
                - Lichtverhältnisse (Qualität, Härte, Farbtemperatur, typische Tageszeiten)
                - Landschaft, Architektur und typische Motive
                - Farbpalette der Umgebung (warm/kühl, satt/gedämpft, kontrastreich/flach)
                - Atmosphäre und Stimmung

                Wichtig: Beurteile Recipes AUSSCHLIESSLICH anhand ihrer Kamera-Parameter \
                (Filmsimulation, Tonkurve, Farbe, Körnung usw.), NICHT anhand des Recipe-Namens.

                Verfügbare Kamera-Einstellungen:
                """
                + recipeList
                + """

                Empfehle die 3 Kamera-Einstellungen, die am besten zum fotografischen Charakter dieses Reiseziels passen.
                Erkläre jeweils in 1-2 Sätzen auf Deutsch, warum genau diese Einstellung für dieses Reiseziel passt.

                Antworte AUSSCHLIESSLICH mit folgendem JSON ohne weitere Erklärungen:
                {"matches": [
                  {"id": "<exakte UUID aus der Liste>", "reason": "<1-2 Sätze auf Deutsch>"},
                  {"id": "<exakte UUID>", "reason": "..."},
                  {"id": "<exakte UUID>", "reason": "..."}
                ]}
                """;
    }
}
