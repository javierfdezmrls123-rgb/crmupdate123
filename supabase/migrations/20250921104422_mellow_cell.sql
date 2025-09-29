-- Create the deals table
CREATE TABLE public.deals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
    title text NOT NULL,
    company text NOT NULL,
    description text DEFAULT '',
    deal_value numeric NOT NULL DEFAULT 0,
    payment_type text NOT NULL DEFAULT 'one_time' CHECK (payment_type IN ('one_time', 'monthly')),
    monthly_amount numeric NOT NULL DEFAULT 0,
    installation_fee numeric NOT NULL DEFAULT 0,
    contract_length_months integer NOT NULL DEFAULT 0,
    closed_date date NOT NULL DEFAULT CURRENT_DATE,
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX idx_deals_user_id ON public.deals(user_id);
CREATE INDEX idx_deals_status ON public.deals(status);
CREATE INDEX idx_deals_closed_date ON public.deals(closed_date);

-- RLS Policy: Users can view their own deals
CREATE POLICY "Users can view their own deals" ON public.deals
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

-- RLS Policy: Admins can view all deals
CREATE POLICY "Admins can view all deals" ON public.deals
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policy: Users can insert their own deals
CREATE POLICY "Users can insert their own deals" ON public.deals
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own deals
CREATE POLICY "Users can update their own deals" ON public.deals
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can delete their own deals
CREATE POLICY "Users can delete their own deals" ON public.deals
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);