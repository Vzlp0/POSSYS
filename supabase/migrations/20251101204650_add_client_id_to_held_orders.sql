/*
  # Add client tracking to held orders

  1. Changes
    - Add `client_id` column to held_orders table to link held orders with clients
    - Add `client_data` jsonb column to store full client snapshot (including loyalty card info)
  
  2. Notes
    - client_id can be null for held orders without a selected customer
    - client_data stores the full client object for easy restoration when resuming
*/

-- Add client_id column
ALTER TABLE held_orders 
ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES clients(id);

-- Add client_data column to store full client snapshot
ALTER TABLE held_orders 
ADD COLUMN IF NOT EXISTS client_data jsonb;
