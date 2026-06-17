package de.fuji.xt50recipes.recipe;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class RecipeService {

    private final RecipeRepository recipeRepository;

    @Transactional(readOnly = true)
    public List<RecipeListItem> findAll(FilmSimulation filmSimulation, String tag, boolean onlyFavorites) {
        boolean hasTag = tag != null && !tag.isBlank();
        List<Recipe> recipes;
        if (filmSimulation != null && hasTag) {
            recipes = recipeRepository.findByFilmSimulationAndTagOrderByCreatedAtDesc(filmSimulation.name(), tag);
        } else if (filmSimulation != null) {
            recipes = recipeRepository.findByFilmSimulationOrderByCreatedAtDesc(filmSimulation);
        } else if (hasTag) {
            recipes = recipeRepository.findByTagOrderByCreatedAtDesc(tag);
        } else {
            recipes = recipeRepository.findAllByOrderByCreatedAtDesc();
        }
        return recipes.stream()
                .filter(r -> !onlyFavorites || r.isFavorite())
                .map(RecipeListItem::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public RecipeResponse findById(UUID id) {
        return RecipeResponse.from(getOrThrow(id));
    }

    public RecipeResponse create(RecipeRequest request) {
        Recipe recipe = new Recipe();
        applyRequest(recipe, request);
        return RecipeResponse.from(recipeRepository.save(recipe));
    }

    public RecipeResponse update(UUID id, RecipeRequest request) {
        Recipe recipe = getOrThrow(id);
        freeSlotIfOccupiedByOther(request.cameraSlot(), id);
        applyRequest(recipe, request);
        return RecipeResponse.from(recipeRepository.save(recipe));
    }

    public void delete(UUID id) {
        recipeRepository.delete(getOrThrow(id));
    }

    @Transactional(readOnly = true)
    public List<RecipeListItem> getCameraStatus() {
        return recipeRepository.findByCameraSlotIsNotNullOrderByCameraSlot()
                .stream()
                .map(RecipeListItem::from)
                .toList();
    }

    public RecipeResponse assignCameraSlot(UUID id, CameraSlot slot, boolean force) {
        Recipe recipe = getOrThrow(id);
        if (slot != null) {
            recipeRepository.findByCameraSlot(slot).ifPresent(occupant -> {
                if (!occupant.getId().equals(id)) {
                    if (!force) throw new SlotConflictException(occupant.getId(), occupant.getName());
                    occupant.setCameraSlot(null);
                    recipeRepository.saveAndFlush(occupant);
                }
            });
        }
        recipe.setCameraSlot(slot);
        return RecipeResponse.from(recipeRepository.save(recipe));
    }

    public RecipeResponse setFavorite(UUID id, boolean favorite) {
        Recipe recipe = getOrThrow(id);
        recipe.setFavorite(favorite);
        return RecipeResponse.from(recipeRepository.save(recipe));
    }

    private void freeSlotIfOccupiedByOther(CameraSlot slot, UUID excludeId) {
        if (slot == null) return;
        recipeRepository.findByCameraSlot(slot).ifPresent(occupant -> {
            if (!occupant.getId().equals(excludeId)) {
                occupant.setCameraSlot(null);
                recipeRepository.saveAndFlush(occupant);
            }
        });
    }

    private Recipe getOrThrow(UUID id) {
        return recipeRepository.findById(id)
                .orElseThrow(() -> new RecipeNotFoundException(id));
    }

    private void applyRequest(Recipe recipe, RecipeRequest req) {
        recipe.setName(req.name());
        recipe.setFilmSimulation(req.filmSimulation());
        recipe.setDynamicRange(req.dynamicRange());
        recipe.setHighlightTone(req.highlightTone());
        recipe.setShadowTone(req.shadowTone());
        recipe.setColor(req.color());
        recipe.setSharpness(req.sharpness());
        recipe.setNoiseReduction(req.noiseReduction());
        recipe.setGrainStrength(req.grainStrength());
        recipe.setGrainSize(req.grainSize());
        recipe.setColorChromeEffect(req.colorChromeEffect());
        recipe.setColorChromeFxBlue(req.colorChromeFxBlue());
        recipe.setWhiteBalanceMode(req.whiteBalanceMode());
        recipe.setWbShiftRed(req.wbShiftRed() != null ? req.wbShiftRed() : 0);
        recipe.setWbShiftBlue(req.wbShiftBlue() != null ? req.wbShiftBlue() : 0);
        recipe.setColorTempKelvin(req.colorTempKelvin());
        recipe.setClarity(req.clarity() != null ? req.clarity() : 0);
        recipe.setMonochromeWarmCool(req.monochromeWarmCool());
        recipe.setMonochromeGreenMagenta(req.monochromeGreenMagenta());
        recipe.setIsoMode(req.isoMode());
        recipe.setIsoNote(req.isoNote());
        recipe.setExpCompNote(req.expCompNote());
        recipe.setDescription(req.description());
        recipe.setInspirationSource(req.inspirationSource());
        recipe.setTags(req.tags() != null ? req.tags().toArray(new String[0]) : new String[0]);
        recipe.setCameraSlot(req.cameraSlot());
    }
}