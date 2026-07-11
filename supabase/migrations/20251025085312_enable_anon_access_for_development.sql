/*
  # Enable anonymous access for development

  1. Changes
    - Allow anonymous users to access key tables during development
    - This enables mock authentication to work with the database
    
  2. Tables Updated
    - items, suppliers, stock_levels, transactions, transaction_items
    - held_orders, clients, employees, branches, stock_locations
*/

-- Items table (already done, but ensuring it's correct)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'items' AND policyname = 'Allow all operations on items'
  ) THEN
    CREATE POLICY "Allow all operations on items"
      ON items FOR ALL
      TO anon, authenticated
      USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Suppliers table
CREATE POLICY "Allow all operations on suppliers"
  ON suppliers FOR ALL
  TO anon, authenticated
  USING (true) WITH CHECK (true);

-- Stock levels
CREATE POLICY "Allow all operations on stock_levels"
  ON stock_levels FOR ALL
  TO anon, authenticated
  USING (true) WITH CHECK (true);

-- Transactions
CREATE POLICY "Allow all operations on transactions"
  ON transactions FOR ALL
  TO anon, authenticated
  USING (true) WITH CHECK (true);

-- Transaction items
CREATE POLICY "Allow all operations on transaction_items"
  ON transaction_items FOR ALL
  TO anon, authenticated
  USING (true) WITH CHECK (true);

-- Held orders
CREATE POLICY "Allow all operations on held_orders"
  ON held_orders FOR ALL
  TO anon, authenticated
  USING (true) WITH CHECK (true);

-- Clients
CREATE POLICY "Allow all operations on clients"
  ON clients FOR ALL
  TO anon, authenticated
  USING (true) WITH CHECK (true);

-- Employees
CREATE POLICY "Allow all operations on employees"
  ON employees FOR ALL
  TO anon, authenticated
  USING (true) WITH CHECK (true);

-- Branches
CREATE POLICY "Allow all operations on branches"
  ON branches FOR ALL
  TO anon, authenticated
  USING (true) WITH CHECK (true);

-- Stock locations
CREATE POLICY "Allow all operations on stock_locations"
  ON stock_locations FOR ALL
  TO anon, authenticated
  USING (true) WITH CHECK (true);

-- Payments
CREATE POLICY "Allow all operations on payments"
  ON payments FOR ALL
  TO anon, authenticated
  USING (true) WITH CHECK (true);

-- Cash balances
CREATE POLICY "Allow all operations on cash_balances"
  ON cash_balances FOR ALL
  TO anon, authenticated
  USING (true) WITH CHECK (true);