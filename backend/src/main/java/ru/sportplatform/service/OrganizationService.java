package ru.sportplatform.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.sportplatform.domain.entity.*;
import ru.sportplatform.domain.enums.Enums.NotificationType;
import ru.sportplatform.domain.enums.Enums.OrganizationStatus;
import ru.sportplatform.domain.enums.Enums.OrganizationType;
import ru.sportplatform.dto.ApiDtos.*;
import ru.sportplatform.exception.ApiException;
import ru.sportplatform.repository.*;
import ru.sportplatform.security.UserPrincipal;

import java.time.Instant;
import java.util.*;

@Service
public class OrganizationService {

    private final OrganizationRepository organizationRepository;
    private final OrganizationApplicationHistoryRepository historyRepository;
    private final OrganizationSubscriptionRepository subscriptionRepository;
    private final EventRepository eventRepository;
    private final EventSeriesRepository seriesRepository;
    private final UserRepository userRepository;
    private final SportRepository sportRepository;
    private final SportService sportService;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;
    private final ObjectMapper objectMapper;

    public OrganizationService(
            OrganizationRepository organizationRepository,
            OrganizationApplicationHistoryRepository historyRepository,
            OrganizationSubscriptionRepository subscriptionRepository,
            EventRepository eventRepository,
            EventSeriesRepository seriesRepository,
            UserRepository userRepository,
            SportRepository sportRepository,
            SportService sportService,
            NotificationService notificationService,
            AuditLogService auditLogService,
            ObjectMapper objectMapper
    ) {
        this.organizationRepository = organizationRepository;
        this.historyRepository = historyRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.eventRepository = eventRepository;
        this.seriesRepository = seriesRepository;
        this.userRepository = userRepository;
        this.sportRepository = sportRepository;
        this.sportService = sportService;
        this.notificationService = notificationService;
        this.auditLogService = auditLogService;
        this.objectMapper = objectMapper;
    }

    public boolean canManageOrganization(Organization org, UUID userId) {
        if (org == null || userId == null) return false;
        if (org.getOwner().getId().equals(userId)) return true;
        return subscriptionRepository.findByOrganizationIdAndUserId(org.getId(), userId)
                .map(sub -> "ADMIN".equalsIgnoreCase(sub.getMemberRole()))
                .orElse(false);
    }

    @Transactional
    public Organization createInitialOrganization(User owner, RegisterOrganizationRequest req) {
        String orgName = req.organizationName().trim();
        OrganizationType actualType = (req.orgType() == null || req.orgType() == OrganizationType.COMMUNITY)
                ? OrganizationType.SPORTS_CLUB
                : req.orgType();

        Organization org = new Organization();
        org.setOwner(owner);
        org.setName(orgName);
        org.setOrgType(actualType);
        org.setCity(req.city().trim());
        org.setDescription(req.description().trim());
        org.setRepresentativeName(orgName);
        org.setModerationContact(req.moderationContact().trim());
        org.setPublicContacts(req.publicContacts());
        org.setWebsiteUrl(req.websiteUrl());
        org.setSocialUrl(req.socialUrl());
        org.setVerificationLink(req.verificationLink());
        org.setExtraModerationInfo(req.extraModerationInfo());
        org.setStatus(OrganizationStatus.PENDING_REVIEW);
        org.setSubmissionVersion(1);

        Set<Sport> sports = resolveSports(req.sportIds(), req.newSportNames(), owner.getId());
        org.setSports(sports);
        org = organizationRepository.save(org);

        saveHistorySnapshot(org, 1, OrganizationStatus.PENDING_REVIEW, "Первичная подача заявки на регистрацию организации", null);

        notificationService.notifyUser(
                owner,
                NotificationType.ORG_SUBMITTED,
                "Заявка организации отправлена на проверку",
                "Ваша организация «" + org.getName() + "» находится на рассмотрении у администратора.",
                "/my-organization"
        );
        return org;
    }

