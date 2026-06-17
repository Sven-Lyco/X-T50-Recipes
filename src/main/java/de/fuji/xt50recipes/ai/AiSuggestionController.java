package de.fuji.xt50recipes.ai;

import de.fuji.xt50recipes.recipe.RecipeRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/suggest")
@RequiredArgsConstructor
public class AiSuggestionController {

    private static final int MAX_IMAGES = 5;

    private final AiSuggestionService aiSuggestionService;

    @PostMapping
    public ResponseEntity<?> suggest(
            @RequestParam("images") List<MultipartFile> images,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "model", required = false) String model
    ) {
        if (images == null || images.isEmpty()) {
            return ResponseEntity.badRequest().body("Mindestens ein Bild erforderlich.");
        }
        if (images.size() > MAX_IMAGES) {
            return ResponseEntity.badRequest().body("Maximal " + MAX_IMAGES + " Bilder erlaubt.");
        }
        log.info("POST /api/suggest received: imageCount={}, model={}, description={}", images.size(), model, description);
        try {
            List<AiSuggestionService.ImageInput> inputs = new ArrayList<>();
            for (MultipartFile file : images) {
                String mimeType = file.getContentType() != null ? file.getContentType() : "image/jpeg";
                inputs.add(new AiSuggestionService.ImageInput(file.getBytes(), mimeType));
            }
            RecipeRequest suggestion = aiSuggestionService.suggest(inputs, description, model);
            log.info("AI suggestion generated successfully");
            return ResponseEntity.ok(suggestion);
        } catch (IOException e) {
            log.error("Failed to read image bytes", e);
            return ResponseEntity.badRequest().body("Bild konnte nicht gelesen werden.");
        } catch (AiSuggestionException e) {
            log.error("AI suggestion failed: {}", e.getMessage());
            return ResponseEntity.status(502).body(e.getMessage());
        } catch (Exception e) {
            log.error("Unexpected error in AI suggestion", e);
            return ResponseEntity.status(502).body("KI-Service nicht verfügbar: " + e.getMessage());
        }
    }
}
