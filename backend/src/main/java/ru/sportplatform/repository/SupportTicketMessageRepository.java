package ru.sportplatform.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.sportplatform.domain.entity.SupportTicketMessage;

import java.util.List;
import java.util.UUID;

public interface SupportTicketMessageRepository extends JpaRepository<SupportTicketMessage, UUID> {
    List<SupportTicketMessage> findByTicketIdOrderByCreatedAtAsc(UUID ticketId);
}
