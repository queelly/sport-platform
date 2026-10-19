export interface SportDto {
  id: string;
  name: string;
  category: string;
  description: string;
  iconName: string;
  archived: boolean;
}

export interface SportInterestItemDto {
  sportId: string;
  sportName: string;
  skillLevel: 'ANY' | 'BEGINNER' | 'AMATEUR' | 'ADVANCED' | 'COMPETITIVE';
  primarySport: boolean;
  wantToTryNew: boolean;
  note?: string;
}

export interface UserSummaryDto {
  id: string;
  email: string;
  displayName: string;
  globalRole: 'USER' | 'ADMIN';
  city?: string;
  district?: string;
  bio?: string;
  avatarUrl?: string;
  preferredFormats?: string;
  preferredSchedule?: string;
  showInPartnerSearch: boolean;
  showUpcomingEvents: 'ALL' | 'FRIENDS_ONLY' | 'NONE';
  showFriendsList: 'ALL' | 'FRIENDS_ONLY' | 'NONE';
  notifyInApp: boolean;
  notifyVk: boolean;
  sportInterests: SportInterestItemDto[];
  createdAt: string;
}

export interface OrganizationHistoryItemDto {
  id: string;
  versionNumber: number;
  submittedSnapshot: string;
  status: 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'NEEDS_REVISION';
  decisionReason?: string;
  createdAt: string;
  decidedAt?: string;
}

export interface OrganizationDto {
  id: string;
  ownerUserId: string;
  ownerDisplayName: string;
  name: string;
  orgType: 'SPORTS_CLUB' | 'COMMUNITY' | 'FEDERATION' | 'SECTION' | 'SCHOOL' | 'OTHER';
  city: string;
  description: string;
  representativeName: string;
  moderationContact?: string;
  publicContacts?: string;
  websiteUrl?: string;
  socialUrl?: string;
  verificationLink?: string;
  extraModerationInfo?: string;
  logoUrl?: string;
  status: 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'NEEDS_REVISION';
  rejectionReason?: string;
  adminNotes?: string;
  submissionVersion: number;
  sports: SportDto[];
  subscribersCount: number;
  subscribedByViewer: boolean;
  applicationHistory: OrganizationHistoryItemDto[];
  createdAt: string;
  updatedAt: string;
}

export interface EventCardDto {
  id: string;
  title: string;
  description: string;
  sport: SportDto;
  organizerUserId: string;
  organizerDisplayName: string;
  organizerAvatarUrl?: string;
  organizationId?: string;
  organizationName?: string;
  organizationVerified: boolean;
  seriesId?: string;
  occurrenceDate?: string;
  recurringOccurrence: boolean;
  modifiedOccurrence: boolean;
  city: string;
  locationAddress: string;
  latitude?: number;
  longitude?: number;
  startsAt: string;
  endsAt: string;
  joinMode: 'OPEN' | 'APPROVAL_REQUIRED';
  skillLevel: 'ANY' | 'BEGINNER' | 'AMATEUR' | 'ADVANCED' | 'COMPETITIVE';
  activityFormat?: string;
  participationConditions?: string;
  whatToBring?: string;
  maxParticipants?: number;
  confirmedParticipantsCount: number;
  pendingApplicationsCount: number;
  waitlistCount: number;
  status: 'PUBLISHED' | 'CANCELLED_BY_ORGANIZER' | 'UNPUBLISHED_BY_ADMIN' | 'COMPLETED';
  moderationReason?: string;
  cancellationReason?: string;
  viewerParticipationStatus?: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED_BY_USER' | 'WAITLISTED' | null;
  createdAt: string;
}

export interface ParticipantDto {
  participationId: string;
  userId: string;
  displayName: string;
  avatarUrl?: string;
  city?: string;
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED_BY_USER' | 'WAITLISTED';
  requestComment?: string;
  organizerComment?: string;
  createdAt: string;
}

export interface EventDetailDto {
  event: EventCardDto;
  confirmedParticipants: ParticipantDto[];
  pendingApplications: ParticipantDto[];
  waitlistParticipants: ParticipantDto[];
  seriesOccurrences: EventCardDto[];
}

