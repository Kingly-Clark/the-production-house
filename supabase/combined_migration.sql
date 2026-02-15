-- ================================================================
-- PRODUCTION HOUSE — COMBINED DATABASE MIGRATION
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ================================================================

-- ================================================================
-- PART 1: SCHEMA (from 001_schema.sql)
-- ================================================================

-- organizations table
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    website_url TEXT,
    brand_summary TEXT,
    brand_colors JSONB DEFAULT '{}',
    logo_url TEXT,
    favicon_url TEXT,
    stripe_customer_id TEXT UNIQUE,
    plan_status TEXT DEFAULT 'active' CHECK (plan_status IN ('active', 'paused', 'cancelled', 'past_due')),
    max_sites INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- users table (linked to auth.users)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'client' CHECK (role IN ('client', 'admin')),
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- sites table
CREATE TABLE IF NOT EXISTS sites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    header_text TEXT,
    template_id TEXT DEFAULT 'classic' CHECK (template_id IN ('classic', 'magazine', 'minimal', 'bold', 'tech')),
    tone_of_voice TEXT DEFAULT 'professional' CHECK (tone_of_voice IN ('professional', 'casual', 'authoritative', 'friendly', 'witty', 'formal', 'conversational')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'building', 'deleted')),
    articles_per_day INT DEFAULT 5,
    cron_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- site_settings table
CREATE TABLE IF NOT EXISTS site_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL UNIQUE REFERENCES sites(id) ON DELETE CASCADE,
    primary_color TEXT DEFAULT '#1a1a2e',
    secondary_color TEXT DEFAULT '#16213e',
    accent_color TEXT DEFAULT '#0f3460',
    text_color TEXT DEFAULT '#e4e4e4',
    background_color TEXT DEFAULT '#0a0a0a',
    font_heading TEXT DEFAULT 'Inter',
    font_body TEXT DEFAULT 'Inter',
    logo_url TEXT,
    favicon_url TEXT,
    custom_css TEXT,
    meta_title TEXT,
    meta_description TEXT,
    og_image_url TEXT,
    google_analytics_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- sources table
CREATE TABLE IF NOT EXISTS sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    source_type TEXT DEFAULT 'rss' CHECK (source_type IN ('rss', 'sitemap')),
    name TEXT,
    is_active BOOLEAN DEFAULT true,
    is_validated BOOLEAN DEFAULT false,
    last_fetched_at TIMESTAMPTZ,
    last_error TEXT,
    article_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(site_id, url)
);

-- categories table
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    article_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(site_id, slug)
);

-- articles table
CREATE TABLE IF NOT EXISTS articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    source_id UUID REFERENCES sources(id) ON DELETE SET NULL,
    original_title TEXT NOT NULL,
    original_url TEXT NOT NULL,
    original_content TEXT,
    original_author TEXT,
    original_published_at TIMESTAMPTZ,
    title TEXT,
    slug TEXT,
    content TEXT,
    excerpt TEXT,
    meta_description TEXT,
    featured_image_url TEXT,
    featured_image_stored TEXT,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    tags TEXT[] DEFAULT '{}',
    status TEXT DEFAULT 'raw' CHECK (status IN ('raw', 'rewriting', 'pending', 'published', 'unpublished', 'failed', 'duplicate', 'filtered')),
    has_backlink BOOLEAN DEFAULT false,
    social_posted BOOLEAN DEFAULT false,
    social_posted_at TIMESTAMPTZ,
    social_copy TEXT,
    social_hashtags TEXT[] DEFAULT '{}',
    content_hash TEXT,
    similarity_score FLOAT,
    view_count INT DEFAULT 0,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(site_id, original_url)
);

-- subscribers table
CREATE TABLE IF NOT EXISTS subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    is_confirmed BOOLEAN DEFAULT false,
    confirmation_token TEXT,
    unsubscribe_token TEXT DEFAULT gen_random_uuid()::text,
    subscribed_at TIMESTAMPTZ DEFAULT now(),
    confirmed_at TIMESTAMPTZ,
    unsubscribed_at TIMESTAMPTZ,
    UNIQUE(site_id, email)
);

