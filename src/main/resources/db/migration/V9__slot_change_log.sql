CREATE TABLE slot_change_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slot VARCHAR(5) NOT NULL,
    previous_recipe_id UUID,
    previous_recipe_name VARCHAR(255),
    new_recipe_id UUID,
    new_recipe_name VARCHAR(255),
    changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
