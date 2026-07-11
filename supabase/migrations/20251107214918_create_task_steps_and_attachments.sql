/*
  # Add task steps and attachments functionality

  1. New Tables
    - `task_steps`
      - `id` (uuid, primary key)
      - `task_id` (uuid, foreign key to tasks)
      - `step_number` (integer, order of the step)
      - `description` (text, what needs to be done)
      - `is_completed` (boolean, completion status)
      - `completed_by` (text, who completed it)
      - `completed_at` (timestamptz, when completed)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `task_attachments`
      - `id` (uuid, primary key)
      - `task_id` (uuid, foreign key to tasks)
      - `file_name` (text, original file name)
      - `file_url` (text, URL or path to file)
      - `file_type` (text, image, document, etc.)
      - `file_size` (integer, size in bytes)
      - `uploaded_by` (text, who uploaded)
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS on both tables
    - Add policies for anon access (development)
*/

-- Create task_steps table
CREATE TABLE IF NOT EXISTS task_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  step_number integer NOT NULL,
  description text NOT NULL,
  is_completed boolean DEFAULT false,
  completed_by text,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create task_attachments table
CREATE TABLE IF NOT EXISTS task_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text NOT NULL,
  file_size integer,
  uploaded_by text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_task_steps_task_id ON task_steps(task_id);
CREATE INDEX IF NOT EXISTS idx_task_attachments_task_id ON task_attachments(task_id);

-- Enable RLS
ALTER TABLE task_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;

-- Policies for task_steps (anon access for development)
CREATE POLICY "Allow anon to view task_steps"
  ON task_steps FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon to insert task_steps"
  ON task_steps FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon to update task_steps"
  ON task_steps FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon to delete task_steps"
  ON task_steps FOR DELETE
  TO anon
  USING (true);

-- Policies for task_attachments (anon access for development)
CREATE POLICY "Allow anon to view task_attachments"
  ON task_attachments FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon to insert task_attachments"
  ON task_attachments FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon to delete task_attachments"
  ON task_attachments FOR DELETE
  TO anon
  USING (true);

-- Policies for authenticated users
CREATE POLICY "Authenticated users can view task_steps"
  ON task_steps FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert task_steps"
  ON task_steps FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update task_steps"
  ON task_steps FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete task_steps"
  ON task_steps FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view task_attachments"
  ON task_attachments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert task_attachments"
  ON task_attachments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete task_attachments"
  ON task_attachments FOR DELETE
  TO authenticated
  USING (true);
