-- Production House — Row Level Security (RLS) Policies
-- Wave 1: Authentication & Database Foundation
-- =============================================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE backlink_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_log ENABLE ROW LEVEL SECURITY;

-- =============================================================
-- HELPER FUNCTIONS
-- =============================================================

-- Get current user's organization ID
CREATE OR REPLACE FUNCTION auth.user_org_id()
RETURNS UUID AS $$
  SELECT organization_id FROM users WHERE id = auth.uid()
$$ LANGUAGE SQL STABLE;

-- Check if current user is admin
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS BOOLEAN AS $$
  SELECT role = 'admin' FROM users WHERE id = auth.uid()
$$ LANGUAGE SQL STABLE;

-- =============================================================
-- ORGANIZATIONS POLICIES
-- =============================================================

CREATE POLICY "org_select_own_or_admin"
  ON organizations FOR SELECT
  USING (
    id = auth.user_org_id() OR
    auth.is_admin()
  );

CREATE POLICY "org_insert_admin_only"
  ON organizations FOR INSERT
  WITH CHECK (auth.is_admin());

CREATE POLICY "org_update_own_or_admin"
  ON organizations FOR UPDATE
  USING (
    id = auth.user_org_id() OR
    auth.is_admin()
  )
  WITH CHECK (
    id = auth.user_org_id() OR
    auth.is_admin()
  );

CREATE POLICY "org_delete_admin_only"
  ON organizations FOR DELETE
  USING (auth.is_admin());

-- =============================================================
-- USERS POLICIES
-- =============================================================

CREATE POLICY "users_select_own_or_admin"
  ON users FOR SELECT
  USING (
    id = auth.uid() OR
    organization_id = auth.user_org_id() OR
    auth.is_admin()
  );

CREATE POLICY "users_insert_own"
  ON users FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "users_update_own_or_admin"
  ON users FOR UPDATE
  USING (
    id = auth.uid() OR
    auth.is_admin()
  )
  WITH CHECK (
    id = auth.uid() OR
    auth.is_admin()
  );

CREATE POLICY "users_delete_admin_only"
  ON users FOR DELETE
  USING (auth.is_admin());

-- =============================================================
-- SITES POLICIES
-- =============================================================

CREATE POLICY "sites_select_own_or_admin"
  ON sites FOR SELECT
  USING (
    organization_id = auth.user_org_id() OR
    auth.is_admin()
  );

CREATE POLICY "sites_insert_own_org"
  ON sites FOR INSERT
  WITH CHECK (organization_id = auth.user_org_id());

CREATE POLICY "sites_update_own_or_admin"
  ON sites FOR UPDATE
  USING (
    organization_id = auth.user_org_id() OR
    auth.is_admin()
  )
  WITH CHECK (
    organization_id = auth.user_org_id() OR
    auth.is_admin()
  );

CREATE POLICY "sites_delete_own_or_admin"
  ON sites FOR DELETE
  USING (
    organization_id = auth.user_org_id() OR
    auth.is_admin()
  );

-- =============================================================
-- SITE_SETTINGS POLICIES
-- =============================================================

CREATE POLICY "site_settings_select_via_site"
  ON site_settings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sites
      WHERE sites.id = site_settings.site_id
      AND (
        sites.organization_id = auth.user_org_id() OR
        auth.is_admin()
      )
    )
  );

CREATE POLICY "site_settings_insert_via_site"
  ON site_settings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sites
      WHERE sites.id = site_settings.site_id
      AND (
        sites.organization_id = auth.user_org_id()
      )
    )
  );

CREATE POLICY "site_settings_update_via_site"
  ON site_settings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM sites
      WHERE sites.id = site_settings.site_id
      AND (
        sites.organization_id = auth.user_org_id() OR
        auth.is_admin()
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sites
      WHERE sites.id = site_settings.site_id
      AND (
        sites.organization_id = auth.user_org_id()
      )
    )
  );

