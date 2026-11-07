package de.fuji.xt50recipes.recipe;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/** The settings of the annotated recipe request lie within the value ranges of the camera model. */
@Documented
@Constraint(validatedBy = WithinCameraRangesValidator.class)
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
public @interface WithinCameraRanges {
    String message() default "Wert liegt außerhalb des Bereichs der Kamera";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
