package de.fuji.xt50recipes.recipe;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import de.fuji.xt50recipes.config.AppProperties;
import de.fuji.xt50recipes.image.RecipeImageRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.mock.web.MockMultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RecipeExportServiceTest {

    @Mock RecipeRepository recipeRepository;
    @Mock RecipeImageRepository imageRepository;

    @TempDir Path tempDir;

    RecipeExportService exportService;
    ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper()
                .registerModule(new JavaTimeModule())
                .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        AppProperties props = new AppProperties(
                "secret-key-32-chars-minimum-test", 3600000L, tempDir.toString(), "admin", "pw", null
        );
        exportService = new RecipeExportService(recipeRepository, imageRepository, props, objectMapper);
    }

    private byte[] zipWithRecipeJson(RecipeResponse response) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (ZipOutputStream zos = new ZipOutputStream(baos)) {
            zos.putNextEntry(new ZipEntry("recipe.json"));
            zos.write(objectMapper.writeValueAsBytes(response));
            zos.closeEntry();
        }
        return baos.toByteArray();
    }

    private RecipeResponse sampleRecipeResponse() {
        return new RecipeResponse(
                UUID.randomUUID(), "Imported Recipe", FilmSimulation.PROVIA, DynamicRange.DR100,
                0.0, 0.0, 0, 0, 0, GrainStrength.OFF, null,
                EffectStrength.OFF, EffectStrength.OFF, WhiteBalanceMode.AUTO,
                0, 0, null, 0, null, null, null, null, null, null, null,
                List.of(), null, false, false, null, List.of(), Instant.now(), Instant.now()
        );
    }

    private Recipe savedRecipe() {
        Recipe r = new Recipe();
        r.setId(UUID.randomUUID());
        r.setName("My Recipe");
        r.setFilmSimulation(FilmSimulation.PROVIA);
        r.setDynamicRange(DynamicRange.DR100);
        r.setHighlightTone(0.0); r.setShadowTone(0.0);
        r.setColor(0); r.setSharpness(0); r.setNoiseReduction(0);
        r.setGrainStrength(GrainStrength.OFF);
        r.setColorChromeEffect(EffectStrength.OFF); r.setColorChromeFxBlue(EffectStrength.OFF);
        r.setWhiteBalanceMode(WhiteBalanceMode.AUTO);
        r.setTags(new String[0]);
        return r;
    }

    @Test
    void exportZip_writesZipWithCorrectContentType() throws IOException {
        Recipe recipe = savedRecipe();
        when(recipeRepository.findById(recipe.getId())).thenReturn(Optional.of(recipe));

        MockHttpServletResponse response = new MockHttpServletResponse();
        exportService.exportZip(recipe.getId(), response);

        assertThat(response.getContentType()).isEqualTo("application/zip");
        assertThat(response.getHeader("Content-Disposition")).contains("My_Recipe.zip");
    }

    @Test
    void importZip_validZip_savesRecipe() throws IOException {
        RecipeResponse response = sampleRecipeResponse();
        byte[] zipBytes = zipWithRecipeJson(response);
        MockMultipartFile file = new MockMultipartFile("file", "recipe.zip", "application/zip", zipBytes);

        Recipe saved = new Recipe();
        saved.setId(UUID.randomUUID());
        saved.setName("Imported Recipe");
        saved.setFilmSimulation(FilmSimulation.PROVIA);
        saved.setDynamicRange(DynamicRange.DR100);
        saved.setHighlightTone(0.0); saved.setShadowTone(0.0);
        saved.setColor(0); saved.setSharpness(0); saved.setNoiseReduction(0);
        saved.setGrainStrength(GrainStrength.OFF);
        saved.setColorChromeEffect(EffectStrength.OFF); saved.setColorChromeFxBlue(EffectStrength.OFF);
        saved.setWhiteBalanceMode(WhiteBalanceMode.AUTO);
        saved.setTags(new String[0]);

        when(recipeRepository.save(any(Recipe.class))).thenReturn(saved);
        when(recipeRepository.findById(saved.getId())).thenReturn(Optional.of(saved));

        RecipeResponse result = exportService.importZip(file);

        assertThat(result.name()).isEqualTo("Imported Recipe");
        verify(recipeRepository).save(any(Recipe.class));
    }

    @Test
    void importZip_missingRecipeJson_throwsIllegalArgument() throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (ZipOutputStream zos = new ZipOutputStream(baos)) {
            zos.putNextEntry(new ZipEntry("other.txt"));
            zos.write("data".getBytes(StandardCharsets.UTF_8));
            zos.closeEntry();
        }
        MockMultipartFile file = new MockMultipartFile("file", "bad.zip", "application/zip", baos.toByteArray());

        assertThatThrownBy(() -> exportService.importZip(file))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("recipe.json");
    }

    @Test
    void importAllZip_twoFolders_importsBoth() throws IOException {
        RecipeResponse r1 = sampleRecipeResponse();
        RecipeResponse r2 = sampleRecipeResponse();

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (ZipOutputStream zos = new ZipOutputStream(baos)) {
            zos.putNextEntry(new ZipEntry("folder1/recipe.json"));
            zos.write(objectMapper.writeValueAsBytes(r1));
            zos.closeEntry();
            zos.putNextEntry(new ZipEntry("folder2/recipe.json"));
            zos.write(objectMapper.writeValueAsBytes(r2));
            zos.closeEntry();
        }
        MockMultipartFile file = new MockMultipartFile("file", "backup.zip", "application/zip", baos.toByteArray());

        Recipe saved = new Recipe();
        saved.setId(UUID.randomUUID());
        saved.setName("Recipe"); saved.setFilmSimulation(FilmSimulation.PROVIA);
        saved.setDynamicRange(DynamicRange.DR100); saved.setHighlightTone(0.0); saved.setShadowTone(0.0);
        saved.setColor(0); saved.setSharpness(0); saved.setNoiseReduction(0);
        saved.setGrainStrength(GrainStrength.OFF);
        saved.setColorChromeEffect(EffectStrength.OFF); saved.setColorChromeFxBlue(EffectStrength.OFF);
        saved.setWhiteBalanceMode(WhiteBalanceMode.AUTO); saved.setTags(new String[0]);

        when(recipeRepository.save(any())).thenReturn(saved);
        when(recipeRepository.findById(any())).thenReturn(Optional.of(saved));

        List<RecipeResponse> results = exportService.importAllZip(file);

        assertThat(results).hasSize(2);
    }
}
