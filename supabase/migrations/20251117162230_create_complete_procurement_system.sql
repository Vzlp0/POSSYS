/*
  # Create Complete Procurement System

  1. New Tables
    - `branches` - Store branches/locations
    - `suppliers` - Supplier master data
    - `purchase_requisitions` - Purchase requisition requests with pr_date
    - `purchase_requisition_items` - Line items for PRs
    - `purchase_orders` - Purchase orders to suppliers
    - `purchase_order_items` - Line items for POs
    - `goods_receipts` - Record of received goods
    - `goods_receipt_items` - Line items for GRs
    - `stock_transfers` - Internal stock transfers
    - `stock_transfer_items` - Line items for transfers

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users with shared access
    
  3. Important Notes
    - All PRs are visible to all employees (shared access)
    - pr_date field defaults to today's date
    - Branch field identifies which branch requested the PR
    - Approval tracking fields included
*/

-- Create branches table
CREATE TABLE IF NOT EXISTS branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  address text,
  phone text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  contact_person text,
  email text,
  phone text,
  address text,
  payment_terms text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Purchase Requisitions with pr_date
CREATE TABLE IF NOT EXISTS purchase_requisitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pr_number text UNIQUE NOT NULL,
  pr_date date DEFAULT CURRENT_DATE NOT NULL,
  requester_id uuid REFERENCES auth.users(id),
  branch_id uuid REFERENCES branches(id),
  status text NOT NULL DEFAULT 'pending',
  priority text NOT NULL DEFAULT 'medium',
  required_date date,
  notes text,
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS purchase_requisition_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pr_id uuid REFERENCES purchase_requisitions(id) ON DELETE CASCADE,
  item_id uuid REFERENCES items(id),
  quantity numeric NOT NULL,
  unit text NOT NULL,
  estimated_cost numeric DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Purchase Orders
CREATE TABLE IF NOT EXISTS purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number text UNIQUE NOT NULL,
  supplier_id uuid REFERENCES suppliers(id),
  branch_id uuid REFERENCES branches(id),
  pr_id uuid REFERENCES purchase_requisitions(id),
  status text NOT NULL DEFAULT 'draft',
  order_date date DEFAULT CURRENT_DATE,
  expected_delivery_date date,
  total_amount numeric DEFAULT 0,
  currency text DEFAULT 'USD',
  payment_terms text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS purchase_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id uuid REFERENCES purchase_orders(id) ON DELETE CASCADE,
  item_id uuid REFERENCES items(id),
  quantity numeric NOT NULL,
  unit text NOT NULL,
  unit_cost numeric NOT NULL,
  subtotal numeric NOT NULL,
  quantity_received numeric DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Goods Receipts
CREATE TABLE IF NOT EXISTS goods_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gr_number text UNIQUE NOT NULL,
  po_id uuid REFERENCES purchase_orders(id),
  branch_id uuid REFERENCES branches(id),
  supplier_id uuid REFERENCES suppliers(id),
  received_date date DEFAULT CURRENT_DATE,
  received_by uuid REFERENCES auth.users(id),
  status text NOT NULL DEFAULT 'draft',
  total_amount numeric DEFAULT 0,
  invoice_number text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS goods_receipt_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gr_id uuid REFERENCES goods_receipts(id) ON DELETE CASCADE,
  po_item_id uuid REFERENCES purchase_order_items(id),
  item_id uuid REFERENCES items(id),
  quantity numeric NOT NULL,
  unit text NOT NULL,
  unit_cost numeric NOT NULL,
  subtotal numeric NOT NULL,
  batch_number text,
  expiry_date date,
  location text DEFAULT 'Stock Room',
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Stock Transfers
CREATE TABLE IF NOT EXISTS stock_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_number text UNIQUE NOT NULL,
  transfer_type text NOT NULL,
  from_branch_id uuid REFERENCES branches(id),
  to_branch_id uuid REFERENCES branches(id),
  from_location text,
  to_location text,
  status text NOT NULL DEFAULT 'draft',
  transfer_date date DEFAULT CURRENT_DATE,
  requested_by uuid REFERENCES auth.users(id),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stock_transfer_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id uuid REFERENCES stock_transfers(id) ON DELETE CASCADE,
  item_id uuid REFERENCES items(id),
  quantity numeric NOT NULL,
  unit text NOT NULL,
  quantity_received numeric DEFAULT 0,
  batch_number text,
  expiry_date date,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_requisitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_requisition_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE goods_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE goods_receipt_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transfer_items ENABLE ROW LEVEL SECURITY;

-- Policies for branches (shared access)
CREATE POLICY "All users can view branches"
  ON branches FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage branches"
  ON branches FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policies for suppliers (shared access)
