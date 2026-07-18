package de.fuji.xt50recipes.recipe;

import de.fuji.xt50recipes.auth.AppUserDetailsService;
import de.fuji.xt50recipes.auth.JwtUtil;
import de.fuji.xt50recipes.config.AppProperties;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(value = BackupController.class, excludeAutoConfiguration = UserDetailsServiceAutoConfiguration.class)
@EnableConfigurationProperties(AppProperties.class)
class BackupControllerTest {

    @Autowired MockMvc mockMvc;

    @MockBean RecipeExportService recipeExportService;
    @MockBean JwtUtil jwtUtil;
    @MockBean AppUserDetailsService userDetailsService;

    @Test
    @WithMockUser
    void exportBackup_returns200() throws Exception {
        doNothing().when(recipeExportService).exportAllZip(any());

        mockMvc.perform(get("/api/backup"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser
    void importBackup_validZip_returns201() throws Exception {
        when(recipeExportService.importAllZip(any())).thenReturn(List.of());

        mockMvc.perform(multipart("/api/backup")
                .file(new MockMultipartFile("file", "backup.zip", "application/zip", new byte[10]))
                .with(csrf()))
                .andExpect(status().isCreated());
    }

}
