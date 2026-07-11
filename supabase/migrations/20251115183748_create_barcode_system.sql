/*
  # Barcode System Enhancement

  ## Overview
  This migration implements a comprehensive barcode system with unique prefixes for fast item recognition
  and supplier barcode integration for seamless goods receipt processing.

  ## Changes

  ### 1. New Tables
  
  #### `barcode_prefixes`
  Configuration table for barcode prefix rules by category
  - `id` (uuid, primary key) - Unique identifier
  - `category` (text, unique) - Item category name
  - `prefix` (text, unique) - Barcode prefix (e.g., "FD", "PK", "EQ")
  - `description` (text) - Description of the prefix
  - `next_sequence` (integer) - Next available sequence number
  - `sequence_length` (integer) - Number of digits in sequence (default 5)
  - `is_active` (boolean) - Whether prefix is actively used
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  #### `barcode_history`
  Audit trail for all barcode assignments and changes
  - `id` (uuid, primary key) - Unique identifier
  - `item_id` (uuid) - Reference to items table
  - `barcode` (text) - The barcode value
  - `barcode_type` (text) - Type: 'internal' or 'supplier'
  - `supplier_id` (text) - Supplier ID if supplier barcode
  - `action` (text) - Action: 'created', 'updated', 'deleted'
  - `changed_by` (text) - User who made the change
  - `created_at` (timestamptz) - Timestamp of change

  ### 2. Items Table Updates
  - Add `barcode` (text, unique) - Internal system barcode with prefix
  - Add `barcode_prefix` (text) - The prefix portion of barcode
  - Add `barcode_sequence` (integer) - The sequence number portion
  - Add index on barcode for fast lookup

  ### 3. Supplier Barcode Support
  The existing `suppliers` JSONB column in items table will be enhanced to include:
  - `supplierBarcode` field for each supplier entry

  ### 4. Default Prefixes
  Populate initial barcode prefixes for common categories:
  - FD: Food items
  - DR: Drinks
  - PK: Packaging materials
  - EQ: Equipment
  - SP: Supplies
  - TL: Tools
  - GN: General items

  ## Security
  - Enable RLS on new tables
  - Policies for authenticated users to manage barcodes
  - Temporary anon access for development
*/

-- Create barcode prefixes configuration table
CREATE TABLE IF NOT EXISTS barcode_prefixes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text UNIQUE NOT NULL,
  prefix text UNIQUE NOT NULL,
  description text DEFAULT '',
  next_sequence integer DEFAULT 1,
  sequence_length integer DEFAULT 5,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create barcode history table for audit trail
CREATE TABLE IF NOT EXISTS barcode_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid REFERENCES items(id) ON DELETE CASCADE,
  barcode text NOT NULL,
  barcode_type text NOT NULL CHECK (barcode_type IN ('internal', 'supplier')),
  supplier_id text,
  action text NOT NULL CHECK (action IN ('created', 'updated', 'deleted')),
  changed_by text DEFAULT 'system',
  created_at timestamptz DEFAULT now()
);

-- Add barcode fields to items table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'items' AND column_name = 'barcode'
  ) THEN
    ALTER TABLE items ADD COLUMN barcode text UNIQUE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'items' AND column_name = 'barcode_prefix'
  ) THEN
    ALTER TABLE items ADD COLUMN barcode_prefix text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'items' AND column_name = 'barcode_sequence'
  ) THEN
    ALTER TABLE items ADD COLUMN barcode_sequence integer;
  END IF;
END $$;

-- Create index on barcode for fast lookup
CREATE INDEX IF NOT EXISTS idx_items_barcode ON items(barcode);
CREATE INDEX IF NOT EXISTS idx_barcode_history_item_id ON barcode_history(item_id);
CREATE INDEX IF NOT EXISTS idx_barcode_history_barcode ON barcode_history(barcode);

-- Insert default barcode prefixes for common categories
INSERT INTO barcode_prefixes (category, prefix, description, next_sequence, sequence_length, is_active)
VALUES
  ('Food', 'FD', 'Food and perishable items', 1, 5, true),
  ('Drinks', 'DR', 'Beverages and drink items', 1, 5, true),
  ('Packaging', 'PK', 'Packaging materials and supplies', 1, 5, true),
  ('Equipment', 'EQ', 'Equipment and machinery', 1, 5, true),
  ('Supplies', 'SP', 'General supplies', 1, 5, true),
  ('Tools', 'TL', 'Tools and hardware', 1, 5, true),
  ('General', 'GN', 'General uncategorized items', 1, 5, true)
