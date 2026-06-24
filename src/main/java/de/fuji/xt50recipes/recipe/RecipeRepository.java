package de.fuji.xt50recipes.recipe;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RecipeRepository extends JpaRepository<Recipe, UUID> {

    List<Recipe> findAllByOrderByCreatedAtDesc();

    @Query(value = """
            SELECT * FROM recipe
            WHERE (:filmSim IS NULL OR film_simulation = :filmSim)
              AND (:tag IS NULL OR :tag = ANY(tags))
              AND (:onlyFavorites = FALSE OR is_favorite = TRUE)
              AND (:scenario IS NULL OR shooting_scenario = :scenario)
            ORDER BY created_at DESC
            """, nativeQuery = true)
    List<Recipe> findByFilters(
            @Param("filmSim") String filmSim,
            @Param("tag") String tag,
            @Param("onlyFavorites") boolean onlyFavorites,
            @Param("scenario") String scenario
    );

    Optional<Recipe> findByCameraSlot(CameraSlot slot);

    List<Recipe> findByCameraSlotIsNotNullOrderByCameraSlot();
}
