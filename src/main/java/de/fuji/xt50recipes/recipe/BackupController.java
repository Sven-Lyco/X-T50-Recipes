package de.fuji.xt50recipes.recipe;

import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/backup")
@RequiredArgsConstructor
public class BackupController {

    private final RecipeExportService recipeExportService;

    @GetMapping
    public void exportBackup(HttpServletResponse response) throws IOException {
        recipeExportService.exportAllZip(response);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public List<RecipeResponse> importBackup(@RequestParam("file") MultipartFile file) throws IOException {
        return recipeExportService.importAllZip(file);
    }
}
