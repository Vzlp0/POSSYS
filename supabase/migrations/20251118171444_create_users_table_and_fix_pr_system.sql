/*
  # Create Users Table and Fix PR System

  1. New Tables
    - `users` - Public users table that syncs with auth.users
      - `id` (uuid, primary key) - References auth.users(id)
      - `email` (text) - User email
      - `username` (text) - Display name
      - `role` (text) - User role (admin, manager, cashier, employee)
      - `is_active` (boolean) - Active status
      - `created_at` (timestamptz) - When created

  2. Functions
    - Auto-create user profile when auth user is created
    
  3. Schema Updates
    - Add foreign key constraints for requester_id and approved_by
    - Fix any missing relationships

  4. Security
    - Enable RLS on users table
    - Add appropriate policies
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  username text NOT NULL,
  role text DEFAULT 'employee',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policies for users
CREATE POLICY "All authenticated users can view users"
  ON users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Create function to auto-create user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, username, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'employee')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Add foreign key constraints to purchase_requisitions
DO $$
BEGIN
  -- Add foreign key for requester_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'purchase_requisitions_requester_id_fkey'
  ) THEN
    ALTER TABLE purchase_requisitions 
    ADD CONSTRAINT purchase_requisitions_requester_id_fkey 
    FOREIGN KEY (requester_id) REFERENCES users(id);
  END IF;

  -- Add foreign key for approved_by if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'purchase_requisitions_approved_by_fkey'
  ) THEN
    ALTER TABLE purchase_requisitions 
    ADD CONSTRAINT purchase_requisitions_approved_by_fkey 
    FOREIGN KEY (approved_by) REFERENCES users(id);
  END IF;
END $$;

-- Insert sample users for testing (these need to match auth.users)
-- Note: In production, users should sign up through the auth system
-- For development, we'll create a function to manually add test users

CREATE OR REPLACE FUNCTION create_test_user(
  user_email text,
  user_password text,
  user_name text,
  user_role text DEFAULT 'employee'
)
RETURNS uuid AS $$
DECLARE
  new_user_id uuid;
BEGIN
  -- This is a placeholder - in real usage, users sign up via Supabase Auth
  -- For now, we'll just create the profile if auth user exists
  SELECT id INTO new_user_id FROM auth.users WHERE email = user_email;
  
  IF new_user_id IS NOT NULL THEN
    INSERT INTO public.users (id, email, username, role)
    VALUES (new_user_id, user_email, user_name, user_role)
    ON CONFLICT (id) DO UPDATE SET username = user_name, role = user_role;
  END IF;
  
  RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
