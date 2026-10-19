-- ============================================================================
-- V1__init_schema.sql
-- Полная реляционная схема Спортивной Платформы «Точка Сбора»
-- Совместима с PostgreSQL 16 и H2 (PostgreSQL Mode)
-- ============================================================================

-- 1. ПОЛЬЗОВАТЕЛИ И ПРОФИЛИ
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(180) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    global_role VARCHAR(30) NOT NULL,
    city VARCHAR(100),
    district VARCHAR(100),
    bio VARCHAR(1500),
    avatar_attachment_id UUID,
    preferred_formats VARCHAR(300),
    preferred_schedule VARCHAR(300),
    show_in_partner_search BOOLEAN NOT NULL DEFAULT TRUE,
    show_upcoming_events VARCHAR(30) NOT NULL DEFAULT 'ALL',
    show_friends_list VARCHAR(30) NOT NULL DEFAULT 'ALL',
    notify_in_app BOOLEAN NOT NULL DEFAULT TRUE,
    notify_vk BOOLEAN NOT NULL DEFAULT TRUE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    terms_accepted BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_users_city ON users(city);
CREATE INDEX idx_users_partner_search ON users(show_in_partner_search, active);

-- 2. REFRESH-СЕССИИ ДЛЯ JWT РОТАЦИИ
CREATE TABLE refresh_sessions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(128) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_refresh_user ON refresh_sessions(user_id);

