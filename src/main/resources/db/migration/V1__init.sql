CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE app_user (
    id            UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    username      VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL
);

CREATE TABLE recipe (
    id                      UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                    VARCHAR(255) NOT NULL,
    film_simulation         VARCHAR(50)  NOT NULL,
    dynamic_range           VARCHAR(10)  NOT NULL,
    highlight_tone          INTEGER      NOT NULL,
    shadow_tone             INTEGER      NOT NULL,
    color                   INTEGER      NOT NULL,
    sharpness               INTEGER      NOT NULL,
    noise_reduction         INTEGER      NOT NULL,
    grain_strength          VARCHAR(10)  NOT NULL,
    grain_size              VARCHAR(10),
    color_chrome_effect     VARCHAR(10)  NOT NULL,
    color_chrome_fx_blue    VARCHAR(10)  NOT NULL,
    white_balance_mode      VARCHAR(20)  NOT NULL,
    wb_shift_red            INTEGER      NOT NULL DEFAULT 0,
    wb_shift_blue           INTEGER      NOT NULL DEFAULT 0,
    color_temp_kelvin       INTEGER,
    clarity                 INTEGER      NOT NULL DEFAULT 0,
    monochrome_warm_cool    INTEGER,
    monochrome_green_magenta INTEGER,
    iso_note                VARCHAR(255),
    exp_comp_note           VARCHAR(255),
    description             TEXT,
    inspiration_source      VARCHAR(500),
    tags                    TEXT[]       NOT NULL DEFAULT '{}',
    camera_slot             VARCHAR(5),
    created_at              TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX recipe_camera_slot_unique
    ON recipe (camera_slot)
    WHERE camera_slot IS NOT NULL;

CREATE TABLE recipe_image (
    id         UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipe_id  UUID         NOT NULL REFERENCES recipe (id) ON DELETE CASCADE,
    filename   VARCHAR(500) NOT NULL,
    caption    VARCHAR(255),
    sort_order INTEGER      NOT NULL DEFAULT 0
);