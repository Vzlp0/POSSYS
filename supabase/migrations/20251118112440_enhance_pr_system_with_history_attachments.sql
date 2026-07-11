/*
  # Enhance Purchase Request System

  1. New Tables
    - `pr_history` - Track all PR status changes and actions
      - `id` (uuid, primary key)
      - `pr_id` (uuid, foreign key) - References purchase_requisitions
      - `action` (text) - created, updated, approved, rejected, cancelled, revision_requested, resubmitted
      - `status` (text) - Status after action
      - `comment` (text) - Optional comment/reason
      - `performed_by` (uuid) - User who performed action
      - `performed_at` (timestamptz) - When action occurred
    
    - `pr_attachments` - Store PR attachments
      - `id` (uuid, primary key)
      - `pr_id` (uuid, foreign key) - References purchase_requisitions
      - `file_name` (text) - Original file name
      - `file_url` (text) - Storage URL
      - `file_type` (text) - MIME type
      - `file_size` (integer) - File size in bytes
      - `uploaded_by` (uuid) - User who uploaded
      - `uploaded_at` (timestamptz) - When uploaded

  2. Schema Updates
    - Update purchase_requisitions status field to support new statuses
    - Add fields for pricing calculations

  3. Security
    - Enable RLS on all new tables
    - Add appropriate policies
*/

-- Create PR history table
CREATE TABLE IF NOT EXISTS pr_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pr_id uuid REFERENCES purchase_requisitions(id) ON DELETE CASCADE,
  action text NOT NULL,
  status text NOT NULL,
  comment text,
  performed_by uuid REFERENCES auth.users(id),
  performed_at timestamptz DEFAULT now()
);

-- Create PR attachments table
CREATE TABLE IF NOT EXISTS pr_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pr_id uuid REFERENCES purchase_requisitions(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text NOT NULL,
  file_size integer DEFAULT 0,
  uploaded_by uuid REFERENCES auth.users(id),
  uploaded_at timestamptz DEFAULT now()
);

-- Add pricing fields to PR items if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'purchase_requisition_items' AND column_name = 'vat_type'
  ) THEN
    ALTER TABLE purchase_requisition_items ADD COLUMN vat_type text DEFAULT 'INC';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'purchase_requisition_items' AND column_name = 'vat_rate'
  ) THEN
    ALTER TABLE purchase_requisition_items ADD COLUMN vat_rate numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'purchase_requisition_items' AND column_name = 'discount_type'
  ) THEN
    ALTER TABLE purchase_requisition_items ADD COLUMN discount_type text DEFAULT 'none';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'purchase_requisition_items' AND column_name = 'discount_value'
  ) THEN
    ALTER TABLE purchase_requisition_items ADD COLUMN discount_value numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'purchase_requisition_items' AND column_name = 'final_cost'
  ) THEN
    ALTER TABLE purchase_requisition_items ADD COLUMN final_cost numeric DEFAULT 0;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE pr_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE pr_attachments ENABLE ROW LEVEL SECURITY;

-- Policies for pr_history
CREATE POLICY "All users can view PR history"
  ON pr_history FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert PR history"
  ON pr_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policies for pr_attachments
CREATE POLICY "All users can view PR attachments"
  ON pr_attachments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can upload attachments"
  ON pr_attachments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can delete their own attachments"
  ON pr_attachments FOR DELETE
  TO authenticated
  USING (uploaded_by = auth.uid());

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_pr_history_pr_id ON pr_history(pr_id);
CREATE INDEX IF NOT EXISTS idx_pr_history_performed_at ON pr_history(performed_at DESC);
CREATE INDEX IF NOT EXISTS idx_pr_attachments_pr_id ON pr_attachments(pr_id);

-- Function to automatically create history entry when PR status changes
CREATE OR REPLACE FUNCTION log_pr_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO pr_history (pr_id, action, status, performed_by, performed_at)
    VALUES (NEW.id, 'created', NEW.status, NEW.requester_id, NEW.created_at);
  ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    INSERT INTO pr_history (pr_id, action, status, comment, performed_by, performed_at)
    VALUES (
      NEW.id,
      CASE NEW.status
        WHEN 'approved' THEN 'approved'
        WHEN 'rejected' THEN 'rejected'
        WHEN 'cancelled' THEN 'cancelled'
        WHEN 'revision_required' THEN 'revision_requested'
        ELSE 'updated'
      END,
      NEW.status,
      NEW.notes,
      NEW.approved_by,
      now()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for PR status changes
DROP TRIGGER IF EXISTS trigger_log_pr_status_change ON purchase_requisitions;
CREATE TRIGGER trigger_log_pr_status_change
  AFTER INSERT OR UPDATE ON purchase_requisitions
  FOR EACH ROW
  EXECUTE FUNCTION log_pr_status_change();
