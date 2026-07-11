/*
  # Enable Anonymous Access for Categories

  1. Changes
    - Add anonymous (anon) role policies for categories table
    - Allow anon users to SELECT categories
    - Allow anon users to INSERT new categories
    - Allow anon users to UPDATE existing categories
    - Allow anon users to DELETE categories
  
  2. Security Note
    - This enables development/testing access
    - In production, these should be restricted to authenticated users only
*/

-- Drop existing authenticated-only policies
DROP POLICY IF EXISTS "Authenticated users can read categories" ON categories;
DROP POLICY IF EXISTS "Authenticated users can create categories" ON categories;
DROP POLICY IF EXISTS "Authenticated users can update categories" ON categories;
DROP POLICY IF EXISTS "Authenticated users can delete categories" ON categories;

-- Create new policies for both authenticated and anonymous users
CREATE POLICY "Anyone can read categories"
  ON categories
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can create categories"
  ON categories
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update categories"
  ON categories
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete categories"
  ON categories
  FOR DELETE
  TO anon, authenticated
  USING (true);
