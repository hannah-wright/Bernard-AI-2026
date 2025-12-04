-- Delete Finapp and related data
DELETE FROM data_sources WHERE startup_id = '55556666-5555-6666-5555-666655556666';
DELETE FROM funding_rounds WHERE startup_id = '55556666-5555-6666-5555-666655556666';
DELETE FROM startups WHERE id = '55556666-5555-6666-5555-666655556666';

-- Insert new US-based Seed round startup: Clerkie
INSERT INTO startups (id, name, description, eli5, website, sectors, city, state, country, estimated_revenue, estimated_size, buzz_score)
VALUES (
  '55556666-5555-6666-5555-666655556666',
  'Clerkie',
  'AI-powered financial wellness platform that provides personalized debt management and financial coaching to help consumers get out of debt faster.',
  'A smart helper that creates a plan to pay off your credit cards and loans faster.',
  'https://clerkie.io',
  ARRAY['Fintech', 'AI/ML']::sector_type[],
  'San Francisco',
  'CA',
  'United States',
  '$500K-1M',
  '12-20',
  72
);

-- Insert funding round
INSERT INTO funding_rounds (startup_id, round_type, amount, date, lead_investors)
VALUES (
  '55556666-5555-6666-5555-666655556666',
  'Seed',
  4500000,
  '2025-11-20',
  ARRAY['Y Combinator', 'Gradient Ventures']
);

-- Insert data source
INSERT INTO data_sources (startup_id, name, confidence, url)
VALUES (
  '55556666-5555-6666-5555-666655556666',
  'Crunchbase News',
  'high',
  'https://news.crunchbase.com/fintech/clerkie-seed-funding/'
);