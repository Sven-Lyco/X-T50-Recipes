package de.fuji.xt50recipes.recipe;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/slot-protocol")
@RequiredArgsConstructor
public class SlotProtocolController {

    private final SlotChangeLogRepository slotChangeLogRepository;

    @GetMapping
    public List<SlotChangeLogResponse> list() {
        return slotChangeLogRepository.findAllByOrderByChangedAtDesc()
                .stream()
                .map(SlotChangeLogResponse::from)
                .toList();
    }
}
