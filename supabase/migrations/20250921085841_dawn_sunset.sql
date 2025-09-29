/*
  # Create admin notifications table

  1. New Tables
    - `admin_notifications`
      - `id` (uuid, primary key)
      - `type` (text) - notification type (stale_lead, no_calls, inactive_salesman)
      - `title` (text) - notification title
      - `message` (text) - notification message
      - `lead_id` (uuid, optional) - reference to specific lead
      - `salesman_id` (uuid) - reference to salesman user
      - `salesman_email` (text) - salesman email for display
      - `is_read` (boolean) - read status
      - `priority` (text) - low, medium, high
      - `data` (jsonb) - additional notification data
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `admin_notifications` table
    - Add policies for admin users to manage notifications

  3. Indexes
    - Add indexes for performance on common queries
*/

CREATE TABLE IF NOT EXISTS admin_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  salesman_id uuid NOT NULL,
  salesman_email text NOT NULL,
  is_read boolean DEFAULT false NOT NULL,
  priority text NOT NULL,
  data jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT admin_notifications_priority_check CHECK (priority IN ('low', 'medium', 'high')),
  CONSTRAINT admin_notifications_type_check CHECK (type IN ('stale_lead', 'no_calls', 'inactive_salesman'))
);

ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_notifications_type ON admin_notifications(type);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_salesman_id ON admin_notifications(salesman_id);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_priority ON admin_notifications(priority);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_is_read ON admin_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON admin_notifications(created_at);

-- RLS Policies for admin users only
CREATE POLICY "Admins can view all notifications"
  ON admin_notifications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert notifications"
  ON admin_notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update notifications"
  ON admin_notifications
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete notifications"
  ON admin_notifications
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Function to automatically clean up old notifications (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
  DELETE FROM admin_notifications 
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;