CREATE POLICY "site_settings_delete_via_site"
  ON site_settings FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM sites
      WHERE sites.id = site_settings.site_id
      AND (
        sites.organization_id = auth.user_org_id()
      )
    )
  );

-- =============================================================
-- SOURCES POLICIES
-- =============================================================

CREATE POLICY "sources_select_via_site"
  ON sources FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sites
      WHERE sites.id = sources.site_id
      AND (
        sites.organization_id = auth.user_org_id() OR
        auth.is_admin()
      )
    )
  );

CREATE POLICY "sources_insert_via_site"
  ON sources FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sites
      WHERE sites.id = sources.site_id
      AND sites.organization_id = auth.user_org_id()
    )
  );

CREATE POLICY "sources_update_via_site"
  ON sources FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM sites
      WHERE sites.id = sources.site_id
      AND (
        sites.organization_id = auth.user_org_id() OR
        auth.is_admin()
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sites
      WHERE sites.id = sources.site_id
      AND sites.organization_id = auth.user_org_id()
    )
  );

CREATE POLICY "sources_delete_via_site"
  ON sources FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM sites
      WHERE sites.id = sources.site_id
      AND sites.organization_id = auth.user_org_id()
    )
  );

-- =============================================================
-- ARTICLES POLICIES
-- =============================================================

-- Public read for published articles
CREATE POLICY "articles_select_published"
  ON articles FOR SELECT
  USING (status = 'published');

-- Own org full access
CREATE POLICY "articles_select_own_org"
  ON articles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sites
      WHERE sites.id = articles.site_id
      AND sites.organization_id = auth.user_org_id()
    ) OR
    auth.is_admin()
  );

CREATE POLICY "articles_insert_own_org"
  ON articles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sites
      WHERE sites.id = articles.site_id
      AND sites.organization_id = auth.user_org_id()
    )
  );

CREATE POLICY "articles_update_own_org"
  ON articles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM sites
      WHERE sites.id = articles.site_id
      AND (
        sites.organization_id = auth.user_org_id() OR
        auth.is_admin()
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sites
      WHERE sites.id = articles.site_id
      AND sites.organization_id = auth.user_org_id()
    )
  );

CREATE POLICY "articles_delete_own_org"
  ON articles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM sites
      WHERE sites.id = articles.site_id
      AND sites.organization_id = auth.user_org_id()
    )
  );

-- =============================================================
-- CATEGORIES POLICIES
-- =============================================================

CREATE POLICY "categories_select_via_site"
  ON categories FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sites
      WHERE sites.id = categories.site_id
      AND (
        sites.organization_id = auth.user_org_id() OR
        auth.is_admin()
      )
    )
  );

CREATE POLICY "categories_insert_via_site"
  ON categories FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sites
      WHERE sites.id = categories.site_id
      AND sites.organization_id = auth.user_org_id()
    )
  );

CREATE POLICY "categories_update_via_site"
  ON categories FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM sites
      WHERE sites.id = categories.site_id
      AND (
        sites.organization_id = auth.user_org_id() OR
        auth.is_admin()
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sites
      WHERE sites.id = categories.site_id
      AND sites.organization_id = auth.user_org_id()
    )
  );

CREATE POLICY "categories_delete_via_site"
  ON categories FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM sites
      WHERE sites.id = categories.site_id
      AND sites.organization_id = auth.user_org_id()
    )
  );

-- =============================================================
-- SUBSCRIBERS POLICIES
-- =============================================================

CREATE POLICY "subscribers_select_via_site"
  ON subscribers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sites
      WHERE sites.id = subscribers.site_id
      AND (
        sites.organization_id = auth.user_org_id() OR
        auth.is_admin()
      )
    )
  );

CREATE POLICY "subscribers_insert_via_site"
  ON subscribers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sites
      WHERE sites.id = subscribers.site_id
    )
  );

