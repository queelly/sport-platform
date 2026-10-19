package ru.sportplatform.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.sportplatform.domain.entity.RefreshSession;
import ru.sportplatform.domain.entity.User;
import ru.sportplatform.domain.entity.UserSportInterest;
import ru.sportplatform.domain.enums.Enums.GlobalRole;
import ru.sportplatform.dto.ApiDtos.*;
import ru.sportplatform.exception.ApiException;
import ru.sportplatform.repository.RefreshSessionRepository;
import ru.sportplatform.repository.UserRepository;
import ru.sportplatform.repository.UserSportInterestRepository;
import ru.sportplatform.security.JwtService;
import ru.sportplatform.security.UserPrincipal;

import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final UserSportInterestRepository sportInterestRepository;
    private final RefreshSessionRepository refreshSessionRepository;
    private final OrganizationService organizationService;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(
            UserRepository userRepository,
            UserSportInterestRepository sportInterestRepository,
            RefreshSessionRepository refreshSessionRepository,
            OrganizationService organizationService,
            PasswordEncoder passwordEncoder,
            JwtService jwtService
    ) {
        this.userRepository = userRepository;
        this.sportInterestRepository = sportInterestRepository;
        this.refreshSessionRepository = refreshSessionRepository;
        this.organizationService = organizationService;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponse registerUser(RegisterUserRequest req) {
        String normalizedEmail = req.email().trim().toLowerCase(Locale.ROOT);
        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw ApiException.conflict("Пользователь с таким email уже зарегистрирован");
        }

        User user = new User();
        user.setEmail(normalizedEmail);
        user.setDisplayName(req.displayName().trim());
        user.setPasswordHash(passwordEncoder.encode(req.password()));
        user.setGlobalRole(GlobalRole.USER); // Никогда не ADMIN при открытой регистрации
        user.setCity(req.city() != null && !req.city().isBlank() ? req.city().trim() : "Москва");
        user.setTermsAccepted(req.termsAccepted());
        user = userRepository.save(user);

        return issueTokensForUser(user);
    }

    @Transactional
    public AuthResponse registerOrganization(RegisterOrganizationRequest req) {
        String normalizedEmail = req.email().trim().toLowerCase(Locale.ROOT);
        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw ApiException.conflict("Учётная запись с таким email уже существует. Войдите в аккаунт или используйте другой email.");
        }

        User owner = new User();
        owner.setEmail(normalizedEmail);
        owner.setDisplayName(req.representativeName().trim());
        owner.setPasswordHash(passwordEncoder.encode(req.password()));
        owner.setGlobalRole(GlobalRole.USER);
        owner.setCity(req.city().trim());
        owner.setBio("Представитель спортивной организации «" + req.organizationName().trim() + "»");
        owner.setTermsAccepted(req.termsAccepted());
        owner = userRepository.save(owner);

        organizationService.createInitialOrganization(owner, req);

        return issueTokensForUser(owner);
    }

    @Transactional
    public AuthResponse login(LoginRequest req) {
        String normalizedEmail = req.email().trim().toLowerCase(Locale.ROOT);
        User user = userRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> ApiException.unauthorized("Неверный email или пароль"));

        if (!user.isActive()) {
            throw ApiException.forbidden("Учётная запись деактивирована");
        }

        if (!passwordEncoder.matches(req.password(), user.getPasswordHash())) {
            throw ApiException.unauthorized("Неверный email или пароль");
        }

        return issueTokensForUser(user);
    }

    @Transactional
    public AuthResponse refresh(String rawRefreshToken) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            throw ApiException.unauthorized("Отсутствует refresh token");
        }
        String hash = jwtService.hashRefreshToken(rawRefreshToken);
        RefreshSession session = refreshSessionRepository.findByTokenHash(hash)
                .orElseThrow(() -> ApiException.unauthorized("Сессия недействительна"));

        if (session.isRevoked()) {
            // Защита от повторного использования уже отозванного refresh-токена
            refreshSessionRepository.revokeAllByUserId(session.getUser().getId());
            throw ApiException.unauthorized("Обнаружено повторное использование отозванного токена. Все сессии сброшены.");
        }

        if (session.getExpiresAt().isBefore(Instant.now())) {
            session.setRevoked(true);
            refreshSessionRepository.save(session);
            throw ApiException.unauthorized("Срок действия сессии истёк. Выполните вход заново.");
        }

        session.setRevoked(true);
        refreshSessionRepository.save(session);

        return issueTokensForUser(session.getUser());
    }

    @Transactional
    public void logout(String rawRefreshToken, UUID currentUserId) {
        if (rawRefreshToken != null && !rawRefreshToken.isBlank()) {
            String hash = jwtService.hashRefreshToken(rawRefreshToken);
            refreshSessionRepository.findByTokenHash(hash).ifPresent(s -> {
                s.setRevoked(true);
                refreshSessionRepository.save(s);
            });
        } else if (currentUserId != null) {
            refreshSessionRepository.revokeAllByUserId(currentUserId);
        }
    }

    @Transactional(readOnly = true)
    public AuthResponse getCurrentSessionInfo(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.unauthorized("Пользователь не найден"));
        UserPrincipal principal = new UserPrincipal(user.getId(), user.getEmail(), user.getDisplayName(), user.getGlobalRole());
        return new AuthResponse(
                jwtService.generateAccessToken(user),
                null,
                toUserSummary(user),
                organizationService.listMyOrganizations(principal)
        );
    }

    public UserSummaryDto toUserSummary(User user) {
        List<UserSportInterest> interests = sportInterestRepository.findByUserId(user.getId());
        List<SportInterestItemDto> sportDtos = interests.stream()
                .map(i -> new SportInterestItemDto(
                        i.getSport().getId(),
                        i.getSport().getName(),
                        i.getSkillLevel(),
                        i.isPrimarySport(),
                        i.isWantToTryNew(),
                        i.getNote()
                ))
                .toList();

        String avatarUrl = user.getAvatarAttachmentId() != null
                ? "/api/v1/attachments/" + user.getAvatarAttachmentId() + "/content"
                : null;

        return new UserSummaryDto(
                user.getId(),
                user.getEmail(),
                user.getDisplayName(),
                user.getGlobalRole(),
                user.getCity(),
                user.getDistrict(),
                user.getBio(),
                avatarUrl,
                user.getPreferredFormats(),
                user.getPreferredSchedule(),
                user.isShowInPartnerSearch(),
                user.getShowUpcomingEvents(),
                user.getShowFriendsList(),
                user.isNotifyInApp(),
                user.isNotifyVk(),
                sportDtos,
                user.getCreatedAt()
        );
    }

    private AuthResponse issueTokensForUser(User user) {
        String accessToken = jwtService.generateAccessToken(user);
        String rawRefresh = jwtService.generateRawRefreshToken();

        RefreshSession session = new RefreshSession();
        session.setUser(user);
        session.setTokenHash(jwtService.hashRefreshToken(rawRefresh));
        session.setExpiresAt(jwtService.calculateRefreshExpiry());
        refreshSessionRepository.save(session);

        UserPrincipal principal = new UserPrincipal(user.getId(), user.getEmail(), user.getDisplayName(), user.getGlobalRole());
        return new AuthResponse(
                accessToken,
                rawRefresh,
                toUserSummary(user),
                organizationService.listMyOrganizations(principal)
        );
    }
}
