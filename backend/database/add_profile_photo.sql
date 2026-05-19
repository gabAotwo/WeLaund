-- Migration: Add profile_photo column to customers, staff, and owners
ALTER TABLE customers ADD COLUMN IF NOT EXISTS profile_photo VARCHAR(255) DEFAULT NULL;
ALTER TABLE staff     ADD COLUMN IF NOT EXISTS profile_photo VARCHAR(255) DEFAULT NULL;
ALTER TABLE owners    ADD COLUMN IF NOT EXISTS profile_photo VARCHAR(255) DEFAULT NULL;
