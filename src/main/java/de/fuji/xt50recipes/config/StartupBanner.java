package de.fuji.xt50recipes.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class StartupBanner implements ApplicationListener<ApplicationReadyEvent> {

    @Override
    public void onApplicationEvent(ApplicationReadyEvent event) {
        log.info("""

            ╔══════════════════════════════════════╗
            ║                                      ║
            ║    ◉  X-T50 Recipes                  ║
            ║       Fujifilm Recipe Manager  📷    ║
            ║                                      ║
            ╚══════════════════════════════════════╝
            """);
    }
}