ON CONFLICT (category) DO NOTHING;

-- Enable RLS on new tables
ALTER TABLE barcode_prefixes ENABLE ROW LEVEL SECURITY;
ALTER TABLE barcode_history ENABLE ROW LEVEL SECURITY;

-- Policies for barcode_prefixes
CREATE POLICY "Allow authenticated users to read barcode prefixes"
  ON barcode_prefixes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to manage barcode prefixes"
  ON barcode_prefixes FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon users to read barcode prefixes"
  ON barcode_prefixes FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon users to manage barcode prefixes"
  ON barcode_prefixes FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Policies for barcode_history
CREATE POLICY "Allow authenticated users to read barcode history"
  ON barcode_history FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert barcode history"
  ON barcode_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow anon users to read barcode history"
  ON barcode_history FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon users to insert barcode history"
  ON barcode_history FOR INSERT
  TO anon
  WITH CHECK (true);

-- Function to generate barcode for an item based on category
CREATE OR REPLACE FUNCTION generate_item_barcode(p_category text)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  v_prefix text;
  v_sequence integer;
  v_seq_length integer;
  v_barcode text;
BEGIN
  -- Get prefix configuration for category
  SELECT prefix, next_sequence, sequence_length
  INTO v_prefix, v_sequence, v_seq_length
  FROM barcode_prefixes
  WHERE category = p_category AND is_active = true;

  -- If no prefix found, use default 'GN' prefix
  IF v_prefix IS NULL THEN
    SELECT prefix, next_sequence, sequence_length
    INTO v_prefix, v_sequence, v_seq_length
    FROM barcode_prefixes
    WHERE category = 'General' AND is_active = true;
  END IF;

  -- Generate barcode: PREFIX-SEQUENCE (e.g., FD-00001)
  v_barcode := v_prefix || '-' || LPAD(v_sequence::text, v_seq_length, '0');

  -- Increment sequence number
  UPDATE barcode_prefixes
  SET next_sequence = next_sequence + 1,
      updated_at = now()
  WHERE prefix = v_prefix;

  RETURN v_barcode;
END;
$$;

-- Trigger function to auto-generate barcode on item insert if not provided
CREATE OR REPLACE FUNCTION auto_generate_barcode()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only generate if barcode is null
  IF NEW.barcode IS NULL THEN
    NEW.barcode := generate_item_barcode(NEW.category);
    NEW.barcode_prefix := SPLIT_PART(NEW.barcode, '-', 1);
    NEW.barcode_sequence := SPLIT_PART(NEW.barcode, '-', 2)::integer;
    
    -- Log to history
    INSERT INTO barcode_history (item_id, barcode, barcode_type, action, changed_by)
    VALUES (NEW.id, NEW.barcode, 'internal', 'created', 'system');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for auto-generating barcodes
DROP TRIGGER IF EXISTS trigger_auto_generate_barcode ON items;
CREATE TRIGGER trigger_auto_generate_barcode
  BEFORE INSERT ON items
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_barcode();

-- Function to update existing items with barcodes (run once)
CREATE OR REPLACE FUNCTION update_existing_items_with_barcodes()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_item RECORD;
  v_barcode text;
BEGIN
  FOR v_item IN 
    SELECT id, category, sku
    FROM items
    WHERE barcode IS NULL
  LOOP
    -- Generate barcode
    v_barcode := generate_item_barcode(v_item.category);
    
    -- Update item
    UPDATE items
    SET barcode = v_barcode,
        barcode_prefix = SPLIT_PART(v_barcode, '-', 1),
        barcode_sequence = SPLIT_PART(v_barcode, '-', 2)::integer
    WHERE id = v_item.id;
    
    -- Log to history
    INSERT INTO barcode_history (item_id, barcode, barcode_type, action, changed_by)
    VALUES (v_item.id, v_barcode, 'internal', 'created', 'migration');
  END LOOP;
END;
$$;

-- Execute barcode generation for existing items
SELECT update_existing_items_with_barcodes();
