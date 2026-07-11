/*
  # Create Clients and Loyalty Program Tables

  1. New Tables
    - `clients`
      - `id` (uuid, primary key) - Unique identifier
      - `client_number` (text, unique) - Human-readable client number (e.g., CL-20231003-001)
      - `first_name` (text) - Client's first name
      - `last_name` (text) - Client's last name
      - `email` (text, nullable) - Email address
      - `phone` (text, nullable) - Phone number
      - `date_of_birth` (date, nullable) - Date of birth for birthday offers
      - `address` (text, nullable) - Physical address
      - `notes` (text, nullable) - Special notes about client preferences
      - `total_visits` (integer) - Total number of visits
      - `total_spent` (decimal) - Lifetime spending amount
      - `status` (text) - active, inactive
      - `created_at` (timestamptz) - When client was registered
      - `updated_at` (timestamptz) - Last update timestamp

    - `loyalty_cards`
      - `id` (uuid, primary key) - Unique identifier
      - `card_number` (text, unique) - Card number (e.g., LOYAL-20231003-001)
      - `client_id` (uuid, foreign key) - Reference to client
      - `program_type` (text) - Type of loyalty program (coffee_6plus1, etc.)
      - `stamps_required` (integer) - Number of stamps needed for reward
      - `current_stamps` (integer) - Current number of stamps
      - `completed_cards` (integer) - Number of cards completed (rewards claimed)
      - `last_stamp_at` (timestamptz, nullable) - When last stamp was added
      - `status` (text) - active, completed, expired
      - `created_at` (timestamptz) - Card creation date
      - `updated_at` (timestamptz) - Last update

    - `loyalty_transactions`
      - `id` (uuid, primary key) - Unique identifier
      - `loyalty_card_id` (uuid, foreign key) - Reference to loyalty card
      - `client_id` (uuid, foreign key) - Reference to client
      - `transaction_id` (text, nullable) - Reference to POS transaction
      - `transaction_type` (text) - stamp_earned, reward_redeemed
      - `stamps_added` (integer) - Number of stamps added
      - `item_name` (text) - Item that earned stamp or was redeemed
      - `transaction_date` (timestamptz) - When transaction occurred
      - `cashier_name` (text) - Who processed the transaction
      - `notes` (text, nullable) - Additional notes
      - `created_at` (timestamptz) - Record creation

    - `client_orders`
      - `id` (uuid, primary key) - Unique identifier
      - `client_id` (uuid, foreign key) - Reference to client
      - `order_number` (text) - Order/transaction number
      - `order_date` (timestamptz) - When order was placed
      - `items` (jsonb) - Order items array
      - `subtotal` (decimal) - Order subtotal
      - `discount` (decimal) - Discount applied
      - `total` (decimal) - Final total
      - `payment_method` (text) - How customer paid
      - `cashier_name` (text) - Who served the customer
      - `loyalty_stamps_earned` (integer) - Stamps earned from this order
      - `notes` (text, nullable) - Order notes
      - `created_at` (timestamptz) - Record creation

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage clients
    - Add policies for loyalty card operations
    - Add policies for viewing order history

  3. Indexes
    - Index on client phone and email for quick lookup
    - Index on loyalty card client_id
    - Index on order history client_id and date

  4. Functions
    - Auto-generate client numbers
    - Auto-generate card numbers
    - Calculate loyalty rewards eligibility
*/

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_number text UNIQUE NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text,
  phone text,
  date_of_birth date,
  address text,
  notes text,
  total_visits integer NOT NULL DEFAULT 0,
  total_spent decimal(10, 2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('active', 'inactive'))
);

-- Create loyalty_cards table
CREATE TABLE IF NOT EXISTS loyalty_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_number text UNIQUE NOT NULL,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  program_type text NOT NULL DEFAULT 'coffee_6plus1',
  stamps_required integer NOT NULL DEFAULT 6,
  current_stamps integer NOT NULL DEFAULT 0,
  completed_cards integer NOT NULL DEFAULT 0,
  last_stamp_at timestamptz,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_loyalty_status CHECK (status IN ('active', 'completed', 'expired')),
  CONSTRAINT valid_stamps CHECK (current_stamps >= 0 AND current_stamps <= stamps_required)
);

