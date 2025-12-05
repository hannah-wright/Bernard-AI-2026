-- Insert data sources for bootstrapped startups with proper enum casting
INSERT INTO public.data_sources (startup_id, name, url, confidence)
SELECT s.id, 'Company Website', s.website, 'high'::confidence_level
FROM public.startups s
WHERE s.name IN ('Mailchimp', 'Basecamp', 'Zoho', 'Spanx', 'GoPro', 'Tough Mudder', 'Patagonia', 'SurveyMonkey', 'GitHub', 'Atlassian')
ON CONFLICT DO NOTHING;

-- Add Bootstrapped funding rounds for companies that don't have any
INSERT INTO public.funding_rounds (startup_id, round_type, amount, date, lead_investors)
SELECT s.id, 'Bootstrapped', 0, '2024-01-01', ARRAY['Self-funded']
FROM public.startups s
WHERE s.name IN ('Mailchimp', 'Basecamp', 'Zoho', 'Spanx', 'GoPro', 'Tough Mudder', 'Patagonia', 'SurveyMonkey', 'GitHub', 'Atlassian')
AND NOT EXISTS (
  SELECT 1 FROM public.funding_rounds fr WHERE fr.startup_id = s.id
)
ON CONFLICT DO NOTHING;