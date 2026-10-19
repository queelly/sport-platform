package ru.sportplatform.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.sportplatform.domain.entity.SupportChatMessage;

import java.util.List;
import java.util.UUID;

public interface SupportChatMessageRepository extends JpaRepository<SupportChatMessage, UUID> {
    List<SupportChatMessage> findByConversationIdOrderByCreatedAtAsc(UUID conversationId);
}
