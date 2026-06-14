package de.fuji.xt50recipes.image;

import de.fuji.xt50recipes.config.AppProperties;
import de.fuji.xt50recipes.recipe.Recipe;
import de.fuji.xt50recipes.recipe.RecipeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class ImageService {

    private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"
    );
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            ".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"
    );

    private final RecipeRepository recipeRepository;
    private final RecipeImageRepository imageRepository;
    private final AppProperties appProperties;

    public RecipeImage upload(UUID recipeId, MultipartFile file) throws IOException {
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_MIME_TYPES.contains(contentType)) {
            throw new IllegalArgumentException("Nicht unterstützter Dateityp: " + contentType);
        }

        Recipe recipe = recipeRepository.findById(recipeId)
                .orElseThrow(() -> new IllegalArgumentException("Recipe not found: " + recipeId));

        String filename = UUID.randomUUID() + sanitizeExtension(file.getOriginalFilename());
        Path storageDir = Paths.get(appProperties.imageStoragePath());
        Files.createDirectories(storageDir);
        Path target = storageDir.resolve(filename);
        Files.copy(file.getInputStream(), target);

        try {
            int nextOrder = recipe.getImages().size();
            RecipeImage image = new RecipeImage();
            image.setRecipe(recipe);
            image.setFilename(filename);
            image.setSortOrder(nextOrder);
            return imageRepository.save(image);
        } catch (Exception e) {
            Files.deleteIfExists(target);
            throw e;
        }
    }

    public void reorder(UUID recipeId, List<ImageOrderItem> items) {
        items.forEach(item -> imageRepository.findByIdAndRecipeId(item.id(), recipeId)
                .ifPresent(img -> {
                    img.setSortOrder(item.sortOrder());
                    imageRepository.save(img);
                }));
    }

    public void delete(UUID recipeId, UUID imageId) throws IOException {
        RecipeImage image = imageRepository.findByIdAndRecipeId(imageId, recipeId)
                .orElseThrow(() -> new IllegalArgumentException("Image not found"));

        Path file = Paths.get(appProperties.imageStoragePath(), image.getFilename());
        Files.deleteIfExists(file);
        imageRepository.delete(image);
    }

    private String sanitizeExtension(String filename) {
        if (filename == null) return "";
        int dot = filename.lastIndexOf('.');
        if (dot < 0) return "";
        String ext = filename.substring(dot).toLowerCase().replaceAll("[^a-z.]", "");
        return ALLOWED_EXTENSIONS.contains(ext) ? ext : "";
    }
}
