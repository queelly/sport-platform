-- ============================================================================
-- V6__reset_for_rich_demo_seed.sql
-- Полная очистка базы данных перед заполнением демонстрационными данными для жюри
-- ============================================================================

DELETE FROM moderation_audit_logs;
DELETE FROM event_reminder_logs;
DELETE FROM notifications;
DELETE FROM vk_account_links;
DELETE FROM support_chat_messages;
DELETE FROM support_conversations;
DELETE FROM support_ticket_messages;
DELETE FROM support_tickets;
DELETE FROM discussion_message_attachments;
DELETE FROM discussion_messages;
DELETE FROM direct_messages;
DELETE FROM friendships;
DELETE FROM event_participations;
DELETE FROM events;
DELETE FROM event_series;
DELETE FROM organization_subscriptions;
DELETE FROM organization_application_history;
DELETE FROM organization_sports;
DELETE FROM organizations;
DELETE FROM user_sport_interests;
DELETE FROM sports;
DELETE FROM refresh_sessions;
DELETE FROM attachments;
DELETE FROM users;
