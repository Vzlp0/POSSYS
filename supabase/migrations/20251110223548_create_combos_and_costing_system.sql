/*
  # Combos & Costing System

  1. New Tables
    - `combos` - Defines combo products with pricing rules
    - `combo_items` - Individual components of a combo
    - `inventory_batches` - Track inventory by batch with cost and expiry
    - `sale_line_batches` - Snapshot of batch costs at sale time
    - `app_settings` - Feature flags and configuration

  2. Extensions to Existing Tables
    - `items` table extended with:
      - `product_type` - Type of product (SIMPLE, VARIANT, COMBO_FIXED, COMBO_MIXMATCH)
      - `list_price` - Regular selling price
      - `standard_cost` - Fallback cost if no batch tracking
      - `tax_code` - Optional tax classification
    - `sale_lines` table extended with:
      - `bundle_id` - Groups combo parent and children
      - `is_bundle_parent` - Identifies the combo parent line
      - `unit_price` - Price per unit
      - `line_discount` - Discount amount applied

  3. Security
    - Enable RLS on all tables
    - Policies for authenticated users to manage their data
*/

-- Extend items table with combo fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'items' AND column_name = 'product_type'
  ) THEN
    ALTER TABLE items ADD COLUMN product_type text DEFAULT 'SIMPLE' CHECK (product_type IN ('SIMPLE', 'VARIANT', 'COMBO_FIXED', 'COMBO_MIXMATCH'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'items' AND column_name = 'list_price'
  ) THEN
    ALTER TABLE items ADD COLUMN list_price decimal(10,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'items' AND column_name = 'standard_cost'
  ) THEN
    ALTER TABLE items ADD COLUMN standard_cost decimal(12,4) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'items' AND column_name = 'tax_code'
  ) THEN
    ALTER TABLE items ADD COLUMN tax_code text;
  END IF;
END $$;

-- Create combos table
CREATE TABLE IF NOT EXISTS combos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_product_id uuid NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  pricing_mode text NOT NULL CHECK (pricing_mode IN ('FIXED_PRICE', 'DISCOUNT_AMOUNT', 'DISCOUNT_PERCENT', 'CHEAPEST_FREE', 'TIERED')),
  fixed_price decimal(10,2) DEFAULT 0,
  percent decimal(5,2) DEFAULT 0,
  mix_n integer DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(parent_product_id)
);

-- Create combo_items table
CREATE TABLE IF NOT EXISTS combo_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  combo_id uuid NOT NULL REFERENCES combos(id) ON DELETE CASCADE,
  component_product_id uuid NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  min_qty integer DEFAULT 0,
  max_qty integer DEFAULT 1,
  is_required boolean DEFAULT false,
  allow_substitutes boolean DEFAULT false,
  substitute_group text,
  created_at timestamptz DEFAULT now()
);

-- Create inventory_batches table
CREATE TABLE IF NOT EXISTS inventory_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  batch_no text NOT NULL,
  expiry_date date,
  qty_on_hand decimal(10,3) DEFAULT 0,
  unit_cost decimal(12,4) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(product_id, batch_no)
);

-- Create sale_line_batches table
CREATE TABLE IF NOT EXISTS sale_line_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_line_id uuid NOT NULL,
  batch_no text NOT NULL,
  qty_from_batch decimal(10,3) NOT NULL,
  expiry_date date,
  unit_cost_snapshot decimal(12,4) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Extend sale_lines table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sale_lines') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'sale_lines' AND column_name = 'bundle_id'
    ) THEN
      ALTER TABLE sale_lines ADD COLUMN bundle_id uuid;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'sale_lines' AND column_name = 'is_bundle_parent'
    ) THEN
      ALTER TABLE sale_lines ADD COLUMN is_bundle_parent boolean DEFAULT false;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'sale_lines' AND column_name = 'unit_price'
    ) THEN
      ALTER TABLE sale_lines ADD COLUMN unit_price decimal(10,2) DEFAULT 0;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'sale_lines' AND column_name = 'line_discount'
    ) THEN
      ALTER TABLE sale_lines ADD COLUMN line_discount decimal(10,2) DEFAULT 0;
    END IF;
  END IF;
END $$;

-- Create app_settings table
CREATE TABLE IF NOT EXISTS app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert default app settings
INSERT INTO app_settings (setting_key, setting_value, description)
VALUES 
  ('combos_enabled', 'true', 'Enable/disable combo functionality'),
  ('tax_mode', 'PARENT_PRICED', 'Tax calculation mode: PARENT_PRICED or COMPONENT_PRICED')
ON CONFLICT (setting_key) DO NOTHING;

-- Enable RLS
ALTER TABLE combos ENABLE ROW LEVEL SECURITY;
ALTER TABLE combo_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_line_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for combos
CREATE POLICY "Users can view combos"
  ON combos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create combos"
  ON combos FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update combos"
  ON combos FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete combos"
  ON combos FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for combo_items
CREATE POLICY "Users can view combo items"
  ON combo_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create combo items"
  ON combo_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update combo items"
  ON combo_items FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete combo items"
  ON combo_items FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for inventory_batches
CREATE POLICY "Users can view inventory batches"
  ON inventory_batches FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create inventory batches"
  ON inventory_batches FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update inventory batches"
  ON inventory_batches FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete inventory batches"
  ON inventory_batches FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for sale_line_batches
CREATE POLICY "Users can view sale line batches"
  ON sale_line_batches FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create sale line batches"
  ON sale_line_batches FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update sale line batches"
  ON sale_line_batches FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for app_settings
CREATE POLICY "Users can view app settings"
  ON app_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update app settings"
  ON app_settings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_combos_parent_product ON combos(parent_product_id);
CREATE INDEX IF NOT EXISTS idx_combo_items_combo ON combo_items(combo_id);
CREATE INDEX IF NOT EXISTS idx_combo_items_component ON combo_items(component_product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_batches_product ON inventory_batches(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_batches_expiry ON inventory_batches(expiry_date);
CREATE INDEX IF NOT EXISTS idx_sale_line_batches_line ON sale_line_batches(sale_line_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_combos_updated_at ON combos;
CREATE TRIGGER update_combos_updated_at
  BEFORE UPDATE ON combos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_inventory_batches_updated_at ON inventory_batches;
CREATE TRIGGER update_inventory_batches_updated_at
  BEFORE UPDATE ON inventory_batches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_app_settings_updated_at ON app_settings;
CREATE TRIGGER update_app_settings_updated_at
  BEFORE UPDATE ON app_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
