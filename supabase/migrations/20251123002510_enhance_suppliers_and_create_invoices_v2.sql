/*
  # Enhance Suppliers System and Add Invoices

  1. Updates to suppliers table
    - Add supplier_type (goods, service, cleaning, logistics, maintenance)
    - Add vat_number
    - Add bank_name
    - Add iban
    - Add city (if not exists)
    - Add notes (if not exists)

  2. New Table: supplier_invoices
    - id (uuid, primary key)
    - invoice_number (text, unique, required)
    - supplier_id (uuid, foreign key)
    - po_id (uuid, foreign key, optional)
    - invoice_date (date, required)
    - invoice_amount (numeric, required)
    - paid_amount (numeric, default 0)
    - remaining_amount (numeric, computed)
    - status (text: paid, partially_paid, unpaid)
    - notes (text)
    - created_at (timestamptz)
    - updated_at (timestamptz)

  3. Updates to supplier_payments table
    - Add invoice_id link
    - Add payment_reference

  4. Security
    - Enable RLS on new tables
    - Add appropriate policies
*/

-- Add new columns to suppliers table if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'suppliers' AND column_name = 'supplier_type') THEN
    ALTER TABLE suppliers ADD COLUMN supplier_type text DEFAULT 'goods'
      CHECK (supplier_type IN ('goods', 'service', 'cleaning', 'logistics', 'maintenance'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'suppliers' AND column_name = 'vat_number') THEN
    ALTER TABLE suppliers ADD COLUMN vat_number text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'suppliers' AND column_name = 'bank_name') THEN
    ALTER TABLE suppliers ADD COLUMN bank_name text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'suppliers' AND column_name = 'iban') THEN
    ALTER TABLE suppliers ADD COLUMN iban text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'suppliers' AND column_name = 'city') THEN
    ALTER TABLE suppliers ADD COLUMN city text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'suppliers' AND column_name = 'notes') THEN
    ALTER TABLE suppliers ADD COLUMN notes text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'suppliers' AND column_name = 'last_po_date') THEN
    ALTER TABLE suppliers ADD COLUMN last_po_date date;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'suppliers' AND column_name = 'total_outstanding') THEN
    ALTER TABLE suppliers ADD COLUMN total_outstanding numeric DEFAULT 0;
  END IF;
END $$;

-- Create supplier_invoices table
CREATE TABLE IF NOT EXISTS supplier_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text UNIQUE NOT NULL,
  supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  po_id uuid REFERENCES purchase_orders(id) ON DELETE SET NULL,
  invoice_date date NOT NULL,
  invoice_amount numeric NOT NULL CHECK (invoice_amount >= 0),
  paid_amount numeric DEFAULT 0 CHECK (paid_amount >= 0),
  remaining_amount numeric GENERATED ALWAYS AS (invoice_amount - paid_amount) STORED,
  status text NOT NULL DEFAULT 'unpaid' CHECK (status IN ('paid', 'partially_paid', 'unpaid')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add invoice_id and payment_reference to supplier_payments if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'supplier_payments' AND column_name = 'invoice_id') THEN
    ALTER TABLE supplier_payments ADD COLUMN invoice_id uuid REFERENCES supplier_invoices(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'supplier_payments' AND column_name = 'payment_reference') THEN
    ALTER TABLE supplier_payments ADD COLUMN payment_reference text;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_supplier_invoices_supplier ON supplier_invoices(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_invoices_po ON supplier_invoices(po_id);
CREATE INDEX IF NOT EXISTS idx_supplier_invoices_date ON supplier_invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_supplier_invoices_status ON supplier_invoices(status);
CREATE INDEX IF NOT EXISTS idx_supplier_payments_invoice ON supplier_payments(invoice_id);

-- Enable RLS on supplier_invoices
ALTER TABLE supplier_invoices ENABLE ROW LEVEL SECURITY;

-- Policies for supplier_invoices
CREATE POLICY "Authenticated users can view invoices"
  ON supplier_invoices FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin and managers can insert invoices"
  ON supplier_invoices FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admin and managers can update invoices"
  ON supplier_invoices FOR UPDATE
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

CREATE POLICY "Admin can delete invoices"
  ON supplier_invoices FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Function to update invoice status based on paid amount
CREATE OR REPLACE FUNCTION update_invoice_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.paid_amount >= NEW.invoice_amount THEN
    NEW.status := 'paid';
  ELSIF NEW.paid_amount > 0 THEN
    NEW.status := 'partially_paid';
  ELSE
    NEW.status := 'unpaid';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update invoice status
DROP TRIGGER IF EXISTS update_invoice_status_trigger ON supplier_invoices;
CREATE TRIGGER update_invoice_status_trigger
  BEFORE INSERT OR UPDATE ON supplier_invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_status();

-- Function to update supplier outstanding balance
CREATE OR REPLACE FUNCTION update_supplier_outstanding()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE suppliers
  SET total_outstanding = (
    SELECT COALESCE(SUM(remaining_amount), 0)
    FROM supplier_invoices
    WHERE supplier_id = COALESCE(NEW.supplier_id, OLD.supplier_id)
  )
  WHERE id = COALESCE(NEW.supplier_id, OLD.supplier_id);
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update supplier outstanding after invoice changes
DROP TRIGGER IF EXISTS update_supplier_outstanding_trigger ON supplier_invoices;
CREATE TRIGGER update_supplier_outstanding_trigger
  AFTER INSERT OR UPDATE OR DELETE ON supplier_invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_supplier_outstanding();

-- Function to update invoice paid amount when payment is added
CREATE OR REPLACE FUNCTION update_invoice_paid_amount()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invoice_id IS NOT NULL THEN
    UPDATE supplier_invoices
    SET paid_amount = paid_amount + NEW.amount
    WHERE id = NEW.invoice_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update invoice paid amount
DROP TRIGGER IF EXISTS update_invoice_paid_amount_trigger ON supplier_payments;
CREATE TRIGGER update_invoice_paid_amount_trigger
  AFTER INSERT ON supplier_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_paid_amount();

-- Function to update supplier last PO date
CREATE OR REPLACE FUNCTION update_supplier_last_po_date()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE suppliers
  SET last_po_date = NEW.order_date
  WHERE id = NEW.supplier_id
  AND (last_po_date IS NULL OR NEW.order_date > last_po_date);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update last PO date
DROP TRIGGER IF EXISTS update_supplier_last_po_date_trigger ON purchase_orders;
CREATE TRIGGER update_supplier_last_po_date_trigger
  AFTER INSERT OR UPDATE ON purchase_orders
  FOR EACH ROW
  WHEN (NEW.supplier_id IS NOT NULL)
  EXECUTE FUNCTION update_supplier_last_po_date();

-- Trigger to update updated_at on supplier_invoices
DROP TRIGGER IF EXISTS update_supplier_invoices_updated_at ON supplier_invoices;
CREATE TRIGGER update_supplier_invoices_updated_at
  BEFORE UPDATE ON supplier_invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();