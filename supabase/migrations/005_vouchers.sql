-- ContentMill — Voucher Codes Migration
-- Run this in the Supabase SQL Editor
-- =============================================================

-- 1. Extend plan_status to include 'founder'
ALTER TABLE organizations
  DROP CONSTRAINT IF EXISTS organizations_plan_status_check;

ALTER TABLE organizations
  ADD CONSTRAINT organizations_plan_status_check
  CHECK (plan_status IN ('active', 'paused', 'cancelled', 'past_due', 'founder'));

-- 2. Voucher codes table
CREATE TABLE IF NOT EXISTS voucher_codes (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  code         TEXT        NOT NULL UNIQUE,
  description  TEXT,
  plan_status  TEXT        NOT NULL DEFAULT 'founder',
  max_sites    INTEGER     NOT NULL DEFAULT 5,
  max_uses     INTEGER,             -- NULL = unlimited
  uses_count   INTEGER     NOT NULL DEFAULT 0,
  is_active    BOOLEAN     NOT NULL DEFAULT true,
  expires_at   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Redemption audit trail
CREATE TABLE IF NOT EXISTS voucher_redemptions (
  id               UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  voucher_code_id  UUID        NOT NULL REFERENCES voucher_codes(id),
  organization_id  UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id          UUID        NOT NULL,
  redeemed_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Auto-update timestamps
CREATE OR REPLACE TRIGGER set_voucher_codes_updated_at
  BEFORE UPDATE ON voucher_codes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 5. Seed the FOUNDER code
INSERT INTO voucher_codes (code, description, plan_status, max_sites, max_uses, is_active)
VALUES ('FOUNDER', 'Founder access — free full access during beta', 'founder', 10, NULL, true)
ON CONFLICT (code) DO NOTHING;