-- site_domains table
CREATE TABLE IF NOT EXISTS site_domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    domain TEXT NOT NULL UNIQUE,
    domain_type TEXT DEFAULT 'custom' CHECK (domain_type IN ('custom', 'subdomain')),
    verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verifying', 'verified', 'active', 'failed')),
    verification_record TEXT,
    ssl_status TEXT DEFAULT 'pending',
    last_checked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- social_accounts table
CREATE TABLE IF NOT EXISTS social_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    platform TEXT NOT NULL CHECK (platform IN ('facebook', 'linkedin', 'x', 'instagram', 'tiktok')),
    account_name TEXT,
    account_id TEXT,
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    provider TEXT DEFAULT 'late',
    provider_profile_key TEXT,
    last_posted_at TIMESTAMPTZ,
    last_error TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(site_id, platform)
);

-- backlink_settings table
CREATE TABLE IF NOT EXISTS backlink_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL UNIQUE REFERENCES sites(id) ON DELETE CASCADE,
    is_enabled BOOLEAN DEFAULT false,
    target_url TEXT,
    banner_image_url TEXT,
    banner_text TEXT,
    link_text TEXT,
    placement_type TEXT DEFAULT 'inline' CHECK (placement_type IN ('inline', 'banner', 'both')),
    frequency INT DEFAULT 3,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    stripe_subscription_id TEXT UNIQUE,
    stripe_price_id TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'cancelled', 'incomplete', 'trialing', 'paused')),
    quantity INT DEFAULT 1,
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- admin_alerts table
CREATE TABLE IF NOT EXISTS admin_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('cron_failure', 'source_error', 'rewrite_failure', 'payment_failed', 'domain_issue', 'social_error', 'system')),
    severity TEXT DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'critical')),
    message TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    organization_id UUID REFERENCES organizations(id),
    site_id UUID REFERENCES sites(id),
    is_resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- templates table
CREATE TABLE IF NOT EXISTS templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    preview_url TEXT,
    layout_config JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed templates
INSERT INTO templates (id, name, description) VALUES
('classic', 'Classic', 'Traditional blog layout with sidebar. Clean, professional, versatile.'),
('magazine', 'Magazine', 'Grid-based layout with featured hero article. Great for news sites.'),
('minimal', 'Minimal', 'Clean, whitespace-focused single-column layout. Modern and readable.'),
('bold', 'Bold', 'Large typography, dark theme default, high-impact visuals. Great for sports/entertainment.'),
('tech', 'Tech', 'Card-based layout with tag filtering. Ideal for technology and industry news.')
ON CONFLICT (id) DO NOTHING;

-- newsletter_log table
CREATE TABLE IF NOT EXISTS newsletter_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    content_html TEXT,
    summary_text TEXT,
    sent_at TIMESTAMPTZ,
    recipient_count INT DEFAULT 0,
    resend_batch_id TEXT,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sending', 'sent', 'failed')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- job_log table
CREATE TABLE IF NOT EXISTS job_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_type TEXT NOT NULL CHECK (job_type IN ('fetch_sources', 'rewrite_articles', 'publish_articles', 'post_social', 'send_newsletter', 'check_domains')),
    site_id UUID REFERENCES sites(id),
    status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
    articles_fetched INT DEFAULT 0,
    articles_rewritten INT DEFAULT 0,
    articles_published INT DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ,
    duration_ms INT
);

-- ================================================================
-- INDEXES
-- ================================================================

CREATE INDEX IF NOT EXISTS idx_sites_org ON sites(organization_id);
CREATE INDEX IF NOT EXISTS idx_sites_slug ON sites(slug);
CREATE INDEX IF NOT EXISTS idx_sources_site ON sources(site_id);
CREATE INDEX IF NOT EXISTS idx_articles_site ON articles(site_id);
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_site_status ON articles(site_id, status);
CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(site_id, published_at DESC) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_articles_content_hash ON articles(content_hash);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(site_id, slug);
CREATE INDEX IF NOT EXISTS idx_categories_site ON categories(site_id);
CREATE INDEX IF NOT EXISTS idx_subscribers_site ON subscribers(site_id);
CREATE INDEX IF NOT EXISTS idx_subscribers_confirmed ON subscribers(site_id, is_confirmed) WHERE is_confirmed = true;
CREATE INDEX IF NOT EXISTS idx_domains_domain ON site_domains(domain);
CREATE INDEX IF NOT EXISTS idx_domains_site ON site_domains(site_id);
CREATE INDEX IF NOT EXISTS idx_alerts_unresolved ON admin_alerts(is_resolved, created_at DESC) WHERE is_resolved = false;
CREATE INDEX IF NOT EXISTS idx_job_log_recent ON job_log(started_at DESC);

