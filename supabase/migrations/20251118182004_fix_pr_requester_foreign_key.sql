/*
  # Fix Purchase Requisitions Requester Foreign Key

  ## Changes
  - Add foreign key constraint from purchase_requisitions.requester_id to users.id
  - This enables proper joins in queries

  ## Security
  - No RLS changes needed
*/

-- Add foreign key if it doesn't exist
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
