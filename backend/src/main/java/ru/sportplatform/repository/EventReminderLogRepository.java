package ru.sportplatform.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.sportplatform.domain.entity.EventReminderLog;

import java.time.Instant;
import java.util.UUID;

public interface EventReminderLogRepository extends JpaRepository<EventReminderLog, UUID> {
    boolean existsByEventIdAndUserIdAndReminderTypeAndEventStartsAt(
            UUID eventId, UUID userId, String reminderType, Instant eventStartsAt);
}
