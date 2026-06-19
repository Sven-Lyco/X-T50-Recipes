package de.fuji.xt50recipes.recipe;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/recipes")
@RequiredArgsConstructor
public class RecipeController {

    private final RecipeService recipeService;
    private final RecipeExportService recipeExportService;

    @GetMapping
    public List<RecipeListItem> list(
            @RequestParam(required = false) FilmSimulation filmSimulation,
            @RequestParam(required = false) String tag,
            @RequestParam(required = false, defaultValue = "false") boolean favorite,
            @RequestParam(required = false) ShootingScenario scenario
    ) {
        return recipeService.findAll(filmSimulation, tag, favorite, scenario);
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

    @PostMapping("/{id}/duplicate")
    @ResponseStatus(HttpStatus.CREATED)
    public RecipeResponse duplicate(@PathVariable UUID id) {
        return recipeService.duplicate(id);
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

    @PutMapping("/{id}/favorite")
    public RecipeResponse setFavorite(@PathVariable UUID id, @RequestBody FavoriteRequest request) {
        return recipeService.setFavorite(id, request.favorite());
    }

    @GetMapping("/{id}/export")
    public void export(@PathVariable UUID id, HttpServletResponse response) throws IOException {
        recipeExportService.exportZip(id, response);
    }

    @PostMapping("/import")
    @ResponseStatus(HttpStatus.CREATED)
    public RecipeResponse importRecipe(@RequestParam("file") MultipartFile file) throws IOException {
        return recipeExportService.importZip(file);
    }

    public record CameraSlotRequest(CameraSlot slot, boolean force) {}
    public record FavoriteRequest(boolean favorite) {}
}
