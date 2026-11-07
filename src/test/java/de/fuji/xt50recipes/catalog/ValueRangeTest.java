package de.fuji.xt50recipes.catalog;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class ValueRangeTest {

    private final ValueRange tone = new ValueRange(-2, 4, 0.5);
    private final ValueRange integer = new ValueRange(-4, 4, 1);

    @Test
    void contains_boundariesAndSteps() {
        assertTrue(tone.contains(-2));
        assertTrue(tone.contains(4));
        assertTrue(tone.contains(1.5));
        assertTrue(integer.contains(0));
    }

    @Test
    void contains_rejectsOutsideAndOffStep() {
        assertFalse(tone.contains(4.5));
        assertFalse(tone.contains(-2.5));
        assertFalse(tone.contains(1.3));
        assertFalse(integer.contains(0.5));
    }

    @Test
    void describe_namesRangeWithSignsAndStep() {
        assertEquals("Erlaubt: -2 bis +4 in Schritten von 0.5", tone.describe());
        assertEquals("Erlaubt: -4 bis +4", integer.describe());
    }
}