CREATE POLICY "subscribers_update_via_site"
  ON subscribers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM sites
      WHERE sites.id = subscribers.site_id
      AND (
        sites.organization_id = auth.user_org_id() OR
        auth.is_admin()
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sites
      WHERE sites.id = subscribers.site_id
      AND (
        sites.organization_id = auth.user_org_id()
      )
    )
  );

CREATE POLICY "subscribers_delete_via_site"
  ON subscribers FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM sites
      WHERE sites.id = subscribers.site_id
      AND sites.organization_id = auth.user_org_id()
    )
  );

-- =============================================================
-- SITE_DOMAINS POLICIES
-- =============================================================

CREATE POLICY "site_domains_select_via_site"
  ON site_domains FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sites
      WHERE sites.id = site_domains.site_id
      AND (
        sites.organization_id = auth.user_org_id() OR
        auth.is_admin()
      )
    )
  );

CREATE POLICY "site_domains_insert_via_site"
  ON site_domains FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sites
      WHERE sites.id = site_domains.site_id
      AND sites.organization_id = auth.user_org_id()
    )
  );

CREATE POLICY "site_domains_update_via_site"
  ON site_domains FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM sites
      WHERE sites.id = site_domains.site_id
      AND (
        sites.organization_id = auth.user_org_id() OR
        auth.is_admin()
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sites
      WHERE sites.id = site_domains.site_id
      AND sites.organization_id = auth.user_org_id()
    )
  );

CREATE POLICY "site_domains_delete_via_site"
  ON site_domains FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM sites
      WHERE sites.id = site_domains.site_id
      AND sites.organization_id = auth.user_org_id()
    )
  );

-- =============================================================
-- SOCIAL_ACCOUNTS POLICIES
-- =============================================================

CREATE POLICY "social_accounts_select_via_site"
  ON social_accounts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sites
      WHERE sites.id = social_accounts.site_id
      AND (
        sites.organization_id = auth.user_org_id() OR
        auth.is_admin()
      )
    )
  );

CREATE POLICY "social_accounts_insert_via_site"
  ON social_accounts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sites
      WHERE sites.id = social_accounts.site_id
      AND sites.organization_id = auth.user_org_id()
    )
  );

CREATE POLICY "social_accounts_update_via_site"
  ON social_accounts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM sites
      WHERE sites.id = social_accounts.site_id
      AND (
        sites.organization_id = auth.user_org_id() OR
        auth.is_admin()
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sites
      WHERE sites.id = social_accounts.site_id
      AND sites.organization_id = auth.user_org_id()
    )
  );

CREATE POLICY "social_accounts_delete_via_site"
  ON social_accounts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM sites
      WHERE sites.id = social_accounts.site_id
      AND sites.organization_id = auth.user_org_id()
    )
  );

-- =============================================================
-- BACKLINK_SETTINGS POLICIES
-- =============================================================

CREATE POLICY "backlink_settings_select_via_site"
  ON backlink_settings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sites
      WHERE sites.id = backlink_settings.site_id
      AND (
        sites.organization_id = auth.user_org_id() OR
        auth.is_admin()
      )
    )
  );

CREATE POLICY "backlink_settings_insert_via_site"
  ON backlink_settings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sites
      WHERE sites.id = backlink_settings.site_id
      AND sites.organization_id = auth.user_org_id()
    )
  );

CREATE POLICY "backlink_settings_update_via_site"
  ON backlink_settings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM sites
      WHERE sites.id = backlink_settings.site_id
      AND (
        sites.organization_id = auth.user_org_id() OR
        auth.is_admin()
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sites
      WHERE sites.id = backlink_settings.site_id
      AND sites.organization_id = auth.user_org_id()
    )
  );

CREATE POLICY "backlink_settings_delete_via_site"
  ON backlink_settings FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM sites
      WHERE sites.id = backlink_settings.site_id
      AND sites.organization_id = auth.user_org_id()
    )
  );

