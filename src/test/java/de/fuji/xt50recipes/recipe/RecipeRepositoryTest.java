package de.fuji.xt50recipes.recipe;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Testcontainers
class RecipeRepositoryTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired
    RecipeRepository repository;

    private Recipe save(String name, FilmSimulation sim, String... tags) {
        Recipe r = new Recipe();
        r.setName(name);
        r.setFilmSimulation(sim);
        r.setDynamicRange(DynamicRange.DR100);
        r.setHighlightTone(0.0);
        r.setShadowTone(0.0);
        r.setColor(0);
        r.setSharpness(0);
        r.setNoiseReduction(0);
        r.setGrainStrength(GrainStrength.OFF);
        r.setColorChromeEffect(EffectStrength.OFF);
        r.setColorChromeFxBlue(EffectStrength.OFF);
        r.setWhiteBalanceMode(WhiteBalanceMode.AUTO);
        r.setTags(tags);
        return repository.save(r);
    }

    @Test
    void findByFilters_noFilter_returnsAll() {
        save("A", FilmSimulation.PROVIA);
        save("B", FilmSimulation.VELVIA);

        List<Recipe> result = repository.findByFilters(null, null, false, null);

        assertThat(result).hasSize(2);
    }

    @Test
    void findByFilters_filmSimulation_filtersCorrectly() {
        save("Provia Recipe", FilmSimulation.PROVIA);
        save("Velvia Recipe", FilmSimulation.VELVIA);

        List<Recipe> result = repository.findByFilters("PROVIA", null, false, null);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getName()).isEqualTo("Provia Recipe");
    }

    @Test
    void findByFilters_tag_usesPostgresAnyOperator() {
        save("Street Shot", FilmSimulation.CLASSIC_CHROME, "street", "moody");
        save("Portrait", FilmSimulation.PROVIA, "portrait");

        List<Recipe> street = repository.findByFilters(null, "street", false, null);
        List<Recipe> portrait = repository.findByFilters(null, "portrait", false, null);
        List<Recipe> noMatch = repository.findByFilters(null, "landscape", false, null);

        assertThat(street).hasSize(1);
        assertThat(street.get(0).getName()).isEqualTo("Street Shot");
        assertThat(portrait).hasSize(1);
        assertThat(noMatch).isEmpty();
    }

    @Test
    void findByFilters_onlyFavorites_returnsOnlyFavorites() {
        Recipe fav = save("Fav", FilmSimulation.PROVIA);
        fav.setFavorite(true);
        repository.save(fav);
        save("Not Fav", FilmSimulation.VELVIA);

        List<Recipe> result = repository.findByFilters(null, null, true, null);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getName()).isEqualTo("Fav");
    }

    @Test
    void findByFilters_scenario_filtersCorrectly() {
        Recipe r = save("Street", FilmSimulation.CLASSIC_CHROME);
        r.setShootingScenario(ShootingScenario.STREET);
        repository.save(r);
        save("Other", FilmSimulation.PROVIA);

        List<Recipe> result = repository.findByFilters(null, null, false, "STREET");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getName()).isEqualTo("Street");
    }

    @Test
    void findByCameraSlotIsNotNull_returnsOnlyAssignedSlots() {
        Recipe r = save("C1 Recipe", FilmSimulation.PROVIA);
        r.setCameraSlot(CameraSlot.C1);
        repository.save(r);
        save("No Slot", FilmSimulation.VELVIA);

        List<Recipe> result = repository.findByCameraSlotIsNotNullOrderByCameraSlot();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getCameraSlot()).isEqualTo(CameraSlot.C1);
    }
}
