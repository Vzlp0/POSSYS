/*
  # Add Printed Label Tracking to Items

  1. Changes
    - Add `printed_label_source` column to track whether internal or supplier label is on item
    - Add `printed_label_supplier_id` column to track which supplier's label is physically on the item
  
  2. Purpose
    - Helps inventory management know which barcode is physically printed on each item
    - Can be either internal barcode or specific supplier's barcode
    - Useful for tracking and auditing physical inventory labels
*/

DO $$
BEGIN
  -- Add printed_label_source column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'items' AND column_name = 'printed_label_source'
  ) THEN
    ALTER TABLE items ADD COLUMN printed_label_source text DEFAULT 'internal';
  END IF;

  -- Add printed_label_supplier_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'items' AND column_name = 'printed_label_supplier_id'
  ) THEN
    ALTER TABLE items ADD COLUMN printed_label_supplier_id text;
  END IF;
END $$;