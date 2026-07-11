/*
  # Fix Purchase Requisitions User Relationship

  ## Changes Made
  1. Add foreign key constraint from purchase_requisitions.requester_id to users.id
  2. Add foreign key constraint from purchase_requisitions.approved_by to users.id
  3. Add indexes for better query performance

  ## Purpose
  This enables proper joins between purchase_requisitions and users table,
  allowing the UI to display requester and approver information correctly.

  ## Notes
  - The foreign key allows NULL values since requester_id can be null for legacy data
  - Cascading is set to SET NULL to preserve PRs if a user is deleted
*/

-- Add foreign key constraint for requester_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'purchase_requisitions_requester_id_fkey'
    AND table_name = 'purchase_requisitions'
  ) THEN
    ALTER TABLE purchase_requisitions
      ADD CONSTRAINT purchase_requisitions_requester_id_fkey
      FOREIGN KEY (requester_id)
      REFERENCES users(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- Add foreign key constraint for approved_by
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'purchase_requisitions_approved_by_fkey'
    AND table_name = 'purchase_requisitions'
  ) THEN
    ALTER TABLE purchase_requisitions
      ADD CONSTRAINT purchase_requisitions_approved_by_fkey
      FOREIGN KEY (approved_by)
      REFERENCES users(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_purchase_requisitions_requester_id 
  ON purchase_requisitions(requester_id);

CREATE INDEX IF NOT EXISTS idx_purchase_requisitions_branch_id 
  ON purchase_requisitions(branch_id);

CREATE INDEX IF NOT EXISTS idx_purchase_requisitions_status 
  ON purchase_requisitions(status);

CREATE INDEX IF NOT EXISTS idx_purchase_requisitions_pr_date 
  ON purchase_requisitions(pr_date DESC);

-- Add helpful comments
COMMENT ON COLUMN purchase_requisitions.requester_id IS 'User who created the purchase requisition';
COMMENT ON COLUMN purchase_requisitions.approved_by IS 'User who approved the purchase requisition';
