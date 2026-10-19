package ru.sportplatform.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.sportplatform.domain.entity.SupportTicket;

import java.util.List;
import java.util.UUID;

public interface SupportTicketRepository extends JpaRepository<SupportTicket, UUID> {
    List<SupportTicket> findByAuthorIdOrderByUpdatedAtDesc(UUID authorId);
    List<SupportTicket> findAllByOrderByUpdatedAtDesc();
}
