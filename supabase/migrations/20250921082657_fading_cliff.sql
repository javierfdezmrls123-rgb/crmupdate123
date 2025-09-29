/*
  # Add User Roles and Update Row Level Security

  1. New Tables
    - `user_roles` - Stores user roles (admin/salesman)
  
  2. Updated Security
    - Leads: Each user can only see their own leads
    - Projects: All authenticated users can see all projects
    - Demos: All authenticated users can see all demos
    - Activities: All authenticated users can see all activities
  
  3. Admin Users
    - ilia@envaire.com (admin)
    - javier@envaire.com (admin)
    - Other users default to 'salesman' role
*/

-- Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'salesman' CHECK (role IN ('admin', 'salesman')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id),
  UNIQUE(email)
);

-- Enable RLS on user_roles
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Policy for user_roles - users can read their own role
CREATE POLICY "Users can read their own role"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy for admins to manage all roles
CREATE POLICY "Admins can manage all roles"
  ON user_roles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Insert admin users
INSERT INTO user_roles (user_id, email, role) 
SELECT id, email, 'admin'
FROM auth.users 
WHERE email IN ('ilia@envaire.com', 'javier@envaire.com')
ON CONFLICT (email) DO UPDATE SET role = 'admin';

-- Function to automatically assign roles to new users
CREATE OR REPLACE FUNCTION assign_user_role()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_roles (user_id, email, role)
  VALUES (
    NEW.id, 
    NEW.email,
    CASE 
      WHEN NEW.email IN ('ilia@envaire.com', 'javier@envaire.com') THEN 'admin'
      ELSE 'salesman'
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to assign roles on user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION assign_user_role();

-- Update leads policies - users can only see their own leads
DROP POLICY IF EXISTS "Users can manage their own leads" ON leads;
CREATE POLICY "Users can manage their own leads"
  ON leads
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Update projects policies - all authenticated users can see all projects
DROP POLICY IF EXISTS "Users can manage their own projects" ON projects;
CREATE POLICY "All users can view all projects"
  ON projects
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "All users can manage projects"
  ON projects
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "All users can update projects"
  ON projects
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "All users can delete projects"
  ON projects
  FOR DELETE
  TO authenticated
  USING (true);

-- Update demos policies - all authenticated users can see all demos
DROP POLICY IF EXISTS "Users can manage their own demos" ON demos;
CREATE POLICY "All users can view all demos"
  ON demos
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "All users can manage demos"
  ON demos
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "All users can update demos"
  ON demos
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "All users can delete demos"
  ON demos
  FOR DELETE
  TO authenticated
  USING (true);

-- Update activities policies - all authenticated users can see all activities
DROP POLICY IF EXISTS "Users can manage their own activities" ON activities;
CREATE POLICY "All users can view all activities"
  ON activities
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "All users can manage activities"
  ON activities
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "All users can update activities"
  ON activities
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "All users can delete activities"
  ON activities
  FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_email ON user_roles(email);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);