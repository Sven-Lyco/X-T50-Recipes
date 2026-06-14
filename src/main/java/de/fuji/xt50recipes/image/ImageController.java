package de.fuji.xt50recipes.image;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/recipes/{recipeId}/images")
@RequiredArgsConstructor
public class ImageController {

    private final ImageService imageService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RecipeImageResponse upload(
            @PathVariable UUID recipeId,
            @RequestParam("file") MultipartFile file
    ) throws IOException {
        RecipeImage image = imageService.upload(recipeId, file);
        return new RecipeImageResponse(image.getId(), image.getFilename(), image.getCaption(), image.getSortOrder());
    }

    @PutMapping("/order")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void reorder(@PathVariable UUID recipeId,
                        @RequestBody List<ImageOrderItem> items) {
        imageService.reorder(recipeId, items);
    }

    @DeleteMapping("/{imageId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID recipeId, @PathVariable UUID imageId) throws IOException {
        imageService.delete(recipeId, imageId);
    }
}