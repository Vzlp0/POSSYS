/*
  # Create Supplier Payments System

  1. New Tables
    - `supplier_payments`
      - `id` (uuid, primary key)
      - `supplier_id` (uuid, foreign key to suppliers)
      - `po_id` (uuid, foreign key to purchase_orders)
      - `gr_id` (uuid, foreign key to goods_receipts)
      - `amount` (numeric, not null) - Payment amount
      - `payment_date` (date, not null) - Date of payment
      - `payment_method` (text) - Payment method (bank transfer, cash, check, etc.)
      - `status` (text, not null, default 'pending') - Payment status: pending, paid, overdue
      - `attachment_url` (text) - URL to payment receipt/proof
      - `notes` (text) - Additional payment notes
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp
      - `created_by` (uuid, foreign key to auth.users) - Who created the payment record

  2. Security
    - Enable RLS on supplier_payments table
    - Add policies for authenticated users based on roles

  3. Important Notes
    - Payment workflow: PO → GR → Payment creation → Payment finalization
    - Status tracking: pending (awaiting payment), paid (completed), overdue (past due date)
    - Supplier payment tracking linked to both PO and GR for complete audit trail
*/

-- Create supplier_payments table
CREATE TABLE IF NOT EXISTS supplier_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  po_id uuid REFERENCES purchase_orders(id) ON DELETE SET NULL,
  gr_id uuid REFERENCES goods_receipts(id) ON DELETE SET NULL,
  amount numeric NOT NULL CHECK (amount >= 0),
  payment_date date NOT NULL,
  payment_method text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
  attachment_url text,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_supplier_payments_supplier ON supplier_payments(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_payments_po ON supplier_payments(po_id);
CREATE INDEX IF NOT EXISTS idx_supplier_payments_gr ON supplier_payments(gr_id);
CREATE INDEX IF NOT EXISTS idx_supplier_payments_status ON supplier_payments(status);
CREATE INDEX IF NOT EXISTS idx_supplier_payments_date ON supplier_payments(payment_date);

-- Enable Row Level Security
ALTER TABLE supplier_payments ENABLE ROW LEVEL SECURITY;

-- Policies for supplier_payments table
CREATE POLICY "Authenticated users can view payments"
  ON supplier_payments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin and managers can insert payments"
  ON supplier_payments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admin and managers can update payments"
  ON supplier_payments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admin can delete payments"
  ON supplier_payments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Function to automatically check and update payment status based on payment terms
CREATE OR REPLACE FUNCTION check_payment_overdue()
RETURNS TRIGGER AS $$
DECLARE
  payment_terms_days integer;
  gr_date date;
  due_date date;
BEGIN
  -- Get the payment terms from supplier (default to 30 days if not specified)
  SELECT 
    CASE 
      WHEN s.payment_terms ILIKE 'Net %' THEN 
        CAST(REGEXP_REPLACE(s.payment_terms, '[^0-9]', '', 'g') AS INTEGER)
      ELSE 30
    END,
    gr.received_date
  INTO payment_terms_days, gr_date
  FROM suppliers s
  LEFT JOIN goods_receipts gr ON gr.id = NEW.gr_id
  WHERE s.id = NEW.supplier_id;

  -- Calculate due date
  IF gr_date IS NOT NULL THEN
    due_date := gr_date + payment_terms_days;
    
    -- Update status to overdue if past due date and not yet paid
    IF NEW.status = 'pending' AND CURRENT_DATE > due_date THEN
      NEW.status := 'overdue';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to check for overdue payments on insert and update
CREATE TRIGGER check_payment_overdue_trigger
  BEFORE INSERT OR UPDATE ON supplier_payments
  FOR EACH ROW
  EXECUTE FUNCTION check_payment_overdue();

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_supplier_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_supplier_payments_updated_at_trigger
  BEFORE UPDATE ON supplier_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_supplier_payments_updated_at();