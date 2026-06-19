package de.fuji.xt50recipes.recipe;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record RecipeRequest(
        @NotBlank String name,
        @NotNull FilmSimulation filmSimulation,
        @NotNull DynamicRange dynamicRange,
        @NotNull Double highlightTone,
        @NotNull Double shadowTone,
        @NotNull Integer color,
        @NotNull Integer sharpness,
        @NotNull Integer noiseReduction,
        @NotNull GrainStrength grainStrength,
        GrainSize grainSize,
        @NotNull EffectStrength colorChromeEffect,
        @NotNull EffectStrength colorChromeFxBlue,
        @NotNull WhiteBalanceMode whiteBalanceMode,
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
        @NotNull List<String> tags,
        CameraSlot cameraSlot,
        Boolean aiGenerated,
        ShootingScenario shootingScenario
) {}
