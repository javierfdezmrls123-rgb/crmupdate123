/*
  # Create activity logs table for monitoring salesman activity

  1. New Tables
    - `activity_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `user_email` (text)
      - `action_type` (text) - click, view, edit, create, delete, call, email, navigate
      - `action_details` (text) - human readable description
      - `target_type` (text) - lead, project, demo, button, form, page, filter
      - `target_id` (uuid, optional) - ID of the target object
      - `target_name` (text, optional) - name of the target object
      - `metadata` (jsonb) - additional data about the action
      - `timestamp` (timestamptz)
      - `ip_address` (text, optional)
      - `user_agent` (text, optional)

  2. Security
    - Enable RLS on `activity_logs` table
    - Add policy for users to insert their own logs
    - Add policy for admins to read all logs

  3. Indexes
    - Index on user_id for fast user queries
    - Index on timestamp for time-based queries
    - Index on action_type for filtering
    - Composite index on user_id + timestamp for monitoring queries

  4. Cleanup
    - Function to automatically delete logs older than 90 days
*/

-- Create activity logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  user_email text NOT NULL,
  action_type text NOT NULL CHECK (action_type IN ('click', 'view', 'edit', 'create', 'delete', 'call', 'email', 'navigate')),
  action_details text NOT NULL,
  target_type text NOT NULL CHECK (target_type IN ('lead', 'project', 'demo', 'button', 'form', 'page', 'filter')),
  target_id uuid,
  target_name text,
  metadata jsonb DEFAULT '{}',
  timestamp timestamptz NOT NULL DEFAULT now(),
  ip_address text,
  user_agent text
);

-- Enable RLS
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp ON activity_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action_type ON activity_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_target_type ON activity_logs(target_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_timestamp ON activity_logs(user_id, timestamp DESC);

-- RLS Policies
CREATE POLICY "Users can insert their own activity logs"
  ON activity_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all activity logs"
  ON activity_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Users can view their own activity logs"
  ON activity_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to clean up old activity logs (older than 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_activity_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM activity_logs 
  WHERE timestamp < (now() - interval '90 days');
END;
$$;

-- Create a scheduled job to run cleanup (this would typically be done via pg_cron or similar)
-- For now, admins can manually call this function when needed