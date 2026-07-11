/*
  # Update Shelf Items from Transaction Items

  1. New Trigger
    - Create trigger on transaction_items table (not cash_sales)
    - When a transaction item is inserted, automatically find and deduct from shelf_items
    - Get branch from parent transaction record
    - Find shelf_item in that branch with the item and stock available
    - Deduct quantity sold from shelf item

  2. Changes
    - Add shelf_item_id column to transaction_items to track which shelf was used
    - Create trigger function to auto-deduct from shelves
    - Handle case where no shelf item exists (just continue, don't fail)

  3. Logic
    - Get branch from transactions table via transaction_id
    - Find shelf_item with: matching branch, matching item_id, current_qty > 0
    - Update shelf_item to decrease current_qty
    - Store shelf_item_id in transaction_items for tracking
*/

-- Add shelf_item_id to transaction_items if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transaction_items' AND column_name = 'shelf_item_id'
  ) THEN
    ALTER TABLE transaction_items ADD COLUMN shelf_item_id uuid REFERENCES shelf_items(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create trigger function for transaction_items
CREATE OR REPLACE FUNCTION update_shelf_from_transaction_item()
RETURNS trigger AS $$
DECLARE
  v_branch_id uuid;
  v_shelf_item_id uuid;
  v_qty_to_deduct decimal;
BEGIN
  -- Only process if item_id is provided
  IF NEW.item_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  v_qty_to_deduct := COALESCE(NEW.quantity, 0);
  
  -- Skip if no quantity
  IF v_qty_to_deduct <= 0 THEN
    RETURN NEW;
  END IF;
  
  -- Get branch_id from parent transaction
  SELECT branch_id INTO v_branch_id
  FROM transactions
  WHERE id = NEW.transaction_id;
  
  -- If no branch found, skip
  IF v_branch_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Find shelf_item in the same branch with this item that has stock
  SELECT si.id INTO v_shelf_item_id
  FROM shelf_items si
  JOIN shelves s ON s.id = si.shelf_id
  WHERE s.branch_name = (
    SELECT name FROM branches WHERE id = v_branch_id
  )
    AND si.item_id = NEW.item_id
    AND si.current_qty >= v_qty_to_deduct
  ORDER BY si.current_qty DESC  -- Use shelf with most stock first
  LIMIT 1;
  
  -- If no shelf found with exact quantity, try any shelf with stock
  IF v_shelf_item_id IS NULL THEN
    SELECT si.id INTO v_shelf_item_id
    FROM shelf_items si
    JOIN shelves s ON s.id = si.shelf_id
    WHERE s.branch_name = (
      SELECT name FROM branches WHERE id = v_branch_id
    )
      AND si.item_id = NEW.item_id
      AND si.current_qty > 0
    ORDER BY si.current_qty DESC
    LIMIT 1;
  END IF;
  
  -- Update shelf item if found
  IF v_shelf_item_id IS NOT NULL THEN
    UPDATE shelf_items
    SET 
      current_qty = GREATEST(0, current_qty - v_qty_to_deduct),
      updated_at = now()
    WHERE id = v_shelf_item_id;
    
    -- Store which shelf_item was used
    NEW.shelf_item_id := v_shelf_item_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on transaction_items
DROP TRIGGER IF EXISTS trigger_update_shelf_from_transaction_item ON transaction_items;

CREATE TRIGGER trigger_update_shelf_from_transaction_item
  BEFORE INSERT ON transaction_items
  FOR EACH ROW
  EXECUTE FUNCTION update_shelf_from_transaction_item();

COMMENT ON FUNCTION update_shelf_from_transaction_item IS 'Automatically deducts sold items from shelf_items based on transaction branch';
