-- Add missing funding rounds for remaining startups
INSERT INTO public.funding_rounds (startup_id, round_type, amount, date, lead_investors)
VALUES 
  -- Funded startups
  ('670c6b1f-d60c-4ecc-846c-137814938a4e', 'Series B', 45000000, '2024-01-01', ARRAY['Elad Gil', 'Y Combinator']),
  ('25e5a7f7-5600-4d8e-92f9-76b33b6a202c', 'Series A', 23500000, '2024-02-01', ARRAY['Redpoint Ventures']),
  ('e366f58c-2fd3-4f38-bc33-a0c2e1bfb4fc', 'Series A', 25000000, '2023-10-01', ARRAY['Sequoia']),
  ('d35eaf84-98b5-4bde-b5ca-8d2e117ecab0', 'Series B', 60000000, '2024-09-01', ARRAY['Accel']),
  ('8b16e827-c8e9-4630-a5a2-37f34f3db2ac', 'Series B', 35000000, '2024-07-01', ARRAY['Accel', 'Stripe']),
  ('7058f120-00b0-4452-a83e-d7620e9eff86', 'Seed', 5000000, '2023-06-01', ARRAY['OSS Capital']),
  ('6fedc4fa-394f-4633-9550-02449ef886b7', 'Seed', 4000000, '2024-03-01', ARRAY['Craft Ventures']),
  ('6b26fea2-22e5-4811-857d-0f21d21fb8a5', 'Series B', 33000000, '2024-01-01', ARRAY['Y Combinator']),
  ('5fa41854-4469-43ba-80b4-a13ab0716800', 'Series A', 20000000, '2024-01-01', ARRAY['Accel']),
  ('6a47d1e5-1b56-46af-8efb-8933db30e065', 'Series A', 40000000, '2024-08-01', ARRAY['Andreessen Horowitz']),
  ('b53afbd4-9c75-4f43-b8dd-e396adb72576', 'Series C', 116000000, '2024-04-01', ARRAY['Sequoia', 'Y Combinator']),
  ('1728cc72-6d2f-480f-a2f2-4003c93d0136', 'Series A', 20000000, '2023-05-01', ARRAY['Crane Venture Partners']),
  -- Bootstrapped/Indie startups with smaller rounds or no external funding
  ('a1445d16-a935-4af3-a2b5-17680420a01e', 'Bootstrapped', 0, '2024-01-01', ARRAY['Self-funded']),
  ('5367f210-0291-4f42-884a-a1cb586277f1', 'Bootstrapped', 0, '2024-01-01', ARRAY['Self-funded']),
  ('329b9f64-1a2d-4a6f-ae65-5929b4e26ba6', 'Pre-Seed', 1500000, '2024-01-01', ARRAY['Y Combinator']),
  ('385e2dd0-c3ff-41db-bd7b-48ec2039aea8', 'Bootstrapped', 0, '2024-01-01', ARRAY['Self-funded']),
  ('d0d2c461-ca38-4e1a-a19d-7af42cf5e898', 'Bootstrapped', 0, '2024-01-01', ARRAY['Self-funded']),
  ('722a68c6-03a4-4608-9e48-47ed92e47f40', 'Seed', 2000000, '2023-06-01', ARRAY['Haystack']),
  ('dcf99f2f-7afd-45fb-a636-34d929625a49', 'Bootstrapped', 0, '2024-01-01', ARRAY['Self-funded']),
  ('f71cd220-bc27-4723-857e-50a8df3822e6', 'Bootstrapped', 0, '2024-01-01', ARRAY['Self-funded']),
  ('a733fcc0-19ed-48a7-9ccb-98085d9de223', 'Series A', 10000000, '2023-01-01', ARRAY['Spark Capital']),
  ('9c8e917b-2933-41cb-a267-d7beff2ceadf', 'Seed', 5000000, '2023-01-01', ARRAY['Heavybit']),
  ('7b65a721-8d37-41b8-8d31-15703038a3c0', 'Bootstrapped', 0, '2024-01-01', ARRAY['Self-funded'])
ON CONFLICT DO NOTHING;