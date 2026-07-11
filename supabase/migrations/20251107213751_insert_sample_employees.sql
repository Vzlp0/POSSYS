/*
  # Insert sample employees for task management

  1. New Data
    - Insert 5 sample active employees with various positions
    - Employees can be assigned to tasks
*/

INSERT INTO employees (employee_number, first_name, last_name, email, phone, position, department, hire_date, status, created_at, updated_at)
VALUES 
  ('EMP001', 'John', 'Admin', 'john.admin@cafe.local', '555-0101', 'Manager', 'Administration', NOW()::date, 'active', NOW(), NOW()),
  ('EMP002', 'Sarah', 'Barista', 'sarah.barista@cafe.local', '555-0102', 'Barista', 'Operations', NOW()::date, 'active', NOW(), NOW()),
  ('EMP003', 'Mike', 'Chef', 'mike.chef@cafe.local', '555-0103', 'Head Chef', 'Kitchen', NOW()::date, 'active', NOW(), NOW()),
  ('EMP004', 'Emma', 'Cashier', 'emma.cashier@cafe.local', '555-0104', 'Cashier', 'Operations', NOW()::date, 'active', NOW(), NOW()),
  ('EMP005', 'David', 'Supervisor', 'david.supervisor@cafe.local', '555-0105', 'Shift Supervisor', 'Operations', NOW()::date, 'active', NOW(), NOW())
ON CONFLICT DO NOTHING;
