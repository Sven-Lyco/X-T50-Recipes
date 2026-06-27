package de.fuji.xt50recipes.recipe;

import java.time.Instant;
import java.util.UUID;

public record SlotChangeLogResponse(
        UUID id,
        CameraSlot slot,
        UUID previousRecipeId,
        String previousRecipeName,
        UUID newRecipeId,
        String newRecipeName,
        Instant changedAt
) {
    public static SlotChangeLogResponse from(SlotChangeLog e) {
        return new SlotChangeLogResponse(
                e.getId(),
                e.getSlot(),
                e.getPreviousRecipeId(),
                e.getPreviousRecipeName(),
                e.getNewRecipeId(),
                e.getNewRecipeName(),
                e.getChangedAt()
        );
    }
}
