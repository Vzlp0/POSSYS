/*
  # Add VAT Mode to Items

  ## Changes
  - Add vat_mode column to items table
    - Options: 'inclusive' (INC) or 'exclusive' (EXC)
    - Default: 'inclusive'
  - Add vat_rate column to store VAT percentage (default 15% for Saudi Arabia)

  ## Notes
  - VAT Inclusive (INC): Price already includes VAT
  - VAT Exclusive (EXC): VAT is added on top of price
  - This is for POS sales only, not for Purchase Requests
*/

-- Add VAT mode and rate to items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'items' AND column_name = 'vat_mode'
  ) THEN
    ALTER TABLE items ADD COLUMN vat_mode TEXT DEFAULT 'inclusive' CHECK (vat_mode IN ('inclusive', 'exclusive'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'items' AND column_name = 'vat_rate'
  ) THEN
    ALTER TABLE items ADD COLUMN vat_rate DECIMAL(5,2) DEFAULT 15.00;
  END IF;
END $$;

-- Add comment
COMMENT ON COLUMN items.vat_mode IS 'VAT calculation mode: inclusive (price includes VAT) or exclusive (VAT added on top)';
COMMENT ON COLUMN items.vat_rate IS 'VAT rate percentage (e.g., 15 for 15%)';
