/*
  # Add call status and industry fields to leads table

  1. New Columns
    - `call_status` (text) - Track call outcomes: not_called, answered, no_response, voicemail, busy, wrong_number
    - `industry` (text) - Industry category from CSV filename
    - `website` (text) - Company website
    - `revenue` (text) - Company revenue information
    - `ceo` (text) - CEO name
    - `whose_phone` (text) - Whose phone number it is
    - `go_skip` (text) - GO/SKIP indicator from CSV

  2. Updates
    - Update status check constraint to match new values
    - Add call_status check constraint
    - Set default values for new columns
*/

-- Add new columns to leads table
DO $$
BEGIN
  -- Add call_status column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'call_status'
  ) THEN
    ALTER TABLE leads ADD COLUMN call_status text DEFAULT 'not_called';
  END IF;

  -- Add industry column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'industry'
  ) THEN
    ALTER TABLE leads ADD COLUMN industry text DEFAULT '';
  END IF;

  -- Add website column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'website'
  ) THEN
    ALTER TABLE leads ADD COLUMN website text DEFAULT '';
  END IF;

  -- Add revenue column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'revenue'
  ) THEN
    ALTER TABLE leads ADD COLUMN revenue text DEFAULT '';
  END IF;

  -- Add ceo column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'ceo'
  ) THEN
    ALTER TABLE leads ADD COLUMN ceo text DEFAULT '';
  END IF;

  -- Add whose_phone column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'whose_phone'
  ) THEN
    ALTER TABLE leads ADD COLUMN whose_phone text DEFAULT '';
  END IF;

  -- Add go_skip column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'go_skip'
  ) THEN
    ALTER TABLE leads ADD COLUMN go_skip text DEFAULT '';
  END IF;
END $$;

-- Drop existing status constraint and add new one
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_status_check;
ALTER TABLE leads ADD CONSTRAINT leads_status_check 
  CHECK (status = ANY (ARRAY['prospect'::text, 'qualified'::text, 'proposal'::text, 'negotiation'::text, 'closed-won'::text, 'closed-lost'::text]));

-- Add call_status constraint
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_call_status_check;
ALTER TABLE leads ADD CONSTRAINT leads_call_status_check 
  CHECK (call_status = ANY (ARRAY['not_called'::text, 'answered'::text, 'no_response'::text, 'voicemail'::text, 'busy'::text, 'wrong_number'::text]));

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leads_call_status ON leads(call_status);
CREATE INDEX IF NOT EXISTS idx_leads_industry ON leads(industry);
CREATE INDEX IF NOT EXISTS idx_leads_company ON leads(company);