-- =============================================================
-- SUBSCRIPTIONS POLICIES
-- =============================================================

CREATE POLICY "subscriptions_select_own_or_admin"
  ON subscriptions FOR SELECT
  USING (
    organization_id = auth.user_org_id() OR
    auth.is_admin()
  );

CREATE POLICY "subscriptions_insert_admin_only"
  ON subscriptions FOR INSERT
  WITH CHECK (auth.is_admin());

CREATE POLICY "subscriptions_update_own_or_admin"
  ON subscriptions FOR UPDATE
  USING (
    organization_id = auth.user_org_id() OR
    auth.is_admin()
  )
  WITH CHECK (
    organization_id = auth.user_org_id() OR
    auth.is_admin()
  );

CREATE POLICY "subscriptions_delete_admin_only"
  ON subscriptions FOR DELETE
  USING (auth.is_admin());

-- =============================================================
-- ADMIN_ALERTS POLICIES
-- =============================================================

CREATE POLICY "admin_alerts_select_admin_only"
  ON admin_alerts FOR SELECT
  USING (auth.is_admin());

CREATE POLICY "admin_alerts_insert_admin_only"
  ON admin_alerts FOR INSERT
  WITH CHECK (auth.is_admin());

CREATE POLICY "admin_alerts_update_admin_only"
  ON admin_alerts FOR UPDATE
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());

CREATE POLICY "admin_alerts_delete_admin_only"
  ON admin_alerts FOR DELETE
  USING (auth.is_admin());

-- =============================================================
-- TEMPLATES POLICIES
-- =============================================================

-- Templates are public read-only
CREATE POLICY "templates_select_public"
  ON templates FOR SELECT
  USING (true);

CREATE POLICY "templates_insert_admin_only"
  ON templates FOR INSERT
  WITH CHECK (auth.is_admin());

CREATE POLICY "templates_update_admin_only"
  ON templates FOR UPDATE
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());

CREATE POLICY "templates_delete_admin_only"
  ON templates FOR DELETE
  USING (auth.is_admin());

-- =============================================================
-- NEWSLETTER_LOG POLICIES
-- =============================================================

CREATE POLICY "newsletter_log_select_via_site"
  ON newsletter_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sites
      WHERE sites.id = newsletter_log.site_id
      AND (
        sites.organization_id = auth.user_org_id() OR
        auth.is_admin()
      )
    )
  );

CREATE POLICY "newsletter_log_insert_via_site"
  ON newsletter_log FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sites
      WHERE sites.id = newsletter_log.site_id
      AND sites.organization_id = auth.user_org_id()
    )
  );

CREATE POLICY "newsletter_log_update_via_site"
  ON newsletter_log FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM sites
      WHERE sites.id = newsletter_log.site_id
      AND (
        sites.organization_id = auth.user_org_id() OR
        auth.is_admin()
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sites
      WHERE sites.id = newsletter_log.site_id
      AND sites.organization_id = auth.user_org_id()
    )
  );

CREATE POLICY "newsletter_log_delete_via_site"
  ON newsletter_log FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM sites
      WHERE sites.id = newsletter_log.site_id
      AND sites.organization_id = auth.user_org_id()
    )
  );

-- =============================================================
-- JOB_LOG POLICIES
-- =============================================================

CREATE POLICY "job_log_select_via_site_or_admin"
  ON job_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sites
      WHERE sites.id = job_log.site_id
      AND (
        sites.organization_id = auth.user_org_id() OR
        auth.is_admin()
      )
    ) OR
    auth.is_admin()
  );

CREATE POLICY "job_log_insert_admin_only"
  ON job_log FOR INSERT
  WITH CHECK (auth.is_admin());

CREATE POLICY "job_log_update_admin_only"
  ON job_log FOR UPDATE
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());

CREATE POLICY "job_log_delete_admin_only"
  ON job_log FOR DELETE
  USING (auth.is_admin());
