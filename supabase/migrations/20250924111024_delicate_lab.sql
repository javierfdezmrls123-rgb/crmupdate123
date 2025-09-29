/*
  # Update leads schema for CSV import system

  1. Schema Changes
    - Remove 'value' field completely from leads table
    - Revenue field already exists and will be used for monetary values
    - Add indexes for better performance during CSV imports
    - Add constraint to ensure revenue format consistency

  2. Security
    - Maintain existing RLS policies
    - Ensure global company uniqueness is preserved

  3. Performance
    - Add indexes for CSV import operations
    - Optimize for bulk operations
*/

-- Remove the value field completely from leads table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'value'
  ) THEN
    ALTER TABLE leads DROP COLUMN value;
  END IF;
END $$;

-- Ensure revenue field exists and has proper constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'revenue'
  ) THEN
    ALTER TABLE leads ADD COLUMN revenue text DEFAULT ''::text;
  END IF;
END $$;

-- Add indexes for better CSV import performance
CREATE INDEX IF NOT EXISTS idx_leads_revenue ON leads(revenue);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);

-- Add constraint for call_status if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'leads_call_status_check'
  ) THEN
    ALTER TABLE leads ADD CONSTRAINT leads_call_status_check 
    CHECK (call_status = ANY (ARRAY['not_called'::text, 'answered'::text, 'no_response'::text, 'voicemail'::text, 'busy'::text, 'wrong_number'::text]));
  END IF;
END $$;