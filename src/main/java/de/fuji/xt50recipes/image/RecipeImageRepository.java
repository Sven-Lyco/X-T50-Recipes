package de.fuji.xt50recipes.image;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RecipeImageRepository extends JpaRepository<RecipeImage, UUID> {
    Optional<RecipeImage> findByIdAndRecipeId(UUID id, UUID recipeId);

    @Query("select i.filename from RecipeImage i")
    List<String> findAllFilenames();
}
