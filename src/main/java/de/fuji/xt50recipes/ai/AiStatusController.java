package de.fuji.xt50recipes.ai;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class AiStatusController {

    @Value("${app.anthropic-api-key:}")
    private String apiKey;

    @GetMapping("/ai-status")
    public Map<String, Boolean> aiStatus() {
        return Map.of("available", apiKey != null && !apiKey.isBlank());
    }
}
