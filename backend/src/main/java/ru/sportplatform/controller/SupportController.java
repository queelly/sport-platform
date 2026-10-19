package ru.sportplatform.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ru.sportplatform.dto.ApiDtos.*;
import ru.sportplatform.security.SecurityUtils;
import ru.sportplatform.service.SupportService;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/support")
public class SupportController {

    private final SupportService supportService;

    public SupportController(SupportService supportService) {
        this.supportService = supportService;
    }

    // --- ТИКЕТЫ ---
    @PostMapping("/tickets")
    public ResponseEntity<SupportTicketDto> createTicket(@Valid @RequestBody CreateTicketRequest req) {
        var viewer = SecurityUtils.requirePrincipal();
        return ResponseEntity.ok(supportService.createTicket(viewer, req));
    }

    @GetMapping("/tickets/my")
    public ResponseEntity<List<SupportTicketDto>> listMyTickets() {
        var viewer = SecurityUtils.requirePrincipal();
        return ResponseEntity.ok(supportService.listMyTickets(viewer));
    }

    @GetMapping("/tickets/{ticketId}")
    public ResponseEntity<SupportTicketDto> getTicket(@PathVariable UUID ticketId) {
        var viewer = SecurityUtils.requirePrincipal();
        return ResponseEntity.ok(supportService.getTicket(ticketId, viewer));
    }

    @PostMapping("/tickets/{ticketId}/reply")
    public ResponseEntity<SupportTicketDto> replyTicket(
            @PathVariable UUID ticketId,
            @Valid @RequestBody ReplyTicketRequest req
    ) {
        var viewer = SecurityUtils.requirePrincipal();
        return ResponseEntity.ok(supportService.replyOrUpdateTicket(ticketId, viewer, req));
    }

    // --- ОТДЕЛЬНЫЙ ЧАТ ТЕХПОДДЕРЖКИ ---
    @GetMapping("/chat")
    public ResponseEntity<SupportConversationDto> getMySupportChat() {
        var viewer = SecurityUtils.requirePrincipal();
        return ResponseEntity.ok(supportService.getMySupportChat(viewer));
    }

    @PostMapping("/chat/messages")
    public ResponseEntity<SupportConversationDto> sendChatMessage(@Valid @RequestBody SendSupportChatMessageRequest req) {
        var viewer = SecurityUtils.requirePrincipal();
        return ResponseEntity.ok(supportService.sendUserChatMessage(viewer, req));
    }
}
