// =============================================================
// Production House — Database Types
// Mirrors the Supabase schema exactly
// =============================================================

export type OrganizationStatus = 'active' | 'paused' | 'cancelled' | 'past_due';
export type SiteStatus = 'active' | 'paused' | 'building' | 'deleted';
export type ArticleStatus = 'raw' | 'rewriting' | 'pending' | 'published' | 'unpublished' | 'failed' | 'duplicate' | 'filtered' | 'deleted';
export type TemplateId = 'classic' | 'magazine' | 'minimal' | 'bold' | 'tech';
export type ToneOfVoice = 'professional' | 'casual' | 'authoritative' | 'friendly' | 'witty' | 'formal' | 'conversational';
export type SourceType = 'rss' | 'sitemap';
export type UserRole = 'client' | 'admin';
export type SubscriptionStatus = 'active' | 'past_due' | 'cancelled' | 'incomplete' | 'trialing' | 'paused';
export type DomainVerificationStatus = 'pending' | 'verifying' | 'verified' | 'active' | 'failed';
export type SocialPlatform = 'facebook' | 'linkedin' | 'x' | 'instagram' | 'tiktok';
export type BacklinkPlacement = 'inline' | 'banner' | 'both';
export type AlertType = 'cron_failure' | 'source_error' | 'rewrite_failure' | 'payment_failed' | 'domain_issue' | 'social_error' | 'system';
export type NotificationType = 'article_published' | 'new_subscriber' | 'billing';
export type AlertSeverity = 'info' | 'warning' | 'critical';
export type JobType = 'fetch_sources' | 'rewrite_articles' | 'publish_articles' | 'post_social' | 'send_newsletter' | 'check_domains';
export type JobStatus = 'running' | 'completed' | 'failed';
export type NewsletterStatus = 'draft' | 'sending' | 'sent' | 'failed';
export type ClientMemberRole = 'owner' | 'admin' | 'member';

// =============================================================
// Table Row Types
// =============================================================

