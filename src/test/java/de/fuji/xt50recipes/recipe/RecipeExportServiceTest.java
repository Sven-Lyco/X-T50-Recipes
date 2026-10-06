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
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.mock.web.MockMultipartFile;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
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

    private byte[] backupZip(List<RecipeResponse> recipes, byte[] protocolJson) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (ZipOutputStream zos = new ZipOutputStream(baos)) {
            for (RecipeResponse r : recipes) {
                zos.putNextEntry(new ZipEntry(r.id() + "/recipe.json"));
                zos.write(objectMapper.writeValueAsBytes(r));
                zos.closeEntry();
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
    void importAllZip_slotAlreadyOccupied_importsWithoutSlot() throws IOException {
        stubRecipePersistence();
        when(recipeRepository.findByCameraSlot(CameraSlot.C3)).thenReturn(Optional.of(savedRecipe()));
        byte[] zip = backupZip(List.of(sampleRecipeResponse(CameraSlot.C3, false)), null);

        List<RecipeResponse> results = exportService.importAllZip(backupFile(zip));

        assertThat(results).hasSize(1);
        assertThat(results.get(0).cameraSlot()).isNull();
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
        verify(slotChangeLogRepository).save(captor.capture());
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
    void importAllZip_skipsSlotProtocolEntriesThatAlreadyExist() throws IOException {
        Instant known = Instant.parse("2026-09-01T10:15:30Z");
        Instant fresh = Instant.parse("2026-09-02T08:00:00Z");
        when(slotChangeLogRepository.existsBySlotAndChangedAt(CameraSlot.C1, known)).thenReturn(true);
        byte[] protocolJson = objectMapper.writeValueAsBytes(List.of(
                new SlotChangeLogResponse(UUID.randomUUID(), CameraSlot.C1, null, null, null, "A", known),
                new SlotChangeLogResponse(UUID.randomUUID(), CameraSlot.C1, null, "A", null, "B", fresh)
        ));

        exportService.importAllZip(backupFile(backupZip(List.of(), protocolJson)));

        ArgumentCaptor<SlotChangeLog> captor = ArgumentCaptor.forClass(SlotChangeLog.class);
        verify(slotChangeLogRepository).save(captor.capture());
        assertThat(captor.getValue().getChangedAt()).isEqualTo(fresh);
    }

    @Test
    void importAllZip_malformedSlotProtocol_stillImportsRecipes() throws IOException {
        stubRecipePersistence();
        byte[] zip = backupZip(List.of(sampleRecipeResponse()), "not json".getBytes(StandardCharsets.UTF_8));

        List<RecipeResponse> results = exportService.importAllZip(backupFile(zip));

        assertThat(results).hasSize(1);
        verify(slotChangeLogRepository, never()).save(any());
    }
}
