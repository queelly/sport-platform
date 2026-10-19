package ru.sportplatform.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.sportplatform.domain.entity.VkAccountLink;

import java.util.Optional;
import java.util.UUID;

public interface VkAccountLinkRepository extends JpaRepository<VkAccountLink, UUID> {
    Optional<VkAccountLink> findByUserId(UUID userId);
    Optional<VkAccountLink> findByLinkCodeIgnoreCase(String linkCode);
    Optional<VkAccountLink> findByVkUserId(Long vkUserId);
}
