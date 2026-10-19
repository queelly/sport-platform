package ru.sportplatform.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ru.sportplatform.domain.enums.Enums.SkillLevel;
import ru.sportplatform.dto.ApiDtos.*;
import ru.sportplatform.security.SecurityUtils;
import ru.sportplatform.service.AuthService;
import ru.sportplatform.service.SocialAndProfileService;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class SocialAndProfileController {

    private final SocialAndProfileService socialService;
    private final AuthService authService;

    public SocialAndProfileController(SocialAndProfileService socialService, AuthService authService) {
        this.socialService = socialService;
        this.authService = authService;
    }

    @PutMapping("/profile/me")
    public ResponseEntity<UserSummaryDto> updateMyProfile(@Valid @RequestBody UpdateProfileRequest req) {
        UUID userId = SecurityUtils.requireUserId();
        return ResponseEntity.ok(socialService.updateMyProfile(userId, req));
    }

    @GetMapping("/users/{userId}")
    public ResponseEntity<PublicUserProfileDto> getPublicProfile(@PathVariable UUID userId) {
        var viewer = SecurityUtils.getCurrentPrincipalOptional().orElse(null);
        return ResponseEntity.ok(socialService.getPublicProfile(userId, viewer));
    }

    @GetMapping("/partners/search")
    public ResponseEntity<List<PublicUserProfileDto>> searchPartners(
            @RequestParam(required = false) UUID sportId,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) SkillLevel skillLevel,
            @RequestParam(required = false) String q
    ) {
        var viewer = SecurityUtils.getCurrentPrincipalOptional().orElse(null);
        return ResponseEntity.ok(socialService.searchSportPartners(sportId, city, skillLevel, q, viewer));
    }

    // --- СПОРТИВНЫЕ ЗНАКОМЫЕ ---
    @GetMapping("/friends")
    public ResponseEntity<List<FriendshipDto>> listMyFriendships() {
        UUID userId = SecurityUtils.requireUserId();
        return ResponseEntity.ok(socialService.listMyFriendships(userId));
    }

    @PostMapping("/friends/requests")
    public ResponseEntity<FriendshipDto> sendFriendRequest(@Valid @RequestBody SendFriendRequestDto req) {
        UUID userId = SecurityUtils.requireUserId();
        return ResponseEntity.ok(socialService.sendFriendRequest(userId, req));
    }

    @PostMapping("/friends/{friendshipId}/respond")
    public ResponseEntity<FriendshipDto> respondToFriendRequest(
            @PathVariable UUID friendshipId,
            @RequestParam boolean accept
    ) {
        UUID userId = SecurityUtils.requireUserId();
        return ResponseEntity.ok(socialService.respondToFriendRequest(userId, friendshipId, accept));
    }

    @DeleteMapping("/friends/{friendshipId}")
    public ResponseEntity<Map<String, String>> cancelOrRemoveFriendship(@PathVariable UUID friendshipId) {
        UUID userId = SecurityUtils.requireUserId();
        socialService.cancelOrRemoveFriendship(userId, friendshipId);
        return ResponseEntity.ok(Map.of("message", "Связь обновлена"));
    }
}
