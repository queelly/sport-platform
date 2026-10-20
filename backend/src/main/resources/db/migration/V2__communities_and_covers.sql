-- ============================================================================
-- V2__communities_and_covers.sql
-- Расширение для ролей участников/администраторов сообществ и обложек мероприятий
-- ============================================================================

ALTER TABLE organization_subscriptions
    ADD COLUMN member_role VARCHAR(30) NOT NULL DEFAULT 'MEMBER';

ALTER TABLE events
    ADD COLUMN cover_attachment_id UUID;

ALTER TABLE event_series
    ADD COLUMN cover_attachment_id UUID;
