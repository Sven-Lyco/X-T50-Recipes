package de.fuji.xt50recipes.catalog;

/** Allowed values of one camera setting: from min to max in steps of step. */
public record ValueRange(double min, double max, double step) {

    public boolean contains(double value) {
        if (value < min || value > max) {
            return false;
        }
        double steps = (value - min) / step;
        return Math.abs(steps - Math.round(steps)) < 1e-9;
    }

    public String describe() {
        String text = "Erlaubt: " + signed(min) + " bis " + signed(max);
        return step == 1.0 ? text : text + " in Schritten von " + plain(step);
    }

    private static String signed(double v) {
        return v > 0 ? "+" + plain(v) : plain(v);
    }

    private static String plain(double v) {
        return v == Math.rint(v) ? String.valueOf((long) v) : String.valueOf(v);
    }
}
