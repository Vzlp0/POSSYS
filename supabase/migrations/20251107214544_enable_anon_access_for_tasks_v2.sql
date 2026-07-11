/*
  # Enable anonymous access for tasks and related tables (Development Only)

  1. Security Changes
    - Add anon policies for tasks table
    - Add anon policies for task_comments table
    - Add anon policies for task_templates table
    - Add anon policies for employees table
    
  2. Important Notes
    - This is for DEVELOPMENT purposes only
    - In production, proper authentication and role-based access should be implemented
    - These policies allow full access to anonymous users for testing
*/

-- Tasks table policies for anon
DROP POLICY IF EXISTS "Allow anon to view tasks" ON tasks;
CREATE POLICY "Allow anon to view tasks"
  ON tasks FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "Allow anon to insert tasks" ON tasks;
CREATE POLICY "Allow anon to insert tasks"
  ON tasks FOR INSERT
  TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon to update tasks" ON tasks;
CREATE POLICY "Allow anon to update tasks"
  ON tasks FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon to delete tasks" ON tasks;
CREATE POLICY "Allow anon to delete tasks"
  ON tasks FOR DELETE
  TO anon
  USING (true);

-- Task comments table policies for anon
DROP POLICY IF EXISTS "Allow anon to view task_comments" ON task_comments;
CREATE POLICY "Allow anon to view task_comments"
  ON task_comments FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "Allow anon to insert task_comments" ON task_comments;
CREATE POLICY "Allow anon to insert task_comments"
  ON task_comments FOR INSERT
  TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon to update task_comments" ON task_comments;
CREATE POLICY "Allow anon to update task_comments"
  ON task_comments FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon to delete task_comments" ON task_comments;
CREATE POLICY "Allow anon to delete task_comments"
  ON task_comments FOR DELETE
  TO anon
  USING (true);

-- Task templates table policies for anon
DROP POLICY IF EXISTS "Allow anon to view task_templates" ON task_templates;
CREATE POLICY "Allow anon to view task_templates"
  ON task_templates FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "Allow anon to insert task_templates" ON task_templates;
CREATE POLICY "Allow anon to insert task_templates"
  ON task_templates FOR INSERT
  TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon to update task_templates" ON task_templates;
CREATE POLICY "Allow anon to update task_templates"
  ON task_templates FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon to delete task_templates" ON task_templates;
CREATE POLICY "Allow anon to delete task_templates"
  ON task_templates FOR DELETE
  TO anon
  USING (true);

-- Employees table policies for anon
DROP POLICY IF EXISTS "Allow anon to view employees" ON employees;
CREATE POLICY "Allow anon to view employees"
  ON employees FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "Allow anon to insert employees" ON employees;
CREATE POLICY "Allow anon to insert employees"
  ON employees FOR INSERT
  TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon to update employees" ON employees;
CREATE POLICY "Allow anon to update employees"
  ON employees FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon to delete employees" ON employees;
CREATE POLICY "Allow anon to delete employees"
  ON employees FOR DELETE
  TO anon
  USING (true);
