-- ============================================================
-- SIMPLE FIX ORGANIZATIONS SCRIPT
-- Run this in Supabase SQL Editor
-- ============================================================

-- Step 1: See current state
SELECT 'Current Sites:' as info;
SELECT id, name, slug, organization_id FROM sites ORDER BY created_at;

SELECT 'Current Organizations:' as info;
SELECT id, name FROM organizations;

SELECT 'Current Users:' as info;
SELECT id, email, organization_id FROM users;

-- ============================================================
-- Step 2: Pick the FIRST organization created (oldest one)
-- and consolidate everything under it
-- ============================================================

-- Get the oldest organization ID (you can change this if needed)
-- Run this first to see which org will be the target:
SELECT 'Target Organization (oldest):' as info;
SELECT id, name, created_at 
FROM organizations 
ORDER BY created_at ASC 
LIMIT 1;

-- ============================================================
-- Step 3: Run these UPDATE statements
-- (Copy the organization ID from above into these queries)
-- ============================================================

-- UPDATE 1: Set all sites to use the first (oldest) organization
UPDATE sites
SET organization_id = (
  SELECT id FROM organizations ORDER BY created_at ASC LIMIT 1
);

-- UPDATE 2: Set all users to use the first (oldest) organization  
UPDATE users
SET organization_id = (
  SELECT id FROM organizations ORDER BY created_at ASC LIMIT 1
);

-- UPDATE 3: Delete all organizations EXCEPT the first one
-- (Only if they have no sites - safety check)
DELETE FROM organizations
WHERE id != (SELECT id FROM organizations ORDER BY created_at ASC LIMIT 1)
  AND id NOT IN (SELECT DISTINCT organization_id FROM sites);

-- ============================================================
-- Step 4: Verify the fix
-- ============================================================

SELECT '--- AFTER FIX ---' as info;

SELECT 'Fixed Sites:' as info;
SELECT id, name, slug, organization_id FROM sites ORDER BY created_at;

SELECT 'Fixed Users:' as info;
SELECT id, email, organization_id FROM users;

SELECT 'Remaining Organizations:' as info;
SELECT id, name FROM organizations;

-- Verification
SELECT 
  'Result: ' || 
  CASE 
    WHEN COUNT(DISTINCT organization_id) = 1 THEN '✅ All sites now under ONE organization!'
    ELSE '⚠️ Still multiple organizations'
  END as status
FROM sites;
