-- Update startups with lesser-known fast-growing companies
UPDATE public.startups SET 
  name = 'Gradium',
  description = 'AI-powered materials discovery platform accelerating the development of sustainable materials for construction and manufacturing.',
  eli5 = 'Uses AI to find new eco-friendly building materials faster than traditional research.',
  website = 'https://gradium.co',
  sectors = ARRAY['AI/ML', 'Climate Tech']::sector_type[],
  city = 'Boston', state = 'MA', country = 'USA',
  estimated_revenue = '$2M-5M', estimated_size = '20-50', buzz_score = 78
WHERE id = '11111111-1111-1111-1111-111111111111';

UPDATE public.startups SET 
  name = 'Raindrop',
  description = 'Atmospheric water harvesting technology that extracts clean drinking water from air using renewable energy.',
  eli5 = 'Makes drinking water out of thin air using solar power.',
  website = 'https://raindrop.io',
  sectors = ARRAY['Climate Tech', 'Healthcare']::sector_type[],
  city = 'San Diego', state = 'CA', country = 'USA',
  estimated_revenue = '$1M-2M', estimated_size = '10-20', buzz_score = 72
WHERE id = '22222222-2222-2222-2222-222222222222';

UPDATE public.startups SET 
  name = 'Truffle',
  description = 'Developer tools for Web3 that simplify smart contract development, testing, and deployment.',
  eli5 = 'Makes it easier for developers to build blockchain apps.',
  website = 'https://trufflesuite.com',
  sectors = ARRAY['Enterprise', 'SaaS']::sector_type[],
  city = 'Denver', state = 'CO', country = 'USA',
  estimated_revenue = '$5M-10M', estimated_size = '30-50', buzz_score = 65
WHERE id = '33333333-3333-3333-3333-333333333333';

UPDATE public.startups SET 
  name = 'Vessel',
  description = 'Unified API platform that connects SaaS applications through a single integration, reducing engineering time.',
  eli5 = 'One plug that connects all your business software together.',
  website = 'https://vessel.dev',
  sectors = ARRAY['SaaS', 'Enterprise']::sector_type[],
  city = 'Austin', state = 'TX', country = 'USA',
  estimated_revenue = '$3M-6M', estimated_size = '25-40', buzz_score = 70
WHERE id = '44444444-4444-4444-4444-444444444444';

UPDATE public.startups SET 
  name = 'Forma',
  description = 'Pre-tax benefits platform helping companies offer flexible employee perks and lifestyle spending accounts.',
  eli5 = 'Lets employees choose their own work benefits like gym memberships or childcare.',
  website = 'https://joinforma.com',
  sectors = ARRAY['Fintech', 'Enterprise']::sector_type[],
  city = 'San Francisco', state = 'CA', country = 'USA',
  estimated_revenue = '$8M-15M', estimated_size = '80-120', buzz_score = 74
WHERE id = '55555555-5555-5555-5555-555555555555';

UPDATE public.startups SET 
  name = 'Stytch',
  description = 'Passwordless authentication infrastructure providing APIs for modern login experiences.',
  eli5 = 'Helps apps let you log in without remembering passwords.',
  website = 'https://stytch.com',
  sectors = ARRAY['SaaS', 'Enterprise']::sector_type[],
  city = 'San Francisco', state = 'CA', country = 'USA',
  estimated_revenue = '$10M-20M', estimated_size = '60-100', buzz_score = 81
WHERE id = '66666666-6666-6666-6666-666666666666';

UPDATE public.startups SET 
  name = 'Airbyte',
  description = 'Open-source data integration platform for syncing data from applications, APIs, and databases.',
  eli5 = 'Moves your data from one place to another automatically.',
  website = 'https://airbyte.com',
  sectors = ARRAY['SaaS', 'Enterprise']::sector_type[],
  city = 'San Francisco', state = 'CA', country = 'USA',
  estimated_revenue = '$15M-25M', estimated_size = '100-150', buzz_score = 85
WHERE id = '77777777-7777-7777-7777-777777777777';

