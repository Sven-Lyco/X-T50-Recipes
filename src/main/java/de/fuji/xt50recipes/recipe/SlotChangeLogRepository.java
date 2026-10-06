package de.fuji.xt50recipes.recipe;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SlotChangeLogRepository extends JpaRepository<SlotChangeLog, UUID> {
    List<SlotChangeLog> findAllByOrderByChangedAtDesc();
}
