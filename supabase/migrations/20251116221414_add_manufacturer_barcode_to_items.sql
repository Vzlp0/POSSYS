/*
  # Add Manufacturer Barcode to Items

  1. Changes
    - Add `manufacturer_barcode` column to items table
    - This stores the barcode printed on the product by the manufacturer
  
  2. Purpose
    - Allows tracking of both internal barcode and manufacturer's barcode
    - POS system will recognize either barcode when scanning products
    - Provides flexibility for inventory management
*/

DO $$
BEGIN
  -- Add manufacturer_barcode column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'items' AND column_name = 'manufacturer_barcode'
  ) THEN
    ALTER TABLE items ADD COLUMN manufacturer_barcode text;
  END IF;
END $$;