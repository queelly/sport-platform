package ru.sportplatform.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ru.sportplatform.dto.ApiDtos.CreateSportRequest;
import ru.sportplatform.dto.ApiDtos.SportDto;
import ru.sportplatform.security.SecurityUtils;
import ru.sportplatform.service.SportService;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/sports")
public class SportController {

    private final SportService sportService;

    public SportController(SportService sportService) {
        this.sportService = sportService;
    }

    @GetMapping
    public ResponseEntity<List<SportDto>> listSports(@RequestParam(defaultValue = "false") boolean includeArchived) {
        if (includeArchived && SecurityUtils.getCurrentPrincipalOptional().map(p -> p.isAdmin()).orElse(false)) {
            return ResponseEntity.ok(sportService.listAllSports());
        }
        return ResponseEntity.ok(sportService.listActiveSports());
    }

    @PostMapping
    public ResponseEntity<SportDto> createSport(@Valid @RequestBody CreateSportRequest req) {
        UUID userId = SecurityUtils.requireUserId();
        return ResponseEntity.ok(sportService.createSport(req, userId));
    }

    @PatchMapping("/{sportId}/archive")
    public ResponseEntity<SportDto> toggleArchive(@PathVariable UUID sportId, @RequestParam boolean archived) {
        SecurityUtils.requireAdmin();
        return ResponseEntity.ok(sportService.toggleArchive(sportId, archived));
    }
}
