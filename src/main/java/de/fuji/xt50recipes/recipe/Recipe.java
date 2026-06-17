package de.fuji.xt50recipes.recipe;

import de.fuji.xt50recipes.image.RecipeImage;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "recipe")
@Getter @Setter @NoArgsConstructor
public class Recipe {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "film_simulation", nullable = false, length = 50)
    private FilmSimulation filmSimulation;

    @Enumerated(EnumType.STRING)
    @Column(name = "dynamic_range", nullable = false, length = 10)
    private DynamicRange dynamicRange;

    @Column(name = "highlight_tone", nullable = false)
    private Double highlightTone;

    @Column(name = "shadow_tone", nullable = false)
    private Double shadowTone;

    @Column(nullable = false)
    private Integer color;

    @Column(nullable = false)
    private Integer sharpness;

    @Column(name = "noise_reduction", nullable = false)
    private Integer noiseReduction;

    @Enumerated(EnumType.STRING)
    @Column(name = "grain_strength", nullable = false, length = 10)
    private GrainStrength grainStrength;

    @Enumerated(EnumType.STRING)
    @Column(name = "grain_size", length = 10)
    private GrainSize grainSize;

    @Enumerated(EnumType.STRING)
    @Column(name = "color_chrome_effect", nullable = false, length = 10)
    private EffectStrength colorChromeEffect;

    @Enumerated(EnumType.STRING)
    @Column(name = "color_chrome_fx_blue", nullable = false, length = 10)
    private EffectStrength colorChromeFxBlue;

    @Enumerated(EnumType.STRING)
    @Column(name = "white_balance_mode", nullable = false, length = 20)
    private WhiteBalanceMode whiteBalanceMode;

    @Column(name = "wb_shift_red", nullable = false)
    private Integer wbShiftRed = 0;

    @Column(name = "wb_shift_blue", nullable = false)
    private Integer wbShiftBlue = 0;

    @Column(name = "color_temp_kelvin")
    private Integer colorTempKelvin;

    @Column(nullable = false)
    private Integer clarity = 0;

    @Column(name = "monochrome_warm_cool")
    private Integer monochromeWarmCool;

    @Column(name = "monochrome_green_magenta")
    private Integer monochromeGreenMagenta;

    @Column(name = "iso_mode", length = 20)
    private String isoMode;

    @Column(name = "iso_note", length = 255)
    private String isoNote;

    @Column(name = "exp_comp_note", length = 255)
    private String expCompNote;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "inspiration_source", length = 500)
    private String inspirationSource;

    @Column(name = "tags", columnDefinition = "text[]")
    private String[] tags = new String[0];

    @Enumerated(EnumType.STRING)
    @Column(name = "camera_slot", length = 5)
    private CameraSlot cameraSlot;

    @Column(name = "is_favorite", nullable = false)
    private boolean favorite = false;

    @Column(name = "ai_generated", nullable = false)
    private boolean aiGenerated = false;

    @OneToMany(mappedBy = "recipe", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC")
    private List<RecipeImage> images = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void prePersist() {
        createdAt = Instant.now();
        updatedAt = Instant.now();
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = Instant.now();
    }
}