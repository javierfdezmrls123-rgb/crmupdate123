/*
  # Add scheduled_call column to leads table

  1. Changes
    - Add `scheduled_call` column to `leads` table
    - Column type: `timestamptz` (timestamp with time zone)
    - Nullable: true (leads may not have scheduled calls)
    - Default: null

  2. Security
    - No RLS changes needed (inherits existing policies)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'scheduled_call'
  ) THEN
    ALTER TABLE leads ADD COLUMN scheduled_call timestamptz;
  END IF;
END $$;