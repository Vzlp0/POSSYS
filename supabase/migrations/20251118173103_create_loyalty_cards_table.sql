/*
  # Create Loyalty Cards Table

  ## New Tables
  
  ### loyalty_cards
  - `id` (uuid, primary key)
  - `card_number` (text, unique)
  - `client_id` (uuid, foreign key to clients)
  - `tier` (text) - bronze/silver/gold/platinum
  - `points_balance` (integer, default 0)
  - `total_points_earned` (integer, default 0)
  - `total_points_redeemed` (integer, default 0)
  - `status` (text) - active/suspended/expired
  - `issued_at` (timestamptz)
  - `expires_at` (timestamptz, nullable)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Security
  - Enable RLS
  - Add policies for authenticated users
*/

CREATE TABLE IF NOT EXISTS loyalty_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_number text UNIQUE NOT NULL,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  tier text DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
  points_balance integer DEFAULT 0,
  total_points_earned integer DEFAULT 0,
  total_points_redeemed integer DEFAULT 0,
  status text DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'expired')),
  issued_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE loyalty_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users full access to loyalty_cards"
  ON loyalty_cards FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_loyalty_cards_client_id ON loyalty_cards(client_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_cards_card_number ON loyalty_cards(card_number);
CREATE INDEX IF NOT EXISTS idx_loyalty_cards_status ON loyalty_cards(status);
