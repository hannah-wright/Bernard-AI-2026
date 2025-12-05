-- Insert Bootstrapped funding rounds for companies with no funding
INSERT INTO public.funding_rounds (startup_id, round_type, amount, date, lead_investors)
VALUES 
  ('af43e9cc-fe1b-4eae-812b-b7501e448aba', 'Bootstrapped', 0, '2024-01-01', ARRAY['Self-funded']),
  ('129e40c8-484f-4c71-82f1-47f04282bf5b', 'Bootstrapped', 0, '2024-01-01', ARRAY['Self-funded']),
  ('3a12c4a5-dc7d-469c-b4e4-43f661009595', 'Bootstrapped', 0, '2024-01-01', ARRAY['Self-funded']),
  ('ca914101-ffc4-43e6-97a5-ad0261dc5b73', 'Bootstrapped', 0, '2024-01-01', ARRAY['Self-funded']),
  ('f4207096-50fa-44e6-baf6-3edcdf3ea168', 'Bootstrapped', 0, '2024-01-01', ARRAY['Self-funded']),
  ('aba1852c-5b41-4c4b-acb4-86b4e025b540', 'Bootstrapped', 0, '2024-01-01', ARRAY['Self-funded']),
  ('7f5d4ee3-d3dd-4b7a-9c1f-fb55b22d9f45', 'Bootstrapped', 0, '2024-01-01', ARRAY['Self-funded']),
  ('d4b71fe4-6201-4e01-a4e0-37fee629cceb', 'Bootstrapped', 0, '2024-01-01', ARRAY['Self-funded'])
ON CONFLICT DO NOTHING;

-- Insert funding rounds for funded startups missing data
INSERT INTO public.funding_rounds (startup_id, round_type, amount, date, lead_investors)
VALUES 
  ('4517e58d-0168-4d9e-8ea4-757cb9365615', 'Series A', 25000000, '2024-06-01', ARRAY['Lightspeed']),
  ('6a4e4120-b89e-4cbb-9235-7bd9bef6df23', 'Series D+', 90000000, '2024-06-01', ARRAY['Accel', 'Nvidia']),
  ('422ee227-8f52-4a17-9857-f76a3d01bbd7', 'Series B', 74000000, '2024-04-01', ARRAY['IVP', 'NEA']),
  ('246b0785-3457-4cd8-aeea-8e5737669033', 'Series A', 125000000, '2022-10-01', ARRAY['Insight Partners']),
  ('61eed1fa-92e4-460c-b655-ab0b2f5df82f', 'Series A', 29000000, '2023-08-01', ARRAY['Tiger Global', 'Sequoia']),
  ('3872f3a7-4f56-4039-8cad-97189df1a68b', 'Series A', 20000000, '2023-12-01', ARRAY['Andreessen Horowitz']),
  ('6775cee6-61e7-4b0e-9d37-e1e851f4d803', 'Series A', 150000000, '2023-03-01', ARRAY['a16z']),
  ('9ab36ade-eb2d-4515-8b03-25a94ed109f5', 'Series C', 200000000, '2024-02-01', ARRAY['Kleiner Perkins']),
  ('c7f597fd-5fde-45a2-b81b-66f81d82f561', 'Series D+', 150000000, '2024-05-01', ARRAY['GV', 'Greenoaks']),
  ('42237694-ddbe-4cd5-b0c4-df86893b9a4f', 'Series A', 25000000, '2024-01-01', ARRAY['Stripe', 'Madrona']),
  ('c0228a39-7038-4288-a84a-92a747491721', 'Series B', 46000000, '2024-04-01', ARRAY['Menlo Ventures']),
  ('35cdb746-7bd7-48f7-bfff-96f09602e1d8', 'Series C', 50000000, '2023-01-01', ARRAY['Kleiner Perkins', 'Andreessen Horowitz']),
  ('fc3759b3-b644-4b04-8679-e755c8d41fce', 'Series A', 55000000, '2024-04-01', ARRAY['Spark Capital']),
  ('30d53ba6-34cc-4334-93b2-d61833a23d93', 'Series C', 100000000, '2024-06-01', ARRAY['Felicis', 'General Catalyst']),
  ('a52b61cf-f373-4035-9c80-5b82e8c4f58b', 'Series B', 80000000, '2024-01-01', ARRAY['Andreessen Horowitz', 'Nat Friedman']),
  ('1ecbd7e1-85a3-43d9-b84b-aaa83cb9d326', 'Series C', 100000000, '2023-08-01', ARRAY['Andreessen Horowitz']),
  ('76038bbf-bb59-45db-a465-2d60ef26c22a', 'Series C', 120000000, '2022-03-01', ARRAY['Accel']),
  ('630ea7b2-633d-4e91-8464-6f18afb2693b', 'Series D+', 270000000, '2021-12-01', ARRAY['Thrive Capital']),
  ('fe672b84-3860-4d9b-95b9-6a4419e55023', 'Series C', 400000000, '2022-01-01', ARRAY['Iconiq'])
ON CONFLICT DO NOTHING;