    @Transactional
    public OrganizationDto createCommunity(UserPrincipal viewer, CreateCommunityRequest req) {
        User owner = userRepository.findById(viewer.id())
                .orElseThrow(() -> ApiException.unauthorized("Пользователь не найден"));

        boolean isOrganizationAccount = organizationRepository.findByOwnerIdOrderByCreatedAtDesc(owner.getId())
                .stream()
                .anyMatch(existing -> existing.getOrgType() != OrganizationType.COMMUNITY);
        if (isOrganizationAccount) {
            throw ApiException.forbidden("Аккаунт спортивной организации не может создавать пользовательские сообщества. Создавать сообщества могут только обычные участники.");
        }

        Organization org = new Organization();
        org.setOwner(owner);
        org.setName(req.name().trim());
        org.setOrgType(OrganizationType.COMMUNITY);
        org.setCity(req.city().trim());
        org.setDescription(req.description().trim());
        org.setRepresentativeName(owner.getDisplayName());
        org.setModerationContact(owner.getEmail());
        org.setPublicContacts(req.publicContacts());
        org.setWebsiteUrl(req.websiteUrl());
        org.setSocialUrl(req.socialUrl());
        if (req.logoAttachmentId() != null) {
            org.setLogoAttachmentId(req.logoAttachmentId());
        }
        org.setStatus(OrganizationStatus.APPROVED);
        org.setSubmissionVersion(1);
        org.setReviewedAt(Instant.now());

        Set<Sport> sports = resolveSports(req.sportIds(), req.newSportNames(), owner.getId());
        org.setSports(sports);
        org = organizationRepository.save(org);

        saveHistorySnapshot(org, 1, OrganizationStatus.APPROVED, "Создание пользовательского спортивного сообщества", owner.getId());

        return toDto(org, viewer);
    }

    @Transactional
    public OrganizationDto updateAndResubmit(UUID orgId, UUID currentUserId, UpdateOrganizationApplicationRequest req) {
        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> ApiException.notFound("Организация не найдена"));
        User actor = userRepository.findById(currentUserId)
                .orElseThrow(() -> ApiException.unauthorized("Пользователь не найден"));

        if (!canManageOrganization(org, currentUserId) && actor.getGlobalRole() != ru.sportplatform.domain.enums.Enums.GlobalRole.ADMIN) {
            throw ApiException.forbidden("Только создатель или администратор может редактировать данные");
        }

        String updatedName = req.name().trim();
        OrganizationType targetType = org.getOrgType();
        if (org.getOrgType() == OrganizationType.COMMUNITY) {
            targetType = OrganizationType.COMMUNITY;
        } else if (req.orgType() != null && req.orgType() != OrganizationType.COMMUNITY) {
            targetType = req.orgType();
        }
        String repName = (org.getOrgType() == OrganizationType.COMMUNITY && req.representativeName() != null && !req.representativeName().isBlank())
                ? req.representativeName().trim()
                : updatedName;

