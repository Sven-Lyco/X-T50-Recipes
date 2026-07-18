package de.fuji.xt50recipes.recipe;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;


@ExtendWith(MockitoExtension.class)
class RecipeServiceTest {

    @Mock
    RecipeRepository recipeRepository;

    @Mock
    SlotChangeLogRepository slotChangeLogRepository;

    @InjectMocks
    RecipeService recipeService;

    private Recipe recipe(UUID id, String name) {
        Recipe r = new Recipe();
        r.setId(id);
        r.setName(name);
        r.setFilmSimulation(FilmSimulation.PROVIA);
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
        r.setTags(new String[0]);
        return r;
    }

    @Test
    void assignCameraSlot_freeSlot_assigns() {
        UUID id = UUID.randomUUID();
        Recipe r = recipe(id, "My Recipe");
        when(recipeRepository.findById(id)).thenReturn(Optional.of(r));
        when(recipeRepository.findByCameraSlot(CameraSlot.C1)).thenReturn(Optional.empty());
        when(recipeRepository.save(r)).thenReturn(r);

        RecipeResponse result = recipeService.assignCameraSlot(id, CameraSlot.C1, false);

        assertThat(result.cameraSlot()).isEqualTo(CameraSlot.C1);
        assertThat(r.getCameraSlot()).isEqualTo(CameraSlot.C1);
    }

    @Test
    void assignCameraSlot_occupiedSlot_withoutForce_throwsConflict() {
        UUID id = UUID.randomUUID();
        Recipe r = recipe(id, "New Recipe");
        Recipe occupant = recipe(UUID.randomUUID(), "Occupant");
        when(recipeRepository.findById(id)).thenReturn(Optional.of(r));
        when(recipeRepository.findByCameraSlot(CameraSlot.C2)).thenReturn(Optional.of(occupant));

        assertThatThrownBy(() -> recipeService.assignCameraSlot(id, CameraSlot.C2, false))
                .isInstanceOf(SlotConflictException.class)
                .hasMessageContaining("Occupant");
    }

    @Test
    void assignCameraSlot_occupiedSlot_withForce_freesOldAndAssigns() {
        UUID id = UUID.randomUUID();
        Recipe r = recipe(id, "New Recipe");
        Recipe occupant = recipe(UUID.randomUUID(), "Old Recipe");
        occupant.setCameraSlot(CameraSlot.C3);
        when(recipeRepository.findById(id)).thenReturn(Optional.of(r));
        when(recipeRepository.findByCameraSlot(CameraSlot.C3)).thenReturn(Optional.of(occupant));
        when(recipeRepository.saveAndFlush(occupant)).thenReturn(occupant);
        when(recipeRepository.save(r)).thenReturn(r);

        recipeService.assignCameraSlot(id, CameraSlot.C3, true);

        assertThat(occupant.getCameraSlot()).isNull();
        assertThat(r.getCameraSlot()).isEqualTo(CameraSlot.C3);
    }

    @Test
    void duplicate_nameIsPrefixedAndSlotIsCleared() {
        UUID id = UUID.randomUUID();
        Recipe original = recipe(id, "Original");
        original.setCameraSlot(CameraSlot.C1);
        Recipe savedCopy = recipe(UUID.randomUUID(), "Kopie von Original");
        when(recipeRepository.findById(id)).thenReturn(Optional.of(original));
        when(recipeRepository.save(any(Recipe.class))).thenReturn(savedCopy);

        RecipeResponse result = recipeService.duplicate(id);

        assertThat(result.name()).isEqualTo("Kopie von Original");
        assertThat(result.cameraSlot()).isNull();
    }

    @Test
    void setFavorite_true_marksAsFavorite() {
        UUID id = UUID.randomUUID();
        Recipe r = recipe(id, "My Recipe");
        when(recipeRepository.findById(id)).thenReturn(Optional.of(r));
        when(recipeRepository.save(r)).thenReturn(r);

        RecipeResponse result = recipeService.setFavorite(id, true);

        assertThat(result.favorite()).isTrue();
    }

    @Test
    void setFavorite_false_unmarksAsFavorite() {
        UUID id = UUID.randomUUID();
        Recipe r = recipe(id, "My Recipe");
        r.setFavorite(true);
        when(recipeRepository.findById(id)).thenReturn(Optional.of(r));
        when(recipeRepository.save(r)).thenReturn(r);

        RecipeResponse result = recipeService.setFavorite(id, false);

        assertThat(result.favorite()).isFalse();
    }

