-- ============================================================================
-- V3__direct_messages.sql
-- Личные сообщения между подтверждёнными спортивными знакомыми (друзьями)
-- ============================================================================

CREATE TABLE direct_messages (
    id UUID PRIMARY KEY,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content VARCHAR(2500) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_dm_sender_recipient ON direct_messages(sender_id, recipient_id, created_at);
CREATE INDEX idx_dm_recipient_sender ON direct_messages(recipient_id, sender_id, created_at);
