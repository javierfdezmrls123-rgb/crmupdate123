/*
  # Add cancelled status to demos

  1. Changes
    - Update demos table status constraint to include 'cancelled'
    - This allows demos to be marked as cancelled in addition to pending, in-progress, and completed

  2. Security
    - No changes to RLS policies needed
    - Existing policies will work with the new status
*/

-- Drop the existing constraint
ALTER TABLE demos DROP CONSTRAINT IF EXISTS demos_status_check;

-- Add the new constraint with 'cancelled' status
ALTER TABLE demos ADD CONSTRAINT demos_status_check 
  CHECK (status = ANY (ARRAY['pending'::text, 'in-progress'::text, 'completed'::text, 'cancelled'::text]));