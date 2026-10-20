package ru.sportplatform.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ru.sportplatform.domain.enums.Enums.JoinMode;
import ru.sportplatform.domain.enums.Enums.SkillLevel;
import ru.sportplatform.dto.ApiDtos.*;
import ru.sportplatform.security.SecurityUtils;
import ru.sportplatform.service.DiscussionService;
import ru.sportplatform.service.EventService;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/events")
public class EventController {

    private final EventService eventService;
    private final DiscussionService discussionService;

    public EventController(EventService eventService, DiscussionService discussionService) {
        this.eventService = eventService;
        this.discussionService = discussionService;
    }

    @GetMapping
    public ResponseEntity<List<EventCardDto>> searchEvents(
            @RequestParam(required = false) UUID sportId,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) JoinMode joinMode,
            @RequestParam(required = false) SkillLevel skillLevel,
            @RequestParam(required = false) Boolean recurring,
            @RequestParam(required = false) Boolean onlyAvailableSpots,
            @RequestParam(required = false) String q
    ) {
        var viewer = SecurityUtils.getCurrentPrincipalOptional().orElse(null);
        return ResponseEntity.ok(eventService.searchEvents(sportId, city, joinMode, skillLevel, recurring, onlyAvailableSpots, q, viewer));
    }

    @GetMapping("/my/organized")
    public ResponseEntity<List<EventCardDto>> listMyOrganized() {
        var viewer = SecurityUtils.requirePrincipal();
        return ResponseEntity.ok(eventService.listMyOrganizedEvents(viewer));
    }

    @GetMapping("/my/participations")
    public ResponseEntity<List<EventCardDto>> listMyParticipations() {
        var viewer = SecurityUtils.requirePrincipal();
        return ResponseEntity.ok(eventService.listMyParticipations(viewer));
    }

    @GetMapping("/{eventId}")
    public ResponseEntity<EventDetailDto> getEventDetail(@PathVariable UUID eventId) {
        var viewer = SecurityUtils.getCurrentPrincipalOptional().orElse(null);
        return ResponseEntity.ok(eventService.getEventDetail(eventId, viewer));
    }

    @PostMapping
    public ResponseEntity<EventDetailDto> createEvent(@Valid @RequestBody CreateEventRequest req) {
        UUID userId = SecurityUtils.requireUserId();
        return ResponseEntity.ok(eventService.createEvent(userId, req));
    }

    @PutMapping("/{eventId}")
    public ResponseEntity<EventDetailDto> updateEvent(
            @PathVariable UUID eventId,
            @Valid @RequestBody UpdateEventRequest req
    ) {
        var viewer = SecurityUtils.requirePrincipal();
        return ResponseEntity.ok(eventService.updateEvent(eventId, viewer, req));
    }

    @PostMapping("/{eventId}/join")
    public ResponseEntity<EventDetailDto> joinOrApply(
            @PathVariable UUID eventId,
            @RequestBody(required = false) JoinEventRequest req
    ) {
        var viewer = SecurityUtils.requirePrincipal();
        String comment = req != null ? req.comment() : null;
        return ResponseEntity.ok(eventService.joinOrApply(eventId, viewer, comment));
    }

    @PostMapping("/{eventId}/participations/{participationId}/decision")
    public ResponseEntity<EventDetailDto> decideParticipation(
            @PathVariable UUID eventId,
            @PathVariable UUID participationId,
            @Valid @RequestBody ParticipationDecisionRequest req
    ) {
        var viewer = SecurityUtils.requirePrincipal();
        return ResponseEntity.ok(eventService.decideParticipation(eventId, participationId, viewer, req));
    }

    @PostMapping("/{eventId}/cancel-participation")
    public ResponseEntity<EventDetailDto> cancelMyParticipation(@PathVariable UUID eventId) {
        var viewer = SecurityUtils.requirePrincipal();
        return ResponseEntity.ok(eventService.cancelMyParticipation(eventId, viewer));
    }

    @PostMapping("/{eventId}/cancel")
    public ResponseEntity<EventDetailDto> cancelEventByOrganizer(
            @PathVariable UUID eventId,
            @RequestBody(required = false) CancelEventRequest req
    ) {
        var viewer = SecurityUtils.requirePrincipal();
        CancelEventRequest safeReq = req != null ? req : new CancelEventRequest("Отменено организатором", false);
        return ResponseEntity.ok(eventService.cancelEventByOrganizer(eventId, viewer, safeReq));
    }

    @PostMapping("/{eventId}/restore")
    public ResponseEntity<EventDetailDto> restoreEventByOrganizer(@PathVariable UUID eventId) {
        var viewer = SecurityUtils.requirePrincipal();
        return ResponseEntity.ok(eventService.restoreEventByOrganizer(eventId, viewer));
    }

    @DeleteMapping("/{eventId}")
    public ResponseEntity<java.util.Map<String, String>> deleteEventByOrganizer(@PathVariable UUID eventId) {
        var viewer = SecurityUtils.requirePrincipal();
        eventService.deleteEventByOrganizer(eventId, viewer);
        return ResponseEntity.ok(java.util.Map.of("message", "Мероприятие удалено организатором"));
    }

    @GetMapping(value = "/{eventId}/ics", produces = "text/calendar;charset=UTF-8")
    public ResponseEntity<byte[]> exportIcsCalendar(@PathVariable UUID eventId) {
        String ics = eventService.generateIcsCalendar(eventId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"sport-event-" + eventId + ".ics\"")
                .contentType(new MediaType("text", "calendar", StandardCharsets.UTF_8))
                .body(ics.getBytes(StandardCharsets.UTF_8));
    }

    // --- ОБСУЖДЕНИЯ ВНУТРИ МЕРОПРИЯТИЯ ---
    @GetMapping("/{eventId}/discussions")
    public ResponseEntity<List<DiscussionMessageDto>> getDiscussions(@PathVariable UUID eventId) {
        var viewer = SecurityUtils.getCurrentPrincipalOptional().orElse(null);
        return ResponseEntity.ok(discussionService.listMessages(eventId, viewer));
    }

    @PostMapping("/{eventId}/discussions")
    public ResponseEntity<DiscussionMessageDto> postDiscussionMessage(
            @PathVariable UUID eventId,
            @Valid @RequestBody CreateDiscussionMessageRequest req
    ) {
        var viewer = SecurityUtils.requirePrincipal();
        return ResponseEntity.ok(discussionService.postMessage(eventId, viewer, req));
    }
}
