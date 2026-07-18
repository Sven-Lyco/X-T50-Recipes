package de.fuji.xt50recipes.image;

import de.fuji.xt50recipes.config.AppProperties;
import de.fuji.xt50recipes.recipe.Recipe;
import de.fuji.xt50recipes.recipe.RecipeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ImageServiceTest {

    @Mock RecipeRepository recipeRepository;
    @Mock RecipeImageRepository imageRepository;

    @TempDir Path tempDir;

    ImageService imageService;

    @BeforeEach
    void setUp() {
        AppProperties props = new AppProperties(
                "secret-key-32-chars-minimum-test", 3600000L, tempDir.toString(), "admin", "pw", null
        );
        imageService = new ImageService(recipeRepository, imageRepository, props);
    }

    private Recipe minimalRecipe(UUID id) {
        Recipe r = new Recipe();
        r.setId(id);
        r.setName("Test Recipe");
        return r;
    }

    @Test
    void upload_validJpeg_savesFileAndEntity() throws IOException {
        UUID recipeId = UUID.randomUUID();
        Recipe recipe = minimalRecipe(recipeId);
        when(recipeRepository.findById(recipeId)).thenReturn(Optional.of(recipe));
        when(imageRepository.save(any(RecipeImage.class))).thenAnswer(inv -> inv.getArgument(0));

        MockMultipartFile file = new MockMultipartFile(
                "file", "photo.jpg", "image/jpeg", "fake-jpeg-data".getBytes()
        );

        RecipeImage result = imageService.upload(recipeId, file);

        assertThat(result.getFilename()).endsWith(".jpg");
        assertThat(tempDir.resolve(result.getFilename())).exists();
        verify(imageRepository).save(any(RecipeImage.class));
    }

    @Test
    void upload_invalidMimeType_throwsIllegalArgument() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "script.js", "text/javascript", "alert(1)".getBytes()
        );

        assertThatThrownBy(() -> imageService.upload(UUID.randomUUID(), file))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Nicht unterstützter");
    }

    @Test
    void upload_nullMimeType_throwsIllegalArgument() {
        MockMultipartFile file = new MockMultipartFile("file", "data", null, new byte[10]);

        assertThatThrownBy(() -> imageService.upload(UUID.randomUUID(), file))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void delete_existingImage_removesFileAndEntity() throws IOException {
        UUID recipeId = UUID.randomUUID();
        UUID imageId = UUID.randomUUID();

        Path imageFile = tempDir.resolve("to-delete.jpg");
        Files.write(imageFile, "data".getBytes());

        RecipeImage image = new RecipeImage();
        image.setId(imageId);
        image.setFilename("to-delete.jpg");
        when(imageRepository.findByIdAndRecipeId(imageId, recipeId)).thenReturn(Optional.of(image));

        imageService.delete(recipeId, imageId);

        verify(imageRepository).delete(image);
        assertThat(imageFile).doesNotExist();
    }

    @Test
    void delete_imageFileNotOnDisk_stillDeletesEntity() throws IOException {
        UUID recipeId = UUID.randomUUID();
        UUID imageId = UUID.randomUUID();

        RecipeImage image = new RecipeImage();
        image.setId(imageId);
        image.setFilename("nonexistent.jpg");
        when(imageRepository.findByIdAndRecipeId(imageId, recipeId)).thenReturn(Optional.of(image));

        imageService.delete(recipeId, imageId);

        verify(imageRepository).delete(image);
    }

    @Test
    void reorder_updatesImageSortOrders() {
        UUID recipeId = UUID.randomUUID();
        UUID imgId = UUID.randomUUID();

        RecipeImage img = new RecipeImage();
        img.setId(imgId);
        img.setSortOrder(0);
        when(imageRepository.findByIdAndRecipeId(imgId, recipeId)).thenReturn(Optional.of(img));
        when(imageRepository.save(img)).thenReturn(img);

        imageService.reorder(recipeId, List.of(new ImageOrderItem(imgId, 3)));

        assertThat(img.getSortOrder()).isEqualTo(3);
    }
}