-- ================================================================
-- TRIGGERS
-- ================================================================

-- updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS set_updated_at ON organizations;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON users;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON sites;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON sites FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON site_settings;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON site_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON sources;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON sources FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON articles;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON articles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON site_domains;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON site_domains FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON social_accounts;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON social_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON backlink_settings;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON backlink_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON subscriptions;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ================================================================
-- PART 2: ROW LEVEL SECURITY (from 002_rls.sql)
-- ================================================================

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

-- Helper functions (in public schema, referencing auth.uid())
CREATE OR REPLACE FUNCTION public.user_org_id()
RETURNS UUID AS $$
  SELECT organization_id FROM public.users WHERE id = auth.uid()
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE((SELECT role = 'admin' FROM public.users WHERE id = auth.uid()), false)
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- ORGANIZATIONS POLICIES
DROP POLICY IF EXISTS "org_select_own_or_admin" ON organizations;
CREATE POLICY "org_select_own_or_admin" ON organizations FOR SELECT
  USING (id = public.user_org_id() OR public.is_admin());

DROP POLICY IF EXISTS "org_insert_admin_only" ON organizations;
CREATE POLICY "org_insert_admin_only" ON organizations FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "org_update_own_or_admin" ON organizations;
CREATE POLICY "org_update_own_or_admin" ON organizations FOR UPDATE
  USING (id = public.user_org_id() OR public.is_admin())
  WITH CHECK (id = public.user_org_id() OR public.is_admin());

DROP POLICY IF EXISTS "org_delete_admin_only" ON organizations;
CREATE POLICY "org_delete_admin_only" ON organizations FOR DELETE
  USING (public.is_admin());

-- USERS POLICIES
DROP POLICY IF EXISTS "users_select_own_or_admin" ON users;
CREATE POLICY "users_select_own_or_admin" ON users FOR SELECT
  USING (id = auth.uid() OR organization_id = public.user_org_id() OR public.is_admin());

DROP POLICY IF EXISTS "users_insert_own" ON users;
CREATE POLICY "users_insert_own" ON users FOR INSERT
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "users_update_own_or_admin" ON users;
CREATE POLICY "users_update_own_or_admin" ON users FOR UPDATE
  USING (id = auth.uid() OR public.is_admin())
  WITH CHECK (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "users_delete_admin_only" ON users;
CREATE POLICY "users_delete_admin_only" ON users FOR DELETE
  USING (public.is_admin());

-- SITES POLICIES
DROP POLICY IF EXISTS "sites_select_own_or_admin" ON sites;
CREATE POLICY "sites_select_own_or_admin" ON sites FOR SELECT
  USING (organization_id = public.user_org_id() OR public.is_admin());

DROP POLICY IF EXISTS "sites_insert_own_org" ON sites;
CREATE POLICY "sites_insert_own_org" ON sites FOR INSERT
  WITH CHECK (organization_id = public.user_org_id());

DROP POLICY IF EXISTS "sites_update_own_or_admin" ON sites;
CREATE POLICY "sites_update_own_or_admin" ON sites FOR UPDATE
  USING (organization_id = public.user_org_id() OR public.is_admin())
  WITH CHECK (organization_id = public.user_org_id() OR public.is_admin());

DROP POLICY IF EXISTS "sites_delete_own_or_admin" ON sites;
CREATE POLICY "sites_delete_own_or_admin" ON sites FOR DELETE
  USING (organization_id = public.user_org_id() OR public.is_admin());

-- SITE_SETTINGS POLICIES
DROP POLICY IF EXISTS "site_settings_select_via_site" ON site_settings;
CREATE POLICY "site_settings_select_via_site" ON site_settings FOR SELECT
  USING (EXISTS (SELECT 1 FROM sites WHERE sites.id = site_settings.site_id AND (sites.organization_id = public.user_org_id() OR public.is_admin())));

DROP POLICY IF EXISTS "site_settings_insert_via_site" ON site_settings;
CREATE POLICY "site_settings_insert_via_site" ON site_settings FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM sites WHERE sites.id = site_settings.site_id AND sites.organization_id = public.user_org_id()));

