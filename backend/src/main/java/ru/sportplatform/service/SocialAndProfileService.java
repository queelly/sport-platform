package ru.sportplatform.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.sportplatform.domain.entity.DirectMessage;
import ru.sportplatform.domain.entity.Friendship;
import ru.sportplatform.domain.entity.Sport;
import ru.sportplatform.domain.entity.User;
import ru.sportplatform.domain.entity.UserSportInterest;
import ru.sportplatform.domain.enums.Enums.*;
import ru.sportplatform.dto.ApiDtos.*;
import ru.sportplatform.exception.ApiException;
import ru.sportplatform.repository.DirectMessageRepository;
import ru.sportplatform.repository.FriendshipRepository;
import ru.sportplatform.repository.SportRepository;
import ru.sportplatform.repository.UserRepository;
import ru.sportplatform.repository.UserSportInterestRepository;
import ru.sportplatform.security.UserPrincipal;

import java.time.Instant;
import java.util.*;

@Service
public class SocialAndProfileService {

    private final UserRepository userRepository;
    private final SportRepository sportRepository;
    private final UserSportInterestRepository sportInterestRepository;
    private final FriendshipRepository friendshipRepository;
    private final DirectMessageRepository directMessageRepository;
    private final EventService eventService;
    private final AuthService authService;
    private final NotificationService notificationService;

    public SocialAndProfileService(
            UserRepository userRepository,
            SportRepository sportRepository,
            UserSportInterestRepository sportInterestRepository,
            FriendshipRepository friendshipRepository,
            DirectMessageRepository directMessageRepository,
            EventService eventService,
            AuthService authService,
            NotificationService notificationService
    ) {
        this.userRepository = userRepository;
        this.sportRepository = sportRepository;
        this.sportInterestRepository = sportInterestRepository;
        this.friendshipRepository = friendshipRepository;
        this.directMessageRepository = directMessageRepository;
        this.eventService = eventService;
        this.authService = authService;
        this.notificationService = notificationService;
    }

    @Transactional
    public UserSummaryDto updateMyProfile(UUID userId, UpdateProfileRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.unauthorized("Пользователь не найден"));

        user.setDisplayName(req.displayName().trim());
        user.setCity(req.city() != null ? req.city().trim() : null);
        user.setDistrict(req.district() != null ? req.district().trim() : null);
        user.setBio(req.bio() != null ? req.bio().trim() : null);
        if (req.avatarAttachmentId() != null) {
            user.setAvatarAttachmentId(req.avatarAttachmentId());
        }
        user.setPreferredFormats(req.preferredFormats());
        user.setPreferredSchedule(req.preferredSchedule());
        user.setShowInPartnerSearch(req.showInPartnerSearch());
        if (req.showUpcomingEvents() != null) {
            user.setShowUpcomingEvents(req.showUpcomingEvents());
        }
        if (req.showFriendsList() != null) {
            user.setShowFriendsList(req.showFriendsList());
        }
        user.setNotifyInApp(req.notifyInApp());
        user.setNotifyVk(req.notifyVk());
        user = userRepository.save(user);

        if (req.sportInterests() != null) {
            sportInterestRepository.deleteByUserId(userId);
            sportInterestRepository.flush();
            Set<UUID> seenSports = new HashSet<>();
            for (SportInterestUpdateItem item : req.sportInterests()) {
                if (item.sportId() == null || !seenSports.add(item.sportId())) continue;
                Sport sport = sportRepository.findById(item.sportId()).orElse(null);
                if (sport != null) {
                    UserSportInterest interest = new UserSportInterest();
                    interest.setUser(user);
                    interest.setSport(sport);
                    interest.setSkillLevel(item.skillLevel() != null ? item.skillLevel() : SkillLevel.AMATEUR);
                    interest.setPrimarySport(item.primarySport());
                    interest.setWantToTryNew(item.wantToTryNew());
                    interest.setNote(item.note());
                    sportInterestRepository.save(interest);
                }
            }
        }

