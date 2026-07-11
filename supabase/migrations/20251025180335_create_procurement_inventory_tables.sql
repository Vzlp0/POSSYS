/*
  # Create Procurement and Inventory Tables

  1. New Tables
    - `purchase_requisitions` - Purchase requisition requests
      - `id` (uuid, primary key)
      - `pr_number` (text, unique) - PR number
      - `requester_id` (uuid) - User who requested
      - `branch_id` (uuid) - Branch requesting
      - `status` (text) - draft, pending, approved, rejected, converted
      - `priority` (text) - low, medium, high, urgent
      - `required_date` (date) - When items are needed
      - `notes` (text) - Additional notes
      - `created_at`, `updated_at` (timestamptz)
      
    - `purchase_requisition_items` - Line items for PRs
      - `id` (uuid, primary key)
      - `pr_id` (uuid, foreign key) - References purchase_requisitions
      - `item_id` (uuid, foreign key) - References items
      - `quantity` (numeric) - Quantity requested
      - `unit` (text) - Unit of measure
      - `estimated_cost` (numeric) - Estimated cost per unit
      - `notes` (text)
      - `created_at` (timestamptz)
    
    - `purchase_orders` - Purchase orders to suppliers
      - `id` (uuid, primary key)
      - `po_number` (text, unique) - PO number
      - `supplier_id` (uuid, foreign key) - References suppliers
      - `branch_id` (uuid, foreign key) - References branches
      - `pr_id` (uuid, nullable) - References purchase_requisitions if converted
      - `status` (text) - draft, sent, partially_received, received, cancelled
      - `order_date` (date) - Date ordered
      - `expected_delivery_date` (date) - Expected delivery
      - `total_amount` (numeric) - Total order amount
      - `currency` (text) - Currency code
      - `payment_terms` (text) - Payment terms
      - `notes` (text)
      - `created_at`, `updated_at` (timestamptz)
      
    - `purchase_order_items` - Line items for POs
      - `id` (uuid, primary key)
      - `po_id` (uuid, foreign key) - References purchase_orders
      - `item_id` (uuid, foreign key) - References items
      - `quantity` (numeric) - Quantity ordered
      - `unit` (text) - Unit of measure
      - `unit_cost` (numeric) - Cost per unit
      - `subtotal` (numeric) - Line total
      - `quantity_received` (numeric, default 0) - Quantity received so far
      - `notes` (text)
      - `created_at` (timestamptz)
    
    - `goods_receipts` - Record of received goods
      - `id` (uuid, primary key)
      - `gr_number` (text, unique) - GR number
      - `po_id` (uuid, foreign key) - References purchase_orders
      - `branch_id` (uuid, foreign key) - References branches
      - `supplier_id` (uuid, foreign key) - References suppliers
      - `received_date` (date) - Date received
      - `received_by` (uuid) - User who received
      - `status` (text) - draft, confirmed, posted
      - `total_amount` (numeric) - Total GR value
      - `invoice_number` (text) - Supplier invoice number
      - `notes` (text)
      - `created_at`, `updated_at` (timestamptz)
      
    - `goods_receipt_items` - Line items for GRs
      - `id` (uuid, primary key)
      - `gr_id` (uuid, foreign key) - References goods_receipts
      - `po_item_id` (uuid, foreign key) - References purchase_order_items
      - `item_id` (uuid, foreign key) - References items
      - `quantity` (numeric) - Quantity received
      - `unit` (text) - Unit of measure
      - `unit_cost` (numeric) - Cost per unit
      - `subtotal` (numeric) - Line total
      - `batch_number` (text) - Batch/lot number
      - `expiry_date` (date, nullable) - Expiry date if tracked
      - `location` (text) - Storage location (Stock Room, Shelves)
      - `notes` (text)
      - `created_at` (timestamptz)
      
    - `stock_transfers` - Internal stock transfers
      - `id` (uuid, primary key)
      - `transfer_number` (text, unique) - Transfer number
      - `transfer_type` (text) - internal (within store), isto (between stores)
      - `from_branch_id` (uuid, nullable) - Source branch for ISTO
      - `to_branch_id` (uuid, nullable) - Destination branch for ISTO
      - `from_location` (text, nullable) - Source location for internal
      - `to_location` (text, nullable) - Destination location for internal
      - `status` (text) - draft, pending, in_transit, received, cancelled
      - `transfer_date` (date)
      - `requested_by` (uuid) - User who requested
      - `notes` (text)
      - `created_at`, `updated_at` (timestamptz)
      
    - `stock_transfer_items` - Line items for transfers
      - `id` (uuid, primary key)
      - `transfer_id` (uuid, foreign key) - References stock_transfers
      - `item_id` (uuid, foreign key) - References items
      - `quantity` (numeric) - Quantity to transfer
      - `unit` (text) - Unit of measure
      - `quantity_received` (numeric, default 0) - Quantity received
      - `batch_number` (text, nullable)
      - `expiry_date` (date, nullable)
      - `notes` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    
  3. Indexes
    - Add indexes on foreign keys and frequently queried columns
*/

-- Purchase Requisitions
CREATE TABLE IF NOT EXISTS purchase_requisitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pr_number text UNIQUE NOT NULL,
  requester_id uuid REFERENCES auth.users(id),
  branch_id uuid REFERENCES branches(id),
  status text NOT NULL DEFAULT 'draft',
  priority text NOT NULL DEFAULT 'medium',
  required_date date,
  notes text,
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

-- Enable RLS
ALTER TABLE purchase_requisitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_requisition_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE goods_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE goods_receipt_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transfer_items ENABLE ROW LEVEL SECURITY;

-- Policies for purchase_requisitions
CREATE POLICY "Authenticated users can view purchase requisitions"
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
CREATE POLICY "Authenticated users can view PR items"
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
CREATE POLICY "Authenticated users can view purchase orders"
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
CREATE POLICY "Authenticated users can view PO items"
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
CREATE POLICY "Authenticated users can view goods receipts"
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
CREATE POLICY "Authenticated users can view GR items"
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
CREATE POLICY "Authenticated users can view stock transfers"
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
CREATE POLICY "Authenticated users can view transfer items"
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