package ru.sportplatform.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import ru.sportplatform.domain.entity.DirectMessage;

import java.util.List;
import java.util.UUID;

public interface DirectMessageRepository extends JpaRepository<DirectMessage, UUID> {

    @Query("""
            SELECT m FROM DirectMessage m
            WHERE (m.sender.id = :u1 AND m.recipient.id = :u2)
               OR (m.sender.id = :u2 AND m.recipient.id = :u1)
            ORDER BY m.createdAt ASC
            """)
    List<DirectMessage> findConversationBetween(@Param("u1") UUID u1, @Param("u2") UUID u2);

    long countBySenderIdAndRecipientIdAndReadFalse(UUID senderId, UUID recipientId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            UPDATE DirectMessage m
            SET m.read = true
            WHERE m.sender.id = :senderId AND m.recipient.id = :recipientId AND m.read = false
            """)
    void markMessagesAsRead(@Param("senderId") UUID senderId, @Param("recipientId") UUID recipientId);
}
