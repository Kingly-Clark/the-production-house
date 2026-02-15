-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule fetch sources every hour
SELECT cron.schedule(
  'fetch-sources-hourly',
  '0 * * * *',
  'SELECT net.http_post(
    ''https://PROJECT_ID.supabase.co/functions/v1/fetch-sources'',
    ''{}''::jsonb,
    ''{"Authorization":"Bearer ANON_KEY","Content-Type":"application/json"}''::jsonb,
    5000
  )'
);

-- Schedule rewrite articles every 15 minutes
SELECT cron.schedule(
  'rewrite-articles-15min',
  '*/15 * * * *',
  'SELECT net.http_post(
    ''https://PROJECT_ID.supabase.co/functions/v1/rewrite-articles'',
    ''{}''::jsonb,
    ''{"Authorization":"Bearer ANON_KEY","Content-Type":"application/json"}''::jsonb,
    5000
  )'
);

-- Schedule post social every 30 minutes
SELECT cron.schedule(
  'post-social-30min',
  '*/30 * * * *',
  'SELECT net.http_post(
    ''https://PROJECT_ID.supabase.co/functions/v1/post-social'',
    ''{}''::jsonb,
    ''{"Authorization":"Bearer ANON_KEY","Content-Type":"application/json"}''::jsonb,
    5000
  )'
);

-- Schedule weekly newsletter Friday at 10 AM UTC
SELECT cron.schedule(
  'send-newsletter-friday',
  '0 10 * * 5',
  'SELECT net.http_post(
    ''https://PROJECT_ID.supabase.co/functions/v1/send-newsletter'',
    ''{}''::jsonb,
    ''{"Authorization":"Bearer ANON_KEY","Content-Type":"application/json"}''::jsonb,
    5000
  )'
);

-- Schedule domain check every 5 minutes
SELECT cron.schedule(
  'check-domains-5min',
  '*/5 * * * *',
  'SELECT net.http_post(
    ''https://PROJECT_ID.supabase.co/functions/v1/check-domains'',
    ''{}''::jsonb,
    ''{"Authorization":"Bearer ANON_KEY","Content-Type":"application/json"}''::jsonb,
    5000
  )'
);

-- Enable pg_net extension if not exists (required for http_post)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create index on job_log for faster queries
CREATE INDEX IF NOT EXISTS job_log_job_type_created_at_idx
ON job_log(job_type, created_at DESC);

CREATE INDEX IF NOT EXISTS job_log_site_id_idx
ON job_log(site_id);

-- Create index on articles for pipeline queries
CREATE INDEX IF NOT EXISTS articles_status_site_id_idx
ON articles(site_id, status);

CREATE INDEX IF NOT EXISTS articles_original_url_site_id_idx
ON articles(site_id, original_url);

CREATE INDEX IF NOT EXISTS articles_content_hash_site_id_idx
ON articles(site_id, content_hash)
WHERE content_hash IS NOT NULL;

-- Create index on sources
CREATE INDEX IF NOT EXISTS sources_site_id_is_active_idx
ON sources(site_id, is_active);

-- Create function to log cron job failures
CREATE OR REPLACE FUNCTION log_cron_failure()
RETURNS void AS $$
BEGIN
  INSERT INTO admin_alerts (type, severity, message, details, is_resolved, created_at)
  VALUES (
    'cron_failure',
    'critical',
    'Cron job failed',
    jsonb_build_object('timestamp', now()),
    false,
    now()
  );
END;
$$ LANGUAGE plpgsql;

-- Create function to update site's article counts
CREATE OR REPLACE FUNCTION update_site_article_counts()
RETURNS TRIGGER AS $$
BEGIN
  -- Update category article count
  IF NEW.category_id IS NOT NULL THEN
    UPDATE categories
    SET article_count = article_count + 1
    WHERE id = NEW.category_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for article creation
DROP TRIGGER IF EXISTS update_category_count ON articles;
CREATE TRIGGER update_category_count
AFTER INSERT ON articles
FOR EACH ROW
EXECUTE FUNCTION update_site_article_counts();
