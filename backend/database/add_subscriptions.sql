ALTER TABLE laundry_shops ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) NOT NULL DEFAULT 'active';
ALTER TABLE laundry_shops ADD COLUMN IF NOT EXISTS subscription_due_date DATE;
ALTER TABLE laundry_shops ADD COLUMN IF NOT EXISTS subscription_monthly_fee NUMERIC(10,2) NOT NULL DEFAULT 999.00;
ALTER TABLE laundry_shops ADD COLUMN IF NOT EXISTS subscription_last_paid_at TIMESTAMP NULL;
ALTER TABLE laundry_shops ADD COLUMN IF NOT EXISTS subscription_note TEXT;
UPDATE laundry_shops SET subscription_due_date = CURRENT_DATE + INTERVAL '30 days' WHERE subscription_due_date IS NULL;

CREATE TABLE IF NOT EXISTS owner_subscription_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES laundry_shops(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
    amount NUMERIC(10,2) NOT NULL,
    billing_month DATE NOT NULL,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'Manual',
    reference_number VARCHAR(120) NOT NULL,
    proof_url TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending','Approved','Rejected')),
    submitted_at TIMESTAMP NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMP NULL,
    reviewed_by UUID NULL REFERENCES super_admins(id),
    admin_note TEXT
);

ALTER TABLE owner_subscription_payments ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES laundry_shops(id) ON DELETE CASCADE;
ALTER TABLE owner_subscription_payments ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES owners(id) ON DELETE CASCADE;
ALTER TABLE owner_subscription_payments ADD COLUMN IF NOT EXISTS amount NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE owner_subscription_payments ADD COLUMN IF NOT EXISTS billing_month DATE NOT NULL DEFAULT DATE_TRUNC('month', CURRENT_DATE)::DATE;
ALTER TABLE owner_subscription_payments ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) NOT NULL DEFAULT 'Manual';
ALTER TABLE owner_subscription_payments ADD COLUMN IF NOT EXISTS reference_number VARCHAR(120) NOT NULL DEFAULT '';
ALTER TABLE owner_subscription_payments ADD COLUMN IF NOT EXISTS proof_url TEXT;
ALTER TABLE owner_subscription_payments ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'Pending';
ALTER TABLE owner_subscription_payments ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP NOT NULL DEFAULT NOW();
ALTER TABLE owner_subscription_payments ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP NULL;
ALTER TABLE owner_subscription_payments ADD COLUMN IF NOT EXISTS reviewed_by UUID NULL REFERENCES super_admins(id);
ALTER TABLE owner_subscription_payments ADD COLUMN IF NOT EXISTS admin_note TEXT;

CREATE INDEX IF NOT EXISTS idx_owner_subscription_payments_status ON owner_subscription_payments(status);
CREATE INDEX IF NOT EXISTS idx_owner_subscription_payments_shop_month ON owner_subscription_payments(shop_id, billing_month);
