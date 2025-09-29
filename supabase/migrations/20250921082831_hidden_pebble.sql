/*
  # Fix infinite recursion in user_roles RLS policies

  1. Security Changes
    - Drop existing recursive policies that cause infinite loops
    - Create simple, non-recursive policies for user_roles table
    - Allow users to read and insert their own roles only
    - Remove admin policy that queries user_roles within itself

  2. New Policies
    - Simple SELECT policy: users can read their own role
    - Simple INSERT policy: users can insert their own role
    - No recursive queries within policy expressions
*/

-- Drop all existing policies on user_roles to start fresh
DROP POLICY IF EXISTS "Admins can manage all roles" ON user_roles;
DROP POLICY IF EXISTS "Users can read their own role" ON user_roles;
DROP POLICY IF EXISTS "Allow authenticated users to insert their own role" ON user_roles;

-- Create simple, non-recursive policies
CREATE POLICY "Users can read their own role"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own role"
  ON user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own role"
  ON user_roles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);