package de.fuji.xt50recipes.catalog;

/** A camera model and the value ranges of its recipe settings. */
public record CameraModel(
        String name,
        ValueRange highlightTone,
        ValueRange shadowTone,
        ValueRange color,
        ValueRange sharpness,
        ValueRange noiseReduction,
        ValueRange clarity,
        ValueRange wbShift) {

    public static final CameraModel X_T50 = new CameraModel(
            "X-T50",
            new ValueRange(-2, 4, 0.5),
            new ValueRange(-2, 4, 0.5),
            new ValueRange(-4, 4, 1),
            new ValueRange(-4, 4, 1),
            new ValueRange(-4, 4, 1),
            new ValueRange(-5, 5, 1),
            new ValueRange(-9, 9, 1));
}
