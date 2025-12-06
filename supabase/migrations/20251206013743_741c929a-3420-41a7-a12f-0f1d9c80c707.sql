-- Fix user's credits and tier after successful subscription
-- This is a one-time fix for user who subscribed but credits weren't updated
UPDATE profiles 
SET credits_remaining = 500, 
    subscription_tier = 'prod_TXoPZKDe4a3oSG',
    updated_at = now()
WHERE id = '3976eff9-89a4-4f2b-81e8-601c683c0046';