DROP POLICY IF EXISTS "site_settings_update_via_site" ON site_settings;
CREATE POLICY "site_settings_update_via_site" ON site_settings FOR UPDATE
  USING (EXISTS (SELECT 1 FROM sites WHERE sites.id = site_settings.site_id AND (sites.organization_id = public.user_org_id() OR public.is_admin())))
  WITH CHECK (EXISTS (SELECT 1 FROM sites WHERE sites.id = site_settings.site_id AND sites.organization_id = public.user_org_id()));

DROP POLICY IF EXISTS "site_settings_delete_via_site" ON site_settings;
CREATE POLICY "site_settings_delete_via_site" ON site_settings FOR DELETE
  USING (EXISTS (SELECT 1 FROM sites WHERE sites.id = site_settings.site_id AND sites.organization_id = public.user_org_id()));

-- SOURCES POLICIES
DROP POLICY IF EXISTS "sources_select_via_site" ON sources;
CREATE POLICY "sources_select_via_site" ON sources FOR SELECT
  USING (EXISTS (SELECT 1 FROM sites WHERE sites.id = sources.site_id AND (sites.organization_id = public.user_org_id() OR public.is_admin())));

DROP POLICY IF EXISTS "sources_insert_via_site" ON sources;
CREATE POLICY "sources_insert_via_site" ON sources FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM sites WHERE sites.id = sources.site_id AND sites.organization_id = public.user_org_id()));

DROP POLICY IF EXISTS "sources_update_via_site" ON sources;
CREATE POLICY "sources_update_via_site" ON sources FOR UPDATE
  USING (EXISTS (SELECT 1 FROM sites WHERE sites.id = sources.site_id AND (sites.organization_id = public.user_org_id() OR public.is_admin())))
  WITH CHECK (EXISTS (SELECT 1 FROM sites WHERE sites.id = sources.site_id AND sites.organization_id = public.user_org_id()));

DROP POLICY IF EXISTS "sources_delete_via_site" ON sources;
CREATE POLICY "sources_delete_via_site" ON sources FOR DELETE
  USING (EXISTS (SELECT 1 FROM sites WHERE sites.id = sources.site_id AND sites.organization_id = public.user_org_id()));

-- ARTICLES POLICIES
DROP POLICY IF EXISTS "articles_select_published" ON articles;
CREATE POLICY "articles_select_published" ON articles FOR SELECT
  USING (status = 'published');

DROP POLICY IF EXISTS "articles_select_own_org" ON articles;
CREATE POLICY "articles_select_own_org" ON articles FOR SELECT
  USING (EXISTS (SELECT 1 FROM sites WHERE sites.id = articles.site_id AND sites.organization_id = public.user_org_id()) OR public.is_admin());

DROP POLICY IF EXISTS "articles_insert_own_org" ON articles;
CREATE POLICY "articles_insert_own_org" ON articles FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM sites WHERE sites.id = articles.site_id AND sites.organization_id = public.user_org_id()));

DROP POLICY IF EXISTS "articles_update_own_org" ON articles;
CREATE POLICY "articles_update_own_org" ON articles FOR UPDATE
  USING (EXISTS (SELECT 1 FROM sites WHERE sites.id = articles.site_id AND (sites.organization_id = public.user_org_id() OR public.is_admin())))
  WITH CHECK (EXISTS (SELECT 1 FROM sites WHERE sites.id = articles.site_id AND sites.organization_id = public.user_org_id()));

DROP POLICY IF EXISTS "articles_delete_own_org" ON articles;
CREATE POLICY "articles_delete_own_org" ON articles FOR DELETE
  USING (EXISTS (SELECT 1 FROM sites WHERE sites.id = articles.site_id AND sites.organization_id = public.user_org_id()));

-- CATEGORIES POLICIES
DROP POLICY IF EXISTS "categories_select_via_site" ON categories;
CREATE POLICY "categories_select_via_site" ON categories FOR SELECT
  USING (EXISTS (SELECT 1 FROM sites WHERE sites.id = categories.site_id AND (sites.organization_id = public.user_org_id() OR public.is_admin())));

