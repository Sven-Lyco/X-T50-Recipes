package de.fuji.xt50recipes.auth;

import de.fuji.xt50recipes.config.AppProperties;
import de.fuji.xt50recipes.user.AppUser;
import de.fuji.xt50recipes.user.AppUserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements ApplicationRunner {

    private final AppUserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AppProperties appProperties;

    @Override
    public void run(ApplicationArguments args) {
        if (userRepository.count() > 0) {
            return;
        }
        String password = appProperties.adminPassword();
        if (!StringUtils.hasText(password)) {
            log.warn("APP_ADMIN_PASSWORD is not set – skipping user creation. Set it to enable login.");
            return;
        }
        String username = appProperties.adminUsername();
        userRepository.save(new AppUser(username, passwordEncoder.encode(password)));
        log.info("Created initial admin user: {}", username);
    }
}