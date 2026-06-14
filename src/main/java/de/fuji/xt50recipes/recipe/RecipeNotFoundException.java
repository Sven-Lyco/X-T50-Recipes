package de.fuji.xt50recipes.recipe;

import java.util.UUID;

public class RecipeNotFoundException extends RuntimeException {
    public RecipeNotFoundException(UUID id) {
        super("Recipe not found: " + id);
    }
}