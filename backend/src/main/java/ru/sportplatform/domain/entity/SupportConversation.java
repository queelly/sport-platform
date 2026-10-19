package ru.sportplatform.domain.entity;

import jakarta.persistence.*;
import ru.sportplatform.domain.enums.Enums.SupportConversationStatus;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "support_conversations")
public class SupportConversation {

    @Id
    private UUID id;

    @OneToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private SupportConversationStatus status = SupportConversationStatus.ACTIVE;

    @Column(name = "unread_by_user", nullable = false)
    private boolean unreadByUser = false;

    @Column(name = "unread_by_admin", nullable = false)
    private boolean unreadByAdmin = true;

    @Column(name = "last_message_preview", length = 300)
    private String lastMessagePreview;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @PrePersist
    public void prePersist() {
        if (id == null) id = UUID.randomUUID();
        Instant now = Instant.now();
        if (createdAt == null) createdAt = now;
        if (updatedAt == null) updatedAt = now;
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public SupportConversationStatus getStatus() { return status; }
    public void setStatus(SupportConversationStatus status) { this.status = status; }
    public boolean isUnreadByUser() { return unreadByUser; }
    public void setUnreadByUser(boolean unreadByUser) { this.unreadByUser = unreadByUser; }
    public boolean isUnreadByAdmin() { return unreadByAdmin; }
    public void setUnreadByAdmin(boolean unreadByAdmin) { this.unreadByAdmin = unreadByAdmin; }
    public String getLastMessagePreview() { return lastMessagePreview; }
    public void setLastMessagePreview(String lastMessagePreview) { this.lastMessagePreview = lastMessagePreview; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
