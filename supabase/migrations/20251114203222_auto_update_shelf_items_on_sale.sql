/*
  # Auto-Update Shelf Items on Sale

  1. Changes
    - Update trigger to automatically find and deduct from shelf_items
    - When a sale is made with an item_id, find shelf_item in same branch
    - Deduct quantity from the first available shelf_item with stock
    - If shelf_item_id is provided, use that specific one
    - Otherwise, auto-select based on branch_name and item_id

  2. Logic
    - Priority: Use shelf_item_id if provided
    - Fallback: Find shelf_item with same branch and item, has stock
    - Update: Decrease current_qty by sold_qty
*/

-- Drop old trigger and function
DROP TRIGGER IF EXISTS trigger_update_shelf_item_on_sale ON cash_sales;
DROP FUNCTION IF EXISTS update_shelf_item_on_sale();

-- Add item_id column to cash_sales if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cash_sales' AND column_name = 'item_id'
  ) THEN
    ALTER TABLE cash_sales ADD COLUMN item_id uuid REFERENCES items(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create improved trigger function
CREATE OR REPLACE FUNCTION update_shelf_item_on_sale()
RETURNS trigger AS $$
DECLARE
  v_shelf_item_id uuid;
  v_qty_to_deduct decimal;
BEGIN
  v_qty_to_deduct := COALESCE(NEW.sold_qty, 1);
  
  -- If shelf_item_id is explicitly provided, use it
  IF NEW.shelf_item_id IS NOT NULL THEN
    v_shelf_item_id := NEW.shelf_item_id;
  
  -- Otherwise, auto-find shelf_item based on branch and item
  ELSIF NEW.branch_name IS NOT NULL AND NEW.item_id IS NOT NULL THEN
    -- Find first shelf_item in same branch with this item that has stock
    SELECT si.id INTO v_shelf_item_id
    FROM shelf_items si
    JOIN shelves s ON s.id = si.shelf_id
    WHERE s.branch_name = NEW.branch_name
      AND si.item_id = NEW.item_id
      AND si.current_qty > 0
    ORDER BY si.current_qty DESC  -- Use shelf with most stock first
    LIMIT 1;
  END IF;
  
  -- Update shelf item if found
  IF v_shelf_item_id IS NOT NULL THEN
    UPDATE shelf_items
    SET 
      current_qty = GREATEST(0, current_qty - v_qty_to_deduct),
      updated_at = now()
    WHERE id = v_shelf_item_id;
    
    -- Update the sale record with the shelf_item_id used
    NEW.shelf_item_id := v_shelf_item_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_update_shelf_item_on_sale
  BEFORE INSERT ON cash_sales
  FOR EACH ROW
  EXECUTE FUNCTION update_shelf_item_on_sale();

COMMENT ON FUNCTION update_shelf_item_on_sale IS 'Automatically finds and deducts from shelf_items when sale is made';
