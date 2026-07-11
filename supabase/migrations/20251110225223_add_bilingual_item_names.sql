/*
  # Add Bilingual Item Names

  1. Changes to Existing Tables
    - Add `name_ar` column to `items` table for Arabic name
    - Rename existing `name` column to `name_en` for clarity
    - Keep backward compatibility by creating a view or computed column

  2. Important Notes
    - Non-breaking change: existing `name` references will continue to work
    - `name_en` (English) is the primary name field
    - `name_ar` (Arabic) is the secondary name field
    - Both fields are stored and can be displayed based on language preference
*/

-- Add Arabic name column to items table
DO $$
BEGIN
  -- Add name_ar column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'items' AND column_name = 'name_ar'
  ) THEN
    ALTER TABLE items ADD COLUMN name_ar text;
  END IF;

  -- Add name_en column and migrate existing name data
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'items' AND column_name = 'name_en'
  ) THEN
    -- Add new column
    ALTER TABLE items ADD COLUMN name_en text;
    
    -- Copy existing name data to name_en
    UPDATE items SET name_en = name WHERE name_en IS NULL;
    
    -- Make name_en NOT NULL after data migration
    ALTER TABLE items ALTER COLUMN name_en SET NOT NULL;
  END IF;

  -- Keep the 'name' column for backward compatibility (defaults to English)
  -- Update it to always match name_en
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'items' AND column_name = 'name'
  ) THEN
    -- Ensure name column stays in sync with name_en
    UPDATE items SET name = name_en WHERE name != name_en OR name IS NULL;
  END IF;
END $$;

-- Create a trigger to keep 'name' column in sync with 'name_en' for backward compatibility
CREATE OR REPLACE FUNCTION sync_item_name()
RETURNS TRIGGER AS $$
BEGIN
  -- When name_en is updated, also update name
  IF NEW.name_en IS NOT NULL THEN
    NEW.name := NEW.name_en;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists and recreate
DROP TRIGGER IF EXISTS sync_item_name_trigger ON items;
CREATE TRIGGER sync_item_name_trigger
  BEFORE INSERT OR UPDATE ON items
  FOR EACH ROW
  EXECUTE FUNCTION sync_item_name();

-- Add helpful comments
COMMENT ON COLUMN items.name_en IS 'Item name in English (primary)';
COMMENT ON COLUMN items.name_ar IS 'Item name in Arabic (secondary)';
COMMENT ON COLUMN items.name IS 'Item name (defaults to English, kept for backward compatibility)';
