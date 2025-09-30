/*
  # Fix Database Structure for CRM Application

  INSTRUCTIONS:
  1. Go to your Supabase Dashboard: https://supabase.com/dashboard
  2. Select your project
  3. Click on "SQL Editor" in the left sidebar
  4. Click "New Query"
  5. Copy and paste this entire SQL script
  6. Click "Run" to execute

  This migration fixes:
  - Ensures user_roles table exists with proper RLS policies
  - Ensures leads table has all required columns
  - Fixes RLS policies to allow proper data access
  - Adds missing indexes for performance
*/

-- ============================================================================
-- PART 1: Fix user_roles table
-- ============================================================================

-- Create user_roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'salesman' CHECK (role IN ('admin', 'salesman')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id),
  UNIQUE(email)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Drop and recreate all policies for user_roles
DROP POLICY IF EXISTS "Users can read their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert any role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update any role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete any role" ON public.user_roles;

-- Users can read their own role
CREATE POLICY "Users can read their own role"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own role (critical for first-time users)
CREATE POLICY "Users can insert their own role"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all roles
CREATE POLICY "Admins can view all roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can insert roles for any user
CREATE POLICY "Admins can insert any role"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update any role
CREATE POLICY "Admins can update any role"
  ON public.user_roles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can delete any role
CREATE POLICY "Admins can delete any role"
  ON public.user_roles
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_email ON public.user_roles(email);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- Create function to auto-assign roles to new users
CREATE OR REPLACE FUNCTION public.assign_user_role()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    CASE
      WHEN NEW.email IN ('ilia@envaire.com', 'javier@envaire.com') THEN 'admin'
      ELSE 'salesman'
    END
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic role assignment on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_user_role();

-- ============================================================================
-- PART 2: Ensure leads table has all required columns
-- ============================================================================

-- Add any missing columns to leads table
DO $$
BEGIN
  -- Add scheduled_call if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'scheduled_call'
  ) THEN
    ALTER TABLE public.leads ADD COLUMN scheduled_call timestamptz;
  END IF;

  -- Add call_status if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'call_status'
  ) THEN
    ALTER TABLE public.leads ADD COLUMN call_status text DEFAULT 'not_called';
  END IF;

  -- Add industry if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'industry'
  ) THEN
    ALTER TABLE public.leads ADD COLUMN industry text DEFAULT '';
  END IF;

  -- Add website if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'website'
  ) THEN
    ALTER TABLE public.leads ADD COLUMN website text DEFAULT '';
  END IF;

  -- Add revenue if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'revenue'
  ) THEN
    ALTER TABLE public.leads ADD COLUMN revenue text DEFAULT '';
  END IF;

  -- Add ceo if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'ceo'
  ) THEN
    ALTER TABLE public.leads ADD COLUMN ceo text DEFAULT '';
  END IF;

  -- Add whose_phone if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'whose_phone'
  ) THEN
    ALTER TABLE public.leads ADD COLUMN whose_phone text DEFAULT '';
  END IF;

  -- Add go_skip if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'go_skip'
  ) THEN
    ALTER TABLE public.leads ADD COLUMN go_skip text DEFAULT '';
  END IF;
END $$;

-- Ensure constraints are correct
ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_status_check;
ALTER TABLE public.leads ADD CONSTRAINT leads_status_check
  CHECK (status = ANY (ARRAY['prospect'::text, 'qualified'::text, 'proposal'::text, 'negotiation'::text, 'closed-won'::text, 'closed-lost'::text]));

ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_call_status_check;
ALTER TABLE public.leads ADD CONSTRAINT leads_call_status_check
  CHECK (call_status = ANY (ARRAY['not_called'::text, 'answered'::text, 'no_response'::text, 'voicemail'::text, 'busy'::text, 'wrong_number'::text]));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON public.leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_call_status ON public.leads(call_status);
CREATE INDEX IF NOT EXISTS idx_leads_industry ON public.leads(industry);
CREATE INDEX IF NOT EXISTS idx_leads_company ON public.leads(company);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at);

-- ============================================================================
-- PART 3: Ensure proper RLS policies on leads
-- ============================================================================

-- Enable RLS on leads table
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can manage their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can view their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can insert their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can update their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can delete their own leads" ON public.leads;

-- Create proper policies for leads
CREATE POLICY "Users can view their own leads"
  ON public.leads
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own leads"
  ON public.leads
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own leads"
  ON public.leads
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own leads"
  ON public.leads
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- VERIFICATION QUERIES (Run these after the migration to verify)
-- ============================================================================

-- Verify user_roles table exists and has data
-- SELECT * FROM public.user_roles;

-- Verify leads table structure
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'leads'
-- ORDER BY ordinal_position;

-- Verify RLS is enabled
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('user_roles', 'leads');

-- Verify policies exist
-- SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('user_roles', 'leads');