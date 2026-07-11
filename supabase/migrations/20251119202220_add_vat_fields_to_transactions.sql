/*
  # Add VAT Fields to Transactions Table

  ## Changes Made
  1. Add columns to transactions table:
    - `vat_inclusive` - VAT amount that's included in prices (informational)
    - `vat_exclusive` - VAT amount added on top of prices (actual tax)
    - `invoice_number` - Alternative invoice identifier
    - `cashier_name` - Store cashier name for reporting
    - `transaction_date` - Transaction date (separate from created_at)
    - `branch_id` - Branch identifier for multi-location tracking

  ## Purpose
  These fields enable proper VAT tracking for both inclusive and exclusive VAT items,
  allowing businesses to properly report and separate VAT amounts for tax compliance.

  ## Notes
  - VAT Inclusive: VAT already built into the price (informational only)
  - VAT Exclusive: VAT added on top (actual tax amount to be reported)
  - The `tax` column now represents total VAT amount (inclusive + exclusive)
*/

-- Add VAT tracking fields to transactions table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'vat_inclusive'
  ) THEN
    ALTER TABLE transactions ADD COLUMN vat_inclusive numeric(15,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'vat_exclusive'
  ) THEN
    ALTER TABLE transactions ADD COLUMN vat_exclusive numeric(15,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'invoice_number'
  ) THEN
    ALTER TABLE transactions ADD COLUMN invoice_number text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'cashier_name'
  ) THEN
    ALTER TABLE transactions ADD COLUMN cashier_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'transaction_date'
  ) THEN
    ALTER TABLE transactions ADD COLUMN transaction_date timestamptz DEFAULT now();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'branch_id'
  ) THEN
    ALTER TABLE transactions ADD COLUMN branch_id text;
  END IF;
END $$;

-- Add helpful comments
COMMENT ON COLUMN transactions.vat_inclusive IS 'VAT amount already included in item prices (for reporting)';
COMMENT ON COLUMN transactions.vat_exclusive IS 'VAT amount added on top of prices (actual tax)';
COMMENT ON COLUMN transactions.tax IS 'Total VAT amount (inclusive + exclusive)';
COMMENT ON COLUMN transactions.invoice_number IS 'Alternative invoice identifier for the transaction';
COMMENT ON COLUMN transactions.cashier_name IS 'Name of the cashier who processed the transaction';
COMMENT ON COLUMN transactions.transaction_date IS 'Date and time of the transaction';
COMMENT ON COLUMN transactions.branch_id IS 'Branch identifier for multi-location tracking';
