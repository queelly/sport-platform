package ru.sportplatform.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.sportplatform.domain.entity.*;
import ru.sportplatform.domain.enums.Enums.NotificationType;
import ru.sportplatform.domain.enums.Enums.OrganizationStatus;
import ru.sportplatform.dto.ApiDtos.*;
import ru.sportplatform.exception.ApiException;
import ru.sportplatform.repository.*;
import ru.sportplatform.security.UserPrincipal;

import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class OrganizationService {

    private final OrganizationRepository organizationRepository;
    private final OrganizationApplicationHistoryRepository historyRepository;
    private final OrganizationSubscriptionRepository subscriptionRepository;
    private final UserRepository userRepository;
    private final SportRepository sportRepository;
    private final SportService sportService;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;

    public OrganizationService(
            OrganizationRepository organizationRepository,
            OrganizationApplicationHistoryRepository historyRepository,
            OrganizationSubscriptionRepository subscriptionRepository,
            UserRepository userRepository,
            SportRepository sportRepository,
            SportService sportService,
            NotificationService notificationService,
            AuditLogService auditLogService
    ) {
        this.organizationRepository = organizationRepository;
        this.historyRepository = historyRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.userRepository = userRepository;
        this.sportRepository = sportRepository;
        this.sportService = sportService;
        this.notificationService = notificationService;
        this.auditLogService = auditLogService;
    }

    @Transactional
    public Organization createInitialOrganization(User owner, RegisterOrganizationRequest req) {
        Organization org = new Organization();
        org.setOwner(owner);
        org.setName(req.organizationName().trim());
        org.setOrgType(req.orgType());
        org.setCity(req.city().trim());
        org.setDescription(req.description().trim());
        org.setRepresentativeName(req.representativeName().trim());
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
    public OrganizationDto updateAndResubmit(UUID orgId, UUID currentUserId, UpdateOrganizationApplicationRequest req) {
        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> ApiException.notFound("Организация не найдена"));
        if (!org.getOwner().getId().equals(currentUserId)) {
            throw ApiException.forbidden("Только представитель организации может редактировать и повторно подавать заявку");
        }

        org.setName(req.name().trim());
        org.setOrgType(req.orgType());
        org.setCity(req.city().trim());
        org.setDescription(req.description().trim());
        org.setRepresentativeName(req.representativeName().trim());
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

        return toDto(org, new UserPrincipal(currentUserId, org.getOwner().getEmail(), org.getOwner().getDisplayName(), org.getOwner().getGlobalRole()));
    }

    @Transactional
    public OrganizationDto moderateOrganization(UUID orgId, UUID adminId, AdminOrgModerationRequest req) {
        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> ApiException.unauthorized("Администратор не найден"));
        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> ApiException.notFound("Организация не найдена"));

        if (req.decision() == OrganizationStatus.REJECTED || req.decision() == OrganizationStatus.NEEDS_REVISION) {
            if (req.reason() == null || req.reason().isBlank()) {
                throw ApiException.badRequest("При отклонении или возврате заявки необходимо указать понятную причину для организации");
            }
        }

        String prevState = org.getStatus().name();
        org.setStatus(req.decision());
        org.setRejectionReason(req.reason());
        if (req.adminNotes() != null) {
            org.setAdminNotes(req.adminNotes());
        }
        org.setReviewedByAdminId(adminId);
        org.setReviewedAt(Instant.now());
        org = organizationRepository.save(org);

        // Обновляем текущую версию в истории либо создаём запись решения
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
                    "Поздравляем! Ваша организация прошла проверку. Теперь доступна публичная страница клуба и публикация мероприятий от имени организации.",
                    "/organizations/" + org.getId()
            );
        } else {
            notificationService.notifyUser(
                    org.getOwner(),
                    NotificationType.ORG_REJECTED,
                    "Заявка организации «" + org.getName() + "» отклонена",
                    "Причина: " + req.reason() + ". Вы можете исправить сведения в кабинете организации и повторно отправить заявку.",
                    "/my-organization"
            );
        }

        return toDto(org, new UserPrincipal(admin.getId(), admin.getEmail(), admin.getDisplayName(), admin.getGlobalRole()));
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
        return organizationRepository.findByOwnerIdOrderByCreatedAtDesc(viewer.id())
                .stream()
                .map(o -> toDto(o, viewer))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<OrganizationDto> listAllForAdmin(UserPrincipal adminViewer, OrganizationStatus statusFilter) {
        List<Organization> list = (statusFilter != null)
                ? organizationRepository.findByStatusOrderByCreatedAtAsc(statusFilter)
                : organizationRepository.findAllByOrderByUpdatedAtDesc();
        return list.stream().map(o -> toDto(o, adminViewer)).toList();
    }

    @Transactional(readOnly = true)
    public OrganizationDto getOrganizationById(UUID orgId, UserPrincipal viewer) {
        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> ApiException.notFound("Организация не найдена"));

        boolean isOwner = viewer != null && org.getOwner().getId().equals(viewer.id());
        boolean isAdmin = viewer != null && viewer.isAdmin();

        if (org.getStatus() != OrganizationStatus.APPROVED && !isOwner && !isAdmin) {
            throw ApiException.forbidden("Публичная страница организации станет доступна после одобрения администратором");
        }
        return toDto(org, viewer);
    }

    @Transactional
    public OrganizationDto toggleSubscription(UUID orgId, UserPrincipal viewer) {
        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> ApiException.notFound("Организация не найдена"));
        if (org.getStatus() != OrganizationStatus.APPROVED) {
            throw ApiException.badRequest("Нельзя подписаться на неодобренную организацию");
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
                            subscriptionRepository.save(sub);
                        }
                );
        return toDto(org, viewer);
    }

    public OrganizationDto toDto(Organization org, UserPrincipal viewer) {
        boolean isOwner = viewer != null && org.getOwner().getId().equals(viewer.id());
        boolean isAdmin = viewer != null && viewer.isAdmin();
        boolean privileged = isOwner || isAdmin;

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

        long subsCount = subscriptionRepository.countByOrganizationId(org.getId());
        boolean subscribed = viewer != null && subscriptionRepository.existsByOrganizationIdAndUserId(org.getId(), viewer.id());

        String logoUrl = org.getLogoAttachmentId() != null
                ? "/api/v1/attachments/" + org.getLogoAttachmentId() + "/content"
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
                history,
                org.getCreatedAt(),
                org.getUpdatedAt()
        );
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
