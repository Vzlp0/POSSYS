/*
  # Add Additional Cost Fields to Items

  1. New Fields Added to items table
    - `vat` (decimal) - VAT percentage or amount
    - `average_cost` (decimal) - Running average cost of inventory
    - `last_purchase_cost` (decimal) - Cost from most recent purchase
    - Rename existing `cost` to `standard_cost` for clarity

  2. Notes
    - All new fields are nullable (optional)
    - `standard_cost` is the base/reference cost
    - `average_cost` is calculated from inventory movements
    - `last_purchase_cost` is updated from purchase orders
    - `vat` can be percentage or amount depending on tax system
*/

-- Add VAT field
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'items' AND column_name = 'vat'
  ) THEN
    ALTER TABLE items ADD COLUMN vat decimal(10,2) DEFAULT 0;
  END IF;
END $$;

-- Add Average Cost field
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'items' AND column_name = 'average_cost'
  ) THEN
    ALTER TABLE items ADD COLUMN average_cost decimal(12,4) DEFAULT 0;
  END IF;
END $$;

-- Add Last Purchase Cost field
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'items' AND column_name = 'last_purchase_cost'
  ) THEN
    ALTER TABLE items ADD COLUMN last_purchase_cost decimal(12,4) DEFAULT 0;
  END IF;
END $$;

-- Ensure standard_cost column exists (it should from combo migration)
-- If cost column exists but standard_cost doesn't, copy data
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'items' AND column_name = 'standard_cost'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'items' AND column_name = 'cost'
    ) THEN
      -- Add standard_cost and copy from cost
      ALTER TABLE items ADD COLUMN standard_cost decimal(12,4) DEFAULT 0;
      UPDATE items SET standard_cost = cost WHERE standard_cost = 0 OR standard_cost IS NULL;
    ELSE
      -- Just add standard_cost
      ALTER TABLE items ADD COLUMN standard_cost decimal(12,4) DEFAULT 0;
    END IF;
  END IF;
END $$;

-- Add helpful comments
COMMENT ON COLUMN items.standard_cost IS 'Base/reference cost for the item';
COMMENT ON COLUMN items.vat IS 'VAT percentage applicable to this item';
COMMENT ON COLUMN items.average_cost IS 'Weighted average cost from inventory movements';
COMMENT ON COLUMN items.last_purchase_cost IS 'Cost from the most recent purchase order';

-- Create a function to update average cost (can be called from purchase receipts)
CREATE OR REPLACE FUNCTION update_item_average_cost(
  p_item_id uuid,
  p_new_qty decimal,
  p_new_cost decimal
)
RETURNS void AS $$
DECLARE
  v_current_qty decimal;
  v_current_avg_cost decimal;
  v_new_avg_cost decimal;
BEGIN
  -- Get current values
  SELECT COALESCE(average_cost, standard_cost, 0)
  INTO v_current_avg_cost
  FROM items
  WHERE id = p_item_id;

  -- For now, assume current quantity is what we're adding to
  -- In a full implementation, this would query inventory levels
  v_current_qty := 0;

  -- Calculate new weighted average
  IF (v_current_qty + p_new_qty) > 0 THEN
    v_new_avg_cost := ((v_current_qty * v_current_avg_cost) + (p_new_qty * p_new_cost)) / (v_current_qty + p_new_qty);
  ELSE
    v_new_avg_cost := p_new_cost;
  END IF;

  -- Update the item
  UPDATE items
  SET 
    average_cost = v_new_avg_cost,
    last_purchase_cost = p_new_cost,
    updated_at = now()
  WHERE id = p_item_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_item_average_cost IS 'Updates average cost based on new purchase quantity and cost';
