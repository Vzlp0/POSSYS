/*
  # Enable Anonymous Access for Users Table (Development)

  1. Changes
    - Add anonymous (anon) role policy for users table
    - Allow anon users to SELECT users
    - This enables development mode without authentication
  
  2. Security Note
    - This is for development purposes only
    - In production, this should be removed and proper authentication should be used
*/

-- Drop existing anon policy if exists to avoid conflicts
DROP POLICY IF EXISTS "Allow anon to view users" ON users;

-- Add anonymous policy for users table
CREATE POLICY "Allow anon to view users"
  ON users FOR SELECT
  TO anon
  USING (true);

-- Also ensure authenticated users can still view (might already exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' 
    AND policyname = 'All authenticated users can view users'
  ) THEN
    CREATE POLICY "All authenticated users can view users"
      ON users FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

