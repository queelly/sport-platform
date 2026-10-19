package ru.sportplatform.domain.entity;

import jakarta.persistence.*;
import ru.sportplatform.domain.enums.Enums.NotificationType;
import ru.sportplatform.domain.enums.Enums.VkDeliveryStatus;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "notifications")
public class Notification {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 60)
    private NotificationType type;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, length = 1500)
    private String message;

    @Column(name = "link_url", length = 300)
    private String linkUrl;

    @Column(name = "is_read", nullable = false)
    private boolean read = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "vk_delivery_status", nullable = false, length = 40)
    private VkDeliveryStatus vkDeliveryStatus = VkDeliveryStatus.NOT_APPLICABLE;

    @Column(name = "vk_delivery_detail", length = 500)
    private String vkDeliveryDetail;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @PrePersist
    public void prePersist() {
        if (id == null) id = UUID.randomUUID();
        if (createdAt == null) createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public NotificationType getType() { return type; }
    public void setType(NotificationType type) { this.type = type; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getLinkUrl() { return linkUrl; }
    public void setLinkUrl(String linkUrl) { this.linkUrl = linkUrl; }
    public boolean isRead() { return read; }
    public void setRead(boolean read) { this.read = read; }
    public VkDeliveryStatus getVkDeliveryStatus() { return vkDeliveryStatus; }
    public void setVkDeliveryStatus(VkDeliveryStatus vkDeliveryStatus) { this.vkDeliveryStatus = vkDeliveryStatus; }
    public String getVkDeliveryDetail() { return vkDeliveryDetail; }
    public void setVkDeliveryDetail(String vkDeliveryDetail) { this.vkDeliveryDetail = vkDeliveryDetail; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
