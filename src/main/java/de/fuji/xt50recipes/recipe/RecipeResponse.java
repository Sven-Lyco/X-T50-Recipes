package de.fuji.xt50recipes.recipe;

import de.fuji.xt50recipes.image.RecipeImageResponse;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

public record RecipeResponse(
        UUID id,
        String name,
        FilmSimulation filmSimulation,
        DynamicRange dynamicRange,
        Double highlightTone,
        Double shadowTone,
        Integer color,
        Integer sharpness,
        Integer noiseReduction,
        GrainStrength grainStrength,
        GrainSize grainSize,
        EffectStrength colorChromeEffect,
        EffectStrength colorChromeFxBlue,
        WhiteBalanceMode whiteBalanceMode,
        Integer wbShiftRed,
        Integer wbShiftBlue,
        Integer colorTempKelvin,
        Integer clarity,
        Integer monochromeWarmCool,
        Integer monochromeGreenMagenta,
        String isoMode,
        String isoNote,
        String expCompNote,
        String description,
        String inspirationSource,
        List<String> tags,
        CameraSlot cameraSlot,
        boolean favorite,
        boolean aiGenerated,
        List<RecipeImageResponse> images,
        Instant createdAt,
        Instant updatedAt
) {
    static RecipeResponse from(Recipe r) {
        return new RecipeResponse(
                r.getId(), r.getName(), r.getFilmSimulation(), r.getDynamicRange(),
                r.getHighlightTone(), r.getShadowTone(), r.getColor(), r.getSharpness(),
                r.getNoiseReduction(), r.getGrainStrength(), r.getGrainSize(),
                r.getColorChromeEffect(), r.getColorChromeFxBlue(), r.getWhiteBalanceMode(),
                r.getWbShiftRed(), r.getWbShiftBlue(), r.getColorTempKelvin(), r.getClarity(),
                r.getMonochromeWarmCool(), r.getMonochromeGreenMagenta(),
                r.getIsoMode(), r.getIsoNote(), r.getExpCompNote(), r.getDescription(), r.getInspirationSource(),
                r.getTags() != null ? Arrays.asList(r.getTags()) : List.of(),
                r.getCameraSlot(), r.isFavorite(), r.isAiGenerated(),
                r.getImages().stream().map(RecipeImageResponse::from).toList(),
                r.getCreatedAt(), r.getUpdatedAt()
        );
    }
}