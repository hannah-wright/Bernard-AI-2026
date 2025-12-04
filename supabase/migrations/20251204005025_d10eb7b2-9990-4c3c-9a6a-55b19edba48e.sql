-- Add new startups with November/December 2025 funding rounds
INSERT INTO public.startups (id, name, logo, description, eli5, website, sectors, city, state, country, estimated_revenue, estimated_size, buzz_score)
VALUES 
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Wordware', null, 'AI development operating system that lets teams build, deploy, and manage AI applications using a visual IDE without writing code.', 'A visual tool that helps anyone build AI apps like building with Lego blocks.', 'https://wordware.ai', ARRAY['AI/ML', 'SaaS']::sector_type[], 'San Francisco', 'CA', 'USA', '$2M-5M', '25-40', 88),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Orq.ai', null, 'Generative AI collaboration platform enabling teams to build, test, and deploy LLM applications with full observability.', 'Helps teams work together to build and test AI chatbots and tools.', 'https://orq.ai', ARRAY['AI/ML', 'Enterprise']::sector_type[], 'Amsterdam', null, 'Netherlands', '$1M-2M', '15-25', 74),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Peec AI', null, 'Brand visibility platform for the AI search era, helping companies optimize their presence in generative search results.', 'Helps brands show up when people search using AI tools like ChatGPT.', 'https://peec.ai', ARRAY['AI/ML', 'SaaS']::sector_type[], 'Tel Aviv', null, 'Israel', '$3M-6M', '30-45', 82),
  ('11112222-1111-2222-1111-222211112222', 'Magic Patterns', null, 'AI design tool that generates production-ready UI components and design systems from natural language descriptions.', 'Describe what you want and it creates beautiful website designs instantly.', 'https://magicpatterns.com', ARRAY['AI/ML', 'SaaS']::sector_type[], 'San Francisco', 'CA', 'USA', '$1M-3M', '12-20', 79),
  ('22223333-2222-3333-2222-333322223333', 'Solfium', null, 'Solar energy fintech providing affordable financing for SMBs in Mexico to adopt clean energy solutions.', 'Helps small businesses in Mexico get solar panels with easy payment plans.', 'https://solfium.mx', ARRAY['Climate Tech', 'Fintech']::sector_type[], 'Mexico City', null, 'Mexico', '$4M-8M', '40-60', 71),
  ('33334444-3333-4444-3333-444433334444', 'Opti Identity', null, 'AI-powered identity security platform preventing account takeovers and credential fraud for enterprises.', 'Uses AI to stop hackers from stealing your login and pretending to be you.', 'https://opti.security', ARRAY['AI/ML', 'Enterprise']::sector_type[], 'New York', 'NY', 'USA', '$2M-4M', '20-35', 77),
  ('44445555-4444-5555-4444-555544445555', 'Nabla', null, 'AI copilot for healthcare that automates clinical documentation and administrative tasks for physicians.', 'AI assistant that writes medical notes for doctors so they can focus on patients.', 'https://nabla.com', ARRAY['AI/ML', 'Healthcare']::sector_type[], 'Paris', null, 'France', '$5M-10M', '50-80', 83),
  ('55556666-5555-6666-5555-666655556666', 'Finapp', null, 'Digital banking infrastructure enabling traditional banks to launch modern fintech products quickly.', 'Helps old banks offer cool app features like newer digital banks do.', 'https://finapp.pl', ARRAY['Fintech', 'SaaS']::sector_type[], 'Warsaw', null, 'Poland', '$3M-6M', '35-50', 69)
ON CONFLICT (id) DO NOTHING;

-- Add funding rounds for new startups (November/December 2025)
INSERT INTO public.funding_rounds (startup_id, round_type, amount, date, lead_investors)
VALUES 
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Seed', 30000000, '2025-11-28', ARRAY['Spark Capital', 'Felicis', 'Y Combinator']),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Seed', 5500000, '2025-12-03', ARRAY['Peak Capital', 'Notion Capital']),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Series A', 21000000, '2025-11-15', ARRAY['Index Ventures', 'Sequoia Capital']),
  ('11112222-1111-2222-1111-222211112222', 'Series A', 6000000, '2025-11-20', ARRAY['Standard Capital', 'Y Combinator', 'Pioneer Fund']),
  ('22223333-2222-3333-2222-333322223333', 'Series A', 10000000, '2025-11-25', ARRAY['Accion Venture Lab', 'ALIVE Ventures']),
  ('33334444-3333-4444-3333-444433334444', 'Seed', 20000000, '2025-12-01', ARRAY['Andreessen Horowitz', 'Greylock']),
  ('44445555-4444-5555-4444-555544445555', 'Series A', 24000000, '2025-11-18', ARRAY['Cathay Innovation', 'ZEBOX Ventures']),
  ('55556666-5555-6666-5555-666655556666', 'Series A', 9500000, '2025-11-22', ARRAY['Credo Ventures', 'Market One Capital']);

-- Add data sources for new startups
INSERT INTO public.data_sources (startup_id, name, confidence, url)
VALUES 
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'TechCrunch', 'verified', 'https://techcrunch.com/wordware-funding'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Vestbee', 'high', 'https://vestbee.com/orqai-funding'),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'StartupHub', 'verified', 'https://startuphub.ai/peec-ai-funding'),
  ('11112222-1111-2222-1111-222211112222', 'Company PR', 'verified', 'https://magicpatterns.com/blog/series-a'),
  ('22223333-2222-3333-2222-333322223333', 'Accion PR', 'verified', 'https://accion.org/solfium-series-a'),
  ('33334444-3333-4444-3333-444433334444', 'VentureBeat', 'high', 'https://venturebeat.com/opti-funding'),
  ('44445555-4444-5555-4444-555544445555', 'FierceHealthcare', 'verified', 'https://fiercehealthcare.com/nabla-funding'),
  ('55556666-5555-6666-5555-666655556666', 'EU-Startups', 'high', 'https://eu-startups.com/finapp-series-a');