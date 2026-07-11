/*
  # Create Advanced Loyalty System

  1. New Tables
    - `loyalty_settings`
      - `id` (uuid, primary key) - Unique identifier
      - `points_enabled` (boolean) - Enable points system
      - `points_per_sar` (decimal) - Points earned per 1 SAR
      - `points_redemption_value` (decimal) - Value of 1 point in SAR
      - `min_points_redemption` (integer) - Minimum points to redeem
      - `cashback_enabled` (boolean) - Enable cashback system
      - `cashback_percentage` (decimal) - Cashback percentage
      - `tiers_enabled` (boolean) - Enable membership tiers
      - `subscription_enabled` (boolean) - Enable subscription system
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Update timestamp

    - `membership_tiers`
      - `id` (uuid, primary key) - Unique identifier
      - `tier_name` (text) - Name (Bronze, Silver, Gold, Platinum)
      - `tier_level` (integer) - Hierarchy level (1, 2, 3, 4)
      - `min_spending` (decimal) - Minimum total spending to qualify
      - `discount_percentage` (decimal) - Discount percentage for this tier
      - `points_multiplier` (decimal) - Points earning multiplier
      - `benefits` (jsonb) - Additional benefits as JSON
      - `tier_color` (text) - UI color code
      - `is_active` (boolean) - Active status
      - `created_at` (timestamptz) - Creation timestamp

    - `subscription_plans`
      - `id` (uuid, primary key) - Unique identifier
      - `plan_name` (text) - Plan name
      - `duration_type` (text) - monthly, yearly
      - `price` (decimal) - Subscription price
      - `benefits` (jsonb) - Benefits included (free items, discounts, etc.)
      - `is_active` (boolean) - Active status
      - `created_at` (timestamptz) - Creation timestamp

    - `client_loyalty`
      - `id` (uuid, primary key) - Unique identifier
      - `client_id` (uuid, foreign key) - Reference to client
      - `loyalty_type` (text) - points, cashback, tier, subscription
      - `points_balance` (integer) - Current points balance
      - `points_earned_total` (integer) - Lifetime points earned
      - `points_redeemed_total` (integer) - Lifetime points redeemed
      - `cashback_balance` (decimal) - Store credit balance
      - `cashback_earned_total` (decimal) - Lifetime cashback earned
      - `cashback_used_total` (decimal) - Lifetime cashback used
      - `tier_id` (uuid, foreign key) - Current membership tier
      - `tier_since` (timestamptz) - When tier was achieved
      - `subscription_plan_id` (uuid, foreign key) - Active subscription
      - `subscription_start` (timestamptz) - Subscription start date
      - `subscription_end` (timestamptz) - Subscription expiry date
      - `subscription_status` (text) - active, expired, cancelled
      - `subscription_usage` (jsonb) - Track usage of subscription benefits
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Update timestamp

    - `loyalty_transactions`
      - `id` (uuid, primary key) - Unique identifier
      - `client_id` (uuid, foreign key) - Reference to client
      - `transaction_type` (text) - points_earned, points_redeemed, cashback_earned, cashback_used, tier_upgrade, subscription_purchase
      - `order_id` (text) - Reference to order
      - `points_change` (integer) - Points added or subtracted
      - `cashback_change` (decimal) - Cashback added or subtracted
      - `amount` (decimal) - Transaction amount
      - `description` (text) - Transaction description
      - `previous_balance` (text) - Balance before transaction
      - `new_balance` (text) - Balance after transaction
      - `created_by` (text) - Who created the transaction
      - `created_at` (timestamptz) - Transaction timestamp

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users

  3. Indexes
    - Index on client_id for quick lookups
    - Index on transaction dates

  4. Functions
    - Calculate tier upgrades
    - Calculate points and cashback
*/

-- Create loyalty_settings table (single row for global settings)
CREATE TABLE IF NOT EXISTS loyalty_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  points_enabled boolean NOT NULL DEFAULT false,
  points_per_sar decimal(10, 2) NOT NULL DEFAULT 1.00,
  points_redemption_value decimal(10, 4) NOT NULL DEFAULT 0.10,
  min_points_redemption integer NOT NULL DEFAULT 100,
  cashback_enabled boolean NOT NULL DEFAULT false,
  cashback_percentage decimal(5, 2) NOT NULL DEFAULT 5.00,
  tiers_enabled boolean NOT NULL DEFAULT false,
  subscription_enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create membership_tiers table
CREATE TABLE IF NOT EXISTS membership_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_name text NOT NULL,
  tier_level integer NOT NULL UNIQUE,
  min_spending decimal(10, 2) NOT NULL DEFAULT 0,
  discount_percentage decimal(5, 2) NOT NULL DEFAULT 0,
  points_multiplier decimal(5, 2) NOT NULL DEFAULT 1.00,
  benefits jsonb NOT NULL DEFAULT '{}'::jsonb,
  tier_color text NOT NULL DEFAULT '#gray',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create subscription_plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_name text NOT NULL,
  duration_type text NOT NULL,
  price decimal(10, 2) NOT NULL,
  benefits jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_duration_type CHECK (duration_type IN ('monthly', 'yearly'))
);