        // Если это верифицированная официальная организация и редактирует не администратор платформы:
        // сохраняем заявку на изменение (pendingChangesJson), а текущая версия организации остаётся публичной и верифицированной!
        if (org.getOrgType() != OrganizationType.COMMUNITY
                && org.getStatus() == OrganizationStatus.APPROVED
                && actor.getGlobalRole() != ru.sportplatform.domain.enums.Enums.GlobalRole.ADMIN) {

            UUID nextLogoId = req.logoAttachmentId() != null ? req.logoAttachmentId() : org.getLogoAttachmentId();
            String nextLogoUrl = nextLogoId != null ? "/api/v1/attachments/" + nextLogoId + "/content" : null;
            List<UUID> nextSportIds = (req.sportIds() != null && !req.sportIds().isEmpty())
                    ? req.sportIds()
                    : org.getSports().stream().map(Sport::getId).toList();
            List<SportDto> nextSports = sportRepository.findAllById(nextSportIds).stream()
                    .map(sportService::toDto)
                    .toList();

            OrganizationPendingChangesDto pending = new OrganizationPendingChangesDto(
                    updatedName,
                    targetType,
                    req.city().trim(),
                    req.description().trim(),
                    repName,
                    req.moderationContact().trim(),
                    req.publicContacts(),
                    req.websiteUrl(),
                    req.socialUrl(),
                    req.verificationLink(),
                    req.extraModerationInfo(),
                    nextLogoId,
                    nextLogoUrl,
                    nextSportIds,
                    nextSports,
                    Instant.now()
            );

            try {
                org.setPendingChangesJson(objectMapper.writeValueAsString(pending));
            } catch (Exception e) {
                throw ApiException.badRequest("Не удалось сформировать заявку на изменение данных организации");
            }

            int nextVer = org.getSubmissionVersion() + 1;
            org.setSubmissionVersion(nextVer);
            // Статус остаётся APPROVED!
            org = organizationRepository.save(org);

            OrganizationApplicationHistory h = new OrganizationApplicationHistory();
            h.setOrganization(org);
            h.setVersionNumber(nextVer);
            h.setSubmittedSnapshot("Запрос на обновление верифицированной организации -> Название: " + pending.name()
                    + " | Тип: " + pending.orgType()
                    + " | Город: " + pending.city()
                    + " | Контакт: " + pending.moderationContact()
                    + " | Ссылки: " + (pending.verificationLink() != null ? pending.verificationLink() : "-"));
            h.setStatus(OrganizationStatus.PENDING_REVIEW);
            h.setDecisionReason("Ожидает проверки изменений модератором (текущая версия организации остаётся опубликованной)");
            historyRepository.save(h);

            notificationService.notifyUser(
                    org.getOwner(),
                    NotificationType.ORG_RESUBMITTED,
                    "Изменения организации отправлены на рассмотрение",
                    "Обновлённые сведения организации «" + org.getName() + "» (версия #" + nextVer + ") отправлены администратору. Текущая верифицированная страница организации остаётся активной и видимой всем пользователям.",
                    "/my-organization"
            );

            return toDto(org, new UserPrincipal(actor.getId(), actor.getEmail(), actor.getDisplayName(), actor.getGlobalRole()));
        }

        org.setName(updatedName);
        org.setOrgType(targetType);
        org.setCity(req.city().trim());
        org.setDescription(req.description().trim());
        org.setRepresentativeName(repName);
        if (org.getOrgType() != OrganizationType.COMMUNITY && org.getOwner().getId().equals(actor.getId())) {
            actor.setDisplayName(updatedName);
            userRepository.save(actor);
        }
        org.setModerationContact(req.moderationContact().trim());
        org.setPublicContacts(req.publicContacts());
        org.setWebsiteUrl(req.websiteUrl());
        org.setSocialUrl(req.socialUrl());
        org.setVerificationLink(req.verificationLink());
        org.setExtraModerationInfo(req.extraModerationInfo());
        if (req.logoAttachmentId() != null) {
            org.setLogoAttachmentId(req.logoAttachmentId());
        }
        if (req.sportIds() != null && !req.sportIds().isEmpty()) {
            Set<Sport> sports = new HashSet<>(sportRepository.findAllById(req.sportIds()));
            org.setSports(sports);
        }

        // Если редактировал админ напрямую, сбрасываем висящие pendingChanges
        if (actor.getGlobalRole() == ru.sportplatform.domain.enums.Enums.GlobalRole.ADMIN) {
            org.setPendingChangesJson(null);
        }

        // Если организация была отклонена или возвращена на доработку, переводим в PENDING_REVIEW и увеличиваем версию заявки
        if (org.getStatus() == OrganizationStatus.REJECTED || org.getStatus() == OrganizationStatus.NEEDS_REVISION || org.getStatus() == OrganizationStatus.DRAFT) {
            int nextVer = org.getSubmissionVersion() + 1;
            org.setSubmissionVersion(nextVer);
            org.setStatus(OrganizationStatus.PENDING_REVIEW);
            org = organizationRepository.save(org);

            saveHistorySnapshot(org, nextVer, OrganizationStatus.PENDING_REVIEW, "Повторная отправка заявки после исправления сведений", null);

            notificationService.notifyUser(
                    org.getOwner(),
                    NotificationType.ORG_RESUBMITTED,
                    "Заявка повторно отправлена на модерацию",
                    "Обновлённая заявка организации «" + org.getName() + "» (версия #" + nextVer + ") передана администратору.",
                    "/my-organization"
            );
        } else {
            org = organizationRepository.save(org);
        }

