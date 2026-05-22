-- ============================================================
--  owner_requests — B2B onboarding funnel
-- ============================================================
CREATE TABLE IF NOT EXISTS owner_requests (
    id               SERIAL PRIMARY KEY,
    owner_name       VARCHAR(255)  NOT NULL,
    email            VARCHAR(255)  NOT NULL,
    phone            VARCHAR(50)   NOT NULL,
    shop_name        VARCHAR(255)  NOT NULL,
    shop_description TEXT,
    status           VARCHAR(20)   NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','approved','rejected')),
    created_at       TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_owner_requests_status ON owner_requests(status);
CREATE INDEX IF NOT EXISTS idx_owner_requests_email  ON owner_requests(email);
