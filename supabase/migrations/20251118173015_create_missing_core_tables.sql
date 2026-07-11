/*
  # Create Missing Core Tables for Complete System

  ## New Tables Created
  
  ### 1. employees
  - `id` (uuid, primary key)
  - `employee_number` (text, unique)
  - `first_name` (text)
  - `last_name` (text)
  - `email` (text, unique)
  - `phone` (text)
  - `department` (text)
  - `position` (text)
  - `status` (text) - active/inactive
  - `hire_date` (date)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### 2. clients
  - `id` (uuid, primary key)
  - `client_number` (text, unique)
  - `first_name` (text)
  - `last_name` (text)
  - `email` (text, unique)
  - `phone` (text)
  - `birth_date` (date)
  - `points` (integer, default 0)
  - `tier` (text) - bronze/silver/gold/platinum
  - `total_spent` (numeric, default 0)
  - `is_active` (boolean, default true)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### 3. loyalty_transactions
  - `id` (uuid, primary key)
  - `client_id` (uuid, foreign key)
  - `transaction_id` (uuid, nullable)
  - `points_earned` (integer)
  - `points_redeemed` (integer)
  - `balance_after` (integer)
  - `transaction_type` (text) - earned/redeemed/adjusted
  - `description` (text)
  - `created_at` (timestamptz)
  
  ### 4. transactions
  - `id` (uuid, primary key)
  - `transaction_number` (text, unique)
  - `cashier_id` (uuid, foreign key to users)
  - `client_id` (uuid, nullable, foreign key to clients)
  - `subtotal` (numeric)
  - `tax` (numeric)
  - `discount` (numeric, default 0)
  - `total` (numeric)
  - `payment_method` (text)
  - `status` (text) - completed/voided/refunded
  - `created_at` (timestamptz)
  
  ### 5. transaction_items
  - `id` (uuid, primary key)
  - `transaction_id` (uuid, foreign key)
  - `item_id` (uuid, foreign key to items)
  - `quantity` (numeric)
  - `unit_price` (numeric)
  - `discount` (numeric, default 0)
  - `tax` (numeric)
  - `total` (numeric)
  - `created_at` (timestamptz)
  
  ### 6. shifts
  - `id` (uuid, primary key)
  - `shift_number` (text)
  - `cashier_id` (uuid, foreign key to users)
  - `opened_at` (timestamptz)
  - `closed_at` (timestamptz, nullable)
  - `opening_float` (numeric)
  - `closing_cash` (numeric, nullable)
  - `expected_cash` (numeric, nullable)
  - `variance` (numeric, nullable)
  - `status` (text) - open/closed
  - `notes` (text)
  - `created_at` (timestamptz)
  
  ### 7. cash_movements
  - `id` (uuid, primary key)
  - `movement_type` (text) - float_in/float_out/petty_cash/deposit
  - `amount` (numeric)
  - `reason` (text)
  - `cashier_id` (uuid, foreign key to users)
  - `shift_id` (uuid, nullable, foreign key to shifts)
  - `approved_by` (uuid, nullable, foreign key to users)
  - `created_at` (timestamptz)

  ### 8. task_templates
  - `id` (uuid, primary key)
  - `title` (text)
  - `description` (text)
  - `assigned_to` (uuid, nullable, foreign key to employees)
  - `priority` (text) - low/medium/high
  - `estimated_duration` (integer) - in minutes
  - `recurrence` (text) - none/daily/weekly/monthly
  - `is_active` (boolean, default true)
  - `created_at` (timestamptz)

  ### 9. tasks
  - `id` (uuid, primary key)
  - `template_id` (uuid, nullable, foreign key to task_templates)
  - `title` (text)
  - `description` (text)
  - `assigned_to` (uuid, foreign key to employees)
  - `assigned_by` (uuid, foreign key to users)
  - `priority` (text) - low/medium/high
  - `status` (text) - pending/in_progress/completed/cancelled
  - `deadline` (timestamptz, nullable)
  - `completed_at` (timestamptz, nullable)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 10. task_steps
  - Already exists from previous migration

  ### 11. task_attachments
  - Already exists from previous migration

  ### 12. cameras
  - `id` (uuid, primary key)
  - `camera_number` (text, unique)
  - `name` (text)
  - `location` (text)
  - `ip_address` (text)
  - `stream_url` (text)
  - `status` (text) - online/offline/error
  - `is_active` (boolean, default true)
  - `created_at` (timestamptz)

  ### 13. camera_events
  - `id` (uuid, primary key)
  - `camera_id` (uuid, foreign key)
  - `event_type` (text) - motion/alarm/offline
  - `description` (text)
  - `snapshot_url` (text, nullable)
  - `video_url` (text, nullable)
  - `severity` (text) - low/medium/high/critical
  - `acknowledged` (boolean, default false)
  - `acknowledged_by` (uuid, nullable, foreign key to users)
  - `created_at` (timestamptz)

  ### 14. menu_screens
  - `id` (uuid, primary key)
  - `screen_name` (text)
  - `location` (text)
  - `layout_type` (text) - grid/list/featured
  - `is_active` (boolean, default true)
  - `display_order` (integer)
  - `created_at` (timestamptz)

  ### 15. menu_screen_items
  - `id` (uuid, primary key)
  - `screen_id` (uuid, foreign key)
  - `item_id` (uuid, foreign key to items)
  - `display_order` (integer)
  - `is_featured` (boolean, default false)
  - `created_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Add policies for authenticated users
*/

