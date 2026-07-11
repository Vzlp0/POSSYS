/*
  # Add Store Credit / Pay Later Feature

  1. Changes to clients table
    - Add `current_debt` column (numeric) to track outstanding balances
    - Default value is 0 (no debt)
    - Allows tracking customers who purchase on account/credit
  
  2. Security
    - Existing RLS policies will apply to the new column
    - Only authenticated users can view and modify debt amounts
*/

-- Add current_debt column to clients table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'current_debt'
  ) THEN
    ALTER TABLE clients ADD COLUMN current_debt numeric DEFAULT 0 NOT NULL;
  END IF;
END $$;

-- Add a check constraint to ensure debt cannot be negative
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'clients_current_debt_non_negative'
  ) THEN
    ALTER TABLE clients ADD CONSTRAINT clients_current_debt_non_negative CHECK (current_debt >= 0);
  END IF;
END $$;

-- Add an index for quick queries on customers with debt
CREATE INDEX IF NOT EXISTS idx_clients_current_debt ON clients(current_debt) WHERE current_debt > 0;

-- Add a comment for documentation
COMMENT ON COLUMN clients.current_debt IS 'Outstanding balance for customers using Pay Later/Store Credit feature';