package ru.sportplatform.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.sportplatform.domain.entity.DiscussionMessage;

import java.util.List;
import java.util.UUID;

public interface DiscussionMessageRepository extends JpaRepository<DiscussionMessage, UUID> {
    List<DiscussionMessage> findByEventIdOrderByCreatedAtAsc(UUID eventId);
}