export interface AttachmentDto {
  id: string;
  originalFilename: string;
  attachmentType: 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  mimeType: string;
  fileSize: number;
  downloadUrl: string;
  createdAt: string;
}

export interface DiscussionMessageDto {
  id: string;
  eventId: string;
  authorUserId: string;
  authorDisplayName: string;
  authorAvatarUrl?: string;
  authorIsOrganizer: boolean;
  authorIsAdmin: boolean;
  content: string;
  externalVideoUrl?: string;
  externalLinkUrl?: string;
  replyToMessageId?: string;
  status: 'VISIBLE' | 'HIDDEN_BY_ADMIN' | 'DELETED_BY_AUTHOR';
  moderationReason?: string;
  attachments: AttachmentDto[];
  createdAt: string;
}

export interface PublicUserProfileDto {
  id: string;
  displayName: string;
  city?: string;
  district?: string;
  bio?: string;
  avatarUrl?: string;
  preferredFormats?: string;
  preferredSchedule?: string;
  sportInterests: SportInterestItemDto[];
  organizedEvents: EventCardDto[];
  upcomingParticipations: EventCardDto[];
  friendsCount: number;
  friendshipStatusWithViewer: string;
  friendshipIdWithViewer?: string;
  friendshipIncomingForViewer: boolean;
  matchReasons: string[];
  createdAt: string;
}

export interface FriendshipDto {
  id: string;
  friendUserId: string;
  friendDisplayName: string;
  friendAvatarUrl?: string;
  friendCity?: string;
  friendSports: SportInterestItemDto[];
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
  incoming: boolean;
  message?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TicketMessageDto {
  id: string;
  authorUserId: string;
  authorDisplayName: string;
  adminReply: boolean;
  content: string;
  attachment?: AttachmentDto;
  createdAt: string;
}

export interface SupportTicketDto {
  id: string;
  ticketNumber: string;
  authorUserId: string;
  authorDisplayName: string;
  authorEmail: string;
  category: 'EVENT_COMPLAINT' | 'USER_COMPLAINT' | 'ORGANIZATION_COMPLAINT' | 'ACCOUNT_ISSUE' | 'TECHNICAL_ISSUE' | 'NOTIFICATION_ISSUE' | 'OTHER';
  subject: string;
  description: string;
  targetType?: string;
  targetId?: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'WAITING_FOR_USER' | 'RESOLVED' | 'CLOSED';
  resolutionSummary?: string;
  messages: TicketMessageDto[];
  createdAt: string;
  updatedAt: string;
}

export interface SupportChatMessageDto {
  id: string;
  senderUserId: string;
  senderDisplayName: string;
  fromAdmin: boolean;
  content: string;
  createdAt: string;
}

export interface SupportConversationDto {
  id: string;
  userId: string;
  userDisplayName: string;
  userEmail: string;
  status: 'ACTIVE' | 'ANSWERED' | 'RESOLVED';
  unreadByUser: boolean;
  unreadByAdmin: boolean;
  lastMessagePreview?: string;
  messages: SupportChatMessageDto[];
  updatedAt: string;
}

export interface VkStatusDto {
  mode: 'TEST_LOG' | 'REAL';
  clubUrl: string;
  groupId: number;
  linked: boolean;
  vkUserId?: number;
  notificationsEnabled: boolean;
  activeLinkCode?: string;
  codeExpiresAt?: string;
  linkedAt?: string;
}

export interface NotificationDto {
  id: string;
  type: string;
  title: string;
  message: string;
  linkUrl?: string;
  read: boolean;
  vkDeliveryStatus: string;
  vkDeliveryDetail?: string;
  createdAt: string;
}

export interface AuditLogDto {
  id: string;
  adminUserId: string;
  adminDisplayName: string;
  actionType: string;
  targetType: string;
  targetId: string;
  previousState?: string;
  newState?: string;
  reason?: string;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  user: UserSummaryDto;
  myOrganizations: OrganizationDto[];
}