CREATE POLICY "All users can view suppliers"
  ON suppliers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage suppliers"
  ON suppliers FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policies for purchase_requisitions (SHARED - all employees see all PRs)
CREATE POLICY "All users can view all purchase requisitions"
  ON purchase_requisitions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create purchase requisitions"
  ON purchase_requisitions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update purchase requisitions"
  ON purchase_requisitions FOR UPDATE
  TO authenticated
  USING (true);

-- Policies for purchase_requisition_items
CREATE POLICY "All users can view PR items"
  ON purchase_requisition_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create PR items"
  ON purchase_requisition_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update PR items"
  ON purchase_requisition_items FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete PR items"
  ON purchase_requisition_items FOR DELETE
  TO authenticated
  USING (true);

-- Policies for purchase_orders
CREATE POLICY "All users can view purchase orders"
  ON purchase_orders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create purchase orders"
  ON purchase_orders FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update purchase orders"
  ON purchase_orders FOR UPDATE
  TO authenticated
  USING (true);

-- Policies for purchase_order_items
CREATE POLICY "All users can view PO items"
  ON purchase_order_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create PO items"
  ON purchase_order_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update PO items"
  ON purchase_order_items FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete PO items"
  ON purchase_order_items FOR DELETE
  TO authenticated
  USING (true);

-- Policies for goods_receipts
CREATE POLICY "All users can view goods receipts"
  ON goods_receipts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create goods receipts"
  ON goods_receipts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update goods receipts"
  ON goods_receipts FOR UPDATE
  TO authenticated
  USING (true);

-- Policies for goods_receipt_items
CREATE POLICY "All users can view GR items"
  ON goods_receipt_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create GR items"
  ON goods_receipt_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update GR items"
  ON goods_receipt_items FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete GR items"
  ON goods_receipt_items FOR DELETE
  TO authenticated
  USING (true);

-- Policies for stock_transfers
CREATE POLICY "All users can view stock transfers"
  ON stock_transfers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create stock transfers"
  ON stock_transfers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update stock transfers"
  ON stock_transfers FOR UPDATE
  TO authenticated
  USING (true);

-- Policies for stock_transfer_items
CREATE POLICY "All users can view transfer items"
  ON stock_transfer_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create transfer items"
  ON stock_transfer_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update transfer items"
  ON stock_transfer_items FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete transfer items"
  ON stock_transfer_items FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_pr_date ON purchase_requisitions(pr_date);
CREATE INDEX IF NOT EXISTS idx_pr_status ON purchase_requisitions(status);
CREATE INDEX IF NOT EXISTS idx_pr_branch ON purchase_requisitions(branch_id);
CREATE INDEX IF NOT EXISTS idx_pr_requester ON purchase_requisitions(requester_id);
CREATE INDEX IF NOT EXISTS idx_pr_items_pr_id ON purchase_requisition_items(pr_id);
CREATE INDEX IF NOT EXISTS idx_pr_items_item_id ON purchase_requisition_items(item_id);
CREATE INDEX IF NOT EXISTS idx_po_supplier_id ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_po_items_po_id ON purchase_order_items(po_id);
CREATE INDEX IF NOT EXISTS idx_po_items_item_id ON purchase_order_items(item_id);
CREATE INDEX IF NOT EXISTS idx_gr_po_id ON goods_receipts(po_id);
CREATE INDEX IF NOT EXISTS idx_gr_items_gr_id ON goods_receipt_items(gr_id);
CREATE INDEX IF NOT EXISTS idx_gr_items_item_id ON goods_receipt_items(item_id);
CREATE INDEX IF NOT EXISTS idx_transfer_items_transfer_id ON stock_transfer_items(transfer_id);
CREATE INDEX IF NOT EXISTS idx_transfer_items_item_id ON stock_transfer_items(item_id);

-- Insert sample branches
INSERT INTO branches (name, code, address, phone) VALUES
  ('Main Branch', 'MAIN', '123 Main Street', '+1234567890'),
  ('Branch 2', 'BR02', '456 Second Avenue', '+1234567891'),
  ('Branch 3', 'BR03', '789 Third Road', '+1234567892')
ON CONFLICT (code) DO NOTHING;

-- Insert sample suppliers
INSERT INTO suppliers (name, code, contact_person, email, phone) VALUES
  ('ABC Suppliers', 'ABC', 'John Doe', 'john@abc.com', '+1111111111'),
  ('XYZ Trading', 'XYZ', 'Jane Smith', 'jane@xyz.com', '+2222222222')
ON CONFLICT (code) DO NOTHING;