UPDATE public.startups SET 
  name = 'Tome',
  description = 'AI-native storytelling platform that generates presentations and documents from simple prompts.',
  eli5 = 'AI that creates beautiful presentations for you in seconds.',
  website = 'https://tome.app',
  sectors = ARRAY['AI/ML', 'SaaS']::sector_type[],
  city = 'San Francisco', state = 'CA', country = 'USA',
  estimated_revenue = '$5M-12M', estimated_size = '40-70', buzz_score = 79
WHERE id = '88888888-8888-8888-8888-888888888888';

UPDATE public.startups SET 
  name = 'Hyperbound',
  description = 'AI sales roleplay platform that trains SDRs with realistic AI buyer simulations.',
  eli5 = 'AI practice partners that help salespeople get better at selling.',
  website = 'https://hyperbound.ai',
  sectors = ARRAY['AI/ML', 'SaaS']::sector_type[],
  city = 'New York', state = 'NY', country = 'USA',
  estimated_revenue = '$1M-3M', estimated_size = '15-25', buzz_score = 68
WHERE id = '99999999-9999-9999-9999-999999999999';

UPDATE public.startups SET 
  name = 'Sardine',
  description = 'Fraud prevention and compliance platform for fintechs using device intelligence and behavior biometrics.',
  eli5 = 'Catches financial fraudsters by analyzing how they use their devices.',
  website = 'https://sardine.ai',
  sectors = ARRAY['Fintech', 'AI/ML']::sector_type[],
  city = 'San Francisco', state = 'CA', country = 'USA',
  estimated_revenue = '$12M-20M', estimated_size = '70-100', buzz_score = 76
WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

UPDATE public.startups SET 
  name = 'Pylon',
  description = 'B2B customer support platform built for Slack and Teams, managing tickets where conversations happen.',
  eli5 = 'Customer support that works inside Slack instead of email.',
  website = 'https://usepylon.com',
  sectors = ARRAY['SaaS', 'Enterprise']::sector_type[],
  city = 'San Francisco', state = 'CA', country = 'USA',
  estimated_revenue = '$2M-5M', estimated_size = '20-35', buzz_score = 71
WHERE id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

UPDATE public.startups SET 
  name = 'Athyna',
  description = 'Global talent marketplace connecting companies with pre-vetted remote professionals from emerging markets.',
  eli5 = 'Finds talented remote workers from around the world for your team.',
  website = 'https://athyna.com',
  sectors = ARRAY['SaaS', 'Enterprise']::sector_type[],
  city = 'Sydney', state = 'NSW', country = 'Australia',
  estimated_revenue = '$3M-7M', estimated_size = '30-50', buzz_score = 67
WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

-- Update funding rounds with more realistic amounts for early-stage startups
UPDATE public.funding_rounds SET amount = 12000000, round_type = 'Seed' WHERE startup_id = '11111111-1111-1111-1111-111111111111';
UPDATE public.funding_rounds SET amount = 8500000, round_type = 'Seed' WHERE startup_id = '22222222-2222-2222-2222-222222222222';
UPDATE public.funding_rounds SET amount = 18000000, round_type = 'Series A' WHERE startup_id = '33333333-3333-3333-3333-333333333333';
UPDATE public.funding_rounds SET amount = 15000000, round_type = 'Series A' WHERE startup_id = '44444444-4444-4444-4444-444444444444';
UPDATE public.funding_rounds SET amount = 35000000, round_type = 'Series B' WHERE startup_id = '55555555-5555-5555-5555-555555555555';
UPDATE public.funding_rounds SET amount = 45000000, round_type = 'Series B' WHERE startup_id = '66666666-6666-6666-6666-666666666666';
UPDATE public.funding_rounds SET amount = 75000000, round_type = 'Series B' WHERE startup_id = '77777777-7777-7777-7777-777777777777';
UPDATE public.funding_rounds SET amount = 28000000, round_type = 'Series A' WHERE startup_id = '88888888-8888-8888-8888-888888888888';
UPDATE public.funding_rounds SET amount = 5500000, round_type = 'Seed' WHERE startup_id = '99999999-9999-9999-9999-999999999999';
UPDATE public.funding_rounds SET amount = 52000000, round_type = 'Series B' WHERE startup_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
UPDATE public.funding_rounds SET amount = 9000000, round_type = 'Seed' WHERE startup_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
UPDATE public.funding_rounds SET amount = 6500000, round_type = 'Seed' WHERE startup_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';