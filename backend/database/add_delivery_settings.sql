-- Migration: Add delivery availability settings and request fields
ALTER TABLE laundry_shops ADD COLUMN IF NOT EXISTS delivery_available BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE laundry_shops ADD COLUMN IF NOT EXISTS delivery_fee NUMERIC(10,2) NOT NULL DEFAULT 0;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_address TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_fee NUMERIC(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_amount_estimated NUMERIC(10,2) DEFAULT 0;
