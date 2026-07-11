/*
  # Allow anonymous access to items table

  1. Changes
    - Add policy to allow anonymous users to manage items
    - This is for development purposes while using mock authentication
    
  2. Security
    - In production, this should be removed and proper Supabase auth should be implemented
*/

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Authenticated users can manage items" ON items;
DROP POLICY IF EXISTS "Authenticated users can view items" ON items;

-- Create permissive policies for development
CREATE POLICY "Allow all operations on items"
  ON items
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);