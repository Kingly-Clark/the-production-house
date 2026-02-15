-- ============================================================
-- FIX ORGANIZATIONS SCRIPT
-- Run this in Supabase SQL Editor to consolidate all sites
-- under a single organization per user
-- ============================================================

-- Step 1: Show current state (preview what we're fixing)
SELECT 'CURRENT STATE - Sites by Organization:' as info;
SELECT 
  s.id as site_id,
  s.name as site_name,
  s.slug,
  s.organization_id,
  o.name as org_name
FROM sites s
LEFT JOIN organizations o ON s.organization_id = o.id
ORDER BY s.created_at;

SELECT 'CURRENT STATE - Users:' as info;
SELECT id, email, organization_id, role FROM users;

SELECT 'CURRENT STATE - Organizations:' as info;
SELECT id, name, plan_status, max_sites FROM organizations;

-- ============================================================
-- Step 2: Fix the data
-- ============================================================

-- Create a temporary function to do the consolidation
DO $$
DECLARE
  target_org_id uuid;
  user_record record;
  site_record record;
  org_record record;
BEGIN
  -- For each user in the system
  FOR user_record IN SELECT * FROM auth.users LOOP
    RAISE NOTICE 'Processing user: %', user_record.email;
    
    -- Check if user already has a valid organization in users table
    SELECT organization_id INTO target_org_id
    FROM users
    WHERE id = user_record.id AND organization_id IS NOT NULL;
    
    -- If no org linked to user, find the first organization that has their sites
    IF target_org_id IS NULL THEN
      SELECT DISTINCT s.organization_id INTO target_org_id
      FROM sites s
      JOIN organizations o ON s.organization_id = o.id
      WHERE o.name ILIKE '%' || split_part(user_record.email, '@', 1) || '%'
      LIMIT 1;
    END IF;
    
    -- If still no org, get the oldest organization with this user's email pattern
    IF target_org_id IS NULL THEN
      SELECT id INTO target_org_id
      FROM organizations
      WHERE name ILIKE '%' || split_part(user_record.email, '@', 1) || '%'
      ORDER BY created_at ASC
      LIMIT 1;
    END IF;
    
    -- If we found a target organization, consolidate everything
    IF target_org_id IS NOT NULL THEN
      RAISE NOTICE 'Target organization for %: %', user_record.email, target_org_id;
      
      -- Update all sites that belong to organizations matching this user's email
      -- to use the single target organization
      UPDATE sites
      SET organization_id = target_org_id
      WHERE organization_id IN (
        SELECT id FROM organizations
        WHERE name ILIKE '%' || split_part(user_record.email, '@', 1) || '%'
      );
      
      RAISE NOTICE 'Updated sites to use organization: %', target_org_id;
      
      -- Ensure user record exists and is linked to the organization
      INSERT INTO users (id, email, organization_id, role, created_at, updated_at)
      VALUES (
        user_record.id,
        user_record.email,
        target_org_id,
        'client',
        NOW(),
        NOW()
      )
      ON CONFLICT (id) DO UPDATE
      SET organization_id = target_org_id,
          updated_at = NOW();
      
      RAISE NOTICE 'Updated user record with organization: %', target_org_id;
      
      -- Delete orphaned organizations (those matching user email but not the target)
      DELETE FROM organizations
      WHERE name ILIKE '%' || split_part(user_record.email, '@', 1) || '%'
        AND id != target_org_id
        AND id NOT IN (SELECT DISTINCT organization_id FROM sites WHERE organization_id IS NOT NULL);
      
      RAISE NOTICE 'Cleaned up orphaned organizations for user: %', user_record.email;
    ELSE
      RAISE NOTICE 'No organization found for user: %', user_record.email;
    END IF;
  END LOOP;
END $$;

-- ============================================================
-- Step 3: Verify the fix
-- ============================================================

SELECT '--- AFTER FIX ---' as status;

SELECT 'FIXED STATE - Sites by Organization:' as info;
SELECT 
  s.id as site_id,
  s.name as site_name,
  s.slug,
  s.organization_id,
  o.name as org_name
FROM sites s
LEFT JOIN organizations o ON s.organization_id = o.id
ORDER BY s.created_at;

SELECT 'FIXED STATE - Users:' as info;
SELECT id, email, organization_id, role FROM users;

SELECT 'FIXED STATE - Organizations:' as info;
SELECT id, name, plan_status, max_sites FROM organizations;

-- Final check: all sites should now have the same organization_id
SELECT 'VERIFICATION:' as info;
SELECT 
  COUNT(DISTINCT organization_id) as unique_orgs,
  COUNT(*) as total_sites,
  CASE 
    WHEN COUNT(DISTINCT organization_id) = 1 THEN '✅ SUCCESS: All sites under one organization!'
    ELSE '⚠️ WARNING: Multiple organizations still exist'
  END as status
FROM sites;
