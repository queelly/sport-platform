package ru.sportplatform.domain.enums;

public class Enums {

    public enum GlobalRole {
        USER,
        ADMIN
    }

    public enum VisibilityScope {
        ALL,
        FRIENDS_ONLY,
        NONE
    }

    public enum SkillLevel {
        ANY,
        BEGINNER,
        AMATEUR,
        ADVANCED,
        COMPETITIVE
    }

    public enum OrganizationType {
        SPORTS_CLUB,
        COMMUNITY,
        FEDERATION,
        SECTION,
        SCHOOL,
        OTHER
    }

    public enum OrganizationStatus {
        DRAFT,
        PENDING_REVIEW,
        APPROVED,
        REJECTED,
        NEEDS_REVISION,
        SUSPENDED
    }

    public enum JoinMode {
        OPEN,
        APPROVAL_REQUIRED
    }

    public enum EventStatus {
        PUBLISHED,
        CANCELLED_BY_ORGANIZER,
        UNPUBLISHED_BY_ADMIN,
        COMPLETED
    }

    public enum ParticipationStatus {
        PENDING,
        CONFIRMED,
        REJECTED,
        CANCELLED_BY_USER,
        WAITLISTED
    }

    public enum FriendshipStatus {
        PENDING,
        ACCEPTED,
        REJECTED,
        CANCELLED
    }

    public enum AttachmentType {
        IMAGE,
        VIDEO,
        DOCUMENT
    }

    public enum MessageVisibilityStatus {
        VISIBLE,
        HIDDEN_BY_ADMIN,
        DELETED_BY_AUTHOR
    }

    public enum TicketCategory {
        EVENT_COMPLAINT,
        USER_COMPLAINT,
        ORGANIZATION_COMPLAINT,
        ACCOUNT_ISSUE,
        TECHNICAL_ISSUE,
        NOTIFICATION_ISSUE,
        OTHER
    }

    public enum TicketStatus {
        OPEN,
        IN_PROGRESS,
        WAITING_FOR_USER,
        RESOLVED,
        CLOSED
    }

    public enum SupportConversationStatus {
        ACTIVE,
        ANSWERED,
        RESOLVED
    }

    public enum NotificationType {
        PARTICIPATION_REQUESTED,
        PARTICIPATION_APPROVED,
        PARTICIPATION_REJECTED,
        WAITLIST_PROMOTED,
        ORG_SUBMITTED,
        ORG_APPROVED,
        ORG_REJECTED,
        ORG_RESUBMITTED,
        FRIEND_REQUEST_RECEIVED,
        FRIEND_REQUEST_ACCEPTED,
        EVENT_REMINDER,
        EVENT_UPDATED,
        EVENT_CANCELLED,
        EVENT_UNPUBLISHED_BY_ADMIN,
        CLUB_NEW_EVENT,
        TICKET_REPLY,
        TICKET_STATUS_CHANGED,
        SUPPORT_CHAT_REPLY,
        EVENT_INVITATION
    }

    public enum VkDeliveryStatus {
        NOT_APPLICABLE,
        PENDING,
        SENT_REAL_VK,
        SENT_TEST_LOG,
        SKIPPED_NOT_LINKED,
        FAILED
    }
}
