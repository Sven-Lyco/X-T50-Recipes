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
        return importFromEntries(entries, false).recipe();
    }

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

        List<RecipeResponse> result = new ArrayList<>();
        // Imported recipes get new IDs; the protocol must point at those instead of the exported ones
        Map<UUID, UUID> newIdByExportedId = new HashMap<>();
        for (Map<String, byte[]> entries : byFolder.values()) {
            try {
                ImportedRecipe imported = importFromEntries(entries, true);
                result.add(imported.recipe());
                if (imported.exportedId() != null) {
                    newIdByExportedId.put(imported.exportedId(), imported.recipe().id());
                }
            } catch (Exception e) {
                log.warn("Skipping recipe folder during backup import: {}", e.getMessage());
            }
        }

        int protocolEntries = protocolJson != null ? importSlotProtocol(protocolJson, newIdByExportedId) : 0;
        log.info("Backup import complete: {} recipes, {} slot protocol entries imported", result.size(), protocolEntries);
        return result;
    }

    private int importSlotProtocol(byte[] json, Map<UUID, UUID> newIdByExportedId) {
        List<SlotChangeLogResponse> exported;
        try {
            exported = objectMapper.readValue(json, new TypeReference<>() {});
        } catch (IOException e) {
            log.warn("Skipping slot protocol during backup import: {}", e.getMessage());
            return 0;
        }

        int imported = 0;
        for (SlotChangeLogResponse e : exported) {
            if (e.slot() == null || e.changedAt() == null) continue;
            // Makes re-importing a backup into the instance it came from idempotent for the protocol
            if (slotChangeLogRepository.existsBySlotAndChangedAt(e.slot(), e.changedAt())) continue;

            SlotChangeLog entry = new SlotChangeLog();
            entry.setSlot(e.slot());
            entry.setPreviousRecipeId(remapRecipeId(e.previousRecipeId(), newIdByExportedId));
            entry.setPreviousRecipeName(e.previousRecipeName());
            entry.setNewRecipeId(remapRecipeId(e.newRecipeId(), newIdByExportedId));
            entry.setNewRecipeName(e.newRecipeName());
            entry.setChangedAt(e.changedAt());
            slotChangeLogRepository.save(entry);
            imported++;
        }
        return imported;
    }

    private static UUID remapRecipeId(UUID exportedId, Map<UUID, UUID> newIdByExportedId) {
        return exportedId != null ? newIdByExportedId.getOrDefault(exportedId, exportedId) : null;
    }

    private record ImportedRecipe(UUID exportedId, RecipeResponse recipe) {}

    // restoreCameraState: backup restore keeps slot and favorite; a single shared recipe starts in the library
    private ImportedRecipe importFromEntries(Map<String, byte[]> entries, boolean restoreCameraState) throws IOException {
        byte[] jsonBytes = entries.get("recipe.json");
        if (jsonBytes == null) throw new IllegalArgumentException("Keine recipe.json im ZIP gefunden.");

        RecipeResponse exported = objectMapper.readValue(jsonBytes, RecipeResponse.class);
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
        if (restoreCameraState) {
            recipe.setFavorite(exported.favorite());
            CameraSlot slot = exported.cameraSlot();
            if (slot != null) {
                // Never displace a recipe that is already on the camera in this instance
                if (recipeRepository.findByCameraSlot(slot).isEmpty()) {
                    recipe.setCameraSlot(slot);
                } else {
                    log.info("Slot {} already occupied, importing '{}' without slot", slot, exported.name());
                }
            }
        }
        recipe.setAiGenerated(exported.aiGenerated());
        recipe.setShootingScenario(exported.shootingScenario());
        recipe = recipeRepository.save(recipe);

        Path storageDir = Paths.get(appProperties.imageStoragePath());
        Files.createDirectories(storageDir);
        int sortOrder = 0;
        for (Map.Entry<String, byte[]> e : entries.entrySet()) {
            if (!e.getKey().startsWith("images/")) continue;
            String origName = e.getKey().substring("images/".length());
            String ext = origName.contains(".") ? origName.substring(origName.lastIndexOf('.')) : "";
            String newFilename = UUID.randomUUID() + ext;
            Files.write(storageDir.resolve(newFilename), e.getValue());

            RecipeImage img = new RecipeImage();
            img.setRecipe(recipe);
            img.setFilename(newFilename);
            img.setSortOrder(sortOrder++);
            imageRepository.save(img);
        }

        log.info("Import complete: recipeId={}, images={}", recipe.getId(), sortOrder);
        return new ImportedRecipe(exported.id(), RecipeResponse.from(recipeRepository.findById(recipe.getId()).orElseThrow()));
    }
}
