package de.fuji.xt50recipes.recipe;

import de.fuji.xt50recipes.catalog.CameraModel;
import de.fuji.xt50recipes.catalog.ValueRange;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class WithinCameraRangesValidator implements ConstraintValidator<WithinCameraRanges, RecipeRequest> {

    private static final CameraModel CAMERA = CameraModel.X_T50;

    @Override
    public boolean isValid(RecipeRequest request, ConstraintValidatorContext context) {
        context.disableDefaultConstraintViolation();
        boolean valid = true;
        valid &= check(context, "highlightTone", request.highlightTone(), CAMERA.highlightTone());
        valid &= check(context, "shadowTone", request.shadowTone(), CAMERA.shadowTone());
        valid &= check(context, "color", request.color(), CAMERA.color());
        valid &= check(context, "sharpness", request.sharpness(), CAMERA.sharpness());
        valid &= check(context, "noiseReduction", request.noiseReduction(), CAMERA.noiseReduction());
        valid &= check(context, "clarity", request.clarity(), CAMERA.clarity());
        valid &= check(context, "wbShiftRed", request.wbShiftRed(), CAMERA.wbShift());
        valid &= check(context, "wbShiftBlue", request.wbShiftBlue(), CAMERA.wbShift());
        return valid;
    }

    /** A missing value is not this check's concern (@NotNull or the service default handles it). */
    private static boolean check(ConstraintValidatorContext context, String field, Number value, ValueRange range) {
        if (value == null || range.contains(value.doubleValue())) {
            return true;
        }
        context.buildConstraintViolationWithTemplate(range.describe())
                .addPropertyNode(field)
                .addConstraintViolation();
        return false;
    }
}
