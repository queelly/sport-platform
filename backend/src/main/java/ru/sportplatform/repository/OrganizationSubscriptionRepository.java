package ru.sportplatform.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.sportplatform.domain.entity.OrganizationSubscription;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OrganizationSubscriptionRepository extends JpaRepository<OrganizationSubscription, UUID> {
    Optional<OrganizationSubscription> findByOrganizationIdAndUserId(UUID organizationId, UUID userId);
    boolean existsByOrganizationIdAndUserId(UUID organizationId, UUID userId);
    long countByOrganizationId(UUID organizationId);
    List<OrganizationSubscription> findByOrganizationId(UUID organizationId);
    List<OrganizationSubscription> findByUserId(UUID userId);
}
