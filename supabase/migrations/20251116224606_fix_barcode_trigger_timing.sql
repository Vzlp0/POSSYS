/*
  # Fix Barcode Trigger Timing Issue

  ## Problem
  The auto_generate_barcode trigger was running BEFORE INSERT, which caused it to try 
  inserting into barcode_history before the item row existed, violating the foreign key constraint.

  ## Solution
  1. Drop the BEFORE INSERT trigger
  2. Recreate trigger logic that doesn't try to insert into barcode_history during the same transaction
  3. Use a separate AFTER INSERT trigger for barcode_history logging

  ## Changes
  - Modify auto_generate_barcode() to only generate the barcode, not log to history
  - Create separate AFTER INSERT trigger to log barcode creation to history
*/

-- Updated function that only generates barcode (no history logging)
CREATE OR REPLACE FUNCTION auto_generate_barcode()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only generate if barcode is null
  IF NEW.barcode IS NULL THEN
    NEW.barcode := generate_item_barcode(NEW.category);
    NEW.barcode_prefix := SPLIT_PART(NEW.barcode, '-', 1);
    NEW.barcode_sequence := SPLIT_PART(NEW.barcode, '-', 2)::integer;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Keep the BEFORE INSERT trigger for generating the barcode
DROP TRIGGER IF EXISTS trigger_auto_generate_barcode ON items;
CREATE TRIGGER trigger_auto_generate_barcode
  BEFORE INSERT ON items
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_barcode();

-- New function to log barcode to history AFTER item is created
CREATE OR REPLACE FUNCTION log_barcode_to_history()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Log to history only if barcode exists
  IF NEW.barcode IS NOT NULL THEN
    INSERT INTO barcode_history (item_id, barcode, barcode_type, action, changed_by)
    VALUES (NEW.id, NEW.barcode, 'internal', 'created', 'system');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create AFTER INSERT trigger for logging
DROP TRIGGER IF EXISTS trigger_log_barcode_history ON items;
CREATE TRIGGER trigger_log_barcode_history
  AFTER INSERT ON items
  FOR EACH ROW
  EXECUTE FUNCTION log_barcode_to_history();