        return toDto(org, new UserPrincipal(actor.getId(), actor.getEmail(), actor.getDisplayName(), actor.getGlobalRole()));
    }

    @Transactional
    public OrganizationDto moderateOrganization(UUID orgId, UUID adminId, AdminOrgModerationRequest req) {
        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> ApiException.unauthorized("Администратор не найден"));
        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> ApiException.notFound("Организация не найдена"));

        boolean hasPendingEdit = org.getPendingChangesJson() != null && !org.getPendingChangesJson().isBlank();

        if (!hasPendingEdit && org.getStatus() == req.decision()) {
            throw ApiException.conflict("Организация уже находится в выбранном статусе (" + req.decision() + ")");
        }

        if (req.decision() == OrganizationStatus.REJECTED || req.decision() == OrganizationStatus.NEEDS_REVISION || req.decision() == OrganizationStatus.SUSPENDED) {
            if (req.reason() == null || req.reason().isBlank()) {
                throw ApiException.badRequest("При отклонении или блокировке необходимо указать понятную причину для организации");
            }
        }

        // Если у верифицированной организации есть ожидающие изменения и админ принимает/отклоняет их:
        if (hasPendingEdit && org.getStatus() == OrganizationStatus.APPROVED && req.decision() != OrganizationStatus.SUSPENDED) {
            OrganizationPendingChangesDto pending = parsePendingChanges(org.getPendingChangesJson());
            if (req.decision() == OrganizationStatus.APPROVED && pending != null) {
                org.setName(pending.name());
                if (pending.orgType() != null && pending.orgType() != OrganizationType.COMMUNITY) {
                    org.setOrgType(pending.orgType());
                }
                org.setCity(pending.city());
                org.setDescription(pending.description());
                org.setRepresentativeName(pending.name());
                org.setModerationContact(pending.moderationContact());
                org.setPublicContacts(pending.publicContacts());
                org.setWebsiteUrl(pending.websiteUrl());
                org.setSocialUrl(pending.socialUrl());
                org.setVerificationLink(pending.verificationLink());
                org.setExtraModerationInfo(pending.extraModerationInfo());
                if (pending.logoAttachmentId() != null) {
                    org.setLogoAttachmentId(pending.logoAttachmentId());
                }
                if (pending.sportIds() != null && !pending.sportIds().isEmpty()) {
                    org.setSports(new HashSet<>(sportRepository.findAllById(pending.sportIds())));
                }
                User owner = org.getOwner();
                owner.setDisplayName(pending.name());
                userRepository.save(owner);

                org.setPendingChangesJson(null);
                org.setRejectionReason(null);
            } else {
                // Отклонение предложенных изменений: текущая версия остаётся APPROVED и опубликованной!
                org.setPendingChangesJson(null);
                org.setRejectionReason(req.reason());
            }

            if (req.adminNotes() != null) {
                org.setAdminNotes(req.adminNotes());
            }
            org.setReviewedByAdminId(adminId);
            org.setReviewedAt(Instant.now());
            org = organizationRepository.save(org);

            Organization finalOrg = org;
            historyRepository.findFirstByOrganizationIdOrderByVersionNumberDesc(org.getId())
                    .ifPresentOrElse(latest -> {
                        latest.setStatus(req.decision());
                        latest.setDecisionReason(req.reason() != null ? req.reason() : "Изменения одобрены администратором");
                        latest.setDecidedByAdminId(adminId);
                        latest.setDecidedAt(Instant.now());
                        historyRepository.save(latest);
                    }, () -> saveHistorySnapshot(finalOrg, finalOrg.getSubmissionVersion(), req.decision(), req.reason(), adminId));

            auditLogService.record(
                    admin,
                    "MODERATE_ORGANIZATION_CHANGES",
                    "ORGANIZATION",
                    org.getId(),
                    "APPROVED_WITH_PENDING_CHANGES",
                    req.decision().name(),
                    req.reason() != null ? req.reason() : "Изменения верифицированной организации одобрены"
            );

            if (req.decision() == OrganizationStatus.APPROVED) {
                notificationService.notifyUser(
                        org.getOwner(),
                        NotificationType.ORG_APPROVED,
                        "Изменения организации «" + org.getName() + "» одобрены!",
                        "Администратор проверил и опубликовал обновлённые данные вашей организации.",
                        "/organizations/" + org.getId()
                );
            } else {
                notificationService.notifyUser(
                        org.getOwner(),
                        NotificationType.ORG_REJECTED,
                        "Изменения организации «" + org.getName() + "» отклонены",
                        "Причина: " + req.reason() + ". Текущая верифицированная версия вашей организации остаётся опубликованной и видимой всем пользователям.",
                        "/my-organization"
                );
            }

            return toDto(org, new UserPrincipal(admin.getId(), admin.getEmail(), admin.getDisplayName(), admin.getGlobalRole()));
        }

        String prevState = org.getStatus().name();
        org.setStatus(req.decision());
        org.setPendingChangesJson(null);
        org.setRejectionReason(req.reason());
        if (req.adminNotes() != null) {
            org.setAdminNotes(req.adminNotes());
        }
        org.setReviewedByAdminId(adminId);
        org.setReviewedAt(Instant.now());
        org = organizationRepository.save(org);

        Organization finalOrg = org;
        historyRepository.findFirstByOrganizationIdOrderByVersionNumberDesc(org.getId())
                .ifPresentOrElse(latest -> {
                    latest.setStatus(req.decision());
                    latest.setDecisionReason(req.reason());
                    latest.setDecidedByAdminId(adminId);
                    latest.setDecidedAt(Instant.now());
                    historyRepository.save(latest);
                }, () -> saveHistorySnapshot(finalOrg, finalOrg.getSubmissionVersion(), req.decision(), req.reason(), adminId));

        auditLogService.record(
                admin,
                "MODERATE_ORGANIZATION",
                "ORGANIZATION",
                org.getId(),
                prevState,
                req.decision().name(),
                req.reason() != null ? req.reason() : "Одобрено администратором"
        );

        if (req.decision() == OrganizationStatus.APPROVED) {
            notificationService.notifyUser(
                    org.getOwner(),
                    NotificationType.ORG_APPROVED,
                    "Организация «" + org.getName() + "» одобрена!",
                    "Поздравляем! Ваша организация прошла проверку. Теперь доступна публичная страница организации и публикация мероприятий от её имени.",
                    "/organizations/" + org.getId()
            );
        } else {
            notificationService.notifyUser(
                    org.getOwner(),
                    NotificationType.ORG_REJECTED,
                    "Статус организации «" + org.getName() + "» изменён",
                    "Причина: " + req.reason() + ". Вы можете исправить сведения в кабинете организации и повторно отправить заявку.",
                    "/my-organization"
            );
        }

        return toDto(org, new UserPrincipal(admin.getId(), admin.getEmail(), admin.getDisplayName(), admin.getGlobalRole()));
    }

    @Transactional
    public void deleteOrganizationByOwner(UUID orgId, UserPrincipal viewer) {
        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> ApiException.notFound("Организация или сообщество не найдено"));

        boolean isOwner = org.getOwner().getId().equals(viewer.id());
        if (!isOwner && !viewer.isAdmin()) {
            throw ApiException.forbidden("Только создатель может удалить своё сообщество или организацию");
        }

        cleanupAndDeleteOrganization(org);
    }

    @Transactional
    public void deleteOrganizationByAdmin(UUID orgId, UUID adminId, String reason) {
        if (reason == null || reason.isBlank()) {
            throw ApiException.badRequest("Для удаления сообщества или организации необходимо указать причину");
        }
        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> ApiException.unauthorized("Администратор не найден"));
        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> ApiException.notFound("Организация или сообщество не найдено"));

        String orgName = org.getName();
        String prevState = org.getStatus().name();
        User owner = org.getOwner();

        auditLogService.record(
                admin,
                "DELETE_ORGANIZATION",
                "ORGANIZATION",
                org.getId(),
                prevState,
                "DELETED",
                "Удалено администратором («" + orgName + "»): " + reason.trim()
        );

        notificationService.notifyUser(
                owner,
                NotificationType.ORG_REJECTED,
                "Сообщество / организация «" + orgName + "» удалена модератором",
                "Причина удаления: " + reason.trim(),
                "/organizations"
        );

        cleanupAndDeleteOrganization(org);
    }

    private void cleanupAndDeleteOrganization(Organization org) {
        UUID orgId = org.getId();
        for (Event ev : eventRepository.findByOrganizationIdOrderByStartsAtAsc(orgId)) {
            ev.setOrganization(null);
            eventRepository.save(ev);
        }
        for (EventSeries s : seriesRepository.findByOrganizationId(orgId)) {
            s.setOrganization(null);
            seriesRepository.save(s);
        }
        subscriptionRepository.deleteAll(subscriptionRepository.findByOrganizationId(orgId));
        historyRepository.deleteAll(historyRepository.findByOrganizationIdOrderByVersionNumberDesc(orgId));
        org.getSports().clear();
        organizationRepository.save(org);
        organizationRepository.delete(org);
    }

    @Transactional(readOnly = true)
    public List<OrganizationDto> listPublicApprovedOrganizations(UserPrincipal viewer) {
        return organizationRepository.findByStatusOrderByCreatedAtAsc(OrganizationStatus.APPROVED)
                .stream()
                .map(o -> toDto(o, viewer))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<OrganizationDto> listMyOrganizations(UserPrincipal viewer) {
        Map<UUID, Organization> map = new LinkedHashMap<>();
        for (Organization owned : organizationRepository.findByOwnerIdOrderByCreatedAtDesc(viewer.id())) {
            map.put(owned.getId(), owned);
        }
        for (OrganizationSubscription sub : subscriptionRepository.findByUserId(viewer.id())) {
            if ("ADMIN".equalsIgnoreCase(sub.getMemberRole())) {
                map.putIfAbsent(sub.getOrganization().getId(), sub.getOrganization());
            }
        }
        return map.values().stream()
                .map(o -> toDto(o, viewer))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<OrganizationDto> listAllForAdmin(UserPrincipal adminViewer, OrganizationStatus statusFilter) {
        List<Organization> all = organizationRepository.findAllByOrderByUpdatedAtDesc();
        List<Organization> list = (statusFilter != null)
                ? all.stream().filter(o -> o.getStatus() == statusFilter
                || (statusFilter == OrganizationStatus.PENDING_REVIEW
                    && o.getPendingChangesJson() != null
                    && !o.getPendingChangesJson().isBlank())).toList()
                : all;
        return list.stream().map(o -> toDto(o, adminViewer)).toList();
    }

    @Transactional(readOnly = true)
    public OrganizationDto getOrganizationById(UUID orgId, UserPrincipal viewer) {
        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> ApiException.notFound("Организация не найдена"));

        boolean canManage = viewer != null && canManageOrganization(org, viewer.id());
        boolean isAdmin = viewer != null && viewer.isAdmin();

        if (org.getStatus() != OrganizationStatus.APPROVED && !canManage && !isAdmin) {
            throw ApiException.forbidden("Публичная страница организации станет доступна после одобрения администратором");
        }
        return toDto(org, viewer);
    }

    @Transactional
    public OrganizationDto toggleSubscription(UUID orgId, UserPrincipal viewer) {
        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> ApiException.notFound("Организация не найдена"));
        if (org.getStatus() != OrganizationStatus.APPROVED) {
            throw ApiException.badRequest("Нельзя вступить в неодобренное сообщество");
        }
        User user = userRepository.findById(viewer.id())
                .orElseThrow(() -> ApiException.unauthorized("Пользователь не найден"));

        subscriptionRepository.findByOrganizationIdAndUserId(orgId, user.getId())
                .ifPresentOrElse(
                        subscriptionRepository::delete,
                        () -> {
                            OrganizationSubscription sub = new OrganizationSubscription();
                            sub.setOrganization(org);
                            sub.setUser(user);
                            sub.setMemberRole("MEMBER");
                            subscriptionRepository.save(sub);
                        }
                );
        return toDto(org, viewer);
    }

    @Transactional(readOnly = true)
    public List<OrganizationMemberDto> listMembers(UUID orgId) {
        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> ApiException.notFound("Организация не найдена"));

        List<OrganizationMemberDto> members = new ArrayList<>();
        User owner = org.getOwner();
        String ownerAvatar = owner.getAvatarAttachmentId() != null
                ? "/api/v1/attachments/" + owner.getAvatarAttachmentId() + "/content"
                : null;
        members.add(new OrganizationMemberDto(
                owner.getId(),
                owner.getDisplayName(),
                owner.getEmail(),
                owner.getCity(),
                ownerAvatar,
                "OWNER",
                org.getCreatedAt()
        ));

        for (OrganizationSubscription sub : subscriptionRepository.findByOrganizationId(orgId)) {
            User u = sub.getUser();
            if (u.getId().equals(owner.getId())) continue;
            String avatar = u.getAvatarAttachmentId() != null
                    ? "/api/v1/attachments/" + u.getAvatarAttachmentId() + "/content"
                    : null;
            members.add(new OrganizationMemberDto(
                    u.getId(),
                    u.getDisplayName(),
                    u.getEmail(),
                    u.getCity(),
                    avatar,
                    sub.getMemberRole() != null ? sub.getMemberRole() : "MEMBER",
                    sub.getCreatedAt()
            ));
        }
        return members;
    }

    @Transactional
    public List<OrganizationMemberDto> assignMemberRole(UUID orgId, UserPrincipal actor, AssignCommunityRoleRequest req) {
        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> ApiException.notFound("Сообщество не найдено"));

        if (!canManageOrganization(org, actor.id()) && !actor.isAdmin()) {
            throw ApiException.forbidden("Только создатель или администратор сообщества может назначать администраторов");
        }

        User targetUser;
        if (req.userId() != null) {
            targetUser = userRepository.findById(req.userId())
                    .orElseThrow(() -> ApiException.notFound("Пользователь не найден"));
        } else if (req.email() != null && !req.email().isBlank()) {
            targetUser = userRepository.findByEmailIgnoreCase(req.email().trim())
                    .orElseThrow(() -> ApiException.notFound("Пользователь с email «" + req.email() + "» не найден"));
        } else {
            throw ApiException.badRequest("Укажите пользователя или его email");
        }

        if (targetUser.getId().equals(org.getOwner().getId())) {
            throw ApiException.badRequest("Создатель сообщества уже обладает полными правами владельца");
        }

        String normalizedRole = "ADMIN".equalsIgnoreCase(req.role()) ? "ADMIN" : "MEMBER";
        OrganizationSubscription sub = subscriptionRepository.findByOrganizationIdAndUserId(orgId, targetUser.getId())
                .orElseGet(() -> {
                    OrganizationSubscription created = new OrganizationSubscription();
                    created.setOrganization(org);
                    created.setUser(targetUser);
                    return created;
                });
        sub.setMemberRole(normalizedRole);
        subscriptionRepository.save(sub);

        if ("ADMIN".equals(normalizedRole)) {
            notificationService.notifyUser(
                    targetUser,
                    NotificationType.ORG_APPROVED,
                    "Вы назначены администратором сообщества «" + org.getName() + "»",
                    "Теперь вы можете управлять сообществом, публиковать мероприятия от его имени и назначать администраторов.",
                    "/organizations/" + org.getId()
            );
        }

        return listMembers(orgId);
    }

    public OrganizationDto toDto(Organization org, UserPrincipal viewer) {
        boolean isOwner = viewer != null && org.getOwner().getId().equals(viewer.id());
        Optional<OrganizationSubscription> viewerSub = viewer != null
                ? subscriptionRepository.findByOrganizationIdAndUserId(org.getId(), viewer.id())
                : Optional.empty();
        boolean isCommunityAdmin = viewerSub.map(s -> "ADMIN".equalsIgnoreCase(s.getMemberRole())).orElse(false);
        boolean isAdmin = viewer != null && viewer.isAdmin();
        boolean managedByViewer = isOwner || isCommunityAdmin;
        boolean privileged = managedByViewer || isAdmin;

        String viewerMemberRole = isOwner
                ? "OWNER"
                : viewerSub.map(OrganizationSubscription::getMemberRole).orElse(null);

        List<SportDto> sports = org.getSports().stream()
                .map(sportService::toDto)
                .toList();

        List<OrganizationHistoryItemDto> history = privileged
                ? historyRepository.findByOrganizationIdOrderByVersionNumberDesc(org.getId())
                .stream()
                .map(h -> new OrganizationHistoryItemDto(
                        h.getId(),
                        h.getVersionNumber(),
                        h.getSubmittedSnapshot(),
                        h.getStatus(),
                        h.getDecisionReason(),
                        h.getCreatedAt(),
                        h.getDecidedAt()
                ))
                .toList()
                : List.of();

        long subsCount = subscriptionRepository.countByOrganizationId(org.getId()) + 1; // +1 including owner
        boolean subscribed = isOwner || viewerSub.isPresent();

        String logoUrl = org.getLogoAttachmentId() != null
                ? "/api/v1/attachments/" + org.getLogoAttachmentId() + "/content"
                : null;

        boolean hasPending = org.getPendingChangesJson() != null && !org.getPendingChangesJson().isBlank();
        OrganizationPendingChangesDto pendingChanges = (privileged && hasPending)
                ? parsePendingChanges(org.getPendingChangesJson())
                : null;

        return new OrganizationDto(
                org.getId(),
                org.getOwner().getId(),
                org.getOwner().getDisplayName(),
                org.getName(),
                org.getOrgType(),
                org.getCity(),
                org.getDescription(),
                org.getRepresentativeName(),
                privileged ? org.getModerationContact() : null,
                org.getPublicContacts(),
                org.getWebsiteUrl(),
                org.getSocialUrl(),
                org.getVerificationLink(),
                privileged ? org.getExtraModerationInfo() : null,
                logoUrl,
                org.getStatus(),
                privileged ? org.getRejectionReason() : null,
                isAdmin ? org.getAdminNotes() : null,
                org.getSubmissionVersion(),
                sports,
                subsCount,
                subscribed,
                managedByViewer,
                viewerMemberRole,
                hasPending,
                pendingChanges,
                history,
                org.getCreatedAt(),
                org.getUpdatedAt()
        );
    }

    private OrganizationPendingChangesDto parsePendingChanges(String json) {
        if (json == null || json.isBlank()) return null;
        try {
            return objectMapper.readValue(json, OrganizationPendingChangesDto.class);
        } catch (Exception e) {
            return null;
        }
    }

    private void saveHistorySnapshot(Organization org, int version, OrganizationStatus status, String reason, UUID adminId) {
        OrganizationApplicationHistory h = new OrganizationApplicationHistory();
        h.setOrganization(org);
        h.setVersionNumber(version);
        String snapshot = "Название: " + org.getName()
                + " | Тип: " + org.getOrgType()
                + " | Город: " + org.getCity()
                + " | Представитель: " + org.getRepresentativeName()
                + " | Контакт: " + org.getModerationContact()
                + " | Ссылки: " + (org.getVerificationLink() != null ? org.getVerificationLink() : "-");
        h.setSubmittedSnapshot(snapshot);
        h.setStatus(status);
        h.setDecisionReason(reason);
        h.setDecidedByAdminId(adminId);
        if (adminId != null) {
            h.setDecidedAt(Instant.now());
        }
        historyRepository.save(h);
    }

    private Set<Sport> resolveSports(List<UUID> sportIds, List<String> newSportNames, UUID creatorId) {
        Set<Sport> result = new HashSet<>();
        if (sportIds != null && !sportIds.isEmpty()) {
            result.addAll(sportRepository.findAllById(sportIds));
        }
        if (newSportNames != null) {
            for (String sName : newSportNames) {
                if (sName != null && !sName.isBlank()) {
                    result.add(sportService.getOrCreateByName(sName, null, creatorId));
                }
            }
        }
        return result;
    }
}
