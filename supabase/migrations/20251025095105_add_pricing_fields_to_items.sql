/*
  # Add Pricing Fields to Items Table

  This migration adds comprehensive pricing support to the items table for POS operations.

  ## New Columns Added
  
  1. **price** (numeric) - The selling price for customers in the POS system
     - Required for items that show in POS
     - Represents the final price customers pay
     - Default: 0
  
  2. **cost** (numeric) - The base cost price from suppliers
     - Calculated from supplier information
     - Used for margin calculations
     - Default: 0
  
  3. **markup_percentage** (numeric) - Optional markup percentage over cost
     - Used for automatic price calculation
     - Can be NULL if not using automatic pricing
  
  4. **last_price_update** (timestamptz) - Timestamp of last price change
     - Tracks when prices were last modified
     - Useful for price history and auditing
     - Default: now()

  ## Changes Made
  
  - Add pricing columns to items table with appropriate defaults
  - Add index on price for faster POS queries
  - Add check constraint to ensure price is not negative
  - Add check constraint to ensure cost is not negative
  - Update existing items to have default price values

  ## Notes
  
  - Existing items will have price and cost set to 0 by default
  - You will need to update prices for existing items after migration
  - The markup_percentage field is optional and can remain NULL
*/

-- Add pricing columns to items table
DO $$
BEGIN
  -- Add price column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'items' AND column_name = 'price'
  ) THEN
    ALTER TABLE items ADD COLUMN price NUMERIC(10, 2) DEFAULT 0 NOT NULL;
  END IF;

  -- Add cost column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'items' AND column_name = 'cost'
  ) THEN
    ALTER TABLE items ADD COLUMN cost NUMERIC(10, 2) DEFAULT 0 NOT NULL;
  END IF;

  -- Add markup_percentage column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'items' AND column_name = 'markup_percentage'
  ) THEN
    ALTER TABLE items ADD COLUMN markup_percentage NUMERIC(5, 2);
  END IF;

  -- Add last_price_update column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'items' AND column_name = 'last_price_update'
  ) THEN
    ALTER TABLE items ADD COLUMN last_price_update TIMESTAMPTZ DEFAULT now();
  END IF;
END $$;

-- Add check constraints to ensure prices are not negative
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'items_price_positive'
  ) THEN
    ALTER TABLE items ADD CONSTRAINT items_price_positive CHECK (price >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'items_cost_positive'
  ) THEN
    ALTER TABLE items ADD CONSTRAINT items_cost_positive CHECK (cost >= 0);
  END IF;
END $$;

-- Add index on price for faster POS queries
CREATE INDEX IF NOT EXISTS idx_items_price ON items(price);

-- Add index on show_in_pos and price for POS item queries
CREATE INDEX IF NOT EXISTS idx_items_pos_price ON items(show_in_pos, price) WHERE show_in_pos = true;