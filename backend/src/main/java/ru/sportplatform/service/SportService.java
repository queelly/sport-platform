package ru.sportplatform.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.sportplatform.domain.entity.Sport;
import ru.sportplatform.dto.ApiDtos.CreateSportRequest;
import ru.sportplatform.dto.ApiDtos.SportDto;
import ru.sportplatform.exception.ApiException;
import ru.sportplatform.repository.SportRepository;

import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class SportService {

    private final SportRepository sportRepository;

    public SportService(SportRepository sportRepository) {
        this.sportRepository = sportRepository;
    }

    public static String normalizeSportName(String raw) {
        if (raw == null) return "";
        return raw.trim().replaceAll("\\s+", " ").toLowerCase(Locale.ROOT);
    }

    @Transactional(readOnly = true)
    public List<SportDto> listActiveSports() {
        return sportRepository.findByArchivedFalseOrderByNameAsc()
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<SportDto> listAllSports() {
        return sportRepository.findAllByOrderByNameAsc()
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public Sport getOrCreateByName(String rawName, String category, UUID creatorUserId) {
        if (rawName == null || rawName.isBlank()) {
            throw ApiException.badRequest("Название вида спорта не может быть пустым");
        }
        String cleanName = rawName.trim().replaceAll("\\s+", " ");
        String normalized = normalizeSportName(cleanName);

        return sportRepository.findByNormalizedName(normalized)
                .map(existing -> {
                    if (existing.isArchived()) {
                        existing.setArchived(false);
                        return sportRepository.save(existing);
                    }
                    return existing;
                })
                .orElseGet(() -> {
                    Sport created = new Sport();
                    created.setName(capitalizeFirst(cleanName));
                    created.setNormalizedName(normalized);
                    created.setCategory(category != null && !category.isBlank() ? category.trim() : "Пользовательские и новые дисциплины");
                    created.setDescription("Спортивное направление «" + capitalizeFirst(cleanName) + "»");
                    created.setIconName("Trophy");
                    created.setCreatedByUserId(creatorUserId);
                    return sportRepository.save(created);
                });
    }

    @Transactional
    public SportDto createSport(CreateSportRequest req, UUID creatorUserId) {
        Sport sport = getOrCreateByName(req.name(), req.category(), creatorUserId);
        if (req.description() != null && !req.description().isBlank()) {
            sport.setDescription(req.description().trim());
            sport = sportRepository.save(sport);
        }
        return toDto(sport);
    }

    @Transactional
    public SportDto toggleArchive(UUID sportId, boolean archived) {
        Sport sport = sportRepository.findById(sportId)
                .orElseThrow(() -> ApiException.notFound("Вид спорта не найден"));
        sport.setArchived(archived);
        return toDto(sportRepository.save(sport));
    }

    public SportDto toDto(Sport s) {
        return new SportDto(
                s.getId(),
                s.getName(),
                s.getCategory(),
                s.getDescription(),
                s.getIconName(),
                s.isArchived()
        );
    }

    private String capitalizeFirst(String text) {
        if (text.isEmpty()) return text;
        return text.substring(0, 1).toUpperCase(Locale.ROOT) + text.substring(1);
    }
}
