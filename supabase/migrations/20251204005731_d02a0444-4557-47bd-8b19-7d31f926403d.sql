-- Delete Opti Identity and Solfium startups and their related data
DELETE FROM data_sources WHERE startup_id IN (
  SELECT id FROM startups WHERE name IN ('Opti Identity', 'Solfium')
);

DELETE FROM funding_rounds WHERE startup_id IN (
  SELECT id FROM startups WHERE name IN ('Opti Identity', 'Solfium')
);

DELETE FROM startups WHERE name IN ('Opti Identity', 'Solfium');