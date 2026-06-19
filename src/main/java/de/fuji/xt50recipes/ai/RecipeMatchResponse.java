package de.fuji.xt50recipes.ai;

import java.util.UUID;

public record RecipeMatchResponse(
        UUID id,
        String name,
        String filmSimulation,
        String previewImageFilename,
        String cameraSlot,
        String reason
) {}
