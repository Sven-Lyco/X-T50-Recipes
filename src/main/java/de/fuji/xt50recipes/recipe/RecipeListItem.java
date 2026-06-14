package de.fuji.xt50recipes.recipe;

import java.util.Arrays;
import java.util.List;
import java.util.UUID;

public record RecipeListItem(
        UUID id,
        String name,
        FilmSimulation filmSimulation,
        CameraSlot cameraSlot,
        List<String> tags,
        String previewImageFilename
) {
    static RecipeListItem from(Recipe r) {
        String preview = r.getImages().isEmpty() ? null : r.getImages().get(0).getFilename();
        return new RecipeListItem(
                r.getId(), r.getName(), r.getFilmSimulation(), r.getCameraSlot(),
                r.getTags() != null ? Arrays.asList(r.getTags()) : List.of(),
                preview
        );
    }
}