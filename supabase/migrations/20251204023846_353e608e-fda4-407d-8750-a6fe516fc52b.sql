-- Delete Norm AI and related data
DELETE FROM data_sources WHERE startup_id = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
DELETE FROM funding_rounds WHERE startup_id = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
DELETE FROM startups WHERE id = 'ffffffff-ffff-ffff-ffff-ffffffffffff';

-- Insert new US-based small Pre-Seed startup: Archetype AI
INSERT INTO startups (id, name, description, eli5, website, sectors, city, state, country, estimated_revenue, estimated_size, buzz_score)
VALUES (
  'ffffffff-ffff-ffff-ffff-ffffffffffff',
  'Archetype AI',
  'AI-powered product documentation tool that automatically generates user guides, changelogs, and help articles from product updates.',
  'A robot that writes all the help pages and guides for apps so humans don''t have to.',
  'https://archetype.dev',
  ARRAY['AI/ML', 'SaaS']::sector_type[],
  'Austin',
  'TX',
  'United States',
  '$50K-100K',
  '3-5',
  58
);

-- Insert funding round ($450K Pre-Seed)
INSERT INTO funding_rounds (startup_id, round_type, amount, date, lead_investors)
VALUES (
  'ffffffff-ffff-ffff-ffff-ffffffffffff',
  'Pre-Seed',
  450000,
  '2025-10-15',
  ARRAY['On Deck Angels', 'South Park Commons']
);

-- Insert data source
INSERT INTO data_sources (startup_id, name, confidence, url)
VALUES (
  'ffffffff-ffff-ffff-ffff-ffffffffffff',
  'TechCrunch',
  'high',
  'https://techcrunch.com/2025/10/archetype-ai-pre-seed/'
);