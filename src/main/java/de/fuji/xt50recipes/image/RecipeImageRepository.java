package de.fuji.xt50recipes.image;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface RecipeImageRepository extends JpaRepository<RecipeImage, UUID> {
    Optional<RecipeImage> findByIdAndRecipeId(UUID id, UUID recipeId);
}
