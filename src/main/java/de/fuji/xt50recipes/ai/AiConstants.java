package de.fuji.xt50recipes.ai;

import java.util.Set;

final class AiConstants {

    static final String ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
    static final String DEFAULT_MODEL = "claude-sonnet-4-6";
    static final Set<String> ALLOWED_MODELS = Set.of(
            "claude-haiku-4-5-20251001",
            "claude-sonnet-4-6",
            "claude-opus-4-8"
    );
    static final Set<String> SUPPORTED_IMAGE_TYPES = Set.of(
            "image/jpeg", "image/png", "image/gif", "image/webp"
    );

    private AiConstants() {}
}
