package de.fuji.xt50recipes.config;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaFallbackController {

    @GetMapping(value = { "/login", "/camera", "/recipes/**", "/reference" })
    public String forward() {
        return "forward:/index.html";
    }
}
