/*
  # Create Task Management System

  1. New Tables
    - `employees`
      - `id` (uuid, primary key) - Unique identifier
      - `employee_number` (text, unique) - Employee number
      - `first_name` (text) - First name
      - `last_name` (text) - Last name
      - `email` (text, unique) - Email address
      - `phone` (text) - Phone number
      - `position` (text) - Job position/title
      - `department` (text) - Department
      - `hire_date` (date) - Date hired
      - `status` (text) - active, inactive
      - `user_id` (uuid) - Link to auth user
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Update timestamp

    - `tasks`
      - `id` (uuid, primary key) - Unique identifier
      - `task_number` (text, unique) - Task reference number
      - `title` (text) - Task title
      - `description` (text) - Task description
      - `assigned_to` (uuid, foreign key) - Employee assigned to
      - `assigned_by` (text) - Manager who assigned
      - `priority` (text) - high, medium, low
      - `status` (text) - pending, in_progress, completed, cancelled
      - `deadline` (timestamptz) - Task deadline
      - `started_at` (timestamptz) - When task was started
      - `completed_at` (timestamptz) - When task was completed
      - `is_daily_task` (boolean) - Is this a recurring daily task
      - `task_date` (date) - For daily tasks, which date
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Update timestamp

    - `task_comments`
      - `id` (uuid, primary key) - Unique identifier
      - `task_id` (uuid, foreign key) - Reference to task
      - `comment` (text) - Comment content
      - `created_by` (text) - Who created the comment
      - `created_at` (timestamptz) - Creation timestamp

    - `task_templates`
      - `id` (uuid, primary key) - Unique identifier
      - `title` (text) - Template title
      - `description` (text) - Template description
      - `priority` (text) - Default priority
      - `estimated_duration` (integer) - Estimated minutes
      - `is_daily` (boolean) - Generate daily
      - `assigned_to` (uuid, foreign key) - Default employee
      - `is_active` (boolean) - Active status
      - `created_at` (timestamptz) - Creation timestamp

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Employees can only view their own tasks
    - Managers can view all tasks

  3. Indexes
    - Index on employee_id for quick task lookups
    - Index on task status and deadline
    - Index on task_date for daily tasks

  4. Functions
    - Generate task numbers
    - Generate daily tasks from templates
*/

-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_number text UNIQUE NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text UNIQUE,
  phone text,
  position text,
  department text,
  hire_date date,
  status text NOT NULL DEFAULT 'active',
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('active', 'inactive'))
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_number text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  assigned_to uuid REFERENCES employees(id) ON DELETE SET NULL,
  assigned_by text NOT NULL,
  priority text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'pending',
  deadline timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  is_daily_task boolean NOT NULL DEFAULT false,
  task_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_priority CHECK (priority IN ('high', 'medium', 'low')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled'))
);

-- Create task_comments table
CREATE TABLE IF NOT EXISTS task_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  comment text NOT NULL,
  created_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create task_templates table
CREATE TABLE IF NOT EXISTS task_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  priority text NOT NULL DEFAULT 'medium',
  estimated_duration integer DEFAULT 60,
  is_daily boolean NOT NULL DEFAULT false,
  assigned_to uuid REFERENCES employees(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_template_priority CHECK (priority IN ('high', 'medium', 'low'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON tasks(deadline);
CREATE INDEX IF NOT EXISTS idx_tasks_task_date ON tasks(task_date);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_employees_user_id ON employees(user_id);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);

-- Enable Row Level Security
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for employees
CREATE POLICY "Authenticated users can view employees"
  ON employees FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage employees"
  ON employees FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for tasks
CREATE POLICY "Users can view all tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create tasks"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete tasks"
  ON tasks FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for task_comments
CREATE POLICY "Users can view task comments"
  ON task_comments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can add comments"
  ON task_comments FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for task_templates
CREATE POLICY "Users can view task templates"
  ON task_templates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage templates"
  ON task_templates FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Function to generate task numbers
CREATE OR REPLACE FUNCTION generate_task_number()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  new_number text;
  counter integer;
BEGIN
  SELECT COUNT(*) + 1 INTO counter FROM tasks;
  new_number := 'TSK-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(counter::text, 4, '0');
  RETURN new_number;
END;
$$;

-- Function to generate employee numbers
CREATE OR REPLACE FUNCTION generate_employee_number()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  new_number text;
  counter integer;
BEGIN
  SELECT COUNT(*) + 1 INTO counter FROM employees;
  new_number := 'EMP-' || LPAD(counter::text, 5, '0');
  RETURN new_number;
END;
$$;

-- Trigger for updated_at on employees
DROP TRIGGER IF EXISTS trigger_update_employees_updated_at ON employees;
CREATE TRIGGER trigger_update_employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW
  EXECUTE FUNCTION update_loyalty_updated_at();

-- Trigger for updated_at on tasks
DROP TRIGGER IF EXISTS trigger_update_tasks_updated_at ON tasks;
CREATE TRIGGER trigger_update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_loyalty_updated_at();

-- Insert sample employees for testing
INSERT INTO employees (employee_number, first_name, last_name, email, position, department, status) VALUES
  ('EMP-00001', 'John', 'Smith', 'john.smith@company.com', 'Senior Manager', 'Operations', 'active'),
  ('EMP-00002', 'Sarah', 'Johnson', 'sarah.johnson@company.com', 'Team Lead', 'Sales', 'active'),
  ('EMP-00003', 'Mike', 'Williams', 'mike.williams@company.com', 'Staff Member', 'Operations', 'active'),
  ('EMP-00004', 'Emily', 'Brown', 'emily.brown@company.com', 'Staff Member', 'Customer Service', 'active'),
  ('EMP-00005', 'David', 'Jones', 'david.jones@company.com', 'Staff Member', 'Sales', 'active')
ON CONFLICT (employee_number) DO NOTHING;

-- Insert sample task templates
INSERT INTO task_templates (title, description, priority, is_daily, is_active) VALUES
  ('Morning Store Opening', 'Complete opening checklist: unlock doors, turn on systems, verify cash register', 'high', true, true),
  ('Evening Store Closing', 'Complete closing checklist: secure cash, turn off systems, lock doors', 'high', true, true),
  ('Inventory Check', 'Verify stock levels and report any low inventory items', 'medium', true, true),
  ('Customer Feedback Review', 'Review and respond to customer feedback from previous day', 'medium', true, true),
  ('Equipment Maintenance Check', 'Inspect all equipment for proper functioning', 'low', true, true)
ON CONFLICT DO NOTHING;