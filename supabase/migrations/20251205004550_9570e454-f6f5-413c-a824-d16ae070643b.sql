-- Schedule daily scrape at midnight UTC
SELECT cron.schedule(
  'daily-scrape-startups',
  '0 0 * * *',
  $$
  SELECT net.http_post(
    url:='https://rkzscmfskerlanbsjugy.supabase.co/functions/v1/scrape-startups',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrenNjbWZza2VybGFuYnNqdWd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3MTMyNjgsImV4cCI6MjA4MDI4OTI2OH0.y-TfTnMCfHtWYa0LVkbyJ7__158jsr-AVve9XNyWcco"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);