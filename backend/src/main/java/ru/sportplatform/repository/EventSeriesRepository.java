package ru.sportplatform.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.sportplatform.domain.entity.EventSeries;

import java.util.List;
import java.util.UUID;

public interface EventSeriesRepository extends JpaRepository<EventSeries, UUID> {
    List<EventSeries> findByActiveTrue();
    List<EventSeries> findByOrganizerIdOrderByCreatedAtDesc(UUID organizerId);
}
