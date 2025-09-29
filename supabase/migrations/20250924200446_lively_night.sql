/*
  # Add Salesmen Roles

  1. New Records
    - Add Tuukka, Jesse, Tuomas, Jukka as salesmen in user_roles table
    - Generate UUIDs for each salesman
    - Set default role as 'salesman'
    - Set created_at to current timestamp

  2. Security
    - Uses existing RLS policies on user_roles table
    - Only admins can view all roles via monitoring room

  3. Notes
    - These are placeholder entries for salesmen who will sign up later
    - Real user_id will be updated when they actually register
    - Email addresses are used as unique identifiers
*/

-- Insert salesmen roles with generated UUIDs
INSERT INTO user_roles (user_id, email, role, created_at) VALUES
  (gen_random_uuid(), 'tuukka@envaire.com', 'salesman', now()),
  (gen_random_uuid(), 'jesse@envaire.com', 'salesman', now()),
  (gen_random_uuid(), 'tuomas@envaire.com', 'salesman', now()),
  (gen_random_uuid(), 'jukka@envaire.com', 'salesman', now())
ON CONFLICT (email) DO NOTHING;