package de.fuji.xt50recipes.recipe;

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
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import java.util.zip.ZipOutputStream;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class RecipeExportService {

    private final RecipeRepository recipeRepository;
    private final RecipeImageRepository imageRepository;
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
            String json = objectMapper.writeValueAsString(RecipeResponse.from(recipe));
            zos.putNextEntry(new ZipEntry("recipe.json"));
            zos.write(json.getBytes(StandardCharsets.UTF_8));
            zos.closeEntry();

            for (RecipeImageResponse img : RecipeResponse.from(recipe).images()) {
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
        recipe.setCameraSlot(null); // Slot-Zuweisung wird beim Import nicht übernommen
        recipe.setAiGenerated(exported.aiGenerated());
        recipe = recipeRepository.save(recipe);

        // Import images with new filenames
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
        return RecipeResponse.from(recipeRepository.findById(recipe.getId()).orElseThrow());
    }
}