-- Create loyalty_transactions table
CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loyalty_card_id uuid NOT NULL REFERENCES loyalty_cards(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  transaction_id text,
  transaction_type text NOT NULL,
  stamps_added integer NOT NULL DEFAULT 0,
  item_name text NOT NULL,
  transaction_date timestamptz NOT NULL DEFAULT now(),
  cashier_name text NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_transaction_type CHECK (transaction_type IN ('stamp_earned', 'reward_redeemed'))
);

-- Create client_orders table
CREATE TABLE IF NOT EXISTS client_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  order_number text NOT NULL,
  order_date timestamptz NOT NULL DEFAULT now(),
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal decimal(10, 2) NOT NULL DEFAULT 0,
  discount decimal(10, 2) NOT NULL DEFAULT 0,
  total decimal(10, 2) NOT NULL DEFAULT 0,
  payment_method text NOT NULL,
  cashier_name text NOT NULL,
  loyalty_stamps_earned integer NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_loyalty_cards_client_id ON loyalty_cards(client_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_cards_status ON loyalty_cards(status);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_card_id ON loyalty_transactions(loyalty_card_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_client_id ON loyalty_transactions(client_id);
CREATE INDEX IF NOT EXISTS idx_client_orders_client_id ON client_orders(client_id);
CREATE INDEX IF NOT EXISTS idx_client_orders_order_date ON client_orders(order_date DESC);

-- Enable Row Level Security
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for clients
CREATE POLICY "Authenticated users can view clients"
  ON clients FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create clients"
  ON clients FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update clients"
  ON clients FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete clients"
  ON clients FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for loyalty_cards
CREATE POLICY "Authenticated users can view loyalty cards"
  ON loyalty_cards FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create loyalty cards"
  ON loyalty_cards FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update loyalty cards"
  ON loyalty_cards FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for loyalty_transactions
CREATE POLICY "Authenticated users can view loyalty transactions"
  ON loyalty_transactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create loyalty transactions"
  ON loyalty_transactions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for client_orders
CREATE POLICY "Authenticated users can view client orders"
  ON client_orders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create client orders"
  ON client_orders FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_clients_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_loyalty_cards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS trigger_update_clients_updated_at ON clients;
CREATE TRIGGER trigger_update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_clients_updated_at();

DROP TRIGGER IF EXISTS trigger_update_loyalty_cards_updated_at ON loyalty_cards;
CREATE TRIGGER trigger_update_loyalty_cards_updated_at
  BEFORE UPDATE ON loyalty_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_loyalty_cards_updated_at();

-- Function to generate unique client numbers
CREATE OR REPLACE FUNCTION generate_client_number()
RETURNS text AS $$
DECLARE
  new_number text;
  date_part text;
  counter integer;
BEGIN
  date_part := to_char(now(), 'YYYYMMDD');
  
  SELECT COUNT(*) + 1 INTO counter
  FROM clients
  WHERE client_number LIKE 'CL-' || date_part || '-%';
  
  new_number := 'CL-' || date_part || '-' || LPAD(counter::text, 3, '0');
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Function to generate unique loyalty card numbers
CREATE OR REPLACE FUNCTION generate_card_number()
RETURNS text AS $$
DECLARE
  new_number text;
  date_part text;
  counter integer;
BEGIN
  date_part := to_char(now(), 'YYYYMMDD');
  
  SELECT COUNT(*) + 1 INTO counter
  FROM loyalty_cards
  WHERE card_number LIKE 'LOYAL-' || date_part || '-%';
  
  new_number := 'LOYAL-' || date_part || '-' || LPAD(counter::text, 3, '0');
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;