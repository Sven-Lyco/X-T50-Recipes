ALTER TABLE recipe
    ALTER COLUMN highlight_tone TYPE DOUBLE PRECISION USING highlight_tone::double precision,
    ALTER COLUMN shadow_tone TYPE DOUBLE PRECISION USING shadow_tone::double precision;
