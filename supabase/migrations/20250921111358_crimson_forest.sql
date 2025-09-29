/*
  # Add salesman fields to deals table

  1. Changes
    - Add `salesman_name` column to store the salesman's display name
    - Add `salesman_email` column to store the salesman's email
    - These fields will be populated when creating deals

  2. Notes
    - Allows deals to be assigned to specific salesmen
    - Treasury will use these fields to display proper salesman info
*/

-- Add salesman fields to deals table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'deals' AND column_name = 'salesman_name'
  ) THEN
    ALTER TABLE deals ADD COLUMN salesman_name text DEFAULT '';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'deals' AND column_name = 'salesman_email'
  ) THEN
    ALTER TABLE deals ADD COLUMN salesman_email text DEFAULT '';
  END IF;
END $$;