export interface Organization {
  id: string;
  name: string;
  website_url: string | null;
  brand_summary: string | null;
  brand_colors: Record<string, string>;
  logo_url: string | null;
  favicon_url: string | null;
  stripe_customer_id: string | null;
  plan_status: OrganizationStatus;
  max_sites: number;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  organization_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  website_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientMember {
  id: string;
  client_id: string;
  user_id: string;
  role: ClientMemberRole;
  created_at: string;
}

export interface Site {
  id: string;
  organization_id: string;
  client_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  header_text: string | null;
  template_id: TemplateId;
  tone_of_voice: ToneOfVoice;
  status: SiteStatus;
  articles_per_day: number;
  cron_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface SiteSettings {
  id: string;
  site_id: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  text_color: string;
  background_color: string;
  font_heading: string;
  font_body: string;
  logo_url: string | null;
  favicon_url: string | null;
  custom_css: string | null;
  meta_title: string | null;
  meta_description: string | null;
  og_image_url: string | null;
  google_analytics_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Source {
  id: string;
  site_id: string;
  url: string;
  source_type: SourceType;
  name: string | null;
  is_active: boolean;
  is_validated: boolean;
  last_fetched_at: string | null;
  last_error: string | null;
  article_count: number;
  created_at: string;
  updated_at: string;
}

export interface Article {
  id: string;
  site_id: string;
  source_id: string | null;
  original_title: string;
  original_url: string;
  original_content: string | null;
  original_author: string | null;
  original_published_at: string | null;
  title: string | null;
  slug: string | null;
  content: string | null;
  excerpt: string | null;
  meta_description: string | null;
  featured_image_url: string | null;
  featured_image_stored: string | null;
  category_id: string | null;
  tags: string[];
  status: ArticleStatus;
  has_backlink: boolean;
  social_posted: boolean;
  social_posted_at: string | null;
  social_copy: string | null;
  social_hashtags: string[];
  content_hash: string | null;
  similarity_score: number | null;
  view_count: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  site_id: string;
  name: string;
  slug: string;
  article_count: number;
  created_at: string;
}

export interface Subscriber {
  id: string;
  site_id: string;
  email: string;
  is_confirmed: boolean;
  confirmation_token: string | null;
  unsubscribe_token: string;
  subscribed_at: string;
  confirmed_at: string | null;
  unsubscribed_at: string | null;
}

export interface SiteDomain {
  id: string;
  site_id: string;
  domain: string;
  domain_type: 'custom' | 'subdomain';
  verification_status: DomainVerificationStatus;
  verification_record: string | null;
  ssl_status: string;
  last_checked_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SocialAccount {
  id: string;
  site_id: string;
  platform: SocialPlatform;
  account_name: string | null;
  account_id: string | null;
  access_token: string | null;
  refresh_token: string | null;
  token_expires_at: string | null;
  is_active: boolean;
  provider: string;
  provider_profile_key: string | null;
  last_posted_at: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface BacklinkSettings {
  id: string;
  site_id: string;
  is_enabled: boolean;
  target_url: string | null;
  banner_image_url: string | null;
  banner_text: string | null;
  link_text: string | null;
  placement_type: BacklinkPlacement;
  frequency: number;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  organization_id: string;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  status: SubscriptionStatus;
  quantity: number;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  details: Record<string, unknown>;
  organization_id: string | null;
  site_id: string | null;
  is_resolved: boolean;
  resolved_at: string | null;
  created_at: string;
}

export interface Template {
  id: TemplateId;
  name: string;
  description: string | null;
  preview_url: string | null;
  layout_config: Record<string, unknown>;
  created_at: string;
}

export interface NewsletterLog {
  id: string;
  site_id: string;
  subject: string;
  content_html: string | null;
  summary_text: string | null;
  sent_at: string | null;
  recipient_count: number;
  resend_batch_id: string | null;
  status: NewsletterStatus;
  created_at: string;
}

export interface JobLog {
  id: string;
  job_type: JobType;
  site_id: string | null;
  status: JobStatus;
  articles_fetched: number;
  articles_rewritten: number;
  articles_published: number;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
}

// =============================================================
// Extended types (with joins)
// =============================================================

export interface SiteWithStats extends Site {
  settings?: SiteSettings;
  source_count: number;
  article_counts: {
    raw: number;
    published: number;
    unpublished: number;
    pending: number;
  };
  subscriber_count: number;
}

export interface ArticleWithCategory extends Article {
  category?: Category;
  source?: Source;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  link: string | null;
  created_at: string;
}

// =============================================================
// Supabase Database type (for typed client)
// =============================================================

export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          website_url: string | null;
          brand_summary: string | null;
          brand_colors: Record<string, string>;
          logo_url: string | null;
          favicon_url: string | null;
          stripe_customer_id: string | null;
          plan_status: OrganizationStatus;
          max_sites: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          website_url?: string | null;
          brand_summary?: string | null;
          brand_colors?: Record<string, string>;
          logo_url?: string | null;
          favicon_url?: string | null;
          stripe_customer_id?: string | null;
          plan_status?: OrganizationStatus;
          max_sites?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          website_url?: string | null;
          brand_summary?: string | null;
          brand_colors?: Record<string, string>;
          logo_url?: string | null;
          favicon_url?: string | null;
          stripe_customer_id?: string | null;
          plan_status?: OrganizationStatus;
          max_sites?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          role: UserRole;
          organization_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          organization_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          organization_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      sites: {
        Row: {
          id: string;
          organization_id: string;
          client_id: string | null;
          name: string;
          slug: string;
          description: string | null;
          header_text: string | null;
          template_id: TemplateId;
          tone_of_voice: ToneOfVoice;
          status: SiteStatus;
          articles_per_day: number;
          cron_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          client_id?: string | null;
          name: string;
          slug: string;
          description?: string | null;
          header_text?: string | null;
          template_id?: TemplateId;
          tone_of_voice?: ToneOfVoice;
          status?: SiteStatus;
          articles_per_day?: number;
          cron_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          client_id?: string | null;
          name?: string;
          slug?: string;
          description?: string | null;
          header_text?: string | null;
          template_id?: TemplateId;
          tone_of_voice?: ToneOfVoice;
          status?: SiteStatus;
          articles_per_day?: number;
          cron_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      clients: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          description: string | null;
          logo_url: string | null;
          website_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          description?: string | null;
          logo_url?: string | null;
          website_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          description?: string | null;
          logo_url?: string | null;
          website_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      client_members: {
        Row: {
          id: string;
          client_id: string;
          user_id: string;
          role: ClientMemberRole;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          user_id: string;
          role?: ClientMemberRole;
          created_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          user_id?: string;
          role?: ClientMemberRole;
          created_at?: string;
        };
        Relationships: [];
      };
      site_settings: {
        Row: {
          id: string;
          site_id: string;
          primary_color: string;
          secondary_color: string;
          accent_color: string;
          text_color: string;
          background_color: string;
          font_heading: string;
          font_body: string;
          logo_url: string | null;
          favicon_url: string | null;
          custom_css: string | null;
          meta_title: string | null;
          meta_description: string | null;
          og_image_url: string | null;
          google_analytics_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          site_id: string;
          primary_color?: string;
          secondary_color?: string;
          accent_color?: string;
          text_color?: string;
          background_color?: string;
          font_heading?: string;
          font_body?: string;
          logo_url?: string | null;
          favicon_url?: string | null;
          custom_css?: string | null;
          meta_title?: string | null;
          meta_description?: string | null;
          og_image_url?: string | null;
          google_analytics_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          site_id?: string;
          primary_color?: string;
          secondary_color?: string;
          accent_color?: string;
          text_color?: string;
          background_color?: string;
          font_heading?: string;
          font_body?: string;
          logo_url?: string | null;
          favicon_url?: string | null;
          custom_css?: string | null;
          meta_title?: string | null;
          meta_description?: string | null;
          og_image_url?: string | null;
          google_analytics_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      sources: {
        Row: {
          id: string;
          site_id: string;
          url: string;
          source_type: SourceType;
          name: string | null;
          is_active: boolean;
          is_validated: boolean;
          last_fetched_at: string | null;
          last_error: string | null;
          article_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          site_id: string;
          url: string;
          source_type?: SourceType;
          name?: string | null;
          is_active?: boolean;
          is_validated?: boolean;
          last_fetched_at?: string | null;
          last_error?: string | null;
          article_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          site_id?: string;
          url?: string;
          source_type?: SourceType;
          name?: string | null;
          is_active?: boolean;
          is_validated?: boolean;
          last_fetched_at?: string | null;
          last_error?: string | null;
          article_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      articles: {
        Row: {
          id: string;
          site_id: string;
          source_id: string | null;
          original_title: string;
          original_url: string;
          original_content: string | null;
          original_author: string | null;
          original_published_at: string | null;
          title: string | null;
          slug: string | null;
          content: string | null;
          excerpt: string | null;
          meta_description: string | null;
          featured_image_url: string | null;
          featured_image_stored: string | null;
          category_id: string | null;
          tags: string[];
          status: ArticleStatus;
          has_backlink: boolean;
          social_posted: boolean;
          social_posted_at: string | null;
          social_copy: string | null;
          social_hashtags: string[];
          content_hash: string | null;
          similarity_score: number | null;
          view_count: number;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          site_id: string;
          source_id?: string | null;
          original_title: string;
          original_url: string;
          original_content?: string | null;
          original_author?: string | null;
          original_published_at?: string | null;
          title?: string | null;
          slug?: string | null;
          content?: string | null;
          excerpt?: string | null;
          meta_description?: string | null;
          featured_image_url?: string | null;
          featured_image_stored?: string | null;
          category_id?: string | null;
          tags?: string[];
          status?: ArticleStatus;
          has_backlink?: boolean;
          social_posted?: boolean;
          social_posted_at?: string | null;
          social_copy?: string | null;
          social_hashtags?: string[];
          content_hash?: string | null;
          similarity_score?: number | null;
          view_count?: number;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          site_id?: string;
          source_id?: string | null;
          original_title?: string;
          original_url?: string;
          original_content?: string | null;
          original_author?: string | null;
          original_published_at?: string | null;
          title?: string | null;
          slug?: string | null;
          content?: string | null;
          excerpt?: string | null;
          meta_description?: string | null;
          featured_image_url?: string | null;
          featured_image_stored?: string | null;
          category_id?: string | null;
          tags?: string[];
          status?: ArticleStatus;
          has_backlink?: boolean;
          social_posted?: boolean;
          social_posted_at?: string | null;
          social_copy?: string | null;
          social_hashtags?: string[];
          content_hash?: string | null;
          similarity_score?: number | null;
          view_count?: number;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          site_id: string;
          name: string;
          slug: string;
          article_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          site_id: string;
          name: string;
          slug: string;
          article_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          site_id?: string;
          name?: string;
          slug?: string;
          article_count?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      subscribers: {
        Row: {
          id: string;
          site_id: string;
          email: string;
          is_confirmed: boolean;
          confirmation_token: string | null;
          unsubscribe_token: string;
          subscribed_at: string;
          confirmed_at: string | null;
          unsubscribed_at: string | null;
        };
        Insert: {
          id?: string;
          site_id: string;
          email: string;
          is_confirmed?: boolean;
          confirmation_token?: string | null;
          unsubscribe_token?: string;
          subscribed_at?: string;
          confirmed_at?: string | null;
          unsubscribed_at?: string | null;
        };
        Update: {
          id?: string;
          site_id?: string;
          email?: string;
          is_confirmed?: boolean;
          confirmation_token?: string | null;
          unsubscribe_token?: string;
          subscribed_at?: string;
          confirmed_at?: string | null;
          unsubscribed_at?: string | null;
        };
        Relationships: [];
      };
      site_domains: {
        Row: {
          id: string;
          site_id: string;
          domain: string;
          domain_type: 'custom' | 'subdomain';
          verification_status: DomainVerificationStatus;
          verification_record: string | null;
          ssl_status: string;
          last_checked_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          site_id: string;
          domain: string;
          domain_type?: 'custom' | 'subdomain';
          verification_status?: DomainVerificationStatus;
          verification_record?: string | null;
          ssl_status?: string;
          last_checked_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          site_id?: string;
          domain?: string;
          domain_type?: 'custom' | 'subdomain';
          verification_status?: DomainVerificationStatus;
          verification_record?: string | null;
          ssl_status?: string;
          last_checked_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      social_accounts: {
        Row: {
          id: string;
          site_id: string;
          platform: SocialPlatform;
          account_name: string | null;
          account_id: string | null;
          access_token: string | null;
          refresh_token: string | null;
          token_expires_at: string | null;
          is_active: boolean;
          provider: string;
          provider_profile_key: string | null;
          last_posted_at: string | null;
          last_error: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          site_id: string;
          platform: 'facebook' | 'linkedin' | 'x' | 'instagram' | 'tiktok';
          account_name?: string | null;
          account_id?: string | null;
          access_token?: string | null;
          refresh_token?: string | null;
          token_expires_at?: string | null;
          is_active?: boolean;
          provider?: string;
          provider_profile_key?: string | null;
          last_posted_at?: string | null;
          last_error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          site_id?: string;
          platform?: 'facebook' | 'linkedin' | 'x' | 'instagram' | 'tiktok';
          account_name?: string | null;
          account_id?: string | null;
          access_token?: string | null;
          refresh_token?: string | null;
          token_expires_at?: string | null;
          is_active?: boolean;
          provider?: string;
          provider_profile_key?: string | null;
          last_posted_at?: string | null;
          last_error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      backlink_settings: {
        Row: {
          id: string;
          site_id: string;
          is_enabled: boolean;
          target_url: string | null;
          banner_image_url: string | null;
          banner_text: string | null;
          link_text: string | null;
          placement_type: BacklinkPlacement;
          frequency: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          site_id: string;
          is_enabled?: boolean;
          target_url?: string | null;
          banner_image_url?: string | null;
          banner_text?: string | null;
          link_text?: string | null;
          placement_type?: BacklinkPlacement;
          frequency?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          site_id?: string;
          is_enabled?: boolean;
          target_url?: string | null;
          banner_image_url?: string | null;
          banner_text?: string | null;
          link_text?: string | null;
          placement_type?: BacklinkPlacement;
          frequency?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          organization_id: string;
          stripe_subscription_id: string | null;
          stripe_price_id: string | null;
          status: SubscriptionStatus;
          quantity: number;
          current_period_start: string | null;
          current_period_end: string | null;
          cancel_at_period_end: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          stripe_subscription_id?: string | null;
          stripe_price_id?: string | null;
          status?: SubscriptionStatus;
          quantity?: number;
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          stripe_subscription_id?: string | null;
          stripe_price_id?: string | null;
          status?: SubscriptionStatus;
          quantity?: number;
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      admin_alerts: {
        Row: {
          id: string;
          type: AlertType;
          severity: AlertSeverity;
          message: string;
          details: Record<string, unknown>;
          organization_id: string | null;
          site_id: string | null;
          is_resolved: boolean;
          resolved_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          type: AlertType;
          severity?: AlertSeverity;
          message: string;
          details?: Record<string, unknown>;
          organization_id?: string | null;
          site_id?: string | null;
          is_resolved?: boolean;
          resolved_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          type?: AlertType;
          severity?: AlertSeverity;
          message?: string;
          details?: Record<string, unknown>;
          organization_id?: string | null;
          site_id?: string | null;
          is_resolved?: boolean;
          resolved_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      templates: {
        Row: {
          id: TemplateId;
          name: string;
          description: string | null;
          preview_url: string | null;
          layout_config: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id: TemplateId;
          name: string;
          description?: string | null;
          preview_url?: string | null;
          layout_config?: Record<string, unknown>;
          created_at?: string;
        };
        Update: {
          id?: TemplateId;
          name?: string;
          description?: string | null;
          preview_url?: string | null;
          layout_config?: Record<string, unknown>;
          created_at?: string;
        };
        Relationships: [];
      };
      newsletter_log: {
        Row: {
          id: string;
          site_id: string;
          subject: string;
          content_html: string | null;
          summary_text: string | null;
          sent_at: string | null;
          recipient_count: number;
          resend_batch_id: string | null;
          status: NewsletterStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          site_id: string;
          subject: string;
          content_html?: string | null;
          summary_text?: string | null;
          sent_at?: string | null;
          recipient_count?: number;
          resend_batch_id?: string | null;
          status?: NewsletterStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          site_id?: string;
          subject?: string;
          content_html?: string | null;
          summary_text?: string | null;
          sent_at?: string | null;
          recipient_count?: number;
          resend_batch_id?: string | null;
          status?: NewsletterStatus;
          created_at?: string;
        };
        Relationships: [];
      };
      job_log: {
        Row: {
          id: string;
          job_type: JobType;
          site_id: string | null;
          status: JobStatus;
          articles_fetched: number;
          articles_rewritten: number;
          articles_published: number;
          error_message: string | null;
          started_at: string;
          completed_at: string | null;
          duration_ms: number | null;
        };
        Insert: {
          id?: string;
          job_type: JobType;
          site_id?: string | null;
          status?: JobStatus;
          articles_fetched?: number;
          articles_rewritten?: number;
          articles_published?: number;
          error_message?: string | null;
          started_at?: string;
          completed_at?: string | null;
          duration_ms?: number | null;
        };
        Update: {
          id?: string;
          job_type?: JobType;
          site_id?: string | null;
          status?: JobStatus;
          articles_fetched?: number;
          articles_rewritten?: number;
          articles_published?: number;
          error_message?: string | null;
          started_at?: string;
          completed_at?: string | null;
          duration_ms?: number | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_site_stats: { Args: { site_uuid: string }; Returns: { source_count: number; article_counts: Record<string, number>; subscriber_count: number } };
      increment_view_count: { Args: { article_uuid: string }; Returns: void };
      update_category_counts: { Args: { site_uuid: string }; Returns: void };
    };
    Enums: Record<string, never>;
  };
  CompositeTypes: Record<string, never>;
};
