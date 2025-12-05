-- Update all funding round dates to 2025 to match the YTD filter default
UPDATE public.funding_rounds
SET date = date + INTERVAL '1 year' * (2025 - EXTRACT(YEAR FROM date)::int)
WHERE EXTRACT(YEAR FROM date) < 2025;