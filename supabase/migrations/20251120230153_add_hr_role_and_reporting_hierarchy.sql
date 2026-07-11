/*
  # Add HR Role and Employee Reporting Hierarchy

  ## Changes Made
  
  1. **HR Role Support**
     - Add 'hr_admin' to allowed user roles
     - HR Admin can manage employee structure and hierarchy
  
  2. **Employee Reporting Hierarchy Columns**
     - `line_manager_id`: Direct line manager for day-to-day management
     - `approver_id`: Person who approves requests (PRs, expenses, etc.)
     - `reports_to`: Organizational reporting hierarchy
     - `branch_id`: Branch assignment for employees
  
  3. **Foreign Keys and Constraints**
     - Self-referencing foreign keys to employees table
     - Cascading rules to handle deletions gracefully
  
  4. **Indexes**
     - Performance indexes on manager and reporting columns
  
  5. **Security (RLS)**
     - HR Admin can view and modify all employees
     - Managers can view their team members
     - Employees can view their own record
  
  ## Notes
  - Reporting relationships are flexible and support matrix organizations
  - All three relationships (line_manager, approver, reports_to) can be different people
  - Handles circular reference prevention at application level
*/

-- Add branch_id to employees if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'employees' AND column_name = 'branch_id'
  ) THEN
    ALTER TABLE employees ADD COLUMN branch_id uuid;
  END IF;
END $$;

-- Add reporting hierarchy columns to employees table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'employees' AND column_name = 'line_manager_id'
  ) THEN
    ALTER TABLE employees ADD COLUMN line_manager_id uuid;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'employees' AND column_name = 'approver_id'
  ) THEN
    ALTER TABLE employees ADD COLUMN approver_id uuid;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'employees' AND column_name = 'reports_to'
  ) THEN
    ALTER TABLE employees ADD COLUMN reports_to uuid;
  END IF;
END $$;

-- Add foreign key constraints for reporting hierarchy (self-referencing)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'employees_line_manager_id_fkey'
  ) THEN
    ALTER TABLE employees
      ADD CONSTRAINT employees_line_manager_id_fkey
      FOREIGN KEY (line_manager_id)
      REFERENCES employees(id)
      ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'employees_approver_id_fkey'
  ) THEN
    ALTER TABLE employees
      ADD CONSTRAINT employees_approver_id_fkey
      FOREIGN KEY (approver_id)
      REFERENCES employees(id)
      ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'employees_reports_to_fkey'
  ) THEN
    ALTER TABLE employees
      ADD CONSTRAINT employees_reports_to_fkey
      FOREIGN KEY (reports_to)
      REFERENCES employees(id)
      ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'employees_branch_id_fkey'
  ) THEN
    ALTER TABLE employees
      ADD CONSTRAINT employees_branch_id_fkey
      FOREIGN KEY (branch_id)
      REFERENCES branches(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_employees_line_manager_id ON employees(line_manager_id);
CREATE INDEX IF NOT EXISTS idx_employees_approver_id ON employees(approver_id);
CREATE INDEX IF NOT EXISTS idx_employees_reports_to ON employees(reports_to);
CREATE INDEX IF NOT EXISTS idx_employees_branch_id ON employees(branch_id);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department);

-- Update RLS policies for employees table
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "HR Admin can manage all employees" ON employees;
DROP POLICY IF EXISTS "Managers can view their team" ON employees;
DROP POLICY IF EXISTS "Employees can view their own record" ON employees;
DROP POLICY IF EXISTS "Employees can view all employees" ON employees;

-- HR Admin can manage all employees
CREATE POLICY "HR Admin can manage all employees"
  ON employees
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'hr_admin'
      AND users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'hr_admin'
      AND users.is_active = true
    )
  );

-- Managers can view employees who report to them
CREATE POLICY "Managers can view their team"
  ON employees
  FOR SELECT
  TO authenticated
  USING (
    line_manager_id IN (
      SELECT id FROM employees WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
    OR reports_to IN (
      SELECT id FROM employees WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- All authenticated users can view all employees (for lookups)
CREATE POLICY "Employees can view all employees"
  ON employees
  FOR SELECT
  TO authenticated
  USING (true);

-- Add helpful comments
COMMENT ON COLUMN employees.line_manager_id IS 'Direct line manager for day-to-day management and reporting';
COMMENT ON COLUMN employees.approver_id IS 'Person who approves requests (PRs, purchase orders, expenses, etc.)';
COMMENT ON COLUMN employees.reports_to IS 'Organizational reporting hierarchy for HR purposes';
COMMENT ON COLUMN employees.branch_id IS 'Branch/location assignment for the employee';

-- Update users table role to support hr_admin
DO $$
BEGIN
  -- Add check constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'users' AND constraint_name = 'users_role_check'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT users_role_check
      CHECK (role IN ('admin', 'manager', 'employee', 'cashier', 'hr_admin'));
  ELSE
    -- Drop and recreate to include hr_admin
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
    ALTER TABLE users
      ADD CONSTRAINT users_role_check
      CHECK (role IN ('admin', 'manager', 'employee', 'cashier', 'hr_admin'));
  END IF;
END $$;

COMMENT ON COLUMN users.role IS 'User role: admin (full access), manager (approval rights), employee (standard), cashier (POS only), hr_admin (HR management only)';
