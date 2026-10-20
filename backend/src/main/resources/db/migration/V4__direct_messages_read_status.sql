-- ============================================================================
-- V4__direct_messages_read_status.sql
-- Отметка о прочтении личных сообщений для подсчёта непрочитанных от друзей
-- ============================================================================

ALTER TABLE direct_messages ADD COLUMN is_read BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX idx_dm_unread ON direct_messages(recipient_id, sender_id, is_read);
