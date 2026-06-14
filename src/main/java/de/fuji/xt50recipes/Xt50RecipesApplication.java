package de.fuji.xt50recipes;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class Xt50RecipesApplication {

    public static void main(String[] args) {
        SpringApplication.run(Xt50RecipesApplication.class, args);
    }
}