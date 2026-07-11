/*
  # Fix Shelf Deduction Trigger

  1. Changes
    - Fix the trigger to properly join branches table
    - Match shelf branch_name with branches.branch_name via branch_id
    - Handle items that don't have matching shelf items gracefully

  2. Logic Flow
    - Get branch_name from branches table using transaction.branch_id
    - Find shelf_items where shelf.branch_name matches
    - Deduct quantity from shelf with most stock first
*/

-- Replace the trigger function with corrected version
CREATE OR REPLACE FUNCTION update_shelf_from_transaction_item()
RETURNS trigger AS $$
DECLARE
  v_branch_name text;
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
  
  -- Get branch_name from parent transaction via branches table
  SELECT b.branch_name INTO v_branch_name
  FROM transactions t
  JOIN branches b ON b.id = t.branch_id
  WHERE t.id = NEW.transaction_id;
  
  -- If no branch found, skip (don't fail the transaction)
  IF v_branch_name IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Find shelf_item in the same branch with this item that has enough stock
  SELECT si.id INTO v_shelf_item_id
  FROM shelf_items si
  JOIN shelves s ON s.id = si.shelf_id
  WHERE s.branch_name = v_branch_name
    AND si.item_id = NEW.item_id
    AND si.current_qty >= v_qty_to_deduct
  ORDER BY si.current_qty DESC  -- Use shelf with most stock first
  LIMIT 1;
  
  -- If no shelf found with exact quantity, try any shelf with stock
  IF v_shelf_item_id IS NULL THEN
    SELECT si.id INTO v_shelf_item_id
    FROM shelf_items si
    JOIN shelves s ON s.id = si.shelf_id
    WHERE s.branch_name = v_branch_name
      AND si.item_id = NEW.item_id
      AND si.current_qty > 0
    ORDER BY si.current_qty DESC
    LIMIT 1;
  END IF;
  
  -- Update shelf item if found (gracefully skip if not found)
  IF v_shelf_item_id IS NOT NULL THEN
    UPDATE shelf_items
    SET 
      current_qty = GREATEST(0, current_qty - v_qty_to_deduct),
      updated_at = now()
    WHERE id = v_shelf_item_id;
    
    -- Store which shelf_item was used for tracking
    NEW.shelf_item_id := v_shelf_item_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_shelf_from_transaction_item IS 'Automatically deducts sold items from shelf_items based on transaction branch. Gracefully handles missing shelf items.';
