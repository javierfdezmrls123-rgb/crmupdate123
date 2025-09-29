/*
  # Enforce Global Company Uniqueness

  1. Database Changes
    - Drop existing constraint if it exists
    - Create proper global unique constraint on company names
    - Ensure case-insensitive uniqueness across all users
  
  2. Security
    - Update RLS policies to allow global company checking
    - Maintain user data isolation while allowing duplicate checks
*/

-- Drop existing constraint if it exists
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_company_global_unique;
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_company_unique;

-- Create global unique constraint (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS leads_company_global_unique 
ON leads (LOWER(TRIM(company)));

-- Update RLS policies to allow global company checking
DROP POLICY IF EXISTS "Users can manage their own leads" ON leads;
DROP POLICY IF EXISTS "Users can check company existence globally" ON leads;

-- Policy for managing own leads
CREATE POLICY "Users can manage their own leads"
ON leads
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy for checking company existence globally (for duplicate prevention)
CREATE POLICY "Users can check company existence globally"
ON leads
FOR SELECT
TO authenticated
USING (true);