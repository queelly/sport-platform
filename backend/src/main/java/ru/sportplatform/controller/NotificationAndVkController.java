package ru.sportplatform.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ru.sportplatform.dto.ApiDtos.NotificationDto;
import ru.sportplatform.dto.ApiDtos.SimulateVkCommandRequest;
import ru.sportplatform.dto.ApiDtos.VkStatusDto;
import ru.sportplatform.security.SecurityUtils;
import ru.sportplatform.service.EventService;
import ru.sportplatform.service.NotificationService;
import ru.sportplatform.service.VkIntegrationService;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class NotificationAndVkController {

    private final NotificationService notificationService;
    private final VkIntegrationService vkIntegrationService;
    private final EventService eventService;

    public NotificationAndVkController(
            NotificationService notificationService,
            VkIntegrationService vkIntegrationService,
            EventService eventService
    ) {
        this.notificationService = notificationService;
        this.vkIntegrationService = vkIntegrationService;
        this.eventService = eventService;
    }

    @GetMapping("/notifications")
    public ResponseEntity<List<NotificationDto>> getMyNotifications() {
        UUID userId = SecurityUtils.requireUserId();
        return ResponseEntity.ok(notificationService.getUserNotifications(userId));
    }

    @GetMapping("/notifications/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount() {
        UUID userId = SecurityUtils.requireUserId();
        return ResponseEntity.ok(Map.of("unreadCount", notificationService.getUnreadCount(userId)));
    }

    @PostMapping("/notifications/{notificationId}/read")
    public ResponseEntity<Map<String, String>> markRead(@PathVariable UUID notificationId) {
        UUID userId = SecurityUtils.requireUserId();
        notificationService.markAsRead(userId, notificationId);
        return ResponseEntity.ok(Map.of("status", "ok"));
    }

    @PostMapping("/notifications/read-all")
    public ResponseEntity<Map<String, String>> markAllRead() {
        UUID userId = SecurityUtils.requireUserId();
        notificationService.markAllAsRead(userId);
        return ResponseEntity.ok(Map.of("status", "ok"));
    }

    // --- VK BOT INTEGRATION ---
    @GetMapping("/vk/status")
    public ResponseEntity<VkStatusDto> getVkStatus() {
        UUID userId = SecurityUtils.requireUserId();
        return ResponseEntity.ok(vkIntegrationService.getStatus(userId));
    }

    @PostMapping("/vk/generate-code")
    public ResponseEntity<VkStatusDto> generateVkLinkCode() {
        UUID userId = SecurityUtils.requireUserId();
        return ResponseEntity.ok(vkIntegrationService.generateLinkCode(userId));
    }

    @PostMapping("/vk/unlink")
    public ResponseEntity<VkStatusDto> unlinkVk() {
        UUID userId = SecurityUtils.requireUserId();
        return ResponseEntity.ok(vkIntegrationService.unlinkVk(userId));
    }

    @PostMapping("/vk/toggle-notifications")
    public ResponseEntity<VkStatusDto> toggleVkNotifications(@RequestParam boolean enabled) {
        UUID userId = SecurityUtils.requireUserId();
        return ResponseEntity.ok(vkIntegrationService.toggleVkNotifications(userId, enabled));
    }

    /**
     * Эндпоинт для проверки входящего сообщения VK-боту в локальном режиме TEST_LOG без реального токена VK.
     */
    @PostMapping("/vk/simulate-bot-message")
    public ResponseEntity<Map<String, Object>> simulateIncomingBotMessage(@Valid @RequestBody SimulateVkCommandRequest req) {
        UUID userId = SecurityUtils.requireUserId();
        long simulatedVkId = req.vkUserId() != null && req.vkUserId() > 0
                ? req.vkUserId()
                : Math.abs(userId.getMostSignificantBits() % 900000000L) + 100000000L;
        String botReply = vkIntegrationService.processIncomingBotMessage(simulatedVkId, req.messageText());
        return ResponseEntity.ok(Map.of(
                "vkUserId", simulatedVkId,
                "botReply", botReply,
                "status", vkIntegrationService.getStatus(userId)
        ));
    }

    @PostMapping("/vk/trigger-reminders")
    public ResponseEntity<Map<String, Object>> triggerRemindersNow() {
        SecurityUtils.requirePrincipal();
        int sent = eventService.dispatchUpcomingReminders();
        return ResponseEntity.ok(Map.of("remindersDispatched", sent));
    }
}
