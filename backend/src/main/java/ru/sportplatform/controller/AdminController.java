package ru.sportplatform.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import ru.sportplatform.domain.enums.Enums.OrganizationStatus;
import ru.sportplatform.domain.enums.Enums.SupportConversationStatus;
import ru.sportplatform.domain.enums.Enums.TicketStatus;
import ru.sportplatform.dto.ApiDtos.*;
import ru.sportplatform.security.SecurityUtils;
import ru.sportplatform.service.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final OrganizationService organizationService;
    private final EventService eventService;
    private final DiscussionService discussionService;
    private final SupportService supportService;
    private final AuditLogService auditLogService;

    public AdminController(
            OrganizationService organizationService,
            EventService eventService,
            DiscussionService discussionService,
            SupportService supportService,
            AuditLogService auditLogService
    ) {
        this.organizationService = organizationService;
        this.eventService = eventService;
        this.discussionService = discussionService;
        this.supportService = supportService;
        this.auditLogService = auditLogService;
    }

    // --- 1. МОДЕРАЦИЯ ОРГАНИЗАЦИЙ ---
    @GetMapping("/organizations")
    public ResponseEntity<List<OrganizationDto>> listOrganizations(
            @RequestParam(required = false) OrganizationStatus status
    ) {
        var admin = SecurityUtils.requirePrincipal();
        return ResponseEntity.ok(organizationService.listAllForAdmin(admin, status));
    }

    @PostMapping("/organizations/{orgId}/decision")
    public ResponseEntity<OrganizationDto> moderateOrganization(
            @PathVariable UUID orgId,
            @Valid @RequestBody AdminOrgModerationRequest req
    ) {
        var admin = SecurityUtils.requirePrincipal();
        return ResponseEntity.ok(organizationService.moderateOrganization(orgId, admin.id(), req));
    }

    // --- 2. МОДЕРАЦИЯ МЕРОПРИЯТИЙ И СООБЩЕНИЙ ---
    @GetMapping("/events")
    public ResponseEntity<List<EventCardDto>> listAllEvents() {
        var admin = SecurityUtils.requirePrincipal();
        return ResponseEntity.ok(eventService.listAllEventsForAdmin(admin));
    }

    @PostMapping("/events/{eventId}/unpublish")
    public ResponseEntity<EventDetailDto> unpublishEvent(
            @PathVariable UUID eventId,
            @Valid @RequestBody AdminReasonRequest req
    ) {
        var admin = SecurityUtils.requirePrincipal();
        return ResponseEntity.ok(eventService.unpublishEventByAdmin(eventId, admin, req.reason()));
    }

    @PostMapping("/events/{eventId}/republish")
    public ResponseEntity<EventDetailDto> republishEvent(
            @PathVariable UUID eventId,
            @RequestBody(required = false) AdminReasonRequest req
    ) {
        var admin = SecurityUtils.requirePrincipal();
        String reason = req != null && req.reason() != null ? req.reason() : "Восстановлено администратором";
        return ResponseEntity.ok(eventService.republishEventByAdmin(eventId, admin, reason));
    }

    @PostMapping("/events/{eventId}/discussions/{messageId}/hide")
    public ResponseEntity<DiscussionMessageDto> hideDiscussionMessage(
            @PathVariable UUID eventId,
            @PathVariable UUID messageId,
            @Valid @RequestBody AdminReasonRequest req
    ) {
        var admin = SecurityUtils.requirePrincipal();
        return ResponseEntity.ok(discussionService.hideMessageByAdmin(eventId, messageId, admin, req.reason()));
    }

    // --- 3. ОБРАБОТКА ТИКЕТОВ И ЖАЛОБ ---
    @GetMapping("/tickets")
    public ResponseEntity<List<SupportTicketDto>> listAllTickets(
            @RequestParam(required = false) TicketStatus status
    ) {
        SecurityUtils.requireAdmin();
        return ResponseEntity.ok(supportService.listAllTicketsForAdmin(status));
    }

    @PostMapping("/tickets/{ticketId}/reply")
    public ResponseEntity<SupportTicketDto> replyAndUpdateTicket(
            @PathVariable UUID ticketId,
            @Valid @RequestBody ReplyTicketRequest req
    ) {
        var admin = SecurityUtils.requirePrincipal();
        return ResponseEntity.ok(supportService.replyOrUpdateTicket(ticketId, admin, req));
    }

    // --- 4. РАБОЧЕЕ ПРОСТРАНСТВО ЧАТА ТЕХПОДДЕРЖКИ ---
    @GetMapping("/support-chats")
    public ResponseEntity<List<SupportConversationDto>> listSupportChats() {
        SecurityUtils.requireAdmin();
        return ResponseEntity.ok(supportService.listAllConversationsForAdmin());
    }

    @PostMapping("/support-chats/{conversationId}/reply")
    public ResponseEntity<SupportConversationDto> replySupportChat(
            @PathVariable UUID conversationId,
            @RequestParam(required = false) SupportConversationStatus status,
            @Valid @RequestBody SendSupportChatMessageRequest req
    ) {
        var admin = SecurityUtils.requirePrincipal();
        return ResponseEntity.ok(supportService.sendAdminChatReply(conversationId, admin, req, status));
    }

    // --- 5. ЖУРНАЛ АДМИНИСТРАТИВНЫХ ДЕЙСТВИЙ ---
    @GetMapping("/audit-logs")
    public ResponseEntity<List<AuditLogDto>> getAuditLogs() {
        SecurityUtils.requireAdmin();
        return ResponseEntity.ok(auditLogService.getRecentLogs());
    }
}
