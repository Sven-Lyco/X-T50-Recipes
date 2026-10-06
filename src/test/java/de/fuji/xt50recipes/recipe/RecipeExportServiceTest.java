package de.fuji.xt50recipes.recipe;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import de.fuji.xt50recipes.config.AppProperties;
import de.fuji.xt50recipes.image.RecipeImage;
import de.fuji.xt50recipes.image.RecipeImageRepository;
import de.fuji.xt50recipes.image.RecipeImageResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.ArgumentCaptor;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import java.util.zip.ZipOutputStream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RecipeExportServiceTest {

    @Mock RecipeRepository recipeRepository;
    @Mock RecipeImageRepository imageRepository;
    @Mock SlotChangeLogRepository slotChangeLogRepository;

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
        exportService = new RecipeExportService(recipeRepository, imageRepository, slotChangeLogRepository, props, objectMapper);
        // importAllZip registers its image file cleanup on the surrounding transaction
        TransactionSynchronizationManager.initSynchronization();
    }

    @AfterEach
    void tearDown() {
        TransactionSynchronizationManager.clearSynchronization();
    }

    private void completeTransaction(int status) {
        TransactionSynchronizationManager.getSynchronizations().forEach(sync -> sync.afterCompletion(status));
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
        return sampleRecipeResponse(null, false);
    }

    private RecipeResponse sampleRecipeResponse(CameraSlot slot, boolean favorite) {
        return new RecipeResponse(
                UUID.randomUUID(), "Imported Recipe", FilmSimulation.PROVIA, DynamicRange.DR100,
                0.0, 0.0, 0, 0, 0, GrainStrength.OFF, null,
                EffectStrength.OFF, EffectStrength.OFF, WhiteBalanceMode.AUTO,
                0, 0, null, 0, null, null, null, null, null, null, null,
                List.of(), slot, favorite, false, null, List.of(), Instant.now(), Instant.now()
        );
    }

    private RecipeResponse sampleRecipeResponseWithImage(String filename, String caption, Instant createdAt, Instant updatedAt) {
        return new RecipeResponse(
                UUID.randomUUID(), "Imported Recipe", FilmSimulation.PROVIA, DynamicRange.DR100,
                0.0, 0.0, 0, 0, 0, GrainStrength.OFF, null,
                EffectStrength.OFF, EffectStrength.OFF, WhiteBalanceMode.AUTO,
                0, 0, null, 0, null, null, null, null, null, null, null,
                List.of(), null, false, false, null,
                List.of(new RecipeImageResponse(UUID.randomUUID(), filename, caption, 0)), createdAt, updatedAt
        );
    }

    private byte[] backupZip(List<RecipeResponse> recipes, byte[] protocolJson) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (ZipOutputStream zos = new ZipOutputStream(baos)) {
            for (RecipeResponse r : recipes) {
                zos.putNextEntry(new ZipEntry(r.id() + "/recipe.json"));
                zos.write(objectMapper.writeValueAsBytes(r));
                zos.closeEntry();
                for (RecipeImageResponse img : r.images()) {
                    zos.putNextEntry(new ZipEntry(r.id() + "/images/" + img.filename()));
                    zos.write("image-bytes".getBytes(StandardCharsets.UTF_8));
                    zos.closeEntry();
                }
            }
            if (protocolJson != null) {
                zos.putNextEntry(new ZipEntry("slot-protocol.json"));
                zos.write(protocolJson);
                zos.closeEntry();
            }
        }
        return baos.toByteArray();
    }

    /** Lets save() assign a fresh ID and findById() return what was saved, like the real repository. */
    private void stubRecipePersistence() {
        Map<UUID, Recipe> store = new HashMap<>();
        when(recipeRepository.save(any(Recipe.class))).thenAnswer(inv -> {
            Recipe r = inv.getArgument(0);
            r.setId(UUID.randomUUID());
            store.put(r.getId(), r);
            return r;
        });
        when(recipeRepository.findById(any())).thenAnswer(inv -> Optional.ofNullable(store.get(inv.<UUID>getArgument(0))));
    }

    private MockMultipartFile backupFile(byte[] zipBytes) {
        return new MockMultipartFile("file", "backup.zip", "application/zip", zipBytes);
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

    @Test
    void exportAllZip_containsRecipesAndSlotProtocol() throws IOException {
        Recipe recipe = savedRecipe();
        recipe.setCameraSlot(CameraSlot.C2);
        when(recipeRepository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of(recipe));

        SlotChangeLog entry = new SlotChangeLog();
        entry.setId(UUID.randomUUID());
        entry.setSlot(CameraSlot.C2);
        entry.setNewRecipeId(recipe.getId());
        entry.setNewRecipeName("My Recipe");
        entry.setChangedAt(Instant.parse("2026-09-01T10:15:30.123456Z"));
        when(slotChangeLogRepository.findAllByOrderByChangedAtDesc()).thenReturn(List.of(entry));

        MockHttpServletResponse response = new MockHttpServletResponse();
        exportService.exportAllZip(response);

        Map<String, byte[]> entries = new HashMap<>();
        try (ZipInputStream zis = new ZipInputStream(new ByteArrayInputStream(response.getContentAsByteArray()))) {
            ZipEntry e;
            while ((e = zis.getNextEntry()) != null) entries.put(e.getName(), zis.readAllBytes());
        }

        assertThat(entries).containsKeys(recipe.getId() + "/recipe.json", "slot-protocol.json");
        RecipeResponse exportedRecipe = objectMapper.readValue(entries.get(recipe.getId() + "/recipe.json"), RecipeResponse.class);
        assertThat(exportedRecipe.cameraSlot()).isEqualTo(CameraSlot.C2);
        SlotChangeLogResponse[] protocol = objectMapper.readValue(entries.get("slot-protocol.json"), SlotChangeLogResponse[].class);
        assertThat(protocol).hasSize(1);
        assertThat(protocol[0].slot()).isEqualTo(CameraSlot.C2);
        assertThat(protocol[0].changedAt()).isEqualTo(entry.getChangedAt());
    }

    @Test
    void importAllZip_restoresCameraSlotAndFavorite() throws IOException {
        stubRecipePersistence();
        byte[] zip = backupZip(List.of(sampleRecipeResponse(CameraSlot.C3, true)), null);

        List<RecipeResponse> results = exportService.importAllZip(backupFile(zip));

        assertThat(results).hasSize(1);
        assertThat(results.get(0).cameraSlot()).isEqualTo(CameraSlot.C3);
        assertThat(results.get(0).favorite()).isTrue();
        verifyNoInteractions(slotChangeLogRepository);
    }

    @Test
    void importZip_singleRecipe_doesNotRestoreSlotOrFavorite() throws IOException {
        stubRecipePersistence();
        byte[] zip = zipWithRecipeJson(sampleRecipeResponse(CameraSlot.C3, true));

        RecipeResponse result = exportService.importZip(new MockMultipartFile("file", "recipe.zip", "application/zip", zip));

        assertThat(result.cameraSlot()).isNull();
        assertThat(result.favorite()).isFalse();
    }

    @Test
    void importAllZip_importsSlotProtocolWithRemappedRecipeIds() throws IOException {
        stubRecipePersistence();
        RecipeResponse exported = sampleRecipeResponse(CameraSlot.C1, false);
        UUID deletedRecipeId = UUID.randomUUID();
        Instant changedAt = Instant.parse("2026-09-01T10:15:30.123456Z");
        byte[] protocolJson = objectMapper.writeValueAsBytes(List.of(
                new SlotChangeLogResponse(UUID.randomUUID(), CameraSlot.C1,
                        deletedRecipeId, "Deleted Recipe", exported.id(), "Imported Recipe", changedAt)
        ));

        List<RecipeResponse> results = exportService.importAllZip(backupFile(backupZip(List.of(exported), protocolJson)));

        ArgumentCaptor<SlotChangeLog> captor = ArgumentCaptor.forClass(SlotChangeLog.class);
        InOrder protocolOrder = inOrder(slotChangeLogRepository);
        protocolOrder.verify(slotChangeLogRepository).deleteAllInBatch();
        protocolOrder.verify(slotChangeLogRepository).save(captor.capture());
        SlotChangeLog saved = captor.getValue();
        assertThat(saved.getId()).isNull();
        assertThat(saved.getSlot()).isEqualTo(CameraSlot.C1);
        assertThat(saved.getChangedAt()).isEqualTo(changedAt);
        assertThat(saved.getNewRecipeId()).isEqualTo(results.get(0).id()).isNotEqualTo(exported.id());
        assertThat(saved.getNewRecipeName()).isEqualTo("Imported Recipe");
        assertThat(saved.getPreviousRecipeId()).isEqualTo(deletedRecipeId);
        assertThat(saved.getPreviousRecipeName()).isEqualTo("Deleted Recipe");
    }

    @Test
    void importAllZip_replacesExistingRecipesAndImages() throws IOException {
        stubRecipePersistence();
        byte[] zip = backupZip(List.of(sampleRecipeResponse(CameraSlot.C3, false)), null);

        exportService.importAllZip(backupFile(zip));

        InOrder order = inOrder(imageRepository, recipeRepository);
        order.verify(imageRepository).deleteAllInBatch();
        order.verify(recipeRepository).deleteAllInBatch();
        order.verify(recipeRepository).save(any(Recipe.class));
        // No protocol in the backup: the existing one is kept
        verifyNoInteractions(slotChangeLogRepository);
    }

    @Test
    void importAllZip_restoresTimestampsAndImageCaptions() throws IOException {
        stubRecipePersistence();
        Instant createdAt = Instant.parse("2025-03-01T08:00:00Z");
        Instant updatedAt = Instant.parse("2025-04-02T09:30:00Z");
        byte[] zip = backupZip(List.of(sampleRecipeResponseWithImage("old.jpg", "Abendlicht", createdAt, updatedAt)), null);

        List<RecipeResponse> results = exportService.importAllZip(backupFile(zip));

        assertThat(results.get(0).createdAt()).isEqualTo(createdAt);
        assertThat(results.get(0).updatedAt()).isEqualTo(updatedAt);
        ArgumentCaptor<RecipeImage> image = ArgumentCaptor.forClass(RecipeImage.class);
        verify(imageRepository).save(image.capture());
        assertThat(image.getValue().getCaption()).isEqualTo("Abendlicht");
        assertThat(image.getValue().getFilename()).endsWith(".jpg").isNotEqualTo("old.jpg");
    }

    @Test
    void importAllZip_committed_removesReplacedImageFilesAndKeepsRestoredOnes() throws IOException {
        stubRecipePersistence();
        Files.writeString(tempDir.resolve("replaced.jpg"), "old");
        when(imageRepository.findAllFilenames()).thenReturn(List.of("replaced.jpg"));
        byte[] zip = backupZip(List.of(sampleRecipeResponseWithImage("old.jpg", null, Instant.now(), Instant.now())), null);

        exportService.importAllZip(backupFile(zip));
        ArgumentCaptor<RecipeImage> image = ArgumentCaptor.forClass(RecipeImage.class);
        verify(imageRepository).save(image.capture());
        Path restored = tempDir.resolve(image.getValue().getFilename());

        assertThat(tempDir.resolve("replaced.jpg")).exists();
        completeTransaction(TransactionSynchronization.STATUS_COMMITTED);

        assertThat(tempDir.resolve("replaced.jpg")).doesNotExist();
        assertThat(restored).exists();
    }

    @Test
    void importAllZip_rolledBack_keepsExistingImageFilesAndRemovesWrittenOnes() throws IOException {
        stubRecipePersistence();
        Files.writeString(tempDir.resolve("replaced.jpg"), "old");
        when(imageRepository.findAllFilenames()).thenReturn(List.of("replaced.jpg"));
        byte[] zip = backupZip(List.of(sampleRecipeResponseWithImage("old.jpg", null, Instant.now(), Instant.now())), null);

        exportService.importAllZip(backupFile(zip));
        ArgumentCaptor<RecipeImage> image = ArgumentCaptor.forClass(RecipeImage.class);
        verify(imageRepository).save(image.capture());
        Path written = tempDir.resolve(image.getValue().getFilename());

        completeTransaction(TransactionSynchronization.STATUS_ROLLED_BACK);

        assertThat(tempDir.resolve("replaced.jpg")).exists();
        assertThat(written).doesNotExist();
    }

    @Test
    void importAllZip_withoutRecipes_isRejectedBeforeDeletingAnything() throws IOException {
        // e.g. a single-recipe export, which has recipe.json in the ZIP root
        byte[] zip = zipWithRecipeJson(sampleRecipeResponse());

        assertThatThrownBy(() -> exportService.importAllZip(backupFile(zip)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("keine Recipes");

        verify(recipeRepository, never()).deleteAllInBatch();
        verify(imageRepository, never()).deleteAllInBatch();
        verifyNoInteractions(slotChangeLogRepository);
    }

    @Test
    void importAllZip_invalidRecipeJson_isRejectedBeforeDeletingAnything() throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (ZipOutputStream zos = new ZipOutputStream(baos)) {
            zos.putNextEntry(new ZipEntry("good/recipe.json"));
            zos.write(objectMapper.writeValueAsBytes(sampleRecipeResponse()));
            zos.closeEntry();
            zos.putNextEntry(new ZipEntry("broken/recipe.json"));
            zos.write("not json".getBytes(StandardCharsets.UTF_8));
            zos.closeEntry();
        }

        assertThatThrownBy(() -> exportService.importAllZip(backupFile(baos.toByteArray())))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("broken");

        verify(recipeRepository, never()).deleteAllInBatch();
        verify(recipeRepository, never()).save(any());
    }

    @Test
    void importAllZip_invalidSlotProtocol_isRejectedBeforeDeletingAnything() throws IOException {
        byte[] zip = backupZip(List.of(sampleRecipeResponse()), "not json".getBytes(StandardCharsets.UTF_8));

        assertThatThrownBy(() -> exportService.importAllZip(backupFile(zip)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("slot-protocol.json");

        verify(recipeRepository, never()).deleteAllInBatch();
        verify(slotChangeLogRepository, never()).deleteAllInBatch();
    }
}