-- 3. ДИНАМИЧЕСКИЙ КАТАЛОГ ВИДОВ СПОРТА
CREATE TABLE sports (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    normalized_name VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(80),
    description VARCHAR(500),
    icon_name VARCHAR(60),
    archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- 4. СПОРТИВНЫЕ ИНТЕРЕСЫ ПОЛЬЗОВАТЕЛЯ
CREATE TABLE user_sport_interests (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sport_id UUID NOT NULL REFERENCES sports(id) ON DELETE CASCADE,
    skill_level VARCHAR(40) NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    want_to_try_new BOOLEAN NOT NULL DEFAULT FALSE,
    note VARCHAR(300),
    CONSTRAINT uq_user_sport UNIQUE (user_id, sport_id)
);

CREATE INDEX idx_user_sport_sport ON user_sport_interests(sport_id);

-- 5. ОРГАНИЗАЦИИ / КЛУБЫ / СООБЩЕСТВА
CREATE TABLE organizations (
    id UUID PRIMARY KEY,
    owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(160) NOT NULL,
    org_type VARCHAR(50) NOT NULL,
    city VARCHAR(100) NOT NULL,
    description VARCHAR(3000) NOT NULL,
    representative_name VARCHAR(120) NOT NULL,
    moderation_contact VARCHAR(250) NOT NULL,
    public_contacts VARCHAR(300),
    website_url VARCHAR(300),
    social_url VARCHAR(300),
    verification_link VARCHAR(400),
    extra_moderation_info VARCHAR(1500),
    logo_attachment_id UUID,
    status VARCHAR(40) NOT NULL,
    rejection_reason VARCHAR(1500),
    admin_notes VARCHAR(1500),
    submission_version INT NOT NULL DEFAULT 1,
    reviewed_by_admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_org_status ON organizations(status);
CREATE INDEX idx_org_owner ON organizations(owner_user_id);

-- Виды спорта организации
CREATE TABLE organization_sports (
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    sport_id UUID NOT NULL REFERENCES sports(id) ON DELETE CASCADE,
    PRIMARY KEY (organization_id, sport_id)
);

-- История подач и проверок заявок организации (сохраняется при переподачах)
CREATE TABLE organization_application_history (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    version_number INT NOT NULL,
    submitted_snapshot VARCHAR(4000) NOT NULL,
    status VARCHAR(40) NOT NULL,
    decision_reason VARCHAR(1500),
    decided_by_admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    decided_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_org_app_history_org ON organization_application_history(organization_id);

-- Подписчики организации (дополнительная функция: подписка на клуб)
CREATE TABLE organization_subscriptions (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT uq_org_sub UNIQUE (organization_id, user_id)
);

-- 6. СЕРИИ РЕГУЛЯРНЫХ МЕРОПРИЯТИЙ
CREATE TABLE event_series (
    id UUID PRIMARY KEY,
    title VARCHAR(180) NOT NULL,
    description VARCHAR(3000) NOT NULL,
    sport_id UUID NOT NULL REFERENCES sports(id),
    organizer_user_id UUID NOT NULL REFERENCES users(id),
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    city VARCHAR(100) NOT NULL,
    location_address VARCHAR(250) NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    day_of_week INT NOT NULL,
    start_time_local VARCHAR(10) NOT NULL,
    duration_minutes INT NOT NULL DEFAULT 90,
    join_mode VARCHAR(40) NOT NULL,
    skill_level VARCHAR(40) NOT NULL,
    participation_conditions VARCHAR(1000),
    what_to_bring VARCHAR(500),
    max_participants INT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    start_date DATE NOT NULL,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- 7. МЕРОПРИЯТИЯ (РАЗОВЫЕ И КОНКРЕТНЫЕ ВСТРЕЧИ РЕГУЛЯРНЫХ СЕРИЙ)
CREATE TABLE events (
    id UUID PRIMARY KEY,
    title VARCHAR(180) NOT NULL,
    description VARCHAR(3000) NOT NULL,
    sport_id UUID NOT NULL REFERENCES sports(id),
    organizer_user_id UUID NOT NULL REFERENCES users(id),
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    series_id UUID REFERENCES event_series(id) ON DELETE SET NULL,
    occurrence_date DATE,
    is_recurring_occurrence BOOLEAN NOT NULL DEFAULT FALSE,
    is_modified_occurrence BOOLEAN NOT NULL DEFAULT FALSE,
    city VARCHAR(100) NOT NULL,
    location_address VARCHAR(250) NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
    join_mode VARCHAR(40) NOT NULL,
    skill_level VARCHAR(40) NOT NULL,
    activity_format VARCHAR(80),
    participation_conditions VARCHAR(1000),
    what_to_bring VARCHAR(500),
    max_participants INT,
    status VARCHAR(40) NOT NULL,
    moderation_reason VARCHAR(1500),
    cancellation_reason VARCHAR(1500),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT uq_series_occurrence UNIQUE (series_id, occurrence_date)
);

CREATE INDEX idx_events_sport ON events(sport_id);
CREATE INDEX idx_events_status_starts ON events(status, starts_at);
CREATE INDEX idx_events_city ON events(city);
CREATE INDEX idx_events_organizer ON events(organizer_user_id);
CREATE INDEX idx_events_org ON events(organization_id);

-- 8. УЧАСТИЕ, ЗАЯВКИ И ЛИСТ ОЖИДАНИЯ
CREATE TABLE event_participations (
    id UUID PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(40) NOT NULL,
    request_comment VARCHAR(500),
    organizer_comment VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT uq_event_participant UNIQUE (event_id, user_id)
);

CREATE INDEX idx_part_event_status ON event_participations(event_id, status);
CREATE INDEX idx_part_user ON event_participations(user_id);

-- 9. СИСТЕМА СПОРТИВНЫХ ЗНАКОМЫХ (FRIENDSHIPS)
CREATE TABLE friendships (
    id UUID PRIMARY KEY,
    requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    addressee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(40) NOT NULL,
    message VARCHAR(300),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT uq_friendship_pair UNIQUE (requester_id, addressee_id)
);

CREATE INDEX idx_friend_requester ON friendships(requester_id, status);
CREATE INDEX idx_friend_addressee ON friendships(addressee_id, status);

-- 10. ВЛОЖЕНИЯ / ФАЙЛЫ (ИЗОБРАЖЕНИЯ, ВИДЕО, ДОКУМЕНТЫ)
CREATE TABLE attachments (
    id UUID PRIMARY KEY,
    uploader_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    original_filename VARCHAR(255) NOT NULL,
    stored_filename VARCHAR(255) NOT NULL UNIQUE,
    attachment_type VARCHAR(40) NOT NULL,
    mime_type VARCHAR(120) NOT NULL,
    file_size BIGINT NOT NULL,
    context_type VARCHAR(50) NOT NULL,
    context_id UUID,
    hidden BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_attach_context ON attachments(context_type, context_id);

-- 11. ОБСУЖДЕНИЯ МЕРОПРИЯТИЙ
CREATE TABLE discussion_messages (
    id UUID PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    author_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content VARCHAR(3000) NOT NULL,
    external_video_url VARCHAR(500),
    external_link_url VARCHAR(500),
    reply_to_message_id UUID REFERENCES discussion_messages(id) ON DELETE SET NULL,
    status VARCHAR(40) NOT NULL DEFAULT 'VISIBLE',
    moderation_reason VARCHAR(1000),
    moderated_by_admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_disc_event_created ON discussion_messages(event_id, created_at);

-- Связь сообщения обсуждения с его вложениями (поддержка нескольких вложений)
CREATE TABLE discussion_message_attachments (
    message_id UUID NOT NULL REFERENCES discussion_messages(id) ON DELETE CASCADE,
    attachment_id UUID NOT NULL REFERENCES attachments(id) ON DELETE CASCADE,
    PRIMARY KEY (message_id, attachment_id)
);

-- 12. СИСТЕМА ТИКЕТОВ ДЛЯ ЖАЛОБ И ОБРАЩЕНИЙ
CREATE TABLE support_tickets (
    id UUID PRIMARY KEY,
    ticket_number VARCHAR(30) NOT NULL UNIQUE,
    author_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(60) NOT NULL,
    subject VARCHAR(200) NOT NULL,
    description VARCHAR(4000) NOT NULL,
    target_type VARCHAR(50),
    target_id UUID,
    status VARCHAR(40) NOT NULL,
    assigned_admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
    resolution_summary VARCHAR(1500),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_tickets_author ON support_tickets(author_user_id);
CREATE INDEX idx_tickets_status ON support_tickets(status);

CREATE TABLE support_ticket_messages (
    id UUID PRIMARY KEY,
    ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    author_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_admin_reply BOOLEAN NOT NULL DEFAULT FALSE,
    content VARCHAR(3000) NOT NULL,
    attachment_id UUID REFERENCES attachments(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_ticket_msg_ticket ON support_ticket_messages(ticket_id, created_at);

-- 13. ЧАТ ТЕХНИЧЕСКОЙ ПОДДЕРЖКИ
CREATE TABLE support_conversations (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(40) NOT NULL,
    unread_by_user BOOLEAN NOT NULL DEFAULT FALSE,
    unread_by_admin BOOLEAN NOT NULL DEFAULT FALSE,
    last_message_preview VARCHAR(300),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE support_chat_messages (
    id UUID PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES support_conversations(id) ON DELETE CASCADE,
    sender_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    from_admin BOOLEAN NOT NULL DEFAULT FALSE,
    content VARCHAR(2500) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_support_chat_conv ON support_chat_messages(conversation_id, created_at);

-- 14. ИНТЕГРАЦИЯ С VK-БОТОМ И УВЕДОМЛЕНИЯ
CREATE TABLE vk_account_links (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    vk_user_id BIGINT,
    link_code VARCHAR(30) UNIQUE,
    code_expires_at TIMESTAMP WITH TIME ZONE,
    linked BOOLEAN NOT NULL DEFAULT FALSE,
    notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    linked_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(60) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message VARCHAR(1500) NOT NULL,
    link_url VARCHAR(300),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    vk_delivery_status VARCHAR(40) NOT NULL DEFAULT 'NOT_APPLICABLE',
    vk_delivery_detail VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_notif_user_created ON notifications(user_id, created_at DESC);

-- Идемпотентный журнал отправленных напоминаний о предстоящих встречах
CREATE TABLE event_reminder_logs (
    id UUID PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reminder_type VARCHAR(40) NOT NULL,
    event_starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT uq_event_reminder UNIQUE (event_id, user_id, reminder_type, event_starts_at)
);

-- 15. ЖУРНАЛ АДМИНИСТРАТИВНЫХ ДЕЙСТВИЙ (AUDIT LOG)
CREATE TABLE moderation_audit_logs (
    id UUID PRIMARY KEY,
    admin_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action_type VARCHAR(80) NOT NULL,
    target_type VARCHAR(60) NOT NULL,
    target_id UUID NOT NULL,
    previous_state VARCHAR(80),
    new_state VARCHAR(80),
    reason VARCHAR(1500),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_audit_created ON moderation_audit_logs(created_at DESC);
