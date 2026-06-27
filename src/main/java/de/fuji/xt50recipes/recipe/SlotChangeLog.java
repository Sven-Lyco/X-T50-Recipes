package de.fuji.xt50recipes.recipe;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "slot_change_log")
@Getter @Setter @NoArgsConstructor
public class SlotChangeLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 5)
    private CameraSlot slot;

    private UUID previousRecipeId;
    private String previousRecipeName;

    private UUID newRecipeId;
    private String newRecipeName;

    @Column(nullable = false)
    private Instant changedAt;
}
