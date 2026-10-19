package ru.sportplatform.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.sportplatform.domain.entity.UserSportInterest;

import java.util.List;
import java.util.UUID;

public interface UserSportInterestRepository extends JpaRepository<UserSportInterest, UUID> {
    List<UserSportInterest> findByUserId(UUID userId);
    void deleteByUserId(UUID userId);
}
