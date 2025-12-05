-- Delete Midjourney from startups (they raised funding, not bootstrapped)
DELETE FROM funding_rounds WHERE startup_id IN (
  SELECT id FROM startups WHERE name ILIKE '%midjourney%'
);

DELETE FROM data_sources WHERE startup_id IN (
  SELECT id FROM startups WHERE name ILIKE '%midjourney%'
);

DELETE FROM startups WHERE name ILIKE '%midjourney%';