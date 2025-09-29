/*
  # Add status updates table for demos and projects

  1. New Tables
    - `status_updates`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `target_type` (text, either 'demo' or 'project')
      - `target_id` (uuid, foreign key to demos or projects)
      - `comment` (text, the status update comment)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `status_updates` table
    - Add policies for users to manage their own status updates
    - Add cascade delete when demos/projects are deleted

  3. Indexes
    - Index on target_type and target_id for efficient queries
    - Index on user_id for user-specific queries
*/

CREATE TABLE IF NOT EXISTS status_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  target_type text NOT NULL CHECK (target_type IN ('demo', 'project')),
  target_id uuid NOT NULL,
  comment text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE status_updates ENABLE ROW LEVEL SECURITY;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_status_updates_target ON status_updates(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_status_updates_user_id ON status_updates(user_id);
CREATE INDEX IF NOT EXISTS idx_status_updates_created_at ON status_updates(created_at DESC);

-- RLS Policies
CREATE POLICY "Users can insert their own status updates"
  ON status_updates
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view status updates for their items"
  ON status_updates
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM demos WHERE demos.id = target_id AND demos.user_id = auth.uid() AND target_type = 'demo'
    ) OR
    EXISTS (
      SELECT 1 FROM projects WHERE projects.id = target_id AND projects.user_id = auth.uid() AND target_type = 'project'
    )
  );

CREATE POLICY "Users can update their own status updates"
  ON status_updates
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own status updates"
  ON status_updates
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add foreign key constraints with cascade delete
-- Note: We can't add direct foreign keys since target_id can reference either demos or projects
-- The cascade delete will be handled by triggers

-- Trigger function to delete status updates when demos/projects are deleted
CREATE OR REPLACE FUNCTION delete_status_updates_on_target_delete()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM status_updates 
  WHERE target_id = OLD.id 
  AND target_type = TG_ARGV[0];
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for cascade delete
DROP TRIGGER IF EXISTS delete_demo_status_updates ON demos;
CREATE TRIGGER delete_demo_status_updates
  AFTER DELETE ON demos
  FOR EACH ROW
  EXECUTE FUNCTION delete_status_updates_on_target_delete('demo');

DROP TRIGGER IF EXISTS delete_project_status_updates ON projects;
CREATE TRIGGER delete_project_status_updates
  AFTER DELETE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION delete_status_updates_on_target_delete('project');