/*
  # Create Returns and Exchange Tables

  1. New Tables
    - `returns`
      - `id` (uuid, primary key)
      - `return_number` (text, unique) - Return reference number (e.g., RET-123456)
      - `transaction_id` (uuid, foreign key) - Reference to original transaction
      - `invoice_number` (text) - Original invoice number
      - `return_date` (timestamptz) - When the return was processed
      - `total_refund` (decimal) - Total amount refunded
      - `refund_method` (text) - Method of refund (cash, network)
      - `reason` (text) - Reason for return
      - `processed_by` (text) - Staff member who processed the return
      - `approved_by` (text, nullable) - Manager who approved (if required)
      - `status` (text) - Status of return (completed, pending, cancelled)
      - `created_at` (timestamptz) - Record creation time

    - `return_items`
      - `id` (uuid, primary key)
      - `return_id` (uuid, foreign key) - Reference to return record
      - `item_name` (text) - Name of returned item
      - `item_sku` (text) - SKU of returned item
      - `quantity` (integer) - Quantity returned
      - `unit_price` (decimal) - Price per unit
      - `line_total` (decimal) - Total for this line (quantity * unit_price)
      - `created_at` (timestamptz) - Record creation time

    - `exchanges`
      - `id` (uuid, primary key)
      - `exchange_number` (text, unique) - Exchange reference number
      - `transaction_id` (uuid, foreign key) - Reference to original transaction
      - `invoice_number` (text) - Original invoice number
      - `exchange_date` (timestamptz) - When the exchange was processed
      - `returned_value` (decimal) - Value of returned items
      - `new_items_value` (decimal) - Value of new items
      - `difference` (decimal) - Price difference (positive = customer pays, negative = refund)
      - `reason` (text) - Reason for exchange
      - `processed_by` (text) - Staff member who processed
      - `approved_by` (text, nullable) - Manager who approved
      - `status` (text) - Status of exchange
      - `created_at` (timestamptz)

    - `exchange_items`
      - `id` (uuid, primary key)
      - `exchange_id` (uuid, foreign key)
      - `item_name` (text)
      - `item_sku` (text)
      - `quantity` (integer)
      - `unit_price` (decimal)
      - `line_total` (decimal)
      - `is_returned_item` (boolean) - True for returned items, false for new items
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to read and insert
*/

-- Create returns table
CREATE TABLE IF NOT EXISTS returns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  return_number text UNIQUE NOT NULL,
  transaction_id uuid REFERENCES transactions(id),
  invoice_number text NOT NULL,
  return_date timestamptz DEFAULT now(),
  total_refund decimal(10, 2) NOT NULL DEFAULT 0,
  refund_method text NOT NULL,
  reason text NOT NULL,
  processed_by text NOT NULL,
  approved_by text,
  status text NOT NULL DEFAULT 'completed',
  created_at timestamptz DEFAULT now()
);

-- Create return_items table
CREATE TABLE IF NOT EXISTS return_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id uuid REFERENCES returns(id) ON DELETE CASCADE,
  item_name text NOT NULL,
  item_sku text NOT NULL,
  quantity integer NOT NULL DEFAULT 0,
  unit_price decimal(10, 2) NOT NULL DEFAULT 0,
  line_total decimal(10, 2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create exchanges table
CREATE TABLE IF NOT EXISTS exchanges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exchange_number text UNIQUE NOT NULL,
  transaction_id uuid REFERENCES transactions(id),
  invoice_number text NOT NULL,
  exchange_date timestamptz DEFAULT now(),
  returned_value decimal(10, 2) NOT NULL DEFAULT 0,
  new_items_value decimal(10, 2) NOT NULL DEFAULT 0,
  difference decimal(10, 2) NOT NULL DEFAULT 0,
  reason text NOT NULL,
  processed_by text NOT NULL,
  approved_by text,
  status text NOT NULL DEFAULT 'completed',
  created_at timestamptz DEFAULT now()
);

-- Create exchange_items table
CREATE TABLE IF NOT EXISTS exchange_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exchange_id uuid REFERENCES exchanges(id) ON DELETE CASCADE,
  item_name text NOT NULL,
  item_sku text NOT NULL,
  quantity integer NOT NULL DEFAULT 0,
  unit_price decimal(10, 2) NOT NULL DEFAULT 0,
  line_total decimal(10, 2) NOT NULL DEFAULT 0,
  is_returned_item boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_returns_transaction_id ON returns(transaction_id);
CREATE INDEX IF NOT EXISTS idx_returns_invoice_number ON returns(invoice_number);
CREATE INDEX IF NOT EXISTS idx_returns_return_date ON returns(return_date);
CREATE INDEX IF NOT EXISTS idx_return_items_return_id ON return_items(return_id);
CREATE INDEX IF NOT EXISTS idx_exchanges_transaction_id ON exchanges(transaction_id);
CREATE INDEX IF NOT EXISTS idx_exchange_items_exchange_id ON exchange_items(exchange_id);

-- Enable Row Level Security
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchanges ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_items ENABLE ROW LEVEL SECURITY;

-- Create policies for returns
CREATE POLICY "Anyone can view returns"
  ON returns FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert returns"
  ON returns FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policies for return_items
CREATE POLICY "Anyone can view return items"
  ON return_items FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert return items"
  ON return_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policies for exchanges
CREATE POLICY "Anyone can view exchanges"
  ON exchanges FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert exchanges"
  ON exchanges FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policies for exchange_items
CREATE POLICY "Anyone can view exchange items"
  ON exchange_items FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert exchange items"
  ON exchange_items FOR INSERT
  TO authenticated
  WITH CHECK (true);
