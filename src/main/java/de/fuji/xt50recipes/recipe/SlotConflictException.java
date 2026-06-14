package de.fuji.xt50recipes.recipe;

import java.util.UUID;

public class SlotConflictException extends RuntimeException {

    private final UUID occupiedById;
    private final String occupiedByName;

    public SlotConflictException(UUID occupiedById, String occupiedByName) {
        super("Camera slot is already occupied by: " + occupiedByName);
        this.occupiedById = occupiedById;
        this.occupiedByName = occupiedByName;
    }

    public UUID getOccupiedById() { return occupiedById; }
    public String getOccupiedByName() { return occupiedByName; }
}