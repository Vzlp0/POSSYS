/*
  # Add suppliers column to items table

  1. Changes
    - Add suppliers JSONB column to items table to store supplier information
    - Set default value to empty array []
    
  2. Notes
    - This allows storing multiple suppliers per item with their details
    - Uses JSONB for flexible storage of supplier data
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'items' AND column_name = 'suppliers'
  ) THEN
    ALTER TABLE items ADD COLUMN suppliers JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;