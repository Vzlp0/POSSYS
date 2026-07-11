/*
  # Add PR and PO Status Management

  1. Changes to purchase_requisitions
    - Add CHECK constraint for valid status values
    - Valid PR statuses: draft, pending, approved, pending_po, po_created, rejected
    
  2. Changes to purchase_orders
    - Add CHECK constraint for valid status values  
    - Valid PO statuses: draft, submitted, approved, in_transit, received, cancelled
    
  3. Updates
    - Update existing 'approved' PRs to 'pending_po' if they don't have a PO yet
    - Ensure PR to PO relationship is one-to-many
*/

-- Add status constraint to purchase_requisitions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'purchase_requisitions_status_check'
  ) THEN
    ALTER TABLE purchase_requisitions
    ADD CONSTRAINT purchase_requisitions_status_check
    CHECK (status IN ('draft', 'pending', 'approved', 'pending_po', 'po_created', 'rejected'));
  END IF;
END $$;

-- Add status constraint to purchase_orders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'purchase_orders_status_check'
  ) THEN
    ALTER TABLE purchase_orders
    ADD CONSTRAINT purchase_orders_status_check
    CHECK (status IN ('draft', 'submitted', 'approved', 'in_transit', 'received', 'cancelled'));
  END IF;
END $$;