DROP POLICY IF EXISTS "categories_insert_via_site" ON categories;
CREATE POLICY "categories_insert_via_site" ON categories FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM sites WHERE sites.id = categories.site_id AND sites.organization_id = public.user_org_id()));

DROP POLICY IF EXISTS "categories_update_via_site" ON categories;
CREATE POLICY "categories_update_via_site" ON categories FOR UPDATE
  USING (EXISTS (SELECT 1 FROM sites WHERE sites.id = categories.site_id AND (sites.organization_id = public.user_org_id() OR public.is_admin())))
  WITH CHECK (EXISTS (SELECT 1 FROM sites WHERE sites.id = categories.site_id AND sites.organization_id = public.user_org_id()));

DROP POLICY IF EXISTS "categories_delete_via_site" ON categories;
CREATE POLICY "categories_delete_via_site" ON categories FOR DELETE
  USING (EXISTS (SELECT 1 FROM sites WHERE sites.id = categories.site_id AND sites.organization_id = public.user_org_id()));

-- SUBSCRIBERS POLICIES
DROP POLICY IF EXISTS "subscribers_select_via_site" ON subscribers;
CREATE POLICY "subscribers_select_via_site" ON subscribers FOR SELECT
  USING (EXISTS (SELECT 1 FROM sites WHERE sites.id = subscribers.site_id AND (sites.organization_id = public.user_org_id() OR public.is_admin())));

DROP POLICY IF EXISTS "subscribers_insert_public" ON subscribers;
CREATE POLICY "subscribers_insert_public" ON subscribers FOR INSERT
  WITH CHECK (true);  -- Allow public newsletter signup

DROP POLICY IF EXISTS "subscribers_update_via_site" ON subscribers;
CREATE POLICY "subscribers_update_via_site" ON subscribers FOR UPDATE
  USING (EXISTS (SELECT 1 FROM sites WHERE sites.id = subscribers.site_id AND (sites.organization_id = public.user_org_id() OR public.is_admin())))
  WITH CHECK (EXISTS (SELECT 1 FROM sites WHERE sites.id = subscribers.site_id AND sites.organization_id = public.user_org_id()));

DROP POLICY IF EXISTS "subscribers_delete_via_site" ON subscribers;
CREATE POLICY "subscribers_delete_via_site" ON subscribers FOR DELETE
  USING (EXISTS (SELECT 1 FROM sites WHERE sites.id = subscribers.site_id AND sites.organization_id = public.user_org_id()));

-- SITE_DOMAINS POLICIES
DROP POLICY IF EXISTS "site_domains_select_via_site" ON site_domains;
CREATE POLICY "site_domains_select_via_site" ON site_domains FOR SELECT
  USING (EXISTS (SELECT 1 FROM sites WHERE sites.id = site_domains.site_id AND (sites.organization_id = public.user_org_id() OR public.is_admin())));

DROP POLICY IF EXISTS "site_domains_insert_via_site" ON site_domains;
CREATE POLICY "site_domains_insert_via_site" ON site_domains FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM sites WHERE sites.id = site_domains.site_id AND sites.organization_id = public.user_org_id()));

DROP POLICY IF EXISTS "site_domains_update_via_site" ON site_domains;
CREATE POLICY "site_domains_update_via_site" ON site_domains FOR UPDATE
  USING (EXISTS (SELECT 1 FROM sites WHERE sites.id = site_domains.site_id AND (sites.organization_id = public.user_org_id() OR public.is_admin())))
  WITH CHECK (EXISTS (SELECT 1 FROM sites WHERE sites.id = site_domains.site_id AND sites.organization_id = public.user_org_id()));

DROP POLICY IF EXISTS "site_domains_delete_via_site" ON site_domains;
CREATE POLICY "site_domains_delete_via_site" ON site_domains FOR DELETE
  USING (EXISTS (SELECT 1 FROM sites WHERE sites.id = site_domains.site_id AND sites.organization_id = public.user_org_id()));

