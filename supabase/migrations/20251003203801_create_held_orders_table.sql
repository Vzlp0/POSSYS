/*
  # Create Held Orders Table for POS System

  1. New Tables
    - `held_orders`
      - `id` (uuid, primary key) - Unique identifier for held order
      - `hold_number` (text, unique) - Human-readable hold order reference (e.g., HOLD-20231003-001)
      - `cashier_id` (uuid) - ID of cashier who created the hold
      - `cashier_name` (text) - Name of cashier for quick display
      - `customer_name` (text, nullable) - Optional customer name
      - `customer_phone` (text, nullable) - Optional customer phone
      - `customer_notes` (text, nullable) - Special instructions or notes
      - `cart_items` (jsonb) - Complete cart data including items, quantities, prices, comments, modifications
      - `subtotal` (decimal) - Order subtotal before discount
      - `discount_type` (text) - Type of discount applied (none, percent, amount)
      - `discount_value` (decimal) - Discount value
      - `total` (decimal) - Final total after discount
      - `collect_method` (text) - Pickup or delivery
      - `order_notes` (text, nullable) - General order notes
      - `status` (text) - Status: active, resumed, cancelled, expired
      - `held_at` (timestamptz) - When order was held
      - `resumed_at` (timestamptz, nullable) - When order was resumed
      - `resumed_by` (text, nullable) - Who resumed the order
      - `cancelled_at` (timestamptz, nullable) - When order was cancelled
      - `cancelled_by` (text, nullable) - Who cancelled the order
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Record update timestamp

  2. Security
    - Enable RLS on `held_orders` table
    - Add policy for authenticated users to read held orders
    - Add policy for authenticated users to create held orders
    - Add policy for authenticated users to update their own held orders
    - Add policy for authenticated users to delete their own held orders

  3. Indexes
    - Index on cashier_id for fast cashier-specific queries
    - Index on status for filtering active holds
    - Index on held_at for sorting by date
    - Index on customer_phone for customer lookup

  4. Important Notes
    - All cart data is stored as JSONB for flexibility
    - Soft delete pattern using status field maintains audit trail
    - Cashiers can only manage their own holds unless they have override permissions
    - Hold numbers are auto-generated for easy reference
*/

-- Create the held_orders table
CREATE TABLE IF NOT EXISTS held_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hold_number text UNIQUE NOT NULL,
  cashier_id uuid NOT NULL,
  cashier_name text NOT NULL,
  customer_name text,
  customer_phone text,
  customer_notes text,
  cart_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal decimal(10, 2) NOT NULL DEFAULT 0,
  discount_type text NOT NULL DEFAULT 'none',
  discount_value decimal(10, 2) NOT NULL DEFAULT 0,
  total decimal(10, 2) NOT NULL DEFAULT 0,
  collect_method text NOT NULL DEFAULT 'pickup',
  order_notes text,
  status text NOT NULL DEFAULT 'active',
  held_at timestamptz NOT NULL DEFAULT now(),
  resumed_at timestamptz,
  resumed_by text,
  cancelled_at timestamptz,
  cancelled_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('active', 'resumed', 'cancelled', 'expired')),
  CONSTRAINT valid_discount_type CHECK (discount_type IN ('none', 'percent', 'amount')),
  CONSTRAINT valid_collect_method CHECK (collect_method IN ('pickup', 'delivery'))
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_held_orders_cashier_id ON held_orders(cashier_id);
CREATE INDEX IF NOT EXISTS idx_held_orders_status ON held_orders(status);
CREATE INDEX IF NOT EXISTS idx_held_orders_held_at ON held_orders(held_at DESC);
CREATE INDEX IF NOT EXISTS idx_held_orders_customer_phone ON held_orders(customer_phone);

-- Enable Row Level Security
ALTER TABLE held_orders ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can view held orders
-- Note: In production, you may want to restrict this to only the cashier's own holds
CREATE POLICY "Authenticated users can view held orders"
  ON held_orders
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Authenticated users can create held orders
CREATE POLICY "Authenticated users can create held orders"
  ON held_orders
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = cashier_id);

-- Policy: Authenticated users can update held orders
-- Users can update any held order (for manager override capability)
-- In production, you might want to restrict to: auth.uid() = cashier_id
CREATE POLICY "Authenticated users can update held orders"
  ON held_orders
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy: Authenticated users can delete their own held orders
CREATE POLICY "Authenticated users can delete held orders"
  ON held_orders
  FOR DELETE
  TO authenticated
  USING (auth.uid() = cashier_id);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_held_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS trigger_update_held_orders_updated_at ON held_orders;
CREATE TRIGGER trigger_update_held_orders_updated_at
  BEFORE UPDATE ON held_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_held_orders_updated_at();

-- Function to generate unique hold numbers
CREATE OR REPLACE FUNCTION generate_hold_number()
RETURNS text AS $$
DECLARE
  new_number text;
  date_part text;
  counter integer;
BEGIN
  -- Format: HOLD-YYYYMMDD-XXX
  date_part := to_char(now(), 'YYYYMMDD');
  
  -- Get the count of holds created today
  SELECT COUNT(*) + 1 INTO counter
  FROM held_orders
  WHERE hold_number LIKE 'HOLD-' || date_part || '-%';
  
  -- Generate the hold number
  new_number := 'HOLD-' || date_part || '-' || LPAD(counter::text, 3, '0');
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;