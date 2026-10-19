package ru.sportplatform.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ru.sportplatform.dto.ApiDtos.*;
import ru.sportplatform.security.SecurityUtils;
import ru.sportplatform.service.EventService;
import ru.sportplatform.service.OrganizationService;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/organizations")
public class OrganizationController {

    private final OrganizationService organizationService;
    private final EventService eventService;

    public OrganizationController(OrganizationService organizationService, EventService eventService) {
        this.organizationService = organizationService;
        this.eventService = eventService;
    }

    @GetMapping
    public ResponseEntity<List<OrganizationDto>> listApproved() {
        var viewer = SecurityUtils.getCurrentPrincipalOptional().orElse(null);
        return ResponseEntity.ok(organizationService.listPublicApprovedOrganizations(viewer));
    }

    @GetMapping("/my")
    public ResponseEntity<List<OrganizationDto>> listMyOrganizations() {
        var viewer = SecurityUtils.requirePrincipal();
        return ResponseEntity.ok(organizationService.listMyOrganizations(viewer));
    }

    @GetMapping("/{orgId}")
    public ResponseEntity<OrganizationDto> getOrganization(@PathVariable UUID orgId) {
        var viewer = SecurityUtils.getCurrentPrincipalOptional().orElse(null);
        return ResponseEntity.ok(organizationService.getOrganizationById(orgId, viewer));
    }

    @GetMapping("/{orgId}/events")
    public ResponseEntity<List<EventCardDto>> getOrganizationEvents(@PathVariable UUID orgId) {
        var viewer = SecurityUtils.getCurrentPrincipalOptional().orElse(null);
        return ResponseEntity.ok(eventService.listOrganizationEvents(orgId, viewer));
    }

    @PutMapping("/{orgId}")
    public ResponseEntity<OrganizationDto> updateAndResubmit(
            @PathVariable UUID orgId,
            @Valid @RequestBody UpdateOrganizationApplicationRequest req
    ) {
        UUID userId = SecurityUtils.requireUserId();
        return ResponseEntity.ok(organizationService.updateAndResubmit(orgId, userId, req));
    }

    @PostMapping("/{orgId}/subscribe")
    public ResponseEntity<OrganizationDto> toggleSubscribe(@PathVariable UUID orgId) {
        var viewer = SecurityUtils.requirePrincipal();
        return ResponseEntity.ok(organizationService.toggleSubscription(orgId, viewer));
    }
}