-- SOCIAL_ACCOUNTS POLICIES
DROP POLICY IF EXISTS "social_accounts_select_via_site" ON social_accounts;
CREATE POLICY "social_accounts_select_via_site" ON social_accounts FOR SELECT
  USING (EXISTS (SELECT 1 FROM sites WHERE sites.id = social_accounts.site_id AND (sites.organization_id = public.user_org_id() OR public.is_admin())));

DROP POLICY IF EXISTS "social_accounts_insert_via_site" ON social_accounts;
CREATE POLICY "social_accounts_insert_via_site" ON social_accounts FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM sites WHERE sites.id = social_accounts.site_id AND sites.organization_id = public.user_org_id()));

DROP POLICY IF EXISTS "social_accounts_update_via_site" ON social_accounts;
CREATE POLICY "social_accounts_update_via_site" ON social_accounts FOR UPDATE
  USING (EXISTS (SELECT 1 FROM sites WHERE sites.id = social_accounts.site_id AND (sites.organization_id = public.user_org_id() OR public.is_admin())))
  WITH CHECK (EXISTS (SELECT 1 FROM sites WHERE sites.id = social_accounts.site_id AND sites.organization_id = public.user_org_id()));

DROP POLICY IF EXISTS "social_accounts_delete_via_site" ON social_accounts;
CREATE POLICY "social_accounts_delete_via_site" ON social_accounts FOR DELETE
  USING (EXISTS (SELECT 1 FROM sites WHERE sites.id = social_accounts.site_id AND sites.organization_id = public.user_org_id()));

-- BACKLINK_SETTINGS POLICIES
DROP POLICY IF EXISTS "backlink_settings_select_via_site" ON backlink_settings;
CREATE POLICY "backlink_settings_select_via_site" ON backlink_settings FOR SELECT
  USING (EXISTS (SELECT 1 FROM sites WHERE sites.id = backlink_settings.site_id AND (sites.organization_id = public.user_org_id() OR public.is_admin())));

DROP POLICY IF EXISTS "backlink_settings_insert_via_site" ON backlink_settings;
CREATE POLICY "backlink_settings_insert_via_site" ON backlink_settings FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM sites WHERE sites.id = backlink_settings.site_id AND sites.organization_id = public.user_org_id()));

DROP POLICY IF EXISTS "backlink_settings_update_via_site" ON backlink_settings;
CREATE POLICY "backlink_settings_update_via_site" ON backlink_settings FOR UPDATE
  USING (EXISTS (SELECT 1 FROM sites WHERE sites.id = backlink_settings.site_id AND (sites.organization_id = public.user_org_id() OR public.is_admin())))
  WITH CHECK (EXISTS (SELECT 1 FROM sites WHERE sites.id = backlink_settings.site_id AND sites.organization_id = public.user_org_id()));

DROP POLICY IF EXISTS "backlink_settings_delete_via_site" ON backlink_settings;
CREATE POLICY "backlink_settings_delete_via_site" ON backlink_settings FOR DELETE
  USING (EXISTS (SELECT 1 FROM sites WHERE sites.id = backlink_settings.site_id AND sites.organization_id = public.user_org_id()));

-- SUBSCRIPTIONS POLICIES
DROP POLICY IF EXISTS "subscriptions_select_own_or_admin" ON subscriptions;
CREATE POLICY "subscriptions_select_own_or_admin" ON subscriptions FOR SELECT
  USING (organization_id = public.user_org_id() OR public.is_admin());

DROP POLICY IF EXISTS "subscriptions_insert_admin_only" ON subscriptions;
CREATE POLICY "subscriptions_insert_admin_only" ON subscriptions FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "subscriptions_update_own_or_admin" ON subscriptions;
CREATE POLICY "subscriptions_update_own_or_admin" ON subscriptions FOR UPDATE
  USING (organization_id = public.user_org_id() OR public.is_admin())
  WITH CHECK (organization_id = public.user_org_id() OR public.is_admin());

DROP POLICY IF EXISTS "subscriptions_delete_admin_only" ON subscriptions;
CREATE POLICY "subscriptions_delete_admin_only" ON subscriptions FOR DELETE
  USING (public.is_admin());

