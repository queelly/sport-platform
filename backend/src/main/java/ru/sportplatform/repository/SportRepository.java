package ru.sportplatform.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.sportplatform.domain.entity.Sport;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SportRepository extends JpaRepository<Sport, UUID> {
    Optional<Sport> findByNormalizedName(String normalizedName);
    List<Sport> findByArchivedFalseOrderByNameAsc();
    List<Sport> findAllByOrderByNameAsc();
}
