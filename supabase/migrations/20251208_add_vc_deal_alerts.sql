-- ============================================
-- VC Deal Alerts Table
-- ============================================
-- Allows users to save filter criteria for VC deals
-- and optionally receive email notifications for new matches.

CREATE TABLE IF NOT EXISTS public.vc_deal_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    tier TEXT DEFAULT 'all',
    firm TEXT DEFAULT 'all',
    sector TEXT DEFAULT 'all',
    time_range TEXT DEFAULT '30',
    email_alerts BOOLEAN DEFAULT TRUE,
    frequency TEXT DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekly')),
    last_sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add index for user lookups
CREATE INDEX IF NOT EXISTS idx_vc_deal_alerts_user_id ON public.vc_deal_alerts(user_id);

-- Add index for email processing (finding active alerts)
CREATE INDEX IF NOT EXISTS idx_vc_deal_alerts_email_active ON public.vc_deal_alerts(email_alerts, frequency) WHERE email_alerts = TRUE;

-- Enable RLS
ALTER TABLE public.vc_deal_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see their own alerts
CREATE POLICY "Users can view own vc deal alerts"
    ON public.vc_deal_alerts
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can create their own alerts
CREATE POLICY "Users can create own vc deal alerts"
    ON public.vc_deal_alerts
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own alerts
CREATE POLICY "Users can update own vc deal alerts"
    ON public.vc_deal_alerts
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own alerts
CREATE POLICY "Users can delete own vc deal alerts"
    ON public.vc_deal_alerts
    FOR DELETE
    USING (auth.uid() = user_id);

-- Service role has full access (for email processing)
CREATE POLICY "Service role full access to vc deal alerts"
    ON public.vc_deal_alerts
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Add comment for documentation
COMMENT ON TABLE public.vc_deal_alerts IS 'Stores user-saved VC deal filters with optional email notification settings';

