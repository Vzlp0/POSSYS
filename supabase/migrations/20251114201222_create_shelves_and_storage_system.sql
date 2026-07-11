/*
  # Create Shelves and Storage Tracking System

  1. New Tables
    - `shelves`
      - Tracks items on retail shelves by branch and section
      - Includes capacity management and current quantity
      - Auto-computed status field (Full/Need Refill/Empty)
    
    - `storage_batches`
      - Tracks stock in storage/backroom by branch
      - Includes batch numbers and expiry dates
      - Records last movement timestamps

  2. Updates to Existing Tables
    - `cash_sales` table (if columns don't exist)
      - Add shelf_id to track which shelf item was sold from
      - Add branch_name if not present
      - Add sold_qty to track quantity sold

  3. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users

  4. Functions
    - Auto-calculate shelf status based on current_qty
    - Helper function to update shelf quantities
*/

-- Create shelves table
CREATE TABLE IF NOT EXISTS shelves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_name text NOT NULL,
  section_name text NOT NULL,
  shelf_code text NOT NULL,
  item_id uuid REFERENCES items(id) ON DELETE CASCADE,
  max_capacity decimal(10,2) NOT NULL DEFAULT 0,
  current_qty decimal(10,2) NOT NULL DEFAULT 0,
  last_count_date timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_shelves_branch ON shelves(branch_name);
CREATE INDEX IF NOT EXISTS idx_shelves_item ON shelves(item_id);
CREATE INDEX IF NOT EXISTS idx_shelves_status ON shelves(branch_name, current_qty, max_capacity);

-- Add computed status function for shelves
CREATE OR REPLACE FUNCTION get_shelf_status(current_qty decimal, max_capacity decimal)
RETURNS text AS $$
BEGIN
  IF current_qty >= max_capacity THEN
    RETURN 'Full';
  ELSIF current_qty = 0 THEN
    RETURN 'Empty';
  ELSE
    RETURN 'Need Refill';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION get_shelf_status IS 'Calculates shelf status: Full, Need Refill, or Empty';

-- Create storage_batches table
CREATE TABLE IF NOT EXISTS storage_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_name text NOT NULL,
  location_name text NOT NULL,
  item_id uuid REFERENCES items(id) ON DELETE CASCADE,
  batch_number text,
  qty_on_hand decimal(10,2) NOT NULL DEFAULT 0,
  expiry_date date,
  last_movement_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for storage_batches
CREATE INDEX IF NOT EXISTS idx_storage_branch ON storage_batches(branch_name);
CREATE INDEX IF NOT EXISTS idx_storage_item ON storage_batches(item_id);
CREATE INDEX IF NOT EXISTS idx_storage_expiry ON storage_batches(expiry_date);

-- Update cash_sales table to add shelf tracking columns if they don't exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cash_sales') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'cash_sales' AND column_name = 'shelf_id'
    ) THEN
      ALTER TABLE cash_sales ADD COLUMN shelf_id uuid REFERENCES shelves(id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'cash_sales' AND column_name = 'branch_name'
    ) THEN
      ALTER TABLE cash_sales ADD COLUMN branch_name text;
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'cash_sales' AND column_name = 'sold_qty'
    ) THEN
      ALTER TABLE cash_sales ADD COLUMN sold_qty decimal(10,2) DEFAULT 1;
    END IF;
  END IF;
END $$;

-- Function to handle shelf quantity update when sale is made
CREATE OR REPLACE FUNCTION update_shelf_on_sale()
RETURNS trigger AS $$
BEGIN
  -- If shelf_id is provided, decrease shelf quantity
  IF NEW.shelf_id IS NOT NULL THEN
    UPDATE shelves
    SET 
      current_qty = current_qty - COALESCE(NEW.sold_qty, 1),
      updated_at = now()
    WHERE id = NEW.shelf_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for cash_sales if table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cash_sales') THEN
    DROP TRIGGER IF EXISTS trigger_update_shelf_on_sale ON cash_sales;
    CREATE TRIGGER trigger_update_shelf_on_sale
      AFTER INSERT ON cash_sales
      FOR EACH ROW
      EXECUTE FUNCTION update_shelf_on_sale();
  END IF;
END $$;

-- Function to move stock from storage to shelf
CREATE OR REPLACE FUNCTION move_storage_to_shelf(
  p_storage_batch_id uuid,
  p_shelf_id uuid,
  p_qty decimal
)
RETURNS jsonb AS $$
DECLARE
  v_storage_qty decimal;
  v_item_id uuid;
  v_branch_name text;
BEGIN
  -- Validate storage batch has enough quantity
  SELECT qty_on_hand, item_id, branch_name
  INTO v_storage_qty, v_item_id, v_branch_name
  FROM storage_batches
  WHERE id = p_storage_batch_id;
  
  IF v_storage_qty IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Storage batch not found');
  END IF;
  
  IF v_storage_qty < p_qty THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient quantity in storage');
  END IF;
  
  -- Update storage batch
  UPDATE storage_batches
  SET 
    qty_on_hand = qty_on_hand - p_qty,
    last_movement_at = now(),
    updated_at = now()
  WHERE id = p_storage_batch_id;
  
  -- Update shelf
  UPDATE shelves
  SET 
    current_qty = current_qty + p_qty,
    last_count_date = now(),
    updated_at = now()
  WHERE id = p_shelf_id;
  
  RETURN jsonb_build_object('success', true, 'message', 'Stock moved successfully');
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION move_storage_to_shelf IS 'Moves stock from storage batch to shelf and logs movement';

-- Enable Row Level Security
ALTER TABLE shelves ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage_batches ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shelves
CREATE POLICY "Users can view all shelves"
  ON shelves FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert shelves"
  ON shelves FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update shelves"
  ON shelves FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete shelves"
  ON shelves FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for storage_batches
CREATE POLICY "Users can view all storage batches"
  ON storage_batches FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert storage batches"
  ON storage_batches FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update storage batches"
  ON storage_batches FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete storage batches"
  ON storage_batches FOR DELETE
  TO authenticated
  USING (true);

-- Add helpful comments
COMMENT ON TABLE shelves IS 'Tracks items on retail shelves with capacity and current quantity';
COMMENT ON TABLE storage_batches IS 'Tracks stock in storage/backroom with batch and expiry info';
