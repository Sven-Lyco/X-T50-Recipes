package de.fuji.xt50recipes.image;

import java.util.UUID;

public record RecipeImageResponse(
        UUID id,
        String filename,
        String caption,
        Integer sortOrder
) {
    public static RecipeImageResponse from(RecipeImage image) {
        return new RecipeImageResponse(image.getId(), image.getFilename(), image.getCaption(), image.getSortOrder());
    }
}
