package ru.sportplatform.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.sportplatform.domain.entity.Event;
import ru.sportplatform.domain.enums.Enums.EventStatus;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EventRepository extends JpaRepository<Event, UUID> {
    List<Event> findByStatusOrderByStartsAtAsc(EventStatus status);
    List<Event> findAllByOrderByStartsAtAsc();
    List<Event> findByOrganizerIdOrderByStartsAtAsc(UUID organizerId);
    List<Event> findByOrganizationIdAndStatusOrderByStartsAtAsc(UUID organizationId, EventStatus status);
    List<Event> findByOrganizationIdOrderByStartsAtAsc(UUID organizationId);
    List<Event> findBySeriesIdOrderByStartsAtAsc(UUID seriesId);
    Optional<Event> findBySeriesIdAndOccurrenceDate(UUID seriesId, LocalDate occurrenceDate);
    List<Event> findByStatusAndStartsAtBetween(EventStatus status, Instant from, Instant to);
}
