/*
  # Create Comprehensive POS System Schema
  
  1. New Tables
    - `users` - User accounts and authentication profiles
    - `items` - Product catalog and item master data
    - `suppliers` - Supplier information
    - `item_suppliers` - Link table between items and suppliers with pricing
    - `stock_locations` - Warehouse/store locations for inventory
    - `stock_levels` - Current stock levels by item and location
    - `transactions` - Sales transactions
    - `transaction_items` - Line items in transactions
    - `payments` - Payment records for transactions
    - `branches` - Store/branch locations
    - `day_openings` - Daily opening records with float
    - `day_closings` - Daily closing records with reconciliation
    
  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for authenticated users
    
  3. Sample Data
    - Pre-populate with comprehensive example data for testing
*/

-- ============================================================================
-- USERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  role text NOT NULL DEFAULT 'staff',
  department text,
  phone text,
  is_active boolean NOT NULL DEFAULT true,
  is_pending boolean NOT NULL DEFAULT false,
  approved_by text,
  approved_at timestamptz,
  last_login timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_role CHECK (role IN ('admin', 'manager', 'cashier', 'staff'))
);

-- ============================================================================
-- SUPPLIERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_number text UNIQUE NOT NULL,
  supplier_name text NOT NULL,
  category text,
  contact_person text,
  email text,
  phone text,
  address text,
  payment_terms text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- ITEMS TABLE (Product Catalog)
-- ============================================================================
CREATE TABLE IF NOT EXISTS items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku text UNIQUE NOT NULL,
  name text NOT NULL,
  category text NOT NULL,
  unit text NOT NULL,
  price decimal(10, 2) DEFAULT 0,
  cost decimal(10, 2) DEFAULT 0,
  is_expiry_tracked boolean NOT NULL DEFAULT false,
  show_in_pos boolean NOT NULL DEFAULT true,
  available_for_online_order boolean NOT NULL DEFAULT false,
  min_display_threshold integer DEFAULT 0,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- ITEM SUPPLIERS (Link table with pricing)
-- ============================================================================
CREATE TABLE IF NOT EXISTS item_suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  cost decimal(10, 2) NOT NULL,
  unit text NOT NULL,
  is_market_range boolean NOT NULL DEFAULT false,
  lead_time_days integer,
  payment_terms text,
  delivery_terms text,
  is_preferred boolean NOT NULL DEFAULT false,
  is_mother_supplier boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(item_id, supplier_id)
);

-- ============================================================================
-- STOCK LOCATIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS stock_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_location_type CHECK (type IN ('warehouse', 'store', 'display', 'storage'))
);

-- ============================================================================
-- STOCK LEVELS
-- ============================================================================
CREATE TABLE IF NOT EXISTS stock_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  location_id uuid NOT NULL REFERENCES stock_locations(id) ON DELETE CASCADE,
  quantity decimal(10, 2) NOT NULL DEFAULT 0,
  batch_number text,
  expiry_date date,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(item_id, location_id, batch_number, expiry_date)
);

-- ============================================================================
-- BRANCHES
-- ============================================================================
CREATE TABLE IF NOT EXISTS branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_code text UNIQUE NOT NULL,
  branch_name text NOT NULL,
  address text,
  phone text,
  timezone text NOT NULL DEFAULT 'UTC',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- TRANSACTIONS (Sales)
-- ============================================================================
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text UNIQUE NOT NULL,
  transaction_date timestamptz NOT NULL DEFAULT now(),
  cashier_id uuid,
  cashier_name text NOT NULL,
  branch_id uuid REFERENCES branches(id),
  subtotal decimal(10, 2) NOT NULL DEFAULT 0,
  discount decimal(10, 2) NOT NULL DEFAULT 0,
  tax decimal(10, 2) NOT NULL DEFAULT 0,
  total decimal(10, 2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'completed',
  voided_by text,
  voided_at timestamptz,
  void_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_transaction_status CHECK (status IN ('completed', 'voided', 'returned', 'exchanged'))
);