-- Create client_loyalty table
CREATE TABLE IF NOT EXISTS client_loyalty (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  loyalty_type text NOT NULL DEFAULT 'points',
  points_balance integer NOT NULL DEFAULT 0,
  points_earned_total integer NOT NULL DEFAULT 0,
  points_redeemed_total integer NOT NULL DEFAULT 0,
  cashback_balance decimal(10, 2) NOT NULL DEFAULT 0,
  cashback_earned_total decimal(10, 2) NOT NULL DEFAULT 0,
  cashback_used_total decimal(10, 2) NOT NULL DEFAULT 0,
  tier_id uuid REFERENCES membership_tiers(id),
  tier_since timestamptz,
  subscription_plan_id uuid REFERENCES subscription_plans(id),
  subscription_start timestamptz,
  subscription_end timestamptz,
  subscription_status text,
  subscription_usage jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_loyalty_type CHECK (loyalty_type IN ('points', 'cashback', 'tier', 'subscription', 'all')),
  CONSTRAINT valid_subscription_status CHECK (subscription_status IN ('active', 'expired', 'cancelled') OR subscription_status IS NULL),
  UNIQUE(client_id)
);

-- Create loyalty_transactions table
CREATE TABLE IF NOT EXISTS loyalty_transactions_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  transaction_type text NOT NULL,
  order_id text,
  points_change integer DEFAULT 0,
  cashback_change decimal(10, 2) DEFAULT 0,
  amount decimal(10, 2) DEFAULT 0,
  description text,
  previous_balance text,
  new_balance text,
  created_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_transaction_type CHECK (transaction_type IN ('points_earned', 'points_redeemed', 'cashback_earned', 'cashback_used', 'tier_upgrade', 'subscription_purchase', 'subscription_renewal'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_client_loyalty_client_id ON client_loyalty(client_id);
CREATE INDEX IF NOT EXISTS idx_client_loyalty_tier_id ON client_loyalty(tier_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_client_id ON loyalty_transactions_history(client_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_created_at ON loyalty_transactions_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_membership_tiers_level ON membership_tiers(tier_level);

-- Enable Row Level Security
ALTER TABLE loyalty_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_loyalty ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view loyalty settings"
  ON loyalty_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update loyalty settings"
  ON loyalty_settings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view membership tiers"
  ON membership_tiers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage membership tiers"
  ON membership_tiers FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view subscription plans"
  ON subscription_plans FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage subscription plans"
  ON subscription_plans FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view client loyalty"
  ON client_loyalty FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage client loyalty"
  ON client_loyalty FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view loyalty transactions"
  ON loyalty_transactions_history FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create loyalty transactions"
  ON loyalty_transactions_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_loyalty_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_loyalty_settings_updated_at ON loyalty_settings;
CREATE TRIGGER trigger_update_loyalty_settings_updated_at
  BEFORE UPDATE ON loyalty_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_loyalty_updated_at();

DROP TRIGGER IF EXISTS trigger_update_client_loyalty_updated_at ON client_loyalty;
CREATE TRIGGER trigger_update_client_loyalty_updated_at
  BEFORE UPDATE ON client_loyalty
  FOR EACH ROW
  EXECUTE FUNCTION update_loyalty_updated_at();

-- Insert default loyalty settings
INSERT INTO loyalty_settings (
  points_enabled,
  points_per_sar,
  points_redemption_value,
  min_points_redemption,
  cashback_enabled,
  cashback_percentage,
  tiers_enabled,
  subscription_enabled
) VALUES (
  false,
  1.00,
  0.10,
  100,
  false,
  5.00,
  false,
  false
) ON CONFLICT DO NOTHING;

-- Insert default membership tiers
INSERT INTO membership_tiers (tier_name, tier_level, min_spending, discount_percentage, points_multiplier, tier_color, is_active) VALUES
  ('Bronze', 1, 0, 0, 1.0, '#CD7F32', true),
  ('Silver', 2, 1000, 5, 1.25, '#C0C0C0', true),
  ('Gold', 3, 5000, 10, 1.5, '#FFD700', true),
  ('Platinum', 4, 10000, 15, 2.0, '#E5E4E2', true)
ON CONFLICT (tier_level) DO NOTHING;

-- Insert default subscription plans
INSERT INTO subscription_plans (plan_name, duration_type, price, benefits, is_active) VALUES
  ('Monthly VIP', 'monthly', 99.00, '{"free_items": 5, "discount": 15, "priority_support": true}'::jsonb, true),
  ('Annual VIP', 'yearly', 999.00, '{"free_items": 60, "discount": 20, "priority_support": true, "birthday_bonus": 100}'::jsonb, true)
ON CONFLICT DO NOTHING;