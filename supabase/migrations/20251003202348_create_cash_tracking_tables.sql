-- Cash Tracking System Migration
--
-- Overview:
-- Creates comprehensive cash tracking system with three main categories
--
-- Tables:
-- 1. cash_sales - Track all sales transactions paid with cash
-- 2. petty_cash - Track petty cash expenses and replenishments  
-- 3. float_cash - Track float distributions and collections
-- 4. cash_balances - Maintains current balance for each cash type

-- Create cash_sales table
CREATE TABLE IF NOT EXISTS cash_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id text NOT NULL,
  amount decimal(10,2) NOT NULL,
  cashier_name text NOT NULL,
  cashier_id text,
  receipt_number text,
  transaction_date timestamptz NOT NULL DEFAULT now(),
  notes text,
  created_at timestamptz DEFAULT now(),
  created_by text
);

-- Create petty_cash table
CREATE TABLE IF NOT EXISTS petty_cash (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_type text NOT NULL CHECK (transaction_type IN ('expense', 'addition')),
  amount decimal(10,2) NOT NULL,
  category text,
  description text NOT NULL,
  receipt_number text,
  approved_by text,
  transaction_date timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  created_by text
);

-- Create float_cash table
CREATE TABLE IF NOT EXISTS float_cash (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_type text NOT NULL CHECK (transaction_type IN ('distribution', 'collection', 'adjustment')),
  amount decimal(10,2) NOT NULL,
  cashier_name text,
  cashier_id text,
  variance decimal(10,2) DEFAULT 0,
  notes text,
  transaction_date timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  created_by text
);

-- Create cash_balances table
CREATE TABLE IF NOT EXISTS cash_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cash_type text NOT NULL UNIQUE CHECK (cash_type IN ('cash_sales', 'petty_cash', 'float')),
  balance decimal(10,2) NOT NULL DEFAULT 0,
  last_updated timestamptz DEFAULT now(),
  updated_by text
);

-- Insert initial balances
INSERT INTO cash_balances (cash_type, balance) 
VALUES 
  ('cash_sales', 0),
  ('petty_cash', 0),
  ('float', 0)
ON CONFLICT (cash_type) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE cash_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE petty_cash ENABLE ROW LEVEL SECURITY;
ALTER TABLE float_cash ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_balances ENABLE ROW LEVEL SECURITY;

-- Create policies for cash_sales
CREATE POLICY "Users can view all cash sales"
  ON cash_sales FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert cash sales"
  ON cash_sales FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update cash sales"
  ON cash_sales FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for petty_cash
CREATE POLICY "Users can view all petty cash"
  ON petty_cash FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert petty cash"
  ON petty_cash FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update petty cash"
  ON petty_cash FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for float_cash
CREATE POLICY "Users can view all float cash"
  ON float_cash FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert float cash"
  ON float_cash FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update float cash"
  ON float_cash FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for cash_balances
CREATE POLICY "Users can view all cash balances"
  ON cash_balances FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update cash balances"
  ON cash_balances FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_cash_sales_date ON cash_sales(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_cash_sales_cashier ON cash_sales(cashier_id);
CREATE INDEX IF NOT EXISTS idx_petty_cash_date ON petty_cash(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_petty_cash_type ON petty_cash(transaction_type);
CREATE INDEX IF NOT EXISTS idx_float_cash_date ON float_cash(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_float_cash_type ON float_cash(transaction_type);
