package de.fuji.xt50recipes.auth;

import de.fuji.xt50recipes.config.AppProperties;
import de.fuji.xt50recipes.user.AppUserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.ApplicationArguments;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DataInitializerTest {

    @Mock
    AppUserRepository userRepository;

    @Mock
    PasswordEncoder passwordEncoder;

    @Mock
    ApplicationArguments applicationArguments;

    private static final AppProperties PROPS_WITH_PASSWORD = new AppProperties(
            "secret-32chars-longenoughtohash", 3600000L, "/tmp", "admin", "mypassword", null
    );
    private static final AppProperties PROPS_NO_PASSWORD = new AppProperties(
            "secret-32chars-longenoughtohash", 3600000L, "/tmp", "admin", null, null
    );
    private static final AppProperties PROPS_BLANK_PASSWORD = new AppProperties(
            "secret-32chars-longenoughtohash", 3600000L, "/tmp", "admin", "  ", null
    );

    @Test
    void run_userAlreadyExists_skipsCreation() throws Exception {
        DataInitializer initializer = new DataInitializer(userRepository, passwordEncoder, PROPS_WITH_PASSWORD);
        when(userRepository.count()).thenReturn(1L);

        initializer.run(applicationArguments);

        verify(userRepository, never()).save(any());
    }

    @Test
    void run_noPasswordConfigured_skipsCreation() throws Exception {
        DataInitializer initializer = new DataInitializer(userRepository, passwordEncoder, PROPS_NO_PASSWORD);
        when(userRepository.count()).thenReturn(0L);

        initializer.run(applicationArguments);

        verify(userRepository, never()).save(any());
    }

    @Test
    void run_blankPasswordConfigured_skipsCreation() throws Exception {
        DataInitializer initializer = new DataInitializer(userRepository, passwordEncoder, PROPS_BLANK_PASSWORD);
        when(userRepository.count()).thenReturn(0L);

        initializer.run(applicationArguments);

        verify(userRepository, never()).save(any());
    }

    @Test
    void run_createsAdminUser_whenNotExistsAndPasswordConfigured() throws Exception {
        DataInitializer initializer = new DataInitializer(userRepository, passwordEncoder, PROPS_WITH_PASSWORD);
        when(userRepository.count()).thenReturn(0L);
        when(passwordEncoder.encode("mypassword")).thenReturn("$encoded");

        initializer.run(applicationArguments);

        ArgumentCaptor<de.fuji.xt50recipes.user.AppUser> captor = ArgumentCaptor.forClass(de.fuji.xt50recipes.user.AppUser.class);
        verify(userRepository).save(captor.capture());
        assertThat(captor.getValue().getUsername()).isEqualTo("admin");
        assertThat(captor.getValue().getPasswordHash()).isEqualTo("$encoded");
    }
}
