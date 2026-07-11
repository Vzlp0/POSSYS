/*
  # Enable Anonymous Access for Shelves and Storage

  1. Changes
    - Add RLS policies for anonymous (anon) role on shelves table
    - Add RLS policies for anonymous (anon) role on storage_batches table
    - This allows the frontend to work during development without authentication

  2. Security Note
    - In production, these policies should be restricted to authenticated users only
    - This is temporary for development purposes
*/

-- Add anon policies for shelves table
CREATE POLICY "Allow anon to view shelves"
  ON shelves FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon to insert shelves"
  ON shelves FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon to update shelves"
  ON shelves FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon to delete shelves"
  ON shelves FOR DELETE
  TO anon
  USING (true);

-- Add anon policies for storage_batches table
CREATE POLICY "Allow anon to view storage batches"
  ON storage_batches FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon to insert storage batches"
  ON storage_batches FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon to update storage batches"
  ON storage_batches FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon to delete storage batches"
  ON storage_batches FOR DELETE
  TO anon
  USING (true);
