/*
  # Remove Shelves and Storage Tracking System

  1. Drop Tables
    - Drop `shelves` table
    - Drop `storage_batches` table
    - Drop related functions and triggers
  
  2. Remove Columns from cash_sales
    - Remove shelf_id column
    - Remove branch_name column
    - Remove sold_qty column
  
  3. Clean Up
    - Drop all related functions
    - Drop all related triggers
    - Remove indexes

  Note: This migration removes all shelf and storage tracking functionality
*/

-- Drop trigger on cash_sales
DROP TRIGGER IF EXISTS trigger_update_shelf_on_sale ON cash_sales;

-- Drop functions
DROP FUNCTION IF EXISTS update_shelf_on_sale();
DROP FUNCTION IF EXISTS move_storage_to_shelf(uuid, uuid, decimal);
DROP FUNCTION IF EXISTS get_shelf_status(decimal, decimal);

-- Drop tables (cascade will remove foreign keys)
DROP TABLE IF EXISTS shelves CASCADE;
DROP TABLE IF EXISTS storage_batches CASCADE;

-- Remove columns from cash_sales if they exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cash_sales' AND column_name = 'shelf_id'
  ) THEN
    ALTER TABLE cash_sales DROP COLUMN shelf_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cash_sales' AND column_name = 'branch_name'
  ) THEN
    ALTER TABLE cash_sales DROP COLUMN branch_name;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cash_sales' AND column_name = 'sold_qty'
  ) THEN
    ALTER TABLE cash_sales DROP COLUMN sold_qty;
  END IF;
END $$;

-- Note: All shelves and storage data has been permanently deleted
