package de.fuji.xt50recipes.recipe;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RecipeRepository extends JpaRepository<Recipe, UUID> {

    List<Recipe> findAllByOrderByCreatedAtDesc();

    List<Recipe> findByFilmSimulationOrderByCreatedAtDesc(FilmSimulation filmSimulation);

    @Query(value = "SELECT * FROM recipe WHERE :tag = ANY(tags) ORDER BY created_at DESC", nativeQuery = true)
    List<Recipe> findByTagOrderByCreatedAtDesc(@Param("tag") String tag);

    @Query(value = "SELECT * FROM recipe WHERE film_simulation = :filmSim AND :tag = ANY(tags) ORDER BY created_at DESC", nativeQuery = true)
    List<Recipe> findByFilmSimulationAndTagOrderByCreatedAtDesc(@Param("filmSim") String filmSim, @Param("tag") String tag);

    Optional<Recipe> findByCameraSlot(CameraSlot slot);

    List<Recipe> findByCameraSlotIsNotNullOrderByCameraSlot();
}
