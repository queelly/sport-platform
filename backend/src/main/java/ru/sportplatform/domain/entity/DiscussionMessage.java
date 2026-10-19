package ru.sportplatform.domain.entity;

import jakarta.persistence.*;
import ru.sportplatform.domain.enums.Enums.MessageVisibilityStatus;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "discussion_messages")
public class DiscussionMessage {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "author_user_id", nullable = false)
    private User author;

    @Column(nullable = false, length = 3000)
    private String content;

    @Column(name = "external_video_url", length = 500)
    private String externalVideoUrl;

    @Column(name = "external_link_url", length = 500)
    private String externalLinkUrl;

    @Column(name = "reply_to_message_id")
    private UUID replyToMessageId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private MessageVisibilityStatus status = MessageVisibilityStatus.VISIBLE;

    @Column(name = "moderation_reason", length = 1000)
    private String moderationReason;

    @Column(name = "moderated_by_admin_id")
    private UUID moderatedByAdminId;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "discussion_message_attachments",
            joinColumns = @JoinColumn(name = "message_id"),
            inverseJoinColumns = @JoinColumn(name = "attachment_id")
    )
    private List<Attachment> attachments = new ArrayList<>();

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

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
    public Event getEvent() { return event; }
    public void setEvent(Event event) { this.event = event; }
    public User getAuthor() { return author; }
    public void setAuthor(User author) { this.author = author; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public String getExternalVideoUrl() { return externalVideoUrl; }
    public void setExternalVideoUrl(String externalVideoUrl) { this.externalVideoUrl = externalVideoUrl; }
    public String getExternalLinkUrl() { return externalLinkUrl; }
    public void setExternalLinkUrl(String externalLinkUrl) { this.externalLinkUrl = externalLinkUrl; }
    public UUID getReplyToMessageId() { return replyToMessageId; }
    public void setReplyToMessageId(UUID replyToMessageId) { this.replyToMessageId = replyToMessageId; }
    public MessageVisibilityStatus getStatus() { return status; }
    public void setStatus(MessageVisibilityStatus status) { this.status = status; }
    public String getModerationReason() { return moderationReason; }
    public void setModerationReason(String moderationReason) { this.moderationReason = moderationReason; }
    public UUID getModeratedByAdminId() { return moderatedByAdminId; }
    public void setModeratedByAdminId(UUID moderatedByAdminId) { this.moderatedByAdminId = moderatedByAdminId; }
    public List<Attachment> getAttachments() { return attachments; }
    public void setAttachments(List<Attachment> attachments) { this.attachments = attachments; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
