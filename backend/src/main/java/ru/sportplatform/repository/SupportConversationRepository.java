package ru.sportplatform.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.sportplatform.domain.entity.SupportConversation;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SupportConversationRepository extends JpaRepository<SupportConversation, UUID> {
    Optional<SupportConversation> findByUserId(UUID userId);
    List<SupportConversation> findAllByOrderByUpdatedAtDesc();
}
