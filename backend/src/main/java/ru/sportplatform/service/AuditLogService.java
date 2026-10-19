package ru.sportplatform.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.sportplatform.domain.entity.ModerationAuditLog;
import ru.sportplatform.domain.entity.User;
import ru.sportplatform.dto.ApiDtos.AuditLogDto;
import ru.sportplatform.repository.ModerationAuditLogRepository;

import java.util.List;
import java.util.UUID;

@Service
public class AuditLogService {

    private final ModerationAuditLogRepository auditLogRepository;

    public AuditLogService(ModerationAuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional
    public void record(User admin, String actionType, String targetType, UUID targetId, String previousState, String newState, String reason) {
        ModerationAuditLog log = new ModerationAuditLog();
        log.setAdmin(admin);
        log.setActionType(actionType);
        log.setTargetType(targetType);
        log.setTargetId(targetId);
        log.setPreviousState(previousState);
        log.setNewState(newState);
        log.setReason(reason);
        auditLogRepository.save(log);
    }

    @Transactional(readOnly = true)
    public List<AuditLogDto> getRecentLogs() {
        return auditLogRepository.findTop100ByOrderByCreatedAtDesc()
                .stream()
                .map(l -> new AuditLogDto(
                        l.getId(),
                        l.getAdmin().getId(),
                        l.getAdmin().getDisplayName(),
                        l.getActionType(),
                        l.getTargetType(),
                        l.getTargetId(),
                        l.getPreviousState(),
                        l.getNewState(),
                        l.getReason(),
                        l.getCreatedAt()
                ))
                .toList();
    }
}
