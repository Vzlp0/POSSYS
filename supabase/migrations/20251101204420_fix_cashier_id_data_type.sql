/*
  # Fix cashier_id data type for consistency

  1. Changes
    - Drop policies that reference cashier_id
    - Change `held_orders.cashier_id` from uuid to text to match other tables
    - Change `transactions.cashier_id` from uuid to text to match other tables
  
  2. Notes
    - This ensures consistency across all tables using cashier identifiers
    - The mock auth system uses simple string IDs, not UUIDs
    - Keep the "Allow all operations" policies which are sufficient for development
*/

-- Drop policies that reference cashier_id for held_orders
DROP POLICY IF EXISTS "Authenticated users can create held orders" ON held_orders;
DROP POLICY IF EXISTS "Authenticated users can delete held orders" ON held_orders;

-- Change held_orders.cashier_id to text
ALTER TABLE held_orders 
ALTER COLUMN cashier_id TYPE text USING cashier_id::text;

-- Do the same for transactions table
DROP POLICY IF EXISTS "Authenticated users can create transactions" ON transactions;
DROP POLICY IF EXISTS "Authenticated users can delete transactions" ON transactions;

-- Change transactions.cashier_id to text  
ALTER TABLE transactions 
ALTER COLUMN cashier_id TYPE text USING cashier_id::text;
