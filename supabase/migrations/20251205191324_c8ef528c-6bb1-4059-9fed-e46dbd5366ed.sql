-- Migrate investor_quality to new neutral labels
UPDATE startups SET investor_quality = 'Unicorn-backers' WHERE investor_quality = 'Tier 1';
UPDATE startups SET investor_quality = 'Multi-exit fund' WHERE investor_quality = 'Tier 2';
UPDATE startups SET investor_quality = 'Established fund' WHERE investor_quality = 'Tier 3';
UPDATE startups SET investor_quality = 'Angel/Seed-focus' WHERE investor_quality = 'Angels only';

-- Also update social_proof JSON field if it contains cap_table_quality
UPDATE startups 
SET social_proof = jsonb_set(social_proof, '{cap_table_quality}', '"Unicorn-backers"')
WHERE social_proof->>'cap_table_quality' = 'Tier 1';

UPDATE startups 
SET social_proof = jsonb_set(social_proof, '{cap_table_quality}', '"Multi-exit fund"')
WHERE social_proof->>'cap_table_quality' = 'Tier 2';

UPDATE startups 
SET social_proof = jsonb_set(social_proof, '{cap_table_quality}', '"Established fund"')
WHERE social_proof->>'cap_table_quality' = 'Tier 3';

UPDATE startups 
SET social_proof = jsonb_set(social_proof, '{cap_table_quality}', '"Angel/Seed-focus"')
WHERE social_proof->>'cap_table_quality' = 'Angels only';