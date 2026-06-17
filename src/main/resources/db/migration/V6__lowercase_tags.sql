UPDATE recipe
SET tags = ARRAY(
    SELECT lower(t) FROM unnest(tags) t
)
WHERE tags IS NOT NULL;
