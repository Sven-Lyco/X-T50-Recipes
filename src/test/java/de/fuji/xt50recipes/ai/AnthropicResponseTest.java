package de.fuji.xt50recipes.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AnthropicResponseTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    private JsonNode json(String raw) throws Exception {
        return objectMapper.readTree(raw);
    }

    @Test
    void extractText_singleTextBlock_returnsText() throws Exception {
        JsonNode root = json("""
                {"stop_reason": "end_turn", "content": [{"type": "text", "text": "{\\"a\\": 1}"}]}
                """);

        assertThat(AnthropicResponse.extractText(root)).isEqualTo("{\"a\": 1}");
    }

    @Test
    void extractText_thinkingBlockFirst_skipsThinking() throws Exception {
        JsonNode root = json("""
                {"stop_reason": "end_turn", "content": [
                  {"type": "thinking", "thinking": "", "signature": "abc"},
                  {"type": "text", "text": "{\\"a\\": 1}"}
                ]}
                """);

        assertThat(AnthropicResponse.extractText(root)).isEqualTo("{\"a\": 1}");
    }

    @Test
    void extractText_multipleTextBlocks_concatenates() throws Exception {
        JsonNode root = json("""
                {"content": [{"type": "text", "text": "{\\"a\\":"}, {"type": "text", "text": " 1}"}]}
                """);

        assertThat(AnthropicResponse.extractText(root)).isEqualTo("{\"a\": 1}");
    }

    @Test
    void extractText_codeFence_isStripped() throws Exception {
        JsonNode root = json("""
                {"content": [{"type": "text", "text": "```json\\n{\\"a\\": 1}\\n```"}]}
                """);

        assertThat(AnthropicResponse.extractText(root)).isEqualTo("{\"a\": 1}");
    }

    @Test
    void extractText_onlyThinkingBlock_throws() throws Exception {
        JsonNode root = json("""
                {"stop_reason": "end_turn", "content": [{"type": "thinking", "thinking": "", "signature": "abc"}]}
                """);

        assertThatThrownBy(() -> AnthropicResponse.extractText(root))
                .isInstanceOf(AiSuggestionException.class)
                .hasMessageContaining("stop_reason=end_turn");
    }

    @Test
    void extractText_maxTokensWithoutText_throwsTruncated() throws Exception {
        JsonNode root = json("""
                {"stop_reason": "max_tokens", "content": [{"type": "thinking", "thinking": "", "signature": "abc"}]}
                """);

        assertThatThrownBy(() -> AnthropicResponse.extractText(root))
                .isInstanceOf(AiSuggestionException.class)
                .hasMessageContaining("abgeschnitten");
    }

    @Test
    void extractText_refusal_throws() throws Exception {
        JsonNode root = json("""
                {"stop_reason": "refusal", "content": []}
                """);

        assertThatThrownBy(() -> AnthropicResponse.extractText(root))
                .isInstanceOf(AiSuggestionException.class)
                .hasMessageContaining("abgelehnt");
    }
}
