package de.fuji.xt50recipes.ai;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/match")
@RequiredArgsConstructor
public class RecipeMatchController {

    private final RecipeMatchService recipeMatchService;

    @PostMapping
    public ResponseEntity<?> match(
            @RequestParam("image") MultipartFile image,
            @RequestParam(value = "model", required = false) String model,
            @RequestParam(value = "onlySlots", required = false, defaultValue = "false") boolean onlySlots
    ) {
        if (image == null || image.isEmpty()) {
            return ResponseEntity.badRequest().body("Bild erforderlich.");
        }
        log.info("POST /api/match: imageSize={}, model={}, onlySlots={}", image.getSize(), model, onlySlots);
        try {
            String mimeType = image.getContentType() != null ? image.getContentType() : "image/jpeg";
            List<RecipeMatchResponse> matches = recipeMatchService.match(image.getBytes(), mimeType, model, onlySlots);
            return ResponseEntity.ok(matches);
        } catch (IOException e) {
            log.error("Failed to read image bytes", e);
            return ResponseEntity.badRequest().body("Bild konnte nicht gelesen werden.");
        } catch (AiSuggestionException e) {
            log.error("Recipe match failed: {}", e.getMessage());
            return ResponseEntity.status(502).body(e.getMessage());
        } catch (Exception e) {
            log.error("Unexpected error in recipe match", e);
            return ResponseEntity.status(502).body("KI-Service nicht verfügbar: " + e.getMessage());
        }
    }
}
