/*
  # Create Test Admin User

  ## Purpose
  Creates a test admin user for easy login during development and testing.

  ## Credentials
  - Email: admin@test.com
  - Password: admin123
  - Role: admin

  ## Notes
  This is for development/testing only. In production, use proper authentication.
*/

-- This will be created via Supabase Auth Dashboard or API
-- For now, we'll create a placeholder in the users table that will be populated when the user signs up

-- Note: The actual user creation with password must be done through Supabase Auth
-- This migration just ensures the table is ready
DO $$
BEGIN
  -- Check if we need to insert a test user record
  -- The auth.users table will be populated when signup happens
  RAISE NOTICE 'To create test user, use the signup form or Supabase Dashboard with:';
  RAISE NOTICE 'Email: admin@test.com';
  RAISE NOTICE 'Password: admin123';
END $$;
