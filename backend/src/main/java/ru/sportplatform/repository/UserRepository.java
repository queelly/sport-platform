package ru.sportplatform.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.sportplatform.domain.entity.User;
import ru.sportplatform.domain.enums.Enums.GlobalRole;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmailIgnoreCase(String email);
    boolean existsByEmailIgnoreCase(String email);
    List<User> findByActiveTrueAndShowInPartnerSearchTrueOrderByCreatedAtDesc();
    List<User> findByGlobalRole(GlobalRole role);
}
