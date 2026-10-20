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
  unreadMessagesCount?: number;
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
  { value: 'Улан-Удэ', label: 'Республика Бурятия (Улан-Удэ)', tzLabel: 'МСК+5 (UTC+8)', lat: 51.8348, lng: 107.5845 },
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
  { value: 'Барнаул', label: 'Алтайский край (Барнаул)', tzLabel: 'МСК+4 (UTC+7)', lat: 53.3468, lng: 83.7769 },
  { value: 'Горно-Алтайск', label: 'Республика Алтай (Горно-Алтайск)', tzLabel: 'МСК+4 (UTC+7)', lat: 51.9581, lng: 85.9603 },
  { value: 'Кемерово', label: 'Кемеровская область — Кузбасс (Кемерово)', tzLabel: 'МСК+4 (UTC+7)', lat: 55.3547, lng: 86.0878 },
  { value: 'Абакан', label: 'Республика Хакасия (Абакан)', tzLabel: 'МСК+4 (UTC+7)', lat: 53.7211, lng: 91.4424 },
  { value: 'Кызыл', label: 'Республика Тыва (Кызыл)', tzLabel: 'МСК+4 (UTC+7)', lat: 51.7191, lng: 94.4378 },
  { value: 'Чита', label: 'Забайкальский край (Чита)', tzLabel: 'МСК+6 (UTC+9)', lat: 52.0336, lng: 113.501 },
  { value: 'Якутск', label: 'Республика Саха (Якутия) (Якутск)', tzLabel: 'МСК+6 (UTC+9)', lat: 62.0355, lng: 129.6755 },
  { value: 'Благовещенск', label: 'Амурская область (Благовещенск)', tzLabel: 'МСК+6 (UTC+9)', lat: 50.2907, lng: 127.5272 },
  { value: 'Южно-Сахалинск', label: 'Сахалинская область (Южно-Сахалинск)', tzLabel: 'МСК+8 (UTC+11)', lat: 46.9591, lng: 142.738 },
  { value: 'Петропавловск-Камчатский', label: 'Камчатский край (Петропавловск-Камчатский)', tzLabel: 'МСК+9 (UTC+12)', lat: 53.0245, lng: 158.6435 },
  { value: 'Магадан', label: 'Магаданская область (Магадан)', tzLabel: 'МСК+8 (UTC+11)', lat: 59.5612, lng: 150.8301 },
  { value: 'Биробиджан', label: 'Еврейская АО (Биробиджан)', tzLabel: 'МСК+7 (UTC+10)', lat: 48.7929, lng: 132.9239 },
  { value: 'Анадырь', label: 'Чукотский АО (Анадырь)', tzLabel: 'МСК+9 (UTC+12)', lat: 64.7337, lng: 177.5089 },
  { value: 'Ижевск', label: 'Удмуртская Республика (Ижевск)', tzLabel: 'МСК+1 (UTC+4)', lat: 56.8527, lng: 53.2045 },
  { value: 'Чебоксары', label: 'Чувашская Республика (Чебоксары)', tzLabel: 'МСК (UTC+3)', lat: 56.1439, lng: 47.2489 },
  { value: 'Йошкар-Ола', label: 'Республика Марий Эл (Йошкар-Ола)', tzLabel: 'МСК (UTC+3)', lat: 56.6344, lng: 47.8999 },
  { value: 'Саранск', label: 'Республика Мордовия (Саранск)', tzLabel: 'МСК (UTC+3)', lat: 54.1874, lng: 45.1839 },
  { value: 'Киров', label: 'Кировская область (Киров)', tzLabel: 'МСК (UTC+3)', lat: 58.6035, lng: 49.668 },
  { value: 'Оренбург', label: 'Оренбургская область (Оренбург)', tzLabel: 'МСК+2 (UTC+5)', lat: 51.7682, lng: 55.097 },
  { value: 'Пенза', label: 'Пензенская область (Пенза)', tzLabel: 'МСК (UTC+3)', lat: 53.195, lng: 45.0183 },
  { value: 'Ульяновск', label: 'Ульяновская область (Ульяновск)', tzLabel: 'МСК+1 (UTC+4)', lat: 54.3142, lng: 48.4031 },
  { value: 'Курган', label: 'Курганская область (Курган)', tzLabel: 'МСК+2 (UTC+5)', lat: 55.441, lng: 65.3411 },
  { value: 'Ханты-Мансийск', label: 'Ханты-Мансийский АО — Югра (Ханты-Мансийск / Сургут)', tzLabel: 'МСК+2 (UTC+5)', lat: 61.0032, lng: 69.0189 },
  { value: 'Салехард', label: 'Ямало-Ненецкий АО (Салехард)', tzLabel: 'МСК+2 (UTC+5)', lat: 66.5299, lng: 66.6145 },
  { value: 'Сыктывкар', label: 'Республика Коми (Сыктывкар)', tzLabel: 'МСК (UTC+3)', lat: 61.6688, lng: 50.8364 },
  { value: 'Петрозаводск', label: 'Республика Карелия (Петрозаводск)', tzLabel: 'МСК (UTC+3)', lat: 61.785, lng: 34.3469 },
  { value: 'Архангельск', label: 'Архангельская область (Архангельск)', tzLabel: 'МСК (UTC+3)', lat: 64.5399, lng: 40.5158 },
  { value: 'Мурманск', label: 'Мурманская область (Мурманск)', tzLabel: 'МСК (UTC+3)', lat: 68.9707, lng: 33.075 },
  { value: 'Вологда', label: 'Вологодская область (Вологда)', tzLabel: 'МСК (UTC+3)', lat: 59.2205, lng: 39.8915 },
  { value: 'Великий Новгород', label: 'Новгородская область (Великий Новгород)', tzLabel: 'МСК (UTC+3)', lat: 58.5228, lng: 31.2699 },
  { value: 'Псков', label: 'Псковская область (Псков)', tzLabel: 'МСК (UTC+3)', lat: 57.8194, lng: 28.3318 },
  { value: 'Тверь', label: 'Тверская область (Тверь)', tzLabel: 'МСК (UTC+3)', lat: 56.8596, lng: 35.9119 },
  { value: 'Смоленск', label: 'Смоленская область (Смоленск)', tzLabel: 'МСК (UTC+3)', lat: 54.7826, lng: 32.0453 },
  { value: 'Брянск', label: 'Брянская область (Брянск)', tzLabel: 'МСК (UTC+3)', lat: 53.2435, lng: 34.3634 },
  { value: 'Калуга', label: 'Калужская область (Калуга)', tzLabel: 'МСК (UTC+3)', lat: 54.5138, lng: 36.2612 },
  { value: 'Рязань', label: 'Рязанская область (Рязань)', tzLabel: 'МСК (UTC+3)', lat: 54.6292, lng: 39.7363 },
  { value: 'Владимир', label: 'Владимирская область (Владимир)', tzLabel: 'МСК (UTC+3)', lat: 56.129, lng: 40.4066 },
  { value: 'Иваново', label: 'Ивановская область (Иваново)', tzLabel: 'МСК (UTC+3)', lat: 57.0004, lng: 40.9739 },
  { value: 'Кострома', label: 'Костромская область (Кострома)', tzLabel: 'МСК (UTC+3)', lat: 57.7679, lng: 40.9269 },
  { value: 'Липецк', label: 'Липецкая область (Липецк)', tzLabel: 'МСК (UTC+3)', lat: 52.6088, lng: 39.5992 },
  { value: 'Тамбов', label: 'Тамбовская область (Тамбов)', tzLabel: 'МСК (UTC+3)', lat: 52.7212, lng: 41.4523 },
  { value: 'Курск', label: 'Курская область (Курск)', tzLabel: 'МСК (UTC+3)', lat: 51.7304, lng: 36.1926 },
  { value: 'Белгород', label: 'Белгородская область (Белгород)', tzLabel: 'МСК (UTC+3)', lat: 50.5955, lng: 36.5873 },
  { value: 'Ставрополь', label: 'Ставропольский край (Ставрополь)', tzLabel: 'МСК (UTC+3)', lat: 45.0445, lng: 41.969 },
  { value: 'Астрахань', label: 'Астраханская область (Астрахань)', tzLabel: 'МСК+1 (UTC+4)', lat: 46.3479, lng: 48.0336 },
  { value: 'Махачкала', label: 'Республика Дагестан (Махачкала)', tzLabel: 'МСК (UTC+3)', lat: 42.9831, lng: 47.5047 },
  { value: 'Грозный', label: 'Чеченская Республика (Грозный)', tzLabel: 'МСК (UTC+3)', lat: 43.3184, lng: 45.6981 },
  { value: 'Владикавказ', label: 'Республика Северная Осетия — Алания (Владикавказ)', tzLabel: 'МСК (UTC+3)', lat: 43.0246, lng: 44.6818 },
  { value: 'Нальчик', label: 'Кабардино-Балкарская Республика (Нальчик)', tzLabel: 'МСК (UTC+3)', lat: 43.4853, lng: 43.6071 },
  { value: 'Черкесск', label: 'Карачаево-Черкесская Республика (Черкесск)', tzLabel: 'МСК (UTC+3)', lat: 44.2269, lng: 42.0468 },
  { value: 'Майкоп', label: 'Республика Адыгея (Майкоп)', tzLabel: 'МСК (UTC+3)', lat: 44.6098, lng: 40.1005 },
  { value: 'Магас', label: 'Республика Ингушетия (Магас)', tzLabel: 'МСК (UTC+3)', lat: 43.1686, lng: 44.8131 },
  { value: 'Элиста', label: 'Республика Калмыкия (Элиста)', tzLabel: 'МСК (UTC+3)', lat: 46.3078, lng: 44.2698 },
  { value: 'Симферополь', label: 'Республика Крым (Симферополь)', tzLabel: 'МСК (UTC+3)', lat: 44.9521, lng: 34.1024 },
  { value: 'Севастополь', label: 'Севастополь', tzLabel: 'МСК (UTC+3)', lat: 44.6166, lng: 33.5254 },
];

export interface DirectMessageDto {
  id: string;
  senderUserId: string;
  senderDisplayName: string;
  senderAvatarUrl?: string;
  recipientUserId: string;
  content: string;
  read?: boolean;
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

