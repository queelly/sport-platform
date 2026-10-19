package ru.sportplatform.domain.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "event_reminder_logs")
public class EventReminderLog {

    @Id
    private UUID id;

    @Column(name = "event_id", nullable = false)
    private UUID eventId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "reminder_type", nullable = false, length = 40)
    private String reminderType; // BEFORE_24H, BEFORE_2H

    @Column(name = "event_starts_at", nullable = false)
    private Instant eventStartsAt;

    @Column(name = "sent_at", nullable = false)
    private Instant sentAt;

    @PrePersist
    public void prePersist() {
        if (id == null) id = UUID.randomUUID();
        if (sentAt == null) sentAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getEventId() { return eventId; }
    public void setEventId(UUID eventId) { this.eventId = eventId; }
    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }
    public String getReminderType() { return reminderType; }
    public void setReminderType(String reminderType) { this.reminderType = reminderType; }
    public Instant getEventStartsAt() { return eventStartsAt; }
    public void setEventStartsAt(Instant eventStartsAt) { this.eventStartsAt = eventStartsAt; }
    public Instant getSentAt() { return sentAt; }
    public void setSentAt(Instant sentAt) { this.sentAt = sentAt; }
}
