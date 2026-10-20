package ru.sportplatform.dto;

import jakarta.validation.constraints.*;
import ru.sportplatform.domain.enums.Enums.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public final class ApiDtos {

    private ApiDtos() {}

    // --- AUTH & REGISTRATION ---
    public record RegisterUserRequest(
            @NotBlank(message = "Укажите отображаемое имя")
            @Size(min = 2, max = 80, message = "Имя должно содержать от 2 до 80 символов")
            String displayName,

            @NotBlank(message = "Укажите email")
            @Email(message = "Некорректный формат email")
            String email,

            @NotBlank(message = "Укажите пароль")
            @Size(min = 8, max = 100, message = "Пароль должен содержать минимум 8 символов")
            String password,

            @AssertTrue(message = "Необходимо согласиться с правилами платформы и обработкой данных")
            boolean termsAccepted,

            String city
    ) {}

    public record RegisterOrganizationRequest(
            String representativeName,

            @NotBlank(message = "Укажите email для входа организации")
            @Email(message = "Некорректный формат email")
            String email,

            @NotBlank(message = "Укажите пароль")
            @Size(min = 8, max = 100, message = "Пароль должен содержать минимум 8 символов")
            String password,

            @AssertTrue(message = "Необходимо согласиться с правилами платформы")
            boolean termsAccepted,

            @NotBlank(message = "Укажите название организации или сообщества")
            @Size(min = 2, max = 160)
            String organizationName,

            @NotNull(message = "Выберите тип объединения")
            OrganizationType orgType,

            @NotBlank(message = "Укажите город или регион")
            String city,

            @NotBlank(message = "Добавьте краткое описание деятельности организации")
            @Size(min = 10, max = 3000)
            String description,

            @NotBlank(message = "Укажите контакт представителя для обратной связи модератора")
            String moderationContact,

            String publicContacts,
            String websiteUrl,
            String socialUrl,
            String verificationLink,
            String extraModerationInfo,
            List<UUID> sportIds,
            List<String> newSportNames
    ) {}

    public record LoginRequest(
            @NotBlank(message = "Укажите email")
            String email,
            @NotBlank(message = "Укажите пароль")
            String password
    ) {}

    public record RefreshTokenRequest(String refreshToken) {}

    public record AuthResponse(
            String accessToken,
            String refreshToken,
            UserSummaryDto user,
            List<OrganizationDto> myOrganizations
    ) {}

    // --- SPORTS ---
    public record SportDto(
            UUID id,
            String name,
            String category,
            String description,
            String iconName,
            boolean archived
    ) {}

    public record CreateSportRequest(
            @NotBlank(message = "Укажите название вида спорта")
            @Size(min = 2, max = 80, message = "Название вида спорта от 2 до 80 символов")
            String name,
            String category,
            String description
    ) {}

    // --- USERS & PROFILES ---
    public record SportInterestItemDto(
            UUID sportId,
            String sportName,
            SkillLevel skillLevel,
            boolean primarySport,
            boolean wantToTryNew,
            String note
    ) {}

    public record UserSummaryDto(
            UUID id,
            String email,
            String displayName,
            GlobalRole globalRole,
            String city,
            String district,
            String bio,
            String avatarUrl,
            String preferredFormats,
            String preferredSchedule,
            boolean showInPartnerSearch,
            VisibilityScope showUpcomingEvents,
            VisibilityScope showFriendsList,
            boolean notifyInApp,
            boolean notifyVk,
            List<SportInterestItemDto> sportInterests,
            Instant createdAt
    ) {}

    public record PublicUserProfileDto(
            UUID id,
            String displayName,
            String city,
            String district,
            String bio,
            String avatarUrl,
            String preferredFormats,
            String preferredSchedule,
            List<SportInterestItemDto> sportInterests,
            List<EventCardDto> organizedEvents,
            List<EventCardDto> upcomingParticipations,
            int friendsCount,
            String friendshipStatusWithViewer,
            UUID friendshipIdWithViewer,
            boolean friendshipIncomingForViewer,
            List<String> matchReasons,
            Instant createdAt
    ) {}

    public record UpdateProfileRequest(
            @NotBlank(message = "Имя не может быть пустым")
            @Size(min = 2, max = 80)
            String displayName,
            String city,
            String district,
            @Size(max = 1500)
            String bio,
            UUID avatarAttachmentId,
            String preferredFormats,
            String preferredSchedule,
            boolean showInPartnerSearch,
            VisibilityScope showUpcomingEvents,
            VisibilityScope showFriendsList,
            boolean notifyInApp,
            boolean notifyVk,
            List<SportInterestUpdateItem> sportInterests
    ) {}

    public record SportInterestUpdateItem(
            UUID sportId,
            SkillLevel skillLevel,
            boolean primarySport,
            boolean wantToTryNew,
            String note
    ) {}

    // --- ORGANIZATIONS ---
    public record OrganizationHistoryItemDto(
            UUID id,
            int versionNumber,
            String submittedSnapshot,
            OrganizationStatus status,
            String decisionReason,
            Instant createdAt,
            Instant decidedAt
    ) {}

    public record OrganizationPendingChangesDto(
            String name,
            OrganizationType orgType,
            String city,
            String description,
            String representativeName,
            String moderationContact,
            String publicContacts,
            String websiteUrl,
            String socialUrl,
            String verificationLink,
            String extraModerationInfo,
            UUID logoAttachmentId,
            String logoUrl,
            List<UUID> sportIds,
            List<SportDto> sports,
            Instant submittedAt
    ) {}

    public record OrganizationDto(
            UUID id,
            UUID ownerUserId,
            String ownerDisplayName,
            String name,
            OrganizationType orgType,
            String city,
            String description,
            String representativeName,
            String moderationContact, // populated only for owner or admin
            String publicContacts,
            String websiteUrl,
            String socialUrl,
            String verificationLink,
            String extraModerationInfo, // populated only for owner or admin
            String logoUrl,
            OrganizationStatus status,
            String rejectionReason, // populated only for owner or admin
            String adminNotes, // populated only for admin
            int submissionVersion,
            List<SportDto> sports,
            long subscribersCount,
            boolean subscribedByViewer,
            boolean managedByViewer,
            String viewerMemberRole,
            boolean hasPendingChanges,
            OrganizationPendingChangesDto pendingChanges,
            List<OrganizationHistoryItemDto> applicationHistory,
            Instant createdAt,
            Instant updatedAt
    ) {}

    public record OrganizationMemberDto(
            UUID userId,
            String displayName,
            String email,
            String city,
            String avatarUrl,
            String role, // OWNER, ADMIN, MEMBER
            Instant joinedAt
    ) {}

    public record CreateCommunityRequest(
            @NotBlank(message = "Укажите название сообщества или клуба")
            @Size(min = 2, max = 160)
            String name,
            OrganizationType orgType,
            @NotBlank(message = "Укажите регион или город")
            String city,
            @NotBlank(message = "Добавьте описание сообщества")
            @Size(min = 5, max = 3000)
            String description,
            String publicContacts,
            String websiteUrl,
            String socialUrl,
            UUID logoAttachmentId,
            List<UUID> sportIds,
            List<String> newSportNames
    ) {}

    public record AssignCommunityRoleRequest(
            UUID userId,
            String email,
            @NotBlank String role // ADMIN or MEMBER
    ) {}

    public record UpdateOrganizationApplicationRequest(
            @NotBlank(message = "Укажите название организации")
            String name,
            @NotNull
            OrganizationType orgType,
            @NotBlank(message = "Укажите город")
            String city,
            @NotBlank(message = "Укажите описание деятельности")
            String description,
            String representativeName,
            @NotBlank(message = "Укажите контакт для обратной связи модератора")
            String moderationContact,
            String publicContacts,
            String websiteUrl,
            String socialUrl,
            String verificationLink,
            String extraModerationInfo,
            UUID logoAttachmentId,
            List<UUID> sportIds
    ) {}

    public record AdminOrgModerationRequest(
            @NotNull(message = "Укажите решение")
            OrganizationStatus decision, // APPROVED, REJECTED, NEEDS_REVISION
            String reason,
            String adminNotes
    ) {}

    // --- EVENTS & SERIES ---
    public record CreateEventRequest(
            @NotBlank(message = "Укажите название мероприятия")
            @Size(min = 3, max = 180)
            String title,

            @NotBlank(message = "Добавьте описание мероприятия")
            @Size(min = 10, max = 3000)
            String description,

            UUID sportId,
            String newSportName,
            String newSportCategory,

            UUID organizationId, // null if personal event

            @NotBlank(message = "Укажите город")
            String city,

            @NotBlank(message = "Укажите место/адрес проведения")
            String locationAddress,

            Double latitude,
            Double longitude,

            @NotNull(message = "Укажите дату и время начала")
            Instant startsAt,

            Instant endsAt,

            @NotNull
            JoinMode joinMode,

            @NotNull
            SkillLevel skillLevel,

            String activityFormat,
            String participationConditions,
            String whatToBring,
            Integer maxParticipants,
            UUID coverAttachmentId,

            // Recurring options
            boolean recurring,
            Integer recurringDayOfWeek,
            String recurringStartTimeLocal,
            Integer recurringDurationMinutes,
            LocalDate recurringStartDate,
            LocalDate recurringEndDate
    ) {
        public CreateEventRequest(
                String title, String description, UUID sportId, String newSportName, String newSportCategory,
                UUID organizationId, String city, String locationAddress, Double latitude, Double longitude,
                Instant startsAt, Instant endsAt, JoinMode joinMode, SkillLevel skillLevel,
                String activityFormat, String participationConditions, String whatToBring, Integer maxParticipants,
                boolean recurring, Integer recurringDayOfWeek, String recurringStartTimeLocal,
                Integer recurringDurationMinutes, LocalDate recurringStartDate, LocalDate recurringEndDate
        ) {
            this(title, description, sportId, newSportName, newSportCategory, organizationId, city, locationAddress,
                    latitude, longitude, startsAt, endsAt, joinMode, skillLevel, activityFormat,
                    participationConditions, whatToBring, maxParticipants, null,
                    recurring, recurringDayOfWeek, recurringStartTimeLocal, recurringDurationMinutes,
                    recurringStartDate, recurringEndDate);
        }
    }

    public record UpdateEventRequest(
            @NotBlank String title,
            @NotBlank String description,
            UUID sportId,
            @NotBlank String city,
            @NotBlank String locationAddress,
            Double latitude,
            Double longitude,
            @NotNull Instant startsAt,
            Instant endsAt,
            @NotNull JoinMode joinMode,
            @NotNull SkillLevel skillLevel,
            String activityFormat,
            String participationConditions,
            String whatToBring,
            Integer maxParticipants,
            UUID coverAttachmentId,
            Boolean removeCoverImage
    ) {
        public UpdateEventRequest(
                String title, String description, UUID sportId, String city, String locationAddress,
                Double latitude, Double longitude, Instant startsAt, Instant endsAt, JoinMode joinMode,
                SkillLevel skillLevel, String activityFormat, String participationConditions,
                String whatToBring, Integer maxParticipants, UUID coverAttachmentId
        ) {
            this(title, description, sportId, city, locationAddress, latitude, longitude, startsAt, endsAt,
                    joinMode, skillLevel, activityFormat, participationConditions, whatToBring, maxParticipants,
                    coverAttachmentId, false);
        }
    }

    public record EventCardDto(
            UUID id,
            String title,
            String description,
            SportDto sport,
            UUID organizerUserId,
            String organizerDisplayName,
            String organizerAvatarUrl,
            UUID organizationId,
            String organizationName,
            boolean organizationVerified,
            UUID seriesId,
            LocalDate occurrenceDate,
            boolean recurringOccurrence,
            boolean modifiedOccurrence,
            String city,
            String locationAddress,
            Double latitude,
            Double longitude,
            Instant startsAt,
            Instant endsAt,
            JoinMode joinMode,
            SkillLevel skillLevel,
            String activityFormat,
            String participationConditions,
            String whatToBring,
            Integer maxParticipants,
            long confirmedParticipantsCount,
            long pendingApplicationsCount,
            long waitlistCount,
            EventStatus status,
            String moderationReason,
            String cancellationReason,
            ParticipationStatus viewerParticipationStatus,
            String coverImageUrl,
            boolean managedByViewer,
            Instant createdAt
    ) {}

    public record ParticipantDto(
            UUID participationId,
            UUID userId,
            String displayName,
            String avatarUrl,
            String city,
            ParticipationStatus status,
            String requestComment,
            String organizerComment,
            Instant createdAt
    ) {}

    public record EventDetailDto(
            EventCardDto event,
            List<ParticipantDto> confirmedParticipants,
            List<ParticipantDto> pendingApplications, // visible to organizer/admin
            List<ParticipantDto> waitlistParticipants,
            List<EventCardDto> seriesOccurrences
    ) {}

    public record JoinEventRequest(String comment) {}

    public record ParticipationDecisionRequest(
            @NotNull ParticipationStatus decision, // CONFIRMED or REJECTED
            String comment
    ) {}

    public record CancelEventRequest(String reason, boolean cancelEntireSeries) {}

    // --- DISCUSSIONS & ATTACHMENTS ---
    public record AttachmentDto(
            UUID id,
            String originalFilename,
            AttachmentType attachmentType,
            String mimeType,
            long fileSize,
            String downloadUrl,
            Instant createdAt
    ) {}

    public record CreateDiscussionMessageRequest(
            @NotBlank(message = "Текст сообщения не может быть пустым")
            @Size(max = 3000)
            String content,
            String externalVideoUrl,
            String externalLinkUrl,
            UUID replyToMessageId,
            List<UUID> attachmentIds
    ) {}

    public record DiscussionMessageDto(
            UUID id,
            UUID eventId,
            UUID authorUserId,
            String authorDisplayName,
            String authorAvatarUrl,
            boolean authorIsOrganizer,
            boolean authorIsAdmin,
            String content,
            String externalVideoUrl,
            String externalLinkUrl,
            UUID replyToMessageId,
            MessageVisibilityStatus status,
            String moderationReason,
            List<AttachmentDto> attachments,
            Instant createdAt
    ) {}

    // --- FRIENDSHIPS ---
    public record SendFriendRequestDto(
            @NotNull UUID targetUserId,
            String message
    ) {}

    public record FriendshipDto(
            UUID id,
            UUID friendUserId,
            String friendDisplayName,
            String friendAvatarUrl,
            String friendCity,
            List<SportInterestItemDto> friendSports,
            FriendshipStatus status,
            boolean incoming,
            String message,
            long unreadMessagesCount,
            Instant createdAt,
            Instant updatedAt
    ) {}

    public record DirectMessageDto(
            UUID id,
            UUID senderUserId,
            String senderDisplayName,
            String senderAvatarUrl,
            UUID recipientUserId,
            String content,
            boolean read,
            Instant createdAt
    ) {}

    public record SendDirectMessageRequest(
            @NotBlank(message = "Текст сообщения не может быть пустым")
            @Size(max = 2500, message = "Сообщение не должно превышать 2500 символов")
            String content
    ) {}

    // --- SUPPORT TICKETS ---
    public record CreateTicketRequest(
            @NotNull(message = "Выберите категорию обращения")
            TicketCategory category,
            @NotBlank(message = "Укажите тему обращения")
            @Size(min = 3, max = 200)
            String subject,
            @NotBlank(message = "Опишите суть проблемы или обращения")
            @Size(min = 5, max = 4000)
            String description,
            String targetType,
            UUID targetId,
            UUID attachmentId
    ) {}

    public record TicketMessageDto(
            UUID id,
            UUID authorUserId,
            String authorDisplayName,
            boolean adminReply,
            String content,
            AttachmentDto attachment,
            Instant createdAt
    ) {}

    public record SupportTicketDto(
            UUID id,
            String ticketNumber,
            UUID authorUserId,
            String authorDisplayName,
            String authorEmail,
            TicketCategory category,
            String subject,
            String description,
            String targetType,
            UUID targetId,
            TicketStatus status,
            String resolutionSummary,
            List<TicketMessageDto> messages,
            Instant createdAt,
            Instant updatedAt
    ) {}

    public record ReplyTicketRequest(
            @NotBlank(message = "Введите сообщение")
            String content,
            UUID attachmentId,
            TicketStatus newStatus,
            String resolutionSummary
    ) {}

    // --- SUPPORT LIVE CHAT ---
    public record SupportChatMessageDto(
            UUID id,
            UUID senderUserId,
            String senderDisplayName,
            boolean fromAdmin,
            String content,
            Instant createdAt
    ) {}

    public record SupportConversationDto(
            UUID id,
            UUID userId,
            String userDisplayName,
            String userEmail,
            SupportConversationStatus status,
            boolean unreadByUser,
            boolean unreadByAdmin,
            String lastMessagePreview,
            List<SupportChatMessageDto> messages,
            Instant updatedAt
    ) {}

    public record SendSupportChatMessageRequest(
            @NotBlank(message = "Введите текст сообщения")
            @Size(max = 2500)
            String content
    ) {}

    // --- VK & NOTIFICATIONS ---
    public record VkStatusDto(
            String mode, // TEST_LOG or REAL
            String clubUrl,
            long groupId,
            boolean linked,
            Long vkUserId,
            boolean notificationsEnabled,
            String activeLinkCode,
            Instant codeExpiresAt,
            Instant linkedAt
    ) {}

    public record SimulateVkCommandRequest(
            Long vkUserId,
            @NotBlank String messageText
    ) {}

    public record NotificationDto(
            UUID id,
            NotificationType type,
            String title,
            String message,
            String linkUrl,
            boolean read,
            VkDeliveryStatus vkDeliveryStatus,
            String vkDeliveryDetail,
            Instant createdAt
    ) {}

    // --- ADMIN MODERATION ---
    public record AdminReasonRequest(
            @NotBlank(message = "Укажите причину модерационного решения")
            String reason
    ) {}

    public record AuditLogDto(
            UUID id,
            UUID adminUserId,
            String adminDisplayName,
            String actionType,
            String targetType,
            UUID targetId,
            String previousState,
            String newState,
            String reason,
            Instant createdAt
    ) {}
}