    @Test
    void findById_unknownId_throwsNotFound() {
        UUID id = UUID.randomUUID();
        when(recipeRepository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> recipeService.findById(id))
                .isInstanceOf(RecipeNotFoundException.class);
    }

    @Test
    void findAll_noFilters_returnsMappedList() {
        UUID id = UUID.randomUUID();
        Recipe r = recipe(id, "Recipe A");
        when(recipeRepository.findByFilters(null, null, false, null)).thenReturn(List.of(r));

        List<RecipeListItem> result = recipeService.findAll(null, null, false, null);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).name()).isEqualTo("Recipe A");
    }

    @Test
    void findAll_withFilmSimFilter_passesNameToRepo() {
        when(recipeRepository.findByFilters("PROVIA", null, false, null)).thenReturn(List.of());

        List<RecipeListItem> result = recipeService.findAll(FilmSimulation.PROVIA, null, false, null);

        assertThat(result).isEmpty();
        verify(recipeRepository).findByFilters("PROVIA", null, false, null);
    }

    @Test
    void create_lowercasesTags() {
        ArgumentCaptor<Recipe> captor = ArgumentCaptor.forClass(Recipe.class);
        Recipe saved = recipe(UUID.randomUUID(), "My Recipe");
        saved.setTags(new String[]{"street", "moody"});
        when(recipeRepository.save(any(Recipe.class))).thenReturn(saved);

        RecipeRequest request = new RecipeRequest(
                "My Recipe", FilmSimulation.PROVIA, DynamicRange.DR100,
                0.0, 0.0, 0, 0, 0, GrainStrength.OFF, null,
                EffectStrength.OFF, EffectStrength.OFF, WhiteBalanceMode.AUTO,
                0, 0, null, 0, null, null,
                null, null, null, null, null, List.of("STREET", "Moody"), null, false, null
        );
        recipeService.create(request);

        verify(recipeRepository).save(captor.capture());
        assertThat(captor.getValue().getTags()).containsExactlyInAnyOrder("street", "moody");
    }

    @Test
    void update_existingRecipe_appliesChanges() {
        UUID id = UUID.randomUUID();
        Recipe r = recipe(id, "Old Name");
        Recipe updated = recipe(id, "New Name");
        when(recipeRepository.findById(id)).thenReturn(Optional.of(r));
        when(recipeRepository.save(r)).thenReturn(updated);

        RecipeRequest request = new RecipeRequest(
                "New Name", FilmSimulation.PROVIA, DynamicRange.DR100,
                0.0, 0.0, 0, 0, 0, GrainStrength.OFF, null,
                EffectStrength.OFF, EffectStrength.OFF, WhiteBalanceMode.AUTO,
                0, 0, null, 0, null, null,
                null, null, null, null, null, List.of(), null, false, null
        );
        RecipeResponse result = recipeService.update(id, request);

        assertThat(result.name()).isEqualTo("New Name");
    }

    @Test
    void delete_existingId_callsRepositoryDelete() {
        UUID id = UUID.randomUUID();
        Recipe r = recipe(id, "To Delete");
        when(recipeRepository.findById(id)).thenReturn(Optional.of(r));

        recipeService.delete(id);

        verify(recipeRepository).delete(r);
    }

    @Test
    void getCameraStatus_returnsSortedSlots() {
        UUID id1 = UUID.randomUUID();
        UUID id2 = UUID.randomUUID();
        Recipe c1 = recipe(id1, "Slot C1");
        c1.setCameraSlot(CameraSlot.C1);
        Recipe c3 = recipe(id2, "Slot C3");
        c3.setCameraSlot(CameraSlot.C3);
        when(recipeRepository.findByCameraSlotIsNotNullOrderByCameraSlot()).thenReturn(List.of(c1, c3));

        List<RecipeListItem> result = recipeService.getCameraStatus();

        assertThat(result).hasSize(2);
        assertThat(result.get(0).cameraSlot()).isEqualTo(CameraSlot.C1);
        assertThat(result.get(1).cameraSlot()).isEqualTo(CameraSlot.C3);
    }

    @Test
    void assignCameraSlot_removingSlot_logsChange() {
        UUID id = UUID.randomUUID();
        Recipe r = recipe(id, "My Recipe");
        r.setCameraSlot(CameraSlot.C2);
        when(recipeRepository.findById(id)).thenReturn(Optional.of(r));
        when(recipeRepository.save(r)).thenReturn(r);

        recipeService.assignCameraSlot(id, null, false);

        verify(slotChangeLogRepository).save(any(SlotChangeLog.class));
    }
}
