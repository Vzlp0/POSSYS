/*
  # Add Manual PO Fields for Audit Trail

  1. Changes to purchase_orders table
    - Add `manual_po` (boolean) - Flag to indicate manual PO creation
    - Add `created_by_override` (uuid) - User who created manual PO
    - Add `override_timestamp` (timestamptz) - When manual PO was created
  
  2. Purpose
    - Track POs created without PR approval
    - Provide audit trail for override actions
    - Enable reporting on manual PO usage
*/

-- Add manual PO fields
DO $$
BEGIN
  -- Add manual_po flag
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'purchase_orders' AND column_name = 'manual_po'
  ) THEN
    ALTER TABLE purchase_orders ADD COLUMN manual_po boolean DEFAULT false;
  END IF;

  -- Add created_by_override field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'purchase_orders' AND column_name = 'created_by_override'
  ) THEN
    ALTER TABLE purchase_orders ADD COLUMN created_by_override uuid REFERENCES auth.users(id);
  END IF;

  -- Add override_timestamp field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'purchase_orders' AND column_name = 'override_timestamp'
  ) THEN
    ALTER TABLE purchase_orders ADD COLUMN override_timestamp timestamptz;
  END IF;
END $$;

-- Create index for manual PO queries
CREATE INDEX IF NOT EXISTS idx_po_manual_po ON purchase_orders(manual_po);
CREATE INDEX IF NOT EXISTS idx_po_override_user ON purchase_orders(created_by_override);

-- Add comment for documentation
COMMENT ON COLUMN purchase_orders.manual_po IS 'Flag indicating PO was created without PR approval (override)';
COMMENT ON COLUMN purchase_orders.created_by_override IS 'User who created this manual PO (override)';
COMMENT ON COLUMN purchase_orders.override_timestamp IS 'Timestamp when manual PO override was used';



