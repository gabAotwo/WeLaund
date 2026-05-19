-- ============================================================
--  Welaund SaaS Laundry System — ALIGNED PostgreSQL Schema
--  Aligning with database_schema.txt
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
--  SUPER ADMINS
-- ============================================================
CREATE TABLE IF NOT EXISTS super_admins (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username       VARCHAR(60)   NOT NULL UNIQUE,
    email          VARCHAR(180)  NOT NULL UNIQUE,
    password_hash  VARCHAR(255)  NOT NULL,
    status         VARCHAR(20)   NOT NULL DEFAULT 'active',
    created_on     TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- ============================================================
--  OWNERS
-- ============================================================
CREATE TABLE IF NOT EXISTS owners (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prefix          VARCHAR(20),
    first_name      VARCHAR(100)  NOT NULL,
    middle_name     VARCHAR(100),
    last_name       VARCHAR(100)  NOT NULL,
    suffix          VARCHAR(20),
    contact_number  VARCHAR(30),
    address         TEXT,
    email           VARCHAR(180)  NOT NULL UNIQUE,
    password_hash   VARCHAR(255)  NOT NULL,
    profile_photo   VARCHAR(255)  DEFAULT NULL,
    created_on      TIMESTAMP     NOT NULL DEFAULT NOW(),
    created_by      UUID          REFERENCES super_admins(id),
    last_updated    TIMESTAMP     NOT NULL DEFAULT NOW(),
    status          VARCHAR(20)   NOT NULL DEFAULT 'active'
);

-- ============================================================
--  LAUNDRY SHOPS
-- ============================================================
CREATE TABLE IF NOT EXISTS laundry_shops (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id        UUID          NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
    shop_name       VARCHAR(180)  NOT NULL,
    address         TEXT,
    contact_number  VARCHAR(30),
    email           VARCHAR(180),
    tin_number      VARCHAR(50),
    operating_hours VARCHAR(100),
    gcash_name      VARCHAR(120),
    gcash_number    VARCHAR(20),
    features        JSONB         DEFAULT '{}',
    created_on      TIMESTAMP     NOT NULL DEFAULT NOW(),
    created_by      UUID          REFERENCES super_admins(id),
    last_updated    TIMESTAMP     NOT NULL DEFAULT NOW(),
    status          VARCHAR(20)   NOT NULL DEFAULT 'active'
);

-- ============================================================
--  STAFF
-- ============================================================
CREATE TABLE IF NOT EXISTS staff (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id         UUID          NOT NULL REFERENCES laundry_shops(id) ON DELETE CASCADE,
    first_name      VARCHAR(100)  NOT NULL,
    middle_name     VARCHAR(100),
    last_name       VARCHAR(100)  NOT NULL,
    role            VARCHAR(50)   NOT NULL DEFAULT 'washer', -- e.g. admin, washer, delivery
    contact_number  VARCHAR(30),
    email           VARCHAR(180)  NOT NULL UNIQUE,
    password_hash   VARCHAR(255)  NOT NULL,
    created_on      TIMESTAMP     NOT NULL DEFAULT NOW(),
    created_by      UUID          REFERENCES owners(id),
    last_updated    TIMESTAMP     NOT NULL DEFAULT NOW(),
    status          VARCHAR(20)   NOT NULL DEFAULT 'active'
);

-- ============================================================
--  CUSTOMERS
-- ============================================================
CREATE TABLE IF NOT EXISTS customers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id         UUID          NOT NULL REFERENCES laundry_shops(id) ON DELETE CASCADE,
    first_name      VARCHAR(100)  NOT NULL,
    middle_name     VARCHAR(100),
    last_name       VARCHAR(100)  NOT NULL,
    contact_number  VARCHAR(30),
    address         TEXT,
    email           VARCHAR(180)  NOT NULL UNIQUE,
    password_hash   VARCHAR(255)  NOT NULL,
    last_updated    TIMESTAMP     NOT NULL DEFAULT NOW(),
    status          VARCHAR(20)   NOT NULL DEFAULT 'Pending' 
                    CHECK (status IN ('Pending','Approved','Disapproved','Inactive'))
);

-- ============================================================
--  SERVICES
-- ============================================================
CREATE TABLE IF NOT EXISTS services (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id         UUID          NOT NULL REFERENCES laundry_shops(id) ON DELETE CASCADE,
    service_name    VARCHAR(120)  NOT NULL,
    unit            VARCHAR(40)   NOT NULL DEFAULT 'per_kg',
    price_per_unit  NUMERIC(10,2) NOT NULL,
    category        VARCHAR(100),
    created_on      TIMESTAMP     NOT NULL DEFAULT NOW(),
    last_updated    TIMESTAMP     NOT NULL DEFAULT NOW(),
    status          VARCHAR(20)   NOT NULL DEFAULT 'active'
);

-- ============================================================
--  ORDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_ref            VARCHAR(30)   NOT NULL UNIQUE,
    customer_id          UUID          NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    shop_id              UUID          NOT NULL REFERENCES laundry_shops(id) ON DELETE CASCADE,
    staff_id             UUID          REFERENCES staff(id), -- who processed it
    total_weight         NUMERIC(8,2)  NOT NULL DEFAULT 0,
    total_amount         NUMERIC(10,2) NOT NULL DEFAULT 0,
    discount_amount      NUMERIC(10,2) NOT NULL DEFAULT 0,
    payment_status       VARCHAR(20)   NOT NULL DEFAULT 'Unpaid' CHECK (payment_status IN ('Unpaid','Paid')),
    order_status         VARCHAR(20)   NOT NULL DEFAULT 'Requested' CHECK (order_status IN ('Requested','Ongoing','Done','Cancelled')),
    pickup_delivery_type VARCHAR(50),
    created_on           TIMESTAMP     NOT NULL DEFAULT NOW(),
    last_updated         TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- ============================================================
--  ORDER ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS order_items (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id           UUID          NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    service_id         UUID          NOT NULL REFERENCES services(id),
    quantity_or_weight NUMERIC(8,2)  NOT NULL,
    subtotal           NUMERIC(10,2) NOT NULL
);

-- ============================================================
--  PAYMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id              UUID          NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    amount_paid           NUMERIC(10,2) NOT NULL,
    payment_method        VARCHAR(30)   NOT NULL DEFAULT 'GCash' CHECK (payment_method IN ('Manual','GCash')),
    transaction_reference VARCHAR(100),
    verified_by           UUID          REFERENCES staff(id),
    payment_date          DATE          NOT NULL DEFAULT CURRENT_DATE,
    status                VARCHAR(20)   NOT NULL DEFAULT 'Pending' CHECK (status IN ('Verified','Pending'))
);

-- ============================================================
--  SEED: Default Super Admin
--  Password: superadmin123  (bcrypt hashed)
-- ============================================================
INSERT INTO super_admins (username, email, password_hash) VALUES (
    'superadmin',
    'superadmin@welaund.com',
    '$2y$12$Kx.4Jf0LH2lMbZ3jOq8p9.1T8kVwUd3a7t.P0A8r5nMz6GyhL2Oui'
) ON CONFLICT DO NOTHING;