-- Delete large established companies (>$500M raised or very late stage)
DELETE FROM public.funding_rounds 
WHERE startup_id IN (
  SELECT id FROM public.startups 
  WHERE total_raised > 500000000 
  OR name IN ('Grab', 'Northvolt', 'Stripe Atlas', 'Anthropic', 'Redwood Materials', 'Plaid', 'Rappi', 'Thrasio', 'Flexport', 'QuantumScape', 'Ginkgo Bioworks', 'Devoted Health', 'Verily', 'Recursion', 'Rippling', 'Commonwealth Fusion', 'Revolut', 'Ramp', 'Brex', 'Inflection AI', 'Deel', 'Tempus', 'Bolt', 'Insitro', 'Meesho', 'Ro', 'Varo', 'Faire', 'Discord', 'Monday.com', 'Form Energy', 'Climeworks', 'Gusto', 'Carta', 'Gong', 'ClickUp', 'Hims & Hers', 'Whatnot', 'Cohere', 'Adept AI', 'Hugging Face', 'Mercury', 'Veho', 'Notion', 'Calendly', 'Figma', 'Lattice', 'Komodo Health', 'GitHub', 'Atlassian', 'Mailchimp', 'Basecamp', 'Zoho', 'Spanx', 'GoPro', 'Tough Mudder', 'Patagonia', 'SurveyMonkey', 'Cerebral', 'Pipe', 'Coda', 'Airbyte', 'Watershed', 'Calm', 'Headspace', 'Twelve', 'Loom', 'Duolingo')
);

DELETE FROM public.data_sources 
WHERE startup_id IN (
  SELECT id FROM public.startups 
  WHERE total_raised > 500000000 
  OR name IN ('Grab', 'Northvolt', 'Stripe Atlas', 'Anthropic', 'Redwood Materials', 'Plaid', 'Rappi', 'Thrasio', 'Flexport', 'QuantumScape', 'Ginkgo Bioworks', 'Devoted Health', 'Verily', 'Recursion', 'Rippling', 'Commonwealth Fusion', 'Revolut', 'Ramp', 'Brex', 'Inflection AI', 'Deel', 'Tempus', 'Bolt', 'Insitro', 'Meesho', 'Ro', 'Varo', 'Faire', 'Discord', 'Monday.com', 'Form Energy', 'Climeworks', 'Gusto', 'Carta', 'Gong', 'ClickUp', 'Hims & Hers', 'Whatnot', 'Cohere', 'Adept AI', 'Hugging Face', 'Mercury', 'Veho', 'Notion', 'Calendly', 'Figma', 'Lattice', 'Komodo Health', 'GitHub', 'Atlassian', 'Mailchimp', 'Basecamp', 'Zoho', 'Spanx', 'GoPro', 'Tough Mudder', 'Patagonia', 'SurveyMonkey', 'Cerebral', 'Pipe', 'Coda', 'Airbyte', 'Watershed', 'Calm', 'Headspace', 'Twelve', 'Loom', 'Duolingo')
);

DELETE FROM public.favorites 
WHERE startup_id IN (
  SELECT id FROM public.startups 
  WHERE total_raised > 500000000 
  OR name IN ('Grab', 'Northvolt', 'Stripe Atlas', 'Anthropic', 'Redwood Materials', 'Plaid', 'Rappi', 'Thrasio', 'Flexport', 'QuantumScape', 'Ginkgo Bioworks', 'Devoted Health', 'Verily', 'Recursion', 'Rippling', 'Commonwealth Fusion', 'Revolut', 'Ramp', 'Brex', 'Inflection AI', 'Deel', 'Tempus', 'Bolt', 'Insitro', 'Meesho', 'Ro', 'Varo', 'Faire', 'Discord', 'Monday.com', 'Form Energy', 'Climeworks', 'Gusto', 'Carta', 'Gong', 'ClickUp', 'Hims & Hers', 'Whatnot', 'Cohere', 'Adept AI', 'Hugging Face', 'Mercury', 'Veho', 'Notion', 'Calendly', 'Figma', 'Lattice', 'Komodo Health', 'GitHub', 'Atlassian', 'Mailchimp', 'Basecamp', 'Zoho', 'Spanx', 'GoPro', 'Tough Mudder', 'Patagonia', 'SurveyMonkey', 'Cerebral', 'Pipe', 'Coda', 'Airbyte', 'Watershed', 'Calm', 'Headspace', 'Twelve', 'Loom', 'Duolingo')
);

DELETE FROM public.startups 
WHERE total_raised > 500000000 
OR name IN ('Grab', 'Northvolt', 'Stripe Atlas', 'Anthropic', 'Redwood Materials', 'Plaid', 'Rappi', 'Thrasio', 'Flexport', 'QuantumScape', 'Ginkgo Bioworks', 'Devoted Health', 'Verily', 'Recursion', 'Rippling', 'Commonwealth Fusion', 'Revolut', 'Ramp', 'Brex', 'Inflection AI', 'Deel', 'Tempus', 'Bolt', 'Insitro', 'Meesho', 'Ro', 'Varo', 'Faire', 'Discord', 'Monday.com', 'Form Energy', 'Climeworks', 'Gusto', 'Carta', 'Gong', 'ClickUp', 'Hims & Hers', 'Whatnot', 'Cohere', 'Adept AI', 'Hugging Face', 'Mercury', 'Veho', 'Notion', 'Calendly', 'Figma', 'Lattice', 'Komodo Health', 'GitHub', 'Atlassian', 'Mailchimp', 'Basecamp', 'Zoho', 'Spanx', 'GoPro', 'Tough Mudder', 'Patagonia', 'SurveyMonkey', 'Cerebral', 'Pipe', 'Coda', 'Airbyte', 'Watershed', 'Calm', 'Headspace', 'Twelve', 'Loom', 'Duolingo');