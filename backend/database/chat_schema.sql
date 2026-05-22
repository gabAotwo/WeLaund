-- ============================================================
--  WashWise Messenger — Database Tables
-- ============================================================

CREATE TABLE IF NOT EXISTS chat_rooms (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_one_id  UUID NOT NULL,
    user_two_id  UUID NOT NULL,
    created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(user_one_id, user_two_id)
);

CREATE INDEX IF NOT EXISTS idx_chat_rooms_users ON chat_rooms(user_one_id, user_two_id);

CREATE TABLE IF NOT EXISTS chat_messages (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id      UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    sender_id    UUID NOT NULL,
    message_text TEXT,
    image_url    VARCHAR(555) DEFAULT NULL,
    is_read      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_room ON chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON chat_messages(sender_id);

-- Customer connections (Friend System for Customer-to-Customer chat)
CREATE TABLE IF NOT EXISTS customer_connections (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id    UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    receiver_id  UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    status       VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(sender_id, receiver_id)
);

CREATE INDEX IF NOT EXISTS idx_customer_connections_sender ON customer_connections(sender_id);
CREATE INDEX IF NOT EXISTS idx_customer_connections_receiver ON customer_connections(receiver_id);

-- Customer Block List
CREATE TABLE IF NOT EXISTS customer_blocks (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blocker_id   UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    blocked_id   UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(blocker_id, blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_customer_blocks_blocker ON customer_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_customer_blocks_blocked ON customer_blocks(blocked_id);