-- ============================================================================
-- TRANSACTION ITEMS
-- ============================================================================
CREATE TABLE IF NOT EXISTS transaction_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  item_id uuid REFERENCES items(id),
  item_name text NOT NULL,
  item_sku text NOT NULL,
  quantity decimal(10, 2) NOT NULL,
  unit_price decimal(10, 2) NOT NULL,
  line_total decimal(10, 2) NOT NULL,
  returned_quantity decimal(10, 2) DEFAULT 0,
  exchanged_quantity decimal(10, 2) DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- PAYMENTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  payment_method text NOT NULL,
  amount decimal(10, 2) NOT NULL,
  payment_date timestamptz NOT NULL DEFAULT now(),
  is_voided boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_payment_method CHECK (payment_method IN ('cash', 'card', 'membership', 'voucher'))
);

-- ============================================================================
-- DAY OPENINGS
-- ============================================================================
CREATE TABLE IF NOT EXISTS day_openings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opening_date date UNIQUE NOT NULL,
  branch_id uuid REFERENCES branches(id),
  float_cash_on_hand decimal(10, 2) NOT NULL DEFAULT 0,
  petty_cash_on_hand decimal(10, 2) NOT NULL DEFAULT 0,
  opened_by text NOT NULL,
  opened_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'Active',
  notes text,
  CONSTRAINT valid_opening_status CHECK (status IN ('Active', 'Closed'))
);

-- ============================================================================
-- DAY CLOSINGS
-- ============================================================================
CREATE TABLE IF NOT EXISTS day_closings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  closing_date date UNIQUE NOT NULL,
  branch_id uuid REFERENCES branches(id),
  total_sales_cash decimal(10, 2) NOT NULL DEFAULT 0,
  total_sales_network decimal(10, 2) NOT NULL DEFAULT 0,
  total_petty_cash decimal(10, 2) NOT NULL DEFAULT 0,
  total_deposits decimal(10, 2) NOT NULL DEFAULT 0,
  cash_on_hand_balance decimal(10, 2) NOT NULL DEFAULT 0,
  variance_cash decimal(10, 2) NOT NULL DEFAULT 0,
  variance_network decimal(10, 2) NOT NULL DEFAULT 0,
  variance_petty decimal(10, 2) NOT NULL DEFAULT 0,
  closed_by text NOT NULL,
  closed_at timestamptz NOT NULL DEFAULT now(),
  notes text
);

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);
CREATE INDEX IF NOT EXISTS idx_items_sku ON items(sku);
CREATE INDEX IF NOT EXISTS idx_items_show_in_pos ON items(show_in_pos);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_cashier ON transactions(cashier_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transaction_items_transaction_id ON transaction_items(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_items_item_id ON transaction_items(item_id);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_stock_levels_item_id ON stock_levels(item_id);
CREATE INDEX IF NOT EXISTS idx_stock_levels_location_id ON stock_levels(location_id);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE day_openings ENABLE ROW LEVEL SECURITY;
ALTER TABLE day_closings ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CREATE RLS POLICIES
-- ============================================================================

-- Users policies
CREATE POLICY "Authenticated users can view all users"
  ON users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage users"
  ON users FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Suppliers policies
CREATE POLICY "Authenticated users can view suppliers"
  ON suppliers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage suppliers"
  ON suppliers FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Items policies
CREATE POLICY "Authenticated users can view items"
  ON items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage items"
  ON items FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Item suppliers policies
CREATE POLICY "Authenticated users can view item suppliers"
  ON item_suppliers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage item suppliers"
  ON item_suppliers FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Stock locations policies
CREATE POLICY "Authenticated users can view stock locations"
  ON stock_locations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage stock locations"
  ON stock_locations FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Stock levels policies
CREATE POLICY "Authenticated users can view stock levels"
  ON stock_levels FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage stock levels"
  ON stock_levels FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Branches policies
CREATE POLICY "Authenticated users can view branches"
  ON branches FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage branches"
  ON branches FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Transactions policies
CREATE POLICY "Authenticated users can view transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update transactions"
  ON transactions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Transaction items policies
CREATE POLICY "Authenticated users can view transaction items"
  ON transaction_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage transaction items"
  ON transaction_items FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Payments policies
CREATE POLICY "Authenticated users can view payments"
  ON payments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage payments"
  ON payments FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Day openings policies
CREATE POLICY "Authenticated users can view day openings"
  ON day_openings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage day openings"
  ON day_openings FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Day closings policies
CREATE POLICY "Authenticated users can view day closings"
  ON day_closings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage day closings"
  ON day_closings FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
