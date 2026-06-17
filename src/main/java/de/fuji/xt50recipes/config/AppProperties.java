package de.fuji.xt50recipes.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app")
public record AppProperties(
        String jwtSecret,
        long jwtExpirationMs,
        String imageStoragePath,
        String adminUsername,
        String adminPassword,
        String anthropicApiKey
) {}