/*
  # Add Flexible Units System to Items

  1. Changes
    - Add `base_unit` column for the fundamental unit of measurement
    - Add `purchase_unit` column for the unit used when purchasing
    - Add `conversion_factor` column to convert purchase units to base units
    - Add `current_stock_base` column to track inventory in base units

  2. Logic
    - All inventory is stored in base_unit
    - During PO/GR: purchase_qty * conversion_factor = base_qty
    - During sales: deduct from base_qty
    - Display both base and purchase unit stock levels

  3. Notes
    - conversion_factor must be > 0
    - base_unit is required for all items
    - purchase_unit is optional (can be same as base_unit)
    - Default conversion_factor is 1 (for items without unit conversion)
*/

DO $$
BEGIN
  -- Add base_unit column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'items' AND column_name = 'base_unit'
  ) THEN
    ALTER TABLE items ADD COLUMN base_unit text DEFAULT 'Piece';
  END IF;

  -- Add purchase_unit column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'items' AND column_name = 'purchase_unit'
  ) THEN
    ALTER TABLE items ADD COLUMN purchase_unit text;
  END IF;

  -- Add conversion_factor column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'items' AND column_name = 'conversion_factor'
  ) THEN
    ALTER TABLE items ADD COLUMN conversion_factor decimal(10,4) DEFAULT 1;
  END IF;

  -- Add current_stock_base column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'items' AND column_name = 'current_stock_base'
  ) THEN
    ALTER TABLE items ADD COLUMN current_stock_base decimal(10,4) DEFAULT 0;
  END IF;
END $$;

-- Add constraint to ensure conversion_factor is always positive
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'items_conversion_factor_positive'
  ) THEN
    ALTER TABLE items 
    ADD CONSTRAINT items_conversion_factor_positive 
    CHECK (conversion_factor > 0);
  END IF;
END $$;
