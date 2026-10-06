package de.fuji.xt50recipes.recipe;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import de.fuji.xt50recipes.config.AppProperties;
import de.fuji.xt50recipes.image.RecipeImage;
import de.fuji.xt50recipes.image.RecipeImageRepository;
import de.fuji.xt50recipes.image.RecipeImageResponse;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import java.util.zip.ZipOutputStream;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class RecipeExportService {

    private final RecipeRepository recipeRepository;
    private static final String SLOT_PROTOCOL_ENTRY = "slot-protocol.json";

    private final RecipeImageRepository imageRepository;
    private final SlotChangeLogRepository slotChangeLogRepository;
    private final AppProperties appProperties;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public void exportZip(UUID id, HttpServletResponse response) throws IOException {
        Recipe recipe = recipeRepository.findById(id)
                .orElseThrow(() -> new RecipeNotFoundException(id));
        String safeName = recipe.getName().replaceAll("[^a-zA-Z0-9._-]", "_");
        response.setContentType("application/zip");
        response.setHeader("Content-Disposition", "attachment; filename=\"" + safeName + ".zip\"");

        Path storageDir = Paths.get(appProperties.imageStoragePath());
        try (ZipOutputStream zos = new ZipOutputStream(response.getOutputStream())) {
            RecipeResponse recipeResponse = RecipeResponse.from(recipe);
            zos.putNextEntry(new ZipEntry("recipe.json"));
            zos.write(objectMapper.writeValueAsString(recipeResponse).getBytes(StandardCharsets.UTF_8));
            zos.closeEntry();

            for (RecipeImageResponse img : recipeResponse.images()) {
                Path imagePath = storageDir.resolve(img.filename());
                if (Files.exists(imagePath)) {
                    zos.putNextEntry(new ZipEntry("images/" + img.filename()));
                    Files.copy(imagePath, zos);
                    zos.closeEntry();
                }
            }
        }
        log.info("Exported recipe id={} as ZIP", id);
    }

    @Transactional(readOnly = true)
    public void exportAllZip(HttpServletResponse response) throws IOException {
        List<Recipe> all = recipeRepository.findAllByOrderByCreatedAtDesc();
        response.setContentType("application/zip");
        response.setHeader("Content-Disposition", "attachment; filename=\"xt50-recipes-backup.zip\"");

        Path storageDir = Paths.get(appProperties.imageStoragePath());
        try (ZipOutputStream zos = new ZipOutputStream(response.getOutputStream())) {
            for (Recipe recipe : all) {
                String prefix = recipe.getId().toString() + "/";
                RecipeResponse recipeResponse = RecipeResponse.from(recipe);
                zos.putNextEntry(new ZipEntry(prefix + "recipe.json"));
                zos.write(objectMapper.writeValueAsString(recipeResponse).getBytes(StandardCharsets.UTF_8));
                zos.closeEntry();

                for (RecipeImageResponse img : recipeResponse.images()) {
                    Path imagePath = storageDir.resolve(img.filename());
                    if (Files.exists(imagePath)) {
                        zos.putNextEntry(new ZipEntry(prefix + "images/" + img.filename()));
                        Files.copy(imagePath, zos);
                        zos.closeEntry();
                    }
                }
            }

            List<SlotChangeLogResponse> protocol = slotChangeLogRepository.findAllByOrderByChangedAtDesc()
                    .stream()
                    .map(SlotChangeLogResponse::from)
                    .toList();
            zos.putNextEntry(new ZipEntry(SLOT_PROTOCOL_ENTRY));
            zos.write(objectMapper.writeValueAsString(protocol).getBytes(StandardCharsets.UTF_8));
            zos.closeEntry();
        }
        log.info("Exported all {} recipes as backup ZIP", all.size());
    }

    public RecipeResponse importZip(MultipartFile file) throws IOException {
        Map<String, byte[]> entries = new LinkedHashMap<>();
        try (ZipInputStream zis = new ZipInputStream(file.getInputStream())) {
            ZipEntry entry;
            while ((entry = zis.getNextEntry()) != null) {
                entries.put(entry.getName(), zis.readAllBytes());
                zis.closeEntry();
            }
        }
        byte[] jsonBytes = entries.get("recipe.json");
        if (jsonBytes == null) throw new IllegalArgumentException("Keine recipe.json im ZIP gefunden.");
        return saveImported(objectMapper.readValue(jsonBytes, RecipeResponse.class), entries, false, new ArrayList<>());
    }

    /**
     * Restores a backup: replaces all recipes, images and (if the backup contains it) the slot protocol.
     * All-or-nothing: the ZIP is validated before anything is deleted, and any failure rolls back.
     */
    @Transactional(rollbackFor = Exception.class)
    public List<RecipeResponse> importAllZip(MultipartFile file) throws IOException {
        Map<String, Map<String, byte[]>> byFolder = new LinkedHashMap<>();
        byte[] protocolJson = null;
        try (ZipInputStream zis = new ZipInputStream(file.getInputStream())) {
            ZipEntry entry;
            while ((entry = zis.getNextEntry()) != null) {
                if (!entry.isDirectory()) {
                    String name = entry.getName();
                    int slash = name.indexOf('/');
                    if (slash > 0) {
                        String folder = name.substring(0, slash);
                        String rest = name.substring(slash + 1);
                        byFolder.computeIfAbsent(folder, k -> new LinkedHashMap<>()).put(rest, zis.readAllBytes());
                    } else if (SLOT_PROTOCOL_ENTRY.equals(name)) {
                        protocolJson = zis.readAllBytes();
                    }
                }
                zis.closeEntry();
            }
        }

        List<BackupRecipe> backupRecipes = new ArrayList<>();
        for (Map.Entry<String, Map<String, byte[]>> folder : byFolder.entrySet()) {
            byte[] jsonBytes = folder.getValue().get("recipe.json");
            if (jsonBytes == null) continue;
            try {
                backupRecipes.add(new BackupRecipe(objectMapper.readValue(jsonBytes, RecipeResponse.class), folder.getValue()));
            } catch (IOException e) {
                throw new IllegalArgumentException("Backup nicht importiert: recipe.json in '" + folder.getKey() + "' ist ungültig.");
            }
        }
        if (backupRecipes.isEmpty()) {
            throw new IllegalArgumentException("Backup nicht importiert: Das ZIP enthält keine Recipes.");
        }
        List<SlotChangeLogResponse> protocol = null;
        if (protocolJson != null) {
            try {
                protocol = objectMapper.readValue(protocolJson, new TypeReference<>() {});
            } catch (IOException e) {
                throw new IllegalArgumentException("Backup nicht importiert: " + SLOT_PROTOCOL_ENTRY + " ist ungültig.");
            }
        }

        List<String> replacedImageFiles = imageRepository.findAllFilenames();
        List<String> restoredImageFiles = new ArrayList<>();
        swapImageFilesOnCompletion(replacedImageFiles, restoredImageFiles);

        // Bulk deletes run immediately, so the camera slots are free before the restored recipes are inserted
        imageRepository.deleteAllInBatch();
        recipeRepository.deleteAllInBatch();

        List<RecipeResponse> result = new ArrayList<>();
        // Restored recipes get new IDs; the protocol must point at those instead of the exported ones
        Map<UUID, UUID> newIdByExportedId = new HashMap<>();
        for (BackupRecipe backupRecipe : backupRecipes) {
            RecipeResponse exported = backupRecipe.exported();
            RecipeResponse restored = saveImported(exported, backupRecipe.entries(), true, restoredImageFiles);
            result.add(restored);
            if (exported.id() != null) newIdByExportedId.put(exported.id(), restored.id());
        }

        // A backup from before the protocol was exported leaves the existing protocol untouched
        if (protocol != null) {
            slotChangeLogRepository.deleteAllInBatch();
            for (SlotChangeLogResponse e : protocol) {
                if (e.slot() == null || e.changedAt() == null) continue;
                SlotChangeLog entry = new SlotChangeLog();
                entry.setSlot(e.slot());
                entry.setPreviousRecipeId(remapRecipeId(e.previousRecipeId(), newIdByExportedId));
                entry.setPreviousRecipeName(e.previousRecipeName());
                entry.setNewRecipeId(remapRecipeId(e.newRecipeId(), newIdByExportedId));
                entry.setNewRecipeName(e.newRecipeName());
                entry.setChangedAt(e.changedAt());
                slotChangeLogRepository.save(entry);
            }
        }

        log.info("Backup restore complete: {} recipes, {} images, slot protocol {}",
                result.size(), restoredImageFiles.size(), protocol != null ? protocol.size() + " entries" : "kept");
        return result;
    }

    private static UUID remapRecipeId(UUID exportedId, Map<UUID, UUID> newIdByExportedId) {
        return exportedId != null ? newIdByExportedId.getOrDefault(exportedId, exportedId) : null;
    }

    private record BackupRecipe(RecipeResponse exported, Map<String, byte[]> entries) {}

    /** Removes the replaced image files once the restore is committed, or the newly written ones if it rolls back. */
    private void swapImageFilesOnCompletion(List<String> replacedFiles, List<String> restoredFiles) {
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCompletion(int status) {
                deleteImageFiles(status == STATUS_COMMITTED ? replacedFiles : restoredFiles);
            }
        });
    }

    private void deleteImageFiles(List<String> filenames) {
        Path storageDir = Paths.get(appProperties.imageStoragePath()).toAbsolutePath().normalize();
        for (String filename : filenames) {
            Path file = storageDir.resolve(filename).normalize();
            if (!file.startsWith(storageDir)) continue;
            try {
                Files.deleteIfExists(file);
            } catch (IOException e) {
                log.warn("Could not delete image file {}: {}", file, e.getMessage());
            }
        }
    }

    // restoreState: a backup restore keeps slot, favorite and timestamps; a single shared recipe starts fresh in the library
    private RecipeResponse saveImported(RecipeResponse exported, Map<String, byte[]> entries, boolean restoreState,
                                        List<String> writtenImageFiles) throws IOException {
        log.info("Importing recipe: name={}", exported.name());

        Recipe recipe = new Recipe();
        recipe.setName(exported.name());
        recipe.setFilmSimulation(exported.filmSimulation());
        recipe.setDynamicRange(exported.dynamicRange());
        recipe.setHighlightTone(exported.highlightTone());
        recipe.setShadowTone(exported.shadowTone());
        recipe.setColor(exported.color());
        recipe.setSharpness(exported.sharpness());
        recipe.setNoiseReduction(exported.noiseReduction());
        recipe.setGrainStrength(exported.grainStrength());
        recipe.setGrainSize(exported.grainSize());
        recipe.setColorChromeEffect(exported.colorChromeEffect());
        recipe.setColorChromeFxBlue(exported.colorChromeFxBlue());
        recipe.setWhiteBalanceMode(exported.whiteBalanceMode());
        recipe.setWbShiftRed(exported.wbShiftRed() != null ? exported.wbShiftRed() : 0);
        recipe.setWbShiftBlue(exported.wbShiftBlue() != null ? exported.wbShiftBlue() : 0);
        recipe.setColorTempKelvin(exported.colorTempKelvin());
        recipe.setClarity(exported.clarity() != null ? exported.clarity() : 0);
        recipe.setMonochromeWarmCool(exported.monochromeWarmCool());
        recipe.setMonochromeGreenMagenta(exported.monochromeGreenMagenta());
        recipe.setIsoMode(exported.isoMode());
        recipe.setIsoNote(exported.isoNote());
        recipe.setExpCompNote(exported.expCompNote());
        recipe.setDescription(exported.description());
        recipe.setInspirationSource(exported.inspirationSource());
        recipe.setTags(exported.tags() != null ? exported.tags().toArray(String[]::new) : new String[0]);
        recipe.setCameraSlot(null);
        if (restoreState) {
            recipe.setCameraSlot(exported.cameraSlot());
            recipe.setFavorite(exported.favorite());
            recipe.setCreatedAt(exported.createdAt());
            recipe.setUpdatedAt(exported.updatedAt());
        }
        recipe.setAiGenerated(exported.aiGenerated());
        recipe.setShootingScenario(exported.shootingScenario());
        recipe = recipeRepository.save(recipe);

        Map<String, String> captionByFilename = new HashMap<>();
        if (exported.images() != null) {
            for (RecipeImageResponse img : exported.images()) {
                if (img.caption() != null) captionByFilename.put(img.filename(), img.caption());
            }
        }

        Path storageDir = Paths.get(appProperties.imageStoragePath());
        Files.createDirectories(storageDir);
        int sortOrder = 0;
        for (Map.Entry<String, byte[]> e : entries.entrySet()) {
            if (!e.getKey().startsWith("images/")) continue;
            String origName = e.getKey().substring("images/".length());
            String ext = origName.contains(".") ? origName.substring(origName.lastIndexOf('.')) : "";
            String newFilename = UUID.randomUUID() + ext;
            Files.write(storageDir.resolve(newFilename), e.getValue());
            writtenImageFiles.add(newFilename);

            RecipeImage img = new RecipeImage();
            img.setRecipe(recipe);
            img.setFilename(newFilename);
            img.setCaption(captionByFilename.get(origName));
            img.setSortOrder(sortOrder++);
            imageRepository.save(img);
        }

        log.info("Import complete: recipeId={}, images={}", recipe.getId(), sortOrder);
        return RecipeResponse.from(recipeRepository.findById(recipe.getId()).orElseThrow());
    }
}
