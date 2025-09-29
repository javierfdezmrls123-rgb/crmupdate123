/*
  # Update projects table structure for client solutions

  1. Changes
    - Remove lead_id, value, stage, probability columns
    - Add company and description columns
    - Update constraints and policies
    - Rename expected_close_date to deadline for clarity

  2. Security
    - Maintain RLS policies for user data protection
*/

-- Add new columns
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS company text NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS description text NOT NULL DEFAULT '';

-- Remove old columns (in separate statements to handle dependencies)
ALTER TABLE projects DROP COLUMN IF EXISTS lead_id;
ALTER TABLE projects DROP COLUMN IF EXISTS value;
ALTER TABLE projects DROP COLUMN IF EXISTS stage;
ALTER TABLE projects DROP COLUMN IF EXISTS probability;

-- Rename expected_close_date to deadline for clarity
ALTER TABLE projects RENAME COLUMN expected_close_date TO deadline;

-- Update the company column to not have default
ALTER TABLE projects ALTER COLUMN company DROP DEFAULT;
ALTER TABLE projects ALTER COLUMN description DROP DEFAULT;