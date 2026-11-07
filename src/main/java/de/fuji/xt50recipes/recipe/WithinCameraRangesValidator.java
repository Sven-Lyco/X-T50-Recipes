package de.fuji.xt50recipes.recipe;

import de.fuji.xt50recipes.catalog.CameraModel;
import de.fuji.xt50recipes.catalog.ValueRange;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.util.LinkedHashMap;
import java.util.Map;

public class WithinCameraRangesValidator implements ConstraintValidator<WithinCameraRanges, RecipeRequest> {

    private static final CameraModel CAMERA = CameraModel.X_T50;

    /** The value of one setting together with the range the camera allows for it. */
    private record Setting(Number value, ValueRange range) {
        /** A missing value is not this check's concern (@NotNull or the service default handles it). */
        boolean isAllowed() {
            return value == null || range.contains(value.doubleValue());
        }
    }

    @Override
    public boolean isValid(RecipeRequest request, ConstraintValidatorContext context) {
        context.disableDefaultConstraintViolation();
        boolean valid = true;
        for (Map.Entry<String, Setting> entry : settingsOf(request).entrySet()) {
            if (!entry.getValue().isAllowed()) {
                reject(context, entry.getKey(), entry.getValue().range());
                valid = false;
            }
        }
        return valid;
    }

    private static Map<String, Setting> settingsOf(RecipeRequest request) {
        Map<String, Setting> settings = new LinkedHashMap<>();
        settings.put("highlightTone", new Setting(request.highlightTone(), CAMERA.highlightTone()));
        settings.put("shadowTone", new Setting(request.shadowTone(), CAMERA.shadowTone()));
        settings.put("color", new Setting(request.color(), CAMERA.color()));
        settings.put("sharpness", new Setting(request.sharpness(), CAMERA.sharpness()));
        settings.put("noiseReduction", new Setting(request.noiseReduction(), CAMERA.noiseReduction()));
        settings.put("clarity", new Setting(request.clarity(), CAMERA.clarity()));
        settings.put("wbShiftRed", new Setting(request.wbShiftRed(), CAMERA.wbShift()));
        settings.put("wbShiftBlue", new Setting(request.wbShiftBlue(), CAMERA.wbShift()));
        return settings;
    }

    private static void reject(ConstraintValidatorContext context, String field, ValueRange range) {
        context.buildConstraintViolationWithTemplate(range.describe())
                .addPropertyNode(field)
                .addConstraintViolation();
    }
}
