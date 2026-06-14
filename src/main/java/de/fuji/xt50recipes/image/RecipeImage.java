package de.fuji.xt50recipes.image;

import de.fuji.xt50recipes.recipe.Recipe;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "recipe_image")
@Getter @Setter @NoArgsConstructor
public class RecipeImage {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipe_id", nullable = false)
    private Recipe recipe;

    @Column(nullable = false, length = 500)
    private String filename;

    @Column(length = 255)
    private String caption;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;
}
