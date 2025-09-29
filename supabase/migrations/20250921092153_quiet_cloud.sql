/*
  # Create activity logs table for monitoring

  1. New Tables
    - `activity_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `user_email` (text)
      - `action_type` (text)
      - `action_details` (text)
      - `target_type` (text)
      - `target_id` (uuid, optional)
      - `target_name` (text, optional)
      - `metadata` (jsonb)
      - `timestamp` (timestamptz)
      - `ip_address` (text, optional)
      - `user_agent` (text, optional)

  2. Security
    - Enable RLS on `activity_logs` table
    - Add policy for users to insert their own logs
    - Add policy for admins to read all logs
*/

CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  user_email text NOT NULL DEFAULT '',
  action_type text NOT NULL,
  action_details text NOT NULL,
  target_type text NOT NULL,
  target_id uuid,
  target_name text,
  metadata jsonb DEFAULT '{}',
  timestamp timestamptz DEFAULT now(),
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Policy for users to insert their own activity logs
CREATE POLICY "Users can insert their own activity logs"
  ON activity_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy for admins to read all activity logs
CREATE POLICY "Admins can read all activity logs"
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

-- Policy for users to read their own activity logs
CREATE POLICY "Users can read their own activity logs"
  ON activity_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp ON activity_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action_type ON activity_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_target_type ON activity_logs(target_type);