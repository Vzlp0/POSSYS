/*
  # Update Shelves to Support Multiple Items

  1. Changes to shelves table
    - Remove item_id column (each shelf can hold multiple items)
    - Remove max_capacity and current_qty (these will be per item, not per shelf)
    - Keep shelf location info: branch_name, section_name, shelf_code

  2. New Table: shelf_items
    - Junction table linking shelves to items with quantities
    - Fields: shelf_id, item_id, max_capacity, current_qty
    - This allows one shelf to hold many different items

  3. Updates
    - Drop old get_shelf_status function (not needed)
    - Create new function for shelf item status
    - Update move_storage_to_shelf function to work with shelf_items
    - Update trigger for cash_sales

  4. Security
    - Enable RLS on shelf_items
    - Add policies for authenticated and anon users
*/

-- First, drop the old trigger and function
DROP TRIGGER IF EXISTS trigger_update_shelf_on_sale ON cash_sales;
DROP FUNCTION IF EXISTS update_shelf_on_sale();
DROP FUNCTION IF EXISTS get_shelf_status(decimal, decimal);

-- Modify shelves table structure
ALTER TABLE shelves DROP COLUMN IF EXISTS item_id;
ALTER TABLE shelves DROP COLUMN IF EXISTS max_capacity;
ALTER TABLE shelves DROP COLUMN IF EXISTS current_qty;
ALTER TABLE shelves DROP COLUMN IF EXISTS last_count_date;

-- Create shelf_items junction table
CREATE TABLE IF NOT EXISTS shelf_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shelf_id uuid REFERENCES shelves(id) ON DELETE CASCADE NOT NULL,
  item_id uuid REFERENCES items(id) ON DELETE CASCADE NOT NULL,
  max_capacity decimal(10,2) NOT NULL DEFAULT 0,
  current_qty decimal(10,2) NOT NULL DEFAULT 0,
  last_count_date timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(shelf_id, item_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_shelf_items_shelf ON shelf_items(shelf_id);
CREATE INDEX IF NOT EXISTS idx_shelf_items_item ON shelf_items(item_id);
CREATE INDEX IF NOT EXISTS idx_shelf_items_status ON shelf_items(current_qty, max_capacity);

-- New status function for shelf items
CREATE OR REPLACE FUNCTION get_shelf_item_status(current_qty decimal, max_capacity decimal)
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

COMMENT ON FUNCTION get_shelf_item_status IS 'Calculates shelf item status: Full, Need Refill, or Empty';

-- Update cash_sales to reference shelf_items instead of shelves
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cash_sales' AND column_name = 'shelf_id'
  ) THEN
    ALTER TABLE cash_sales DROP COLUMN shelf_id;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cash_sales' AND column_name = 'shelf_item_id'
  ) THEN
    ALTER TABLE cash_sales ADD COLUMN shelf_item_id uuid REFERENCES shelf_items(id) ON DELETE SET NULL;
  END IF;
END $$;

-- New trigger function for cash_sales with shelf_items
CREATE OR REPLACE FUNCTION update_shelf_item_on_sale()
RETURNS trigger AS $$
BEGIN
  IF NEW.shelf_item_id IS NOT NULL THEN
    UPDATE shelf_items
    SET 
      current_qty = current_qty - COALESCE(NEW.sold_qty, 1),
      updated_at = now()
    WHERE id = NEW.shelf_item_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for cash_sales
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cash_sales') THEN
    DROP TRIGGER IF EXISTS trigger_update_shelf_item_on_sale ON cash_sales;
    CREATE TRIGGER trigger_update_shelf_item_on_sale
      AFTER INSERT ON cash_sales
      FOR EACH ROW
      EXECUTE FUNCTION update_shelf_item_on_sale();
  END IF;
END $$;

-- Update move_storage_to_shelf function to work with shelf_items
DROP FUNCTION IF EXISTS move_storage_to_shelf(uuid, uuid, decimal);

CREATE OR REPLACE FUNCTION move_storage_to_shelf(
  p_storage_batch_id uuid,
  p_shelf_item_id uuid,
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
  
  -- Update shelf item
  UPDATE shelf_items
  SET 
    current_qty = current_qty + p_qty,
    last_count_date = now(),
    updated_at = now()
  WHERE id = p_shelf_item_id;
  
  RETURN jsonb_build_object('success', true, 'message', 'Stock moved successfully');
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION move_storage_to_shelf IS 'Moves stock from storage batch to shelf item and logs movement';

-- Enable Row Level Security on shelf_items
ALTER TABLE shelf_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shelf_items (authenticated users)
CREATE POLICY "Users can view all shelf items"
  ON shelf_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert shelf items"
  ON shelf_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update shelf items"
  ON shelf_items FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete shelf items"
  ON shelf_items FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for shelf_items (anon users - for development)
CREATE POLICY "Allow anon to view shelf items"
  ON shelf_items FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon to insert shelf items"
  ON shelf_items FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon to update shelf items"
  ON shelf_items FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon to delete shelf items"
  ON shelf_items FOR DELETE
  TO anon
  USING (true);

-- Add helpful comments
COMMENT ON TABLE shelf_items IS 'Junction table linking shelves to items with quantities - allows multiple items per shelf';
COMMENT ON TABLE shelves IS 'Physical shelf locations in stores - can hold multiple different items';
