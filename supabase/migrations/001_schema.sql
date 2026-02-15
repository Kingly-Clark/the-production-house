-- Production House — Database Schema
-- Wave 1: Authentication & Database Foundation
-- =============================================================

-- organizations table
CREATE TABLE organizations (
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
CREATE TABLE users (
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
CREATE TABLE sites (
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
CREATE TABLE site_settings (
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
CREATE TABLE sources (
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

-- categories table (created before articles since articles references categories)
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    article_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(site_id, slug)
);

-- articles table (full schema with all columns including social, dedup, backlink fields)
CREATE TABLE articles (
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

-- subscribers table (newsletter)
CREATE TABLE subscribers (
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
CREATE TABLE site_domains (
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
CREATE TABLE social_accounts (
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
CREATE TABLE backlink_settings (
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

-- subscriptions table (Stripe sync)
CREATE TABLE subscriptions (
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
CREATE TABLE admin_alerts (
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

-- templates table (with seed data)
CREATE TABLE templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    preview_url TEXT,
    layout_config JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO templates (id, name, description) VALUES
('classic', 'Classic', 'Traditional blog layout with sidebar. Clean, professional, versatile.'),
('magazine', 'Magazine', 'Grid-based layout with featured hero article. Great for news sites.'),
('minimal', 'Minimal', 'Clean, whitespace-focused single-column layout. Modern and readable.'),
('bold', 'Bold', 'Large typography, dark theme default, high-impact visuals. Great for sports/entertainment.'),
('tech', 'Tech', 'Card-based layout with tag filtering. Ideal for technology and industry news.');

-- newsletter_log table
CREATE TABLE newsletter_log (
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
CREATE TABLE job_log (
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

-- =============================================================
-- INDEXES
-- =============================================================

CREATE INDEX idx_sites_org ON sites(organization_id);
CREATE INDEX idx_sites_slug ON sites(slug);
CREATE INDEX idx_sources_site ON sources(site_id);
CREATE INDEX idx_articles_site ON articles(site_id);
CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_site_status ON articles(site_id, status);
CREATE INDEX idx_articles_published ON articles(site_id, published_at DESC) WHERE status = 'published';
CREATE INDEX idx_articles_content_hash ON articles(content_hash);
CREATE INDEX idx_articles_slug ON articles(site_id, slug);
CREATE INDEX idx_categories_site ON categories(site_id);
CREATE INDEX idx_subscribers_site ON subscribers(site_id);
CREATE INDEX idx_subscribers_confirmed ON subscribers(site_id, is_confirmed) WHERE is_confirmed = true;
CREATE INDEX idx_domains_domain ON site_domains(domain);
CREATE INDEX idx_domains_site ON site_domains(site_id);
CREATE INDEX idx_alerts_unresolved ON admin_alerts(is_resolved, created_at DESC) WHERE is_resolved = false;
CREATE INDEX idx_job_log_recent ON job_log(started_at DESC);

-- =============================================================
-- TRIGGERS
-- =============================================================

-- updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables with updated_at column
CREATE TRIGGER set_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON sites FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON site_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON sources FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON articles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON site_domains FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON social_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON backlink_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
