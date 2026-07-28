package de.fuji.xt50recipes.ai;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/location-match")
@RequiredArgsConstructor
public class LocationMatchController {

    private final LocationMatchService locationMatchService;

    record LocationMatchRequest(String location, java.util.List<String> primarySubjects, java.util.List<String> secondarySubjects, String model, boolean onlySlots) {}

    @PostMapping
    public ResponseEntity<?> match(@RequestBody LocationMatchRequest request) {
        if (request.location() == null || request.location().isBlank()) {
            return ResponseEntity.badRequest().body("Reiseziel erforderlich.");
        }
        log.info("POST /api/location-match: location='{}', model={}, onlySlots={}",
                request.location(), request.model(), request.onlySlots());
        try {
            List<RecipeMatchResponse> matches = locationMatchService.match(
                    request.location(), request.primarySubjects(), request.secondarySubjects(), request.model(), request.onlySlots());
            return ResponseEntity.ok(matches);
        } catch (AiSuggestionException e) {
            log.error("Location match failed: {}", e.getMessage());
            return ResponseEntity.status(502).body(e.getMessage());
        } catch (Exception e) {
            log.error("Unexpected error in location match", e);
            return ResponseEntity.status(502).body("KI-Service nicht verfügbar: " + e.getMessage());
        }
    }
}
