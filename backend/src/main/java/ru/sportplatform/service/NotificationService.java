package ru.sportplatform.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.sportplatform.domain.entity.Notification;
import ru.sportplatform.domain.entity.User;
import ru.sportplatform.domain.enums.Enums.NotificationType;
import ru.sportplatform.dto.ApiDtos.NotificationDto;
import ru.sportplatform.exception.ApiException;
import ru.sportplatform.repository.NotificationRepository;

import java.util.List;
import java.util.UUID;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final VkIntegrationService vkIntegrationService;

    public NotificationService(
            NotificationRepository notificationRepository,
            VkIntegrationService vkIntegrationService
    ) {
        this.notificationRepository = notificationRepository;
        this.vkIntegrationService = vkIntegrationService;
    }

    @Transactional
    public Notification notifyUser(User recipient, NotificationType type, String title, String message, String linkUrl) {
        Notification n = new Notification();
        n.setUser(recipient);
        n.setType(type);
        n.setTitle(title);
        n.setMessage(message);
        n.setLinkUrl(linkUrl);

        var vkResult = vkIntegrationService.dispatchNotificationToUser(recipient, title, message);
        n.setVkDeliveryStatus(vkResult.status());
        n.setVkDeliveryDetail(vkResult.detail());

        return notificationRepository.save(n);
    }

    @Transactional(readOnly = true)
    public List<NotificationDto> getUserNotifications(UUID userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(UUID userId) {
        return notificationRepository.countByUserIdAndReadFalse(userId);
    }

    @Transactional
    public void markAsRead(UUID userId, UUID notificationId) {
        Notification n = notificationRepository.findById(notificationId)
                .orElseThrow(() -> ApiException.notFound("Уведомление не найдено"));
        if (!n.getUser().getId().equals(userId)) {
            throw ApiException.forbidden("Нельзя изменить статус чужого уведомления");
        }
        n.setRead(true);
        notificationRepository.save(n);
    }

    @Transactional
    public void markAllAsRead(UUID userId) {
        List<Notification> list = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
        for (Notification n : list) {
            if (!n.isRead()) {
                n.setRead(true);
            }
        }
        notificationRepository.saveAll(list);
    }

    private NotificationDto toDto(Notification n) {
        return new NotificationDto(
                n.getId(),
                n.getType(),
                n.getTitle(),
                n.getMessage(),
                n.getLinkUrl(),
                n.isRead(),
                n.getVkDeliveryStatus(),
                n.getVkDeliveryDetail(),
                n.getCreatedAt()
        );
    }
}
