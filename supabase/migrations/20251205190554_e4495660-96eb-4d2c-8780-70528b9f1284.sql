-- Enable required extensions for cron scheduling
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Grant usage to postgres role
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- Schedule scrape-startups to run at 8am and 8pm PST (4am and 4pm UTC)
SELECT cron.schedule(
  'scrape-startups-twice-daily',
  '0 4,16 * * *',
  $$
  SELECT net.http_post(
    url := 'https://rkzscmfskerlanbsjugy.supabase.co/functions/v1/scrape-startups',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrenNjbWZza2VybGFuYnNqdWd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3MTMyNjgsImV4cCI6MjA4MDI4OTI2OH0.y-TfTnMCfHtWYa0LVkbyJ7__158jsr-AVve9XNyWcco"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);