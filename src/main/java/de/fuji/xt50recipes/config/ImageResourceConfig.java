package de.fuji.xt50recipes.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@RequiredArgsConstructor
public class ImageResourceConfig implements WebMvcConfigurer {

    private final AppProperties appProperties;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String storagePath = appProperties.imageStoragePath();
        String location = storagePath.endsWith("/") ? "file:" + storagePath : "file:" + storagePath + "/";
        registry.addResourceHandler("/images/**")
                .addResourceLocations(location);
    }
}