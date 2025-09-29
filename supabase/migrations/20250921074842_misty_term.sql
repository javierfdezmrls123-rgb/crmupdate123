/*
  # Create CRM Tables - Leads, Projects, Demos, Activities

  1. New Tables
    - `leads` - Lead/customer information with contact details
    - `projects` - Sales projects linked to leads  
    - `demos` - Demo tasks with priority and status tracking
    - `activities` - Activity log for leads and projects

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data

  3. Relationships
    - Projects link to leads via lead_id
    - Demos can link to leads and/or projects
    - Activities can link to leads and/or projects
*/

-- Create leads table
CREATE TABLE IF NOT EXISTS public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  email text,
  phone text,
  company text,
  position text,
  status text DEFAULT 'prospect' CHECK (status IN ('prospect', 'qualified', 'proposal', 'negotiation', 'closed-won', 'closed-lost')),
  value numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  last_contact timestamptz DEFAULT now(),
  notes text DEFAULT ''
);

-- Create projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  value numeric DEFAULT 0,
  stage text DEFAULT 'discovery' CHECK (stage IN ('discovery', 'proposal', 'negotiation', 'closed-won', 'closed-lost')),
  probability integer DEFAULT 50 CHECK (probability >= 0 AND probability <= 100),
  expected_close_date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  notes text DEFAULT ''
);

-- Create demos table
CREATE TABLE IF NOT EXISTS public.demos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text DEFAULT '',
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'completed', 'cancelled')),
  due_date date NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create activities table
CREATE TABLE IF NOT EXISTS public.activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('call', 'email', 'meeting', 'note', 'demo')),
  title text NOT NULL,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON public.leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_lead_id ON public.projects(lead_id);
CREATE INDEX IF NOT EXISTS idx_projects_stage ON public.projects(stage);
CREATE INDEX IF NOT EXISTS idx_demos_user_id ON public.demos(user_id);
CREATE INDEX IF NOT EXISTS idx_demos_status ON public.demos(status);
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON public.activities(user_id);

-- Enable Row Level Security
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for leads
CREATE POLICY "Users can manage their own leads"
  ON public.leads
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for projects
CREATE POLICY "Users can manage their own projects"
  ON public.projects
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for demos
CREATE POLICY "Users can manage their own demos"
  ON public.demos
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for activities
CREATE POLICY "Users can manage their own activities"
  ON public.activities
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);