-- employees table
CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_number text UNIQUE NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  department text,
  position text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  hire_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read employees"
  ON employees FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert employees"
  ON employees FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update employees"
  ON employees FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete employees"
  ON employees FOR DELETE
  TO authenticated
  USING (true);

-- clients table
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_number text UNIQUE NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text UNIQUE,
  phone text,
  birth_date date,
  points integer DEFAULT 0,
  tier text DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
  total_spent numeric(15,2) DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read clients"
  ON clients FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert clients"
  ON clients FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update clients"
  ON clients FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete clients"
  ON clients FOR DELETE
  TO authenticated
  USING (true);

-- loyalty_transactions table
CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  transaction_id uuid,
  points_earned integer DEFAULT 0,
  points_redeemed integer DEFAULT 0,
  balance_after integer NOT NULL,
  transaction_type text NOT NULL CHECK (transaction_type IN ('earned', 'redeemed', 'adjusted', 'expired')),
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users full access to loyalty_transactions"
  ON loyalty_transactions FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_number text UNIQUE NOT NULL,
  cashier_id uuid REFERENCES users(id),
  client_id uuid REFERENCES clients(id),
  subtotal numeric(15,2) NOT NULL,
  tax numeric(15,2) DEFAULT 0,
  discount numeric(15,2) DEFAULT 0,
  total numeric(15,2) NOT NULL,
  payment_method text NOT NULL,
  status text DEFAULT 'completed' CHECK (status IN ('completed', 'voided', 'refunded', 'pending')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users full access to transactions"
  ON transactions FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- transaction_items table
CREATE TABLE IF NOT EXISTS transaction_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid REFERENCES transactions(id) ON DELETE CASCADE,
  item_id uuid REFERENCES items(id),
  quantity numeric(10,3) NOT NULL,
  unit_price numeric(15,2) NOT NULL,
  discount numeric(15,2) DEFAULT 0,
  tax numeric(15,2) DEFAULT 0,
  total numeric(15,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users full access to transaction_items"
  ON transaction_items FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- shifts table
CREATE TABLE IF NOT EXISTS shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_number text NOT NULL,
  cashier_id uuid REFERENCES users(id),
  opened_at timestamptz DEFAULT now(),
  closed_at timestamptz,
  opening_float numeric(15,2) NOT NULL,
  closing_cash numeric(15,2),
  expected_cash numeric(15,2),
  variance numeric(15,2),
  status text DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users full access to shifts"
  ON shifts FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- cash_movements table
CREATE TABLE IF NOT EXISTS cash_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  movement_type text NOT NULL CHECK (movement_type IN ('float_in', 'float_out', 'petty_cash', 'deposit', 'withdrawal', 'adjustment')),
  amount numeric(15,2) NOT NULL,
  reason text NOT NULL,
  cashier_id uuid REFERENCES users(id),
  shift_id uuid REFERENCES shifts(id),
  approved_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE cash_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users full access to cash_movements"
  ON cash_movements FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- task_templates table
CREATE TABLE IF NOT EXISTS task_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  assigned_to uuid REFERENCES employees(id),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  estimated_duration integer,
  recurrence text DEFAULT 'none' CHECK (recurrence IN ('none', 'daily', 'weekly', 'monthly')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users full access to task_templates"
  ON task_templates FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES task_templates(id),
  title text NOT NULL,
  description text,
  assigned_to uuid REFERENCES employees(id),
  assigned_by uuid REFERENCES users(id),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  deadline timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users full access to tasks"
  ON tasks FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- cameras table
CREATE TABLE IF NOT EXISTS cameras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  camera_number text UNIQUE NOT NULL,
  name text NOT NULL,
  location text,
  ip_address text,
  stream_url text,
  status text DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'error')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE cameras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users full access to cameras"
  ON cameras FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- camera_events table
CREATE TABLE IF NOT EXISTS camera_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  camera_id uuid REFERENCES cameras(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('motion', 'alarm', 'offline', 'online', 'error')),
  description text,
  snapshot_url text,
  video_url text,
  severity text DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  acknowledged boolean DEFAULT false,
  acknowledged_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE camera_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users full access to camera_events"
  ON camera_events FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- menu_screens table
CREATE TABLE IF NOT EXISTS menu_screens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  screen_name text NOT NULL,
  location text,
  layout_type text DEFAULT 'grid' CHECK (layout_type IN ('grid', 'list', 'featured', 'carousel')),
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE menu_screens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users full access to menu_screens"
  ON menu_screens FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- menu_screen_items table
CREATE TABLE IF NOT EXISTS menu_screen_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  screen_id uuid REFERENCES menu_screens(id) ON DELETE CASCADE,
  item_id uuid REFERENCES items(id) ON DELETE CASCADE,
  display_order integer DEFAULT 0,
  is_featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE menu_screen_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users full access to menu_screen_items"
  ON menu_screen_items FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_client_id ON loyalty_transactions(client_id);
CREATE INDEX IF NOT EXISTS idx_transactions_cashier_id ON transactions(cashier_id);
CREATE INDEX IF NOT EXISTS idx_transactions_client_id ON transactions(client_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transaction_items_transaction_id ON transaction_items(transaction_id);
CREATE INDEX IF NOT EXISTS idx_shifts_cashier_id ON shifts(cashier_id);
CREATE INDEX IF NOT EXISTS idx_shifts_status ON shifts(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_camera_events_camera_id ON camera_events(camera_id);
CREATE INDEX IF NOT EXISTS idx_camera_events_acknowledged ON camera_events(acknowledged);
