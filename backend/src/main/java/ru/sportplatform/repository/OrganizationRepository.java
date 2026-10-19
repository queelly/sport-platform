package ru.sportplatform.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.sportplatform.domain.entity.Organization;
import ru.sportplatform.domain.enums.Enums.OrganizationStatus;

import java.util.List;
import java.util.UUID;

public interface OrganizationRepository extends JpaRepository<Organization, UUID> {
    List<Organization> findByOwnerIdOrderByCreatedAtDesc(UUID ownerId);
    List<Organization> findByStatusOrderByCreatedAtAsc(OrganizationStatus status);
    List<Organization> findAllByOrderByUpdatedAtDesc();
}
