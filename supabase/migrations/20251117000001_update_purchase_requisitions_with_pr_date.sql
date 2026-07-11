/*
  # Update Purchase Requisitions Table

  1. Changes
    - Add `pr_date` field (date) - Date of PR creation, defaults to today
    - Update `branch_id` to be non-nullable for tracking
    - Add `approved_by` field (uuid) - User who approved/rejected
    - Add `approved_at` field (timestamptz) - When approval/rejection happened

  2. Notes
    - The `pr_date` field will automatically default to current date
    - All PRs are shared across all branches (existing RLS allows this)
    - The `branch_id` helps identify which branch requested the PR
    - Approval tracking fields added for audit trail
*/

-- Add new fields to purchase_requisitions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'purchase_requisitions' AND column_name = 'pr_date'
  ) THEN
    ALTER TABLE purchase_requisitions ADD COLUMN pr_date date DEFAULT CURRENT_DATE NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'purchase_requisitions' AND column_name = 'approved_by'
  ) THEN
    ALTER TABLE purchase_requisitions ADD COLUMN approved_by uuid REFERENCES auth.users(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'purchase_requisitions' AND column_name = 'approved_at'
  ) THEN
    ALTER TABLE purchase_requisitions ADD COLUMN approved_at timestamptz;
  END IF;
END $$;

-- Create index for faster filtering by date and status
CREATE INDEX IF NOT EXISTS idx_pr_date ON purchase_requisitions(pr_date);
CREATE INDEX IF NOT EXISTS idx_pr_status ON purchase_requisitions(status);
CREATE INDEX IF NOT EXISTS idx_pr_branch ON purchase_requisitions(branch_id);
CREATE INDEX IF NOT EXISTS idx_pr_requester ON purchase_requisitions(requester_id);
