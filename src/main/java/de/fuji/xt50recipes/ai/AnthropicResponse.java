package de.fuji.xt50recipes.ai;

import com.fasterxml.jackson.databind.JsonNode;

final class AnthropicResponse {

    private AnthropicResponse() {}

    // Models with thinking enabled put thinking blocks before the answer, so the text is not always content[0].
    static String extractText(JsonNode root) {
        String stopReason = root.path("stop_reason").asText("");
        if ("refusal".equals(stopReason)) {
            throw new AiSuggestionException("Anfrage vom Modell abgelehnt.");
        }

        StringBuilder sb = new StringBuilder();
        for (JsonNode block : root.path("content")) {
            if ("text".equals(block.path("type").asText())) {
                sb.append(block.path("text").asText());
            }
        }

        String text = sb.toString().replaceAll("(?s)```json\\s*", "").replaceAll("(?s)```\\s*", "").trim();
        if (text.isEmpty()) {
            throw new AiSuggestionException("max_tokens".equals(stopReason)
                    ? "Antwort abgeschnitten (max_tokens erreicht), kein Text erhalten."
                    : "Antwort enthält keinen Text (stop_reason=" + stopReason + ").");
        }
        return text;
    }
}
