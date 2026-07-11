/*
  # Create Items Table

  1. New Tables
    - `items`
      - `id` (uuid, primary key)
      - `name` (text) - Main item name
      - `name_en` (text) - English name
      - `name_ar` (text) - Arabic name
      - `sku` (text, unique) - Item code
      - `category` (text) - Item category
      - `unit` (text) - Unit of measurement
      - `price` (decimal) - Selling price
      - `cost` (decimal) - Base cost
      - `standard_cost` (decimal) - Standard cost reference
      - `vat` (decimal) - VAT percentage
      - `average_cost` (decimal) - Calculated average cost
      - `last_purchase_cost` (decimal) - Last purchase cost
      - `markup_percentage` (decimal) - Markup percentage
      - `last_price_update` (timestamptz) - Last price update timestamp
      - `is_expiry_tracked` (boolean) - Whether item has expiry tracking
      - `show_in_pos` (boolean) - Whether item appears in POS system
      - `available_for_online_order` (boolean) - Online ordering availability
      - `suppliers` (jsonb) - Array of associated suppliers
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on `items` table
    - Add policies for authenticated users to manage items
    - Temporary anon access for development
*/

CREATE TABLE IF NOT EXISTS items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_en text,
  name_ar text,
  sku text UNIQUE NOT NULL,
  category text NOT NULL,
  unit text NOT NULL,
  price decimal(10,2) DEFAULT 0,
  cost decimal(10,2) DEFAULT 0,
  standard_cost decimal(10,2) DEFAULT 0,
  vat decimal(5,2) DEFAULT 0,
  average_cost decimal(10,2) DEFAULT 0,
  last_purchase_cost decimal(10,2) DEFAULT 0,
  markup_percentage decimal(5,2) DEFAULT 0,
  last_price_update timestamptz DEFAULT now(),
  is_expiry_tracked boolean DEFAULT false,
  show_in_pos boolean DEFAULT true,
  available_for_online_order boolean DEFAULT false,
  suppliers jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read items"
  ON items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert items"
  ON items FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update items"
  ON items FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete items"
  ON items FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Allow anon users to read items"
  ON items FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon users to insert items"
  ON items FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon users to update items"
  ON items FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon users to delete items"
  ON items FOR DELETE
  TO anon
  USING (true);
