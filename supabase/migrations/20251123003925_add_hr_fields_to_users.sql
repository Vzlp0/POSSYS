/*
  # Add HR Management Fields to Users Table

  1. Updates to users table
    - Add job_title field
    - Add branch_id field (if not exists)
    - Add manager_id field (for reporting lines)
    - Add permissions field (JSON for granular permissions)

  2. Security
    - Update RLS policies as needed
*/

-- Add new columns to users table if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'job_title') THEN
    ALTER TABLE users ADD COLUMN job_title text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'branch_id') THEN
    ALTER TABLE users ADD COLUMN branch_id uuid REFERENCES branches(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'manager_id') THEN
    ALTER TABLE users ADD COLUMN manager_id uuid REFERENCES users(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'permissions') THEN
    ALTER TABLE users ADD COLUMN permissions jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_manager_id ON users(manager_id);
CREATE INDEX IF NOT EXISTS idx_users_branch_id ON users(branch_id);