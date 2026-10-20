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
  status: 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'NEEDS_REVISION' | 'SUSPENDED';
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
  status: 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'NEEDS_REVISION' | 'SUSPENDED';
  rejectionReason?: string;
  adminNotes?: string;
  submissionVersion: number;
  sports: SportDto[];
  subscribersCount: number;
  subscribedByViewer: boolean;
  managedByViewer?: boolean;
  viewerMemberRole?: 'OWNER' | 'ADMIN' | 'MEMBER' | null;
  applicationHistory: OrganizationHistoryItemDto[];
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationMemberDto {
  userId: string;
  displayName: string;
  email: string;
  city?: string;
  avatarUrl?: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  joinedAt: string;
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
  coverImageUrl?: string;
  managedByViewer?: boolean;
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

export interface RegionInfo {
  value: string; // canonical city/region value stored in DB (e.g. "Москва")
  label: string; // display label with region (e.g. "Москва и Московская обл.")
  tzLabel: string; // e.g. "МСК (UTC+3)"
  lat: number;
  lng: number;
}

export const RUSSIAN_REGIONS: RegionInfo[] = [
  { value: 'Москва', label: 'Москва и Московская область', tzLabel: 'МСК (UTC+3)', lat: 55.7558, lng: 37.6173 },
  { value: 'Санкт-Петербург', label: 'Санкт-Петербург и Ленинградская область', tzLabel: 'МСК (UTC+3)', lat: 59.9343, lng: 30.3351 },
  { value: 'Красноярск', label: 'Красноярский край (Красноярск)', tzLabel: 'МСК+4 (UTC+7)', lat: 56.0153, lng: 92.8932 },
  { value: 'Орёл', label: 'Орловская область (Орёл)', tzLabel: 'МСК (UTC+3)', lat: 52.9651, lng: 36.0785 },
  { value: 'Екатеринбург', label: 'Свердловская область (Екатеринбург)', tzLabel: 'МСК+2 (UTC+5)', lat: 56.8389, lng: 60.6057 },
  { value: 'Новосибирск', label: 'Новосибирская область (Новосибирск)', tzLabel: 'МСК+4 (UTC+7)', lat: 55.0084, lng: 82.9357 },
  { value: 'Казань', label: 'Республика Татарстан (Казань)', tzLabel: 'МСК (UTC+3)', lat: 55.7887, lng: 49.1221 },
  { value: 'Нижний Новгород', label: 'Нижегородская область (Нижний Новгород)', tzLabel: 'МСК (UTC+3)', lat: 56.2965, lng: 43.9361 },
  { value: 'Краснодар', label: 'Краснодарский край (Краснодар / Сочи)', tzLabel: 'МСК (UTC+3)', lat: 45.0355, lng: 38.9753 },
  { value: 'Самара', label: 'Самарская область (Самара)', tzLabel: 'МСК+1 (UTC+4)', lat: 53.1959, lng: 50.1002 },
  { value: 'Уфа', label: 'Республика Башкортостан (Уфа)', tzLabel: 'МСК+2 (UTC+5)', lat: 54.7388, lng: 55.9721 },
  { value: 'Ростов-на-Дону', label: 'Ростовская область (Ростов-на-Дону)', tzLabel: 'МСК (UTC+3)', lat: 47.2357, lng: 39.7015 },
  { value: 'Челябинск', label: 'Челябинская область (Челябинск)', tzLabel: 'МСК+2 (UTC+5)', lat: 55.1644, lng: 61.4368 },
  { value: 'Воронеж', label: 'Воронежская область (Воронеж)', tzLabel: 'МСК (UTC+3)', lat: 51.672, lng: 39.1843 },
  { value: 'Пермь', label: 'Пермский край (Пермь)', tzLabel: 'МСК+2 (UTC+5)', lat: 58.0105, lng: 56.2502 },
  { value: 'Волгоград', label: 'Волгоградская область (Волгоград)', tzLabel: 'МСК (UTC+3)', lat: 48.708, lng: 44.5133 },
  { value: 'Тюмень', label: 'Тюменская область (Тюмень)', tzLabel: 'МСК+2 (UTC+5)', lat: 57.1522, lng: 65.5272 },
  { value: 'Иркутск', label: 'Иркутская область (Иркутск)', tzLabel: 'МСК+5 (UTC+8)', lat: 52.2869, lng: 104.305 },
  { value: 'Владивосток', label: 'Приморский край (Владивосток)', tzLabel: 'МСК+7 (UTC+10)', lat: 43.1155, lng: 131.8855 },
  { value: 'Калининград', label: 'Калининградская область (Калининград)', tzLabel: 'МСК-1 (UTC+2)', lat: 54.7104, lng: 20.4522 },
  { value: 'Тула', label: 'Тульская область (Тула)', tzLabel: 'МСК (UTC+3)', lat: 54.1961, lng: 37.6182 },
  { value: 'Ярославль', label: 'Ярославская область (Ярославль)', tzLabel: 'МСК (UTC+3)', lat: 57.6261, lng: 39.8845 },
  { value: 'Томск', label: 'Томская область (Томск)', tzLabel: 'МСК+4 (UTC+7)', lat: 56.4846, lng: 84.9476 },
  { value: 'Омск', label: 'Омская область (Омск)', tzLabel: 'МСК+3 (UTC+6)', lat: 54.9885, lng: 73.3242 },
  { value: 'Саратов', label: 'Саратовская область (Саратов)', tzLabel: 'МСК+1 (UTC+4)', lat: 51.5336, lng: 46.0343 },
  { value: 'Хабаровск', label: 'Хабаровский край (Хабаровск)', tzLabel: 'МСК+7 (UTC+10)', lat: 48.4827, lng: 135.084 },
];

export interface DirectMessageDto {
  id: string;
  senderUserId: string;
  senderDisplayName: string;
  senderAvatarUrl?: string;
  recipientUserId: string;
  content: string;
  createdAt: string;
}

export const EVENT_CATEGORIES: Array<{ value: string; label: string }> = [
  { value: 'Спортивные тренировки', label: '🏃 Спортивные тренировки' },
  { value: 'Соревнования', label: '🏆 Соревнования' },
  { value: 'Фестивали', label: '🎉 Фестивали' },
  { value: 'Квесты', label: '🧭 Квесты' },
];

export function isOnlineEvent(city?: string, locationAddress?: string): boolean {
  if (!city) return false;
  const norm = city.trim().toLowerCase();
  return norm === 'онлайн' || norm === 'online' || (locationAddress?.trim().toLowerCase().startsWith('онлайн') ?? false);
}

export function getBrowserLocalTzLabel(): string {
  try {
    const offsetMin = -new Date().getTimezoneOffset();
    const sign = offsetMin >= 0 ? '+' : '-';
    const hours = Math.floor(Math.abs(offsetMin) / 60);
    return `Местное время (UTC${sign}${hours})`;
  } catch {
    return 'Местное время';
  }
}

export function getRegionInfo(cityOrRegion?: string): RegionInfo | undefined {
  if (!cityOrRegion) return undefined;
  const norm = cityOrRegion.trim().toLowerCase().replace('ё', 'е');
  if (norm === 'онлайн' || norm === 'online') return undefined;
  return RUSSIAN_REGIONS.find(
    (r) =>
      r.value.toLowerCase().replace('ё', 'е') === norm ||
      r.label.toLowerCase().replace('ё', 'е').includes(norm)
  );
}

