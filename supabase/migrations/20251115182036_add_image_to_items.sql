/*
  # Add Image Support to Items Table

  1. Changes
    - Add `image_url` column to items table to store item images
    - Can store direct image URLs or base64 encoded images

  2. Notes
    - Images can be stored as URLs or base64 data URIs
    - No breaking changes to existing data
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'items' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE items ADD COLUMN image_url text;
  END IF;
END $$;
