package ru.sportplatform.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.sportplatform.domain.entity.EventParticipation;
import ru.sportplatform.domain.enums.Enums.ParticipationStatus;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EventParticipationRepository extends JpaRepository<EventParticipation, UUID> {
    Optional<EventParticipation> findByEventIdAndUserId(UUID eventId, UUID userId);
    List<EventParticipation> findByEventIdOrderByCreatedAtAsc(UUID eventId);
    List<EventParticipation> findByEventIdAndStatusOrderByCreatedAtAsc(UUID eventId, ParticipationStatus status);
    long countByEventIdAndStatus(UUID eventId, ParticipationStatus status);
    List<EventParticipation> findByUserIdOrderByCreatedAtDesc(UUID userId);
}
