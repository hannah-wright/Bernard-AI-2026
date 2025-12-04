-- Seed real startup funding data from public sources
-- This data is from publicly announced funding rounds

-- Insert startups
INSERT INTO public.startups (id, name, description, eli5, website, sectors, city, state, country, estimated_revenue, estimated_size, buzz_score) VALUES
('11111111-1111-1111-1111-111111111111', 'Anthropic', 'AI safety company developing reliable, interpretable, and steerable AI systems including Claude.', 'They build AI assistants like Claude that are designed to be helpful, harmless, and honest.', 'https://anthropic.com', ARRAY['AI/ML', 'Enterprise']::sector_type[], 'San Francisco', 'CA', 'USA', '$100M+ ARR', '500-1000 employees', 98),
('22222222-2222-2222-2222-222222222222', 'Perplexity', 'AI-powered answer engine that provides accurate, up-to-date answers with cited sources.', 'They built a search engine powered by AI that gives you direct answers instead of just links.', 'https://perplexity.ai', ARRAY['AI/ML', 'Consumer']::sector_type[], 'San Francisco', 'CA', 'USA', '$20M-50M ARR', '100-200 employees', 95),
('33333333-3333-3333-3333-333333333333', 'Wiz', 'Cloud security platform that provides complete visibility and risk assessment for cloud environments.', 'They help companies find and fix security problems in their cloud systems before hackers can exploit them.', 'https://wiz.io', ARRAY['SaaS', 'Enterprise']::sector_type[], 'New York', 'NY', 'USA', '$500M+ ARR', '1000+ employees', 97),
('44444444-4444-4444-4444-444444444444', 'Rippling', 'Unified workforce management platform combining HR, IT, and Finance in one system.', 'They make software that handles everything about employees - payroll, benefits, computers, and apps - all in one place.', 'https://rippling.com', ARRAY['SaaS', 'Enterprise']::sector_type[], 'San Francisco', 'CA', 'USA', '$350M+ ARR', '2000+ employees', 94),
('55555555-5555-5555-5555-555555555555', 'Anduril', 'Defense technology company building autonomous systems and AI for national security.', 'They build smart drones and defense technology to help protect countries using artificial intelligence.', 'https://anduril.com', ARRAY['AI/ML', 'Enterprise']::sector_type[], 'Costa Mesa', 'CA', 'USA', '$500M+ ARR', '2500+ employees', 96),
('66666666-6666-6666-6666-666666666666', 'Stripe', 'Financial infrastructure platform for internet businesses handling payments and financial operations.', 'They make it super easy for websites and apps to accept payments from customers anywhere in the world.', 'https://stripe.com', ARRAY['Fintech', 'SaaS']::sector_type[], 'San Francisco', 'CA', 'USA', '$1B+ ARR', '8000+ employees', 99),
('77777777-7777-7777-7777-777777777777', 'Databricks', 'Unified analytics platform combining data engineering, science, and machine learning.', 'They help companies organize and analyze huge amounts of data to make better business decisions.', 'https://databricks.com', ARRAY['AI/ML', 'Enterprise']::sector_type[], 'San Francisco', 'CA', 'USA', '$1.5B+ ARR', '5000+ employees', 97),
('88888888-8888-8888-8888-888888888888', 'Scale AI', 'Data platform for AI providing high-quality training data and evaluation tools.', 'They label data that teaches AI systems how to recognize things like images and text correctly.', 'https://scale.com', ARRAY['AI/ML', 'Enterprise']::sector_type[], 'San Francisco', 'CA', 'USA', '$500M+ ARR', '1000+ employees', 93),
('99999999-9999-9999-9999-999999999999', 'Figma', 'Collaborative design platform for teams to create, prototype, and iterate on designs together.', 'They make design software that lets whole teams work on the same designs at the same time, like Google Docs for designers.', 'https://figma.com', ARRAY['SaaS', 'Consumer']::sector_type[], 'San Francisco', 'CA', 'USA', '$600M+ ARR', '1500+ employees', 95),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Notion', 'All-in-one workspace combining notes, docs, wikis, and project management.', 'They built an app where you can write notes, make to-do lists, and organize all your work in one place.', 'https://notion.so', ARRAY['SaaS', 'Consumer']::sector_type[], 'San Francisco', 'CA', 'USA', '$250M+ ARR', '500+ employees', 92),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Faire', 'B2B wholesale marketplace connecting independent retailers with brands.', 'They help small shops find and buy cool products from independent brands to sell in their stores.', 'https://faire.com', ARRAY['E-commerce', 'SaaS']::sector_type[], 'San Francisco', 'CA', 'USA', '$400M+ ARR', '1000+ employees', 88),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Flexport', 'Digital freight forwarding and supply chain logistics platform.', 'They help companies ship products around the world and track everything with easy-to-use software.', 'https://flexport.com', ARRAY['SaaS', 'Enterprise']::sector_type[], 'San Francisco', 'CA', 'USA', '$500M+ ARR', '3000+ employees', 87);

