package ru.sportplatform.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.sportplatform.domain.entity.OrganizationApplicationHistory;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OrganizationApplicationHistoryRepository extends JpaRepository<OrganizationApplicationHistory, UUID> {
    List<OrganizationApplicationHistory> findByOrganizationIdOrderByVersionNumberDesc(UUID organizationId);
    Optional<OrganizationApplicationHistory> findFirstByOrganizationIdOrderByVersionNumberDesc(UUID organizationId);
}
