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
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(value = SlotProtocolController.class, excludeAutoConfiguration = UserDetailsServiceAutoConfiguration.class)
@EnableConfigurationProperties(AppProperties.class)
class SlotProtocolControllerTest {

    @Autowired MockMvc mockMvc;

    @MockBean SlotChangeLogRepository slotChangeLogRepository;
    @MockBean JwtUtil jwtUtil;
    @MockBean AppUserDetailsService userDetailsService;

    @Test
    @WithMockUser
    void list_noEntries_returnsEmptyArray() throws Exception {
        when(slotChangeLogRepository.findAllByOrderByChangedAtDesc()).thenReturn(List.of());
        mockMvc.perform(get("/api/slot-protocol"))
                .andExpect(status().isOk())
                .andExpect(content().json("[]"));
    }

    @Test
    @WithMockUser
    void list_withEntries_returnsSlotAndRecipeNames() throws Exception {
        UUID entryId = UUID.randomUUID();
        UUID prevId = UUID.randomUUID();
        UUID newId = UUID.randomUUID();
        SlotChangeLog entry = new SlotChangeLog();
        entry.setId(entryId);
        entry.setSlot(CameraSlot.C1);
        entry.setPreviousRecipeId(prevId);
        entry.setPreviousRecipeName("Old Recipe");
        entry.setNewRecipeId(newId);
        entry.setNewRecipeName("New Recipe");
        entry.setChangedAt(Instant.parse("2025-06-01T10:00:00Z"));

        when(slotChangeLogRepository.findAllByOrderByChangedAtDesc()).thenReturn(List.of(entry));

        mockMvc.perform(get("/api/slot-protocol"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].slot").value("C1"))
                .andExpect(jsonPath("$[0].previousRecipeName").value("Old Recipe"))
                .andExpect(jsonPath("$[0].newRecipeName").value("New Recipe"));
    }

    @Test
    void list_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/slot-protocol"))
                .andExpect(status().isUnauthorized());
    }
}