-- ADMIN_ALERTS POLICIES
DROP POLICY IF EXISTS "admin_alerts_select_admin_only" ON admin_alerts;
CREATE POLICY "admin_alerts_select_admin_only" ON admin_alerts FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "admin_alerts_insert_admin_only" ON admin_alerts;
CREATE POLICY "admin_alerts_insert_admin_only" ON admin_alerts FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_alerts_update_admin_only" ON admin_alerts;
CREATE POLICY "admin_alerts_update_admin_only" ON admin_alerts FOR UPDATE
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_alerts_delete_admin_only" ON admin_alerts;
CREATE POLICY "admin_alerts_delete_admin_only" ON admin_alerts FOR DELETE
  USING (public.is_admin());

-- TEMPLATES POLICIES
DROP POLICY IF EXISTS "templates_select_public" ON templates;
CREATE POLICY "templates_select_public" ON templates FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "templates_insert_admin_only" ON templates;
CREATE POLICY "templates_insert_admin_only" ON templates FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "templates_update_admin_only" ON templates;
CREATE POLICY "templates_update_admin_only" ON templates FOR UPDATE
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "templates_delete_admin_only" ON templates;
CREATE POLICY "templates_delete_admin_only" ON templates FOR DELETE
  USING (public.is_admin());

-- NEWSLETTER_LOG POLICIES
DROP POLICY IF EXISTS "newsletter_log_select_via_site" ON newsletter_log;
CREATE POLICY "newsletter_log_select_via_site" ON newsletter_log FOR SELECT
  USING (EXISTS (SELECT 1 FROM sites WHERE sites.id = newsletter_log.site_id AND (sites.organization_id = public.user_org_id() OR public.is_admin())));

DROP POLICY IF EXISTS "newsletter_log_insert_via_site" ON newsletter_log;
CREATE POLICY "newsletter_log_insert_via_site" ON newsletter_log FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM sites WHERE sites.id = newsletter_log.site_id AND sites.organization_id = public.user_org_id()));

DROP POLICY IF EXISTS "newsletter_log_update_via_site" ON newsletter_log;
CREATE POLICY "newsletter_log_update_via_site" ON newsletter_log FOR UPDATE
  USING (EXISTS (SELECT 1 FROM sites WHERE sites.id = newsletter_log.site_id AND (sites.organization_id = public.user_org_id() OR public.is_admin())))
  WITH CHECK (EXISTS (SELECT 1 FROM sites WHERE sites.id = newsletter_log.site_id AND sites.organization_id = public.user_org_id()));

DROP POLICY IF EXISTS "newsletter_log_delete_via_site" ON newsletter_log;
CREATE POLICY "newsletter_log_delete_via_site" ON newsletter_log FOR DELETE
  USING (EXISTS (SELECT 1 FROM sites WHERE sites.id = newsletter_log.site_id AND sites.organization_id = public.user_org_id()));

-- JOB_LOG POLICIES
DROP POLICY IF EXISTS "job_log_select_via_site_or_admin" ON job_log;
CREATE POLICY "job_log_select_via_site_or_admin" ON job_log FOR SELECT
  USING (EXISTS (SELECT 1 FROM sites WHERE sites.id = job_log.site_id AND (sites.organization_id = public.user_org_id() OR public.is_admin())) OR public.is_admin());

DROP POLICY IF EXISTS "job_log_insert_admin_only" ON job_log;
CREATE POLICY "job_log_insert_admin_only" ON job_log FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "job_log_update_admin_only" ON job_log;
CREATE POLICY "job_log_update_admin_only" ON job_log FOR UPDATE
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "job_log_delete_admin_only" ON job_log;
CREATE POLICY "job_log_delete_admin_only" ON job_log FOR DELETE
  USING (public.is_admin());

-- ================================================================
-- PART 3: HELPER FUNCTIONS (from 003_functions.sql)
-- ================================================================

-- Site statistics function
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

-- Increment view count function
CREATE OR REPLACE FUNCTION increment_view_count(article_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE articles
  SET view_count = view_count + 1
  WHERE id = article_uuid;
END;
$$ LANGUAGE plpgsql;

-- Update category counts function
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

-- Auto-create user function (will be called by Supabase Auth Hook)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
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

-- NOTE: The trigger on auth.users must be created via Supabase Dashboard:
-- Go to: Database → Triggers → Create Trigger
-- Table: auth.users
-- Event: INSERT  
-- Function: handle_new_user

-- ================================================================
-- DONE! Your database is now set up.
-- ================================================================
