-- Drop the existing check constraint
ALTER TABLE public.credit_transactions DROP CONSTRAINT credit_transactions_type_check;

-- Add the new check constraint with 'trial_grant' included
ALTER TABLE public.credit_transactions ADD CONSTRAINT credit_transactions_type_check 
CHECK (type = ANY (ARRAY['purchase'::text, 'subscription_start'::text, 'subscription_renewal'::text, 'subscription_cancelled'::text, 'usage'::text, 'refund'::text, 'adjustment'::text, 'trial_grant'::text]));