        return authService.toUserSummary(user);
    }

    @Transactional(readOnly = true)
    public PublicUserProfileDto getPublicProfile(UUID targetUserId, UserPrincipal viewer) {
        User target = userRepository.findById(targetUserId)
                .orElseThrow(() -> ApiException.notFound("Профиль пользователя не найден"));

        return buildPublicProfileDto(target, viewer, null, null);
    }

    @Transactional(readOnly = true)
    public List<PublicUserProfileDto> listActiveUsersDirectory(String query, UserPrincipal viewer) {
        return userRepository.findAll().stream()
                .filter(User::isActive)
                .filter(u -> viewer == null || !u.getId().equals(viewer.id()))
                .filter(u -> query == null || query.isBlank() || EventService.fuzzyTextMatches(query, u.getDisplayName(), u.getEmail(), u.getCity()))
                .limit(50)
                .map(u -> buildPublicProfileDto(u, viewer, null, null))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PublicUserProfileDto> searchSportPartners(
            UUID sportId,
            String city,
            SkillLevel skillLevel,
            String query,
            UserPrincipal viewer
    ) {
        List<User> candidates = userRepository.findByActiveTrueAndShowInPartnerSearchTrueOrderByCreatedAtDesc();
        return candidates.stream()
                .filter(u -> viewer == null || !u.getId().equals(viewer.id()))
                .filter(u -> city == null || city.isBlank() || EventService.fuzzyCityMatches(city, u.getCity()))
                .map(u -> buildPublicProfileDto(u, viewer, sportId, skillLevel))
                .filter(dto -> {
                    if (query != null && !query.isBlank()) {
                        String sportsCombined = dto.sportInterests().stream()
                                .map(SportInterestItemDto::sportName)
                                .reduce("", (a, b) -> a + " " + b);
                        boolean textMatch = EventService.fuzzyTextMatches(
                                query,
                                dto.displayName(),
                                dto.bio(),
                                dto.preferredFormats(),
                                dto.city(),
                                dto.district(),
                                sportsCombined
                        );
                        if (!textMatch) return false;
                    }
                    if (sportId == null && skillLevel == null) return true;
                    return dto.sportInterests().stream().anyMatch(si ->
                            (sportId == null || si.sportId().equals(sportId))
                                    && (skillLevel == null || si.skillLevel() == skillLevel || skillLevel == SkillLevel.ANY)
                    );
                })
                .toList();
    }

    // --- СИСТЕМА ЗНАКОМЫХ (FRIENDSHIPS) ---

    @Transactional
    public FriendshipDto sendFriendRequest(UUID currentUserId, SendFriendRequestDto req) {
        if (currentUserId.equals(req.targetUserId())) {
            throw ApiException.badRequest("Нельзя добавить в спортивные знакомые самого себя");
        }
        User requester = userRepository.findById(currentUserId)
                .orElseThrow(() -> ApiException.unauthorized("Пользователь не найден"));
        User addressee = userRepository.findById(req.targetUserId())
                .orElseThrow(() -> ApiException.notFound("Пользователь не найден"));

        List<Friendship> existingBetween = friendshipRepository.findBetweenUsers(currentUserId, req.targetUserId());
        for (Friendship f : existingBetween) {
            if (f.getStatus() == FriendshipStatus.ACCEPTED) {
                throw ApiException.conflict("Вы уже состоите в списке спортивных знакомых");
            }
            if (f.getStatus() == FriendshipStatus.PENDING) {
                if (f.getRequester().getId().equals(currentUserId)) {
                    throw ApiException.conflict("Вы уже отправили запрос этому пользователю. Он ожидает подтверждения.");
                } else {
                    // Встречный запрос автоматически подтверждает знакомство
                    f.setStatus(FriendshipStatus.ACCEPTED);
                    f = friendshipRepository.save(f);
                    notificationService.notifyUser(
                            f.getRequester(),
                            NotificationType.FRIEND_REQUEST_ACCEPTED,
                            userDisplayName(requester) + " принял(а) запрос на знакомство",
                            "Теперь вы в списке спортивных знакомых друг у друга!",
                            "/friends"
                    );
                    return toFriendshipDto(f, currentUserId);
                }
            }
        }

        // Если ранее был REJECTED или CANCELLED между этими же requester -> addressee, переиспользуем запись
        Friendship f = friendshipRepository.findByRequesterIdAndAddresseeId(currentUserId, req.targetUserId())
                .orElseGet(() -> {
                    Friendship created = new Friendship();
                    created.setRequester(requester);
                    created.setAddressee(addressee);
                    return created;
                });

        f.setStatus(FriendshipStatus.PENDING);
        f.setMessage(req.message());
        f = friendshipRepository.save(f);

        notificationService.notifyUser(
                addressee,
                NotificationType.FRIEND_REQUEST_RECEIVED,
                "Новый запрос в спортивные знакомые",
                requester.getDisplayName() + " хочет добавить вас в спортивные знакомые."
                        + (req.message() != null && !req.message().isBlank() ? " Сообщение: «" + req.message() + "»" : ""),
                "/friends"
        );

        return toFriendshipDto(f, currentUserId);
    }

    @Transactional
    public FriendshipDto respondToFriendRequest(UUID currentUserId, UUID friendshipId, boolean accept) {
        Friendship f = friendshipRepository.findById(friendshipId)
                .orElseThrow(() -> ApiException.notFound("Запрос на знакомство не найден"));

        if (!f.getAddressee().getId().equals(currentUserId)) {
            throw ApiException.forbidden("Принять или отклонить запрос может только его получатель");
        }
        if (f.getStatus() != FriendshipStatus.PENDING) {
            throw ApiException.conflict("Запрос уже обработан (текущий статус: " + f.getStatus() + ")");
        }

        f.setStatus(accept ? FriendshipStatus.ACCEPTED : FriendshipStatus.REJECTED);
        f = friendshipRepository.save(f);

        if (accept) {
            notificationService.notifyUser(
                    f.getRequester(),
                    NotificationType.FRIEND_REQUEST_ACCEPTED,
                    f.getAddressee().getDisplayName() + " принял(а) ваш запрос на знакомство!",
                    "Теперь вы в списке спортивных знакомых.",
                    "/friends"
            );
        }

        return toFriendshipDto(f, currentUserId);
    }

    @Transactional
    public void cancelOrRemoveFriendship(UUID currentUserId, UUID friendshipId) {
        Friendship f = friendshipRepository.findById(friendshipId)
                .orElseThrow(() -> ApiException.notFound("Запись знакомства не найдена"));

        if (!f.getRequester().getId().equals(currentUserId) && !f.getAddressee().getId().equals(currentUserId)) {
            throw ApiException.forbidden("Вы не можете изменять чужие связи знакомств");
        }

        if (f.getStatus() == FriendshipStatus.PENDING && f.getRequester().getId().equals(currentUserId)) {
            f.setStatus(FriendshipStatus.CANCELLED);
            friendshipRepository.save(f);
        } else {
            friendshipRepository.delete(f);
        }
    }

    @Transactional(readOnly = true)
    public List<FriendshipDto> listMyFriendships(UUID currentUserId) {
        return friendshipRepository.findAllInvolvingUser(currentUserId)
                .stream()
                .filter(f -> f.getStatus() == FriendshipStatus.ACCEPTED || f.getStatus() == FriendshipStatus.PENDING)
                .map(f -> toFriendshipDto(f, currentUserId))
                .toList();
    }

    @Transactional
    public List<DirectMessageDto> listDirectMessages(UUID currentUserId, UUID friendUserId) {
        ensureAcceptedFriendship(currentUserId, friendUserId);
        directMessageRepository.markMessagesAsRead(friendUserId, currentUserId);
        return directMessageRepository.findConversationBetween(currentUserId, friendUserId)
                .stream()
                .map(this::toDirectMessageDto)
                .toList();
    }

    @Transactional
    public DirectMessageDto sendDirectMessage(UUID currentUserId, UUID friendUserId, SendDirectMessageRequest req) {
        if (currentUserId.equals(friendUserId)) {
            throw ApiException.badRequest("Нельзя отправить сообщение самому себе");
        }
        ensureAcceptedFriendship(currentUserId, friendUserId);

        User sender = userRepository.findById(currentUserId)
                .orElseThrow(() -> ApiException.unauthorized("Пользователь не найден"));
        User recipient = userRepository.findById(friendUserId)
                .orElseThrow(() -> ApiException.notFound("Получатель не найден"));

        DirectMessage msg = new DirectMessage();
        msg.setSender(sender);
        msg.setRecipient(recipient);
        msg.setContent(req.content().trim());
        msg.setRead(false);
        msg = directMessageRepository.save(msg);

        return toDirectMessageDto(msg);
    }

    private void ensureAcceptedFriendship(UUID u1, UUID u2) {
        boolean accepted = friendshipRepository.findBetweenUsers(u1, u2)
                .stream()
                .anyMatch(f -> f.getStatus() == FriendshipStatus.ACCEPTED);
        if (!accepted) {
            throw ApiException.forbidden("Личные сообщения доступны только между подтверждёнными спортивными знакомыми (друзьями)");
        }
    }

    private DirectMessageDto toDirectMessageDto(DirectMessage m) {
        String avatar = m.getSender().getAvatarAttachmentId() != null
                ? "/api/v1/attachments/" + m.getSender().getAvatarAttachmentId() + "/content"
                : null;
        return new DirectMessageDto(
                m.getId(),
                m.getSender().getId(),
                m.getSender().getDisplayName(),
                avatar,
                m.getRecipient().getId(),
                m.getContent(),
                m.isRead(),
                m.getCreatedAt()
        );
    }

    private PublicUserProfileDto buildPublicProfileDto(User target, UserPrincipal viewer, UUID filterSportId, SkillLevel filterSkill) {
        List<UserSportInterest> interests = sportInterestRepository.findByUserId(target.getId());
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

        String friendshipStatus = "NONE";
        UUID friendshipId = null;
        boolean incoming = false;
        boolean isFriend = false;
        boolean isSelf = viewer != null && viewer.id().equals(target.getId());

        if (viewer != null && !isSelf) {
            List<Friendship> between = friendshipRepository.findBetweenUsers(viewer.id(), target.getId());
            for (Friendship f : between) {
                if (f.getStatus() == FriendshipStatus.ACCEPTED) {
                    friendshipStatus = "ACCEPTED";
                    friendshipId = f.getId();
                    isFriend = true;
                    break;
                } else if (f.getStatus() == FriendshipStatus.PENDING) {
                    friendshipStatus = "PENDING";
                    friendshipId = f.getId();
                    incoming = f.getAddressee().getId().equals(viewer.id());
                }
            }
        }

        boolean canSeeUpcoming = isSelf
                || target.getShowUpcomingEvents() == VisibilityScope.ALL
                || (target.getShowUpcomingEvents() == VisibilityScope.FRIENDS_ONLY && isFriend);

        Instant now = java.time.Instant.now();
        UserPrincipal targetPrincipal = new UserPrincipal(target.getId(), target.getEmail(), target.getDisplayName(), target.getGlobalRole());
        List<EventCardDto> organized = eventService.listMyOrganizedEvents(targetPrincipal)
                .stream()
                .filter(e -> e.status() == EventStatus.PUBLISHED && !e.startsAt().isBefore(now))
                .limit(6)
                .toList();

        List<EventCardDto> upcomingParticipations = canSeeUpcoming
                ? eventService.listMyParticipations(targetPrincipal)
                .stream()
                .filter(e -> e.status() == EventStatus.PUBLISHED && !e.startsAt().isBefore(now))
                .limit(6)
                .toList()
                : List.of();

        int friendsCount = (int) friendshipRepository.findAllInvolvingUser(target.getId())
                .stream()
                .filter(f -> f.getStatus() == FriendshipStatus.ACCEPTED)
                .count();

        Set<UUID> viewerSportIds = new HashSet<>();
        if (viewer != null && !isSelf) {
            sportInterestRepository.findByUserId(viewer.id())
                    .forEach(vi -> viewerSportIds.add(vi.getSport().getId()));
        }

        List<String> matchReasons = new ArrayList<>();
        if (target.getCity() != null && !target.getCity().isBlank()) {
            matchReasons.add("Город: " + target.getCity());
        }
        for (SportInterestItemDto si : sportDtos) {
            if (viewerSportIds.contains(si.sportId())) {
                matchReasons.add("Общий спорт: " + si.sportName());
            } else if (filterSportId != null && si.sportId().equals(filterSportId)) {
                matchReasons.add("Совпадение по спорту: " + si.sportName());
            } else if (si.primarySport()) {
                matchReasons.add("Основной спорт: " + si.sportName());
            }
        }
        if (filterSkill != null) {
            matchReasons.add("Подходящий уровень подготовки");
        }

        String avatarUrl = target.getAvatarAttachmentId() != null
                ? "/api/v1/attachments/" + target.getAvatarAttachmentId() + "/content"
                : null;

        return new PublicUserProfileDto(
                target.getId(),
                target.getDisplayName(),
                target.getCity(),
                target.getDistrict(),
                target.getBio(),
                avatarUrl,
                target.getPreferredFormats(),
                target.getPreferredSchedule(),
                sportDtos,
                organized,
                upcomingParticipations,
                friendsCount,
                friendshipStatus,
                friendshipId,
                incoming,
                matchReasons,
                target.getCreatedAt()
        );
    }

    private FriendshipDto toFriendshipDto(Friendship f, UUID viewerId) {
        boolean incoming = f.getAddressee().getId().equals(viewerId);
        User other = incoming ? f.getRequester() : f.getAddressee();
        List<SportInterestItemDto> sports = sportInterestRepository.findByUserId(other.getId())
                .stream()
                .map(i -> new SportInterestItemDto(
                        i.getSport().getId(),
                        i.getSport().getName(),
                        i.getSkillLevel(),
                        i.isPrimarySport(),
                        i.isWantToTryNew(),
                        i.getNote()
                ))
                .toList();

        String avatarUrl = other.getAvatarAttachmentId() != null
                ? "/api/v1/attachments/" + other.getAvatarAttachmentId() + "/content"
                : null;

        long unreadMessagesCount = f.getStatus() == FriendshipStatus.ACCEPTED
                ? directMessageRepository.countBySenderIdAndRecipientIdAndReadFalse(other.getId(), viewerId)
                : 0L;

        return new FriendshipDto(
                f.getId(),
                other.getId(),
                other.getDisplayName(),
                avatarUrl,
                other.getCity(),
                sports,
                f.getStatus(),
                incoming,
                f.getMessage(),
                unreadMessagesCount,
                f.getCreatedAt(),
                f.getUpdatedAt()
        );
    }

    private String userDisplayName(User u) {
        return u.getDisplayName();
    }
}
