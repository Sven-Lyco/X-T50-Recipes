package de.fuji.xt50recipes.image;

import de.fuji.xt50recipes.auth.AppUserDetailsService;
import de.fuji.xt50recipes.auth.JwtUtil;
import de.fuji.xt50recipes.config.AppProperties;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(value = ImageController.class, excludeAutoConfiguration = UserDetailsServiceAutoConfiguration.class)
@EnableConfigurationProperties(AppProperties.class)
class ImageControllerTest {

    @Autowired MockMvc mockMvc;

    @MockBean ImageService imageService;
    @MockBean JwtUtil jwtUtil;
    @MockBean AppUserDetailsService userDetailsService;

    @Test
    @WithMockUser
    void upload_validFile_returns201() throws Exception {
        UUID recipeId = UUID.randomUUID();
        UUID imageId = UUID.randomUUID();
        RecipeImage image = new RecipeImage();
        image.setId(imageId);
        image.setFilename("test.jpg");
        image.setSortOrder(0);

        when(imageService.upload(eq(recipeId), any())).thenReturn(image);

        MockMultipartFile file = new MockMultipartFile(
                "file", "photo.jpg", MediaType.IMAGE_JPEG_VALUE, "fake-image-data".getBytes()
        );

        mockMvc.perform(multipart("/api/recipes/{recipeId}/images", recipeId)
                .file(file)
                .with(csrf()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.filename").value("test.jpg"));
    }

    @Test
    @WithMockUser
    void delete_existingImage_returns204() throws Exception {
        UUID recipeId = UUID.randomUUID();
        UUID imageId = UUID.randomUUID();
        doNothing().when(imageService).delete(recipeId, imageId);

        mockMvc.perform(delete("/api/recipes/{recipeId}/images/{imageId}", recipeId, imageId)
                .with(csrf()))
                .andExpect(status().isNoContent());
    }

    @Test
    @WithMockUser
    void reorder_validBody_returns204() throws Exception {
        UUID recipeId = UUID.randomUUID();
        UUID imageId = UUID.randomUUID();
        doNothing().when(imageService).reorder(any(), any());

        String body = "[{\"id\":\"" + imageId + "\",\"sortOrder\":0}]";

        mockMvc.perform(put("/api/recipes/{recipeId}/images/order", recipeId)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
                .andExpect(status().isNoContent());
    }

}
