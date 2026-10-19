package ru.sportplatform.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.sportplatform.domain.entity.ModerationAuditLog;

import java.util.List;
import java.util.UUID;

public interface ModerationAuditLogRepository extends JpaRepository<ModerationAuditLog, UUID> {
    List<ModerationAuditLog> findTop100ByOrderByCreatedAtDesc();
    List<ModerationAuditLog> findByTargetTypeAndTargetIdOrderByCreatedAtDesc(String targetType, UUID targetId);
}
