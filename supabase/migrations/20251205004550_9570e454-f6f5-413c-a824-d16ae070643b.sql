-- Schedule daily scrape at midnight UTC
SELECT cron.schedule(
  'daily-scrape-startups',
  '0 0 * * *',
  $$
  SELECT net.http_post(
    url:='https://YOUR_PROJECT_REF.supabase.co/functions/v1/scrape-startups',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer <SUPABASE_ANON_KEY>"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);