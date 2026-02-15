-- Production House — Helper Functions
-- Wave 1: Authentication & Database Foundation
-- =============================================================

-- =============================================================
-- SITE STATISTICS FUNCTION
-- =============================================================

CREATE OR REPLACE FUNCTION get_site_stats(site_uuid UUID)
RETURNS TABLE(
  source_count INT,
  articles_raw INT,
  articles_pending INT,
  articles_published INT,
  articles_unpublished INT,
  articles_failed INT,
  articles_duplicate INT,
  articles_filtered INT,
  subscriber_count INT,
  published_subscriber_count INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM sources WHERE site_id = site_uuid)::INT as source_count,
    (SELECT COUNT(*) FROM articles WHERE site_id = site_uuid AND status = 'raw')::INT as articles_raw,
    (SELECT COUNT(*) FROM articles WHERE site_id = site_uuid AND status = 'pending')::INT as articles_pending,
    (SELECT COUNT(*) FROM articles WHERE site_id = site_uuid AND status = 'published')::INT as articles_published,
    (SELECT COUNT(*) FROM articles WHERE site_id = site_uuid AND status = 'unpublished')::INT as articles_unpublished,
    (SELECT COUNT(*) FROM articles WHERE site_id = site_uuid AND status = 'failed')::INT as articles_failed,
    (SELECT COUNT(*) FROM articles WHERE site_id = site_uuid AND status = 'duplicate')::INT as articles_duplicate,
    (SELECT COUNT(*) FROM articles WHERE site_id = site_uuid AND status = 'filtered')::INT as articles_filtered,
    (SELECT COUNT(*) FROM subscribers WHERE site_id = site_uuid)::INT as subscriber_count,
    (SELECT COUNT(*) FROM subscribers WHERE site_id = site_uuid AND is_confirmed = true)::INT as published_subscriber_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- =============================================================
-- INCREMENT VIEW COUNT FUNCTION
-- =============================================================

CREATE OR REPLACE FUNCTION increment_view_count(article_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE articles
  SET view_count = view_count + 1
  WHERE id = article_uuid;
END;
$$ LANGUAGE plpgsql;

-- =============================================================
-- UPDATE CATEGORY COUNTS FUNCTION
-- =============================================================

CREATE OR REPLACE FUNCTION update_category_counts(site_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE categories c
  SET article_count = (
    SELECT COUNT(*) FROM articles
    WHERE category_id = c.id
    AND status = 'published'
  )
  WHERE site_id = site_uuid;
END;
$$ LANGUAGE plpgsql;

-- =============================================================
-- AUTO-CREATE USER ON AUTH.USERS INSERT TRIGGER
-- =============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create a corresponding row in the public.users table
  -- The user is created as a 'client' by default (not admin)
  -- They will not have an organization assigned initially
  INSERT INTO public.users (id, email, full_name, role, organization_id)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    'client',
    NULL
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create users row when auth.users is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