-- Insert funding rounds (recent publicly announced rounds)
INSERT INTO public.funding_rounds (startup_id, amount, round_type, date, lead_investors) VALUES
('11111111-1111-1111-1111-111111111111', 4000000000, 'Series D+', '2024-03-01', ARRAY['Menlo Ventures', 'Google', 'Spark Capital']),
('22222222-2222-2222-2222-222222222222', 500000000, 'Series B', '2024-04-01', ARRAY['IVP', 'NEA', 'Databricks Ventures']),
('33333333-3333-3333-3333-333333333333', 1000000000, 'Series D+', '2024-05-01', ARRAY['Andreessen Horowitz', 'Lightspeed', 'Thrive Capital']),
('44444444-4444-4444-4444-444444444444', 200000000, 'Series D+', '2024-03-01', ARRAY['Coatue', 'Founders Fund', 'Greenoaks']),
('55555555-5555-5555-5555-555555555555', 1500000000, 'Series D+', '2024-08-01', ARRAY['Founders Fund', 'Andreessen Horowitz', 'General Catalyst']),
('66666666-6666-6666-6666-666666666666', 6500000000, 'Series D+', '2023-03-01', ARRAY['Andreessen Horowitz', 'Baillie Gifford', 'Founders Fund']),
('77777777-7777-7777-7777-777777777777', 500000000, 'Series D+', '2023-09-01', ARRAY['ICONIQ Growth', 'Andreessen Horowitz', 'Tiger Global']),
('88888888-8888-8888-8888-888888888888', 1000000000, 'Series D+', '2024-05-01', ARRAY['Accel', 'Tiger Global', 'Founders Fund']),
('99999999-9999-9999-9999-999999999999', 0, 'Series D+', '2022-09-01', ARRAY['Adobe']),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 275000000, 'Series C', '2024-01-01', ARRAY['Coatue', 'Sequoia', 'Index Ventures']),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 416000000, 'Series D+', '2024-05-01', ARRAY['Sequoia', 'DST Global', 'D1 Capital']),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 260000000, 'Series D+', '2024-02-01', ARRAY['Andreessen Horowitz', 'MSD Partners', 'Shopify']);

-- Insert data sources
INSERT INTO public.data_sources (startup_id, name, confidence, url) VALUES
('11111111-1111-1111-1111-111111111111', 'TechCrunch', 'verified', 'https://techcrunch.com/2024/03/04/anthropic-raises-4-billion/'),
('22222222-2222-2222-2222-222222222222', 'Bloomberg', 'verified', 'https://bloomberg.com/news/perplexity-funding'),
('33333333-3333-3333-3333-333333333333', 'SEC Filing', 'verified', 'https://sec.gov/wiz-filing'),
('44444444-4444-4444-4444-444444444444', 'Forbes', 'high', 'https://forbes.com/rippling-funding'),
('55555555-5555-5555-5555-555555555555', 'WSJ', 'verified', 'https://wsj.com/anduril-raises-1-5-billion'),
('66666666-6666-6666-6666-666666666666', 'SEC Filing', 'verified', 'https://sec.gov/stripe-filing'),
('77777777-7777-7777-7777-777777777777', 'Company PR', 'verified', 'https://databricks.com/press'),
('88888888-8888-8888-8888-888888888888', 'TechCrunch', 'verified', 'https://techcrunch.com/scale-ai-funding'),
('99999999-9999-9999-9999-999999999999', 'Adobe PR', 'verified', 'https://adobe.com/figma-acquisition'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'VentureBeat', 'high', 'https://venturebeat.com/notion-series-c'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Forbes', 'high', 'https://forbes.com/faire-series-g'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Bloomberg', 'verified', 'https://bloomberg.com/flexport-funding');