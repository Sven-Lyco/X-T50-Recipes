package de.fuji.xt50recipes.recipe;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/recipes")
@RequiredArgsConstructor
public class RecipeController {

    private final RecipeService recipeService;

    @GetMapping
    public List<RecipeListItem> list(
            @RequestParam(required = false) FilmSimulation filmSimulation,
            @RequestParam(required = false) String tag
    ) {
        return recipeService.findAll(filmSimulation, tag);
    }

    @GetMapping("/{id}")
    public RecipeResponse get(@PathVariable UUID id) {
        return recipeService.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RecipeResponse create(@Valid @RequestBody RecipeRequest request) {
        return recipeService.create(request);
    }

    @PutMapping("/{id}")
    public RecipeResponse update(@PathVariable UUID id, @Valid @RequestBody RecipeRequest request) {
        return recipeService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        recipeService.delete(id);
    }

    @GetMapping("/camera-status")
    public List<RecipeListItem> cameraStatus() {
        return recipeService.getCameraStatus();
    }

    @PutMapping("/{id}/camera-slot")
    public RecipeResponse assignCameraSlot(
            @PathVariable UUID id,
            @RequestBody CameraSlotRequest request
    ) {
        return recipeService.assignCameraSlot(id, request.slot(), request.force());
    }

    public record CameraSlotRequest(CameraSlot slot, boolean force) {}
}
