/*
  # Create Categories Table

  1. New Tables
    - `categories`
      - `id` (uuid, primary key)
      - `name` (text, unique, required) - Category name
      - `description` (text) - Optional category description
      - `is_active` (boolean, default true) - Whether category is active
      - `display_order` (integer) - Order for display
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on `categories` table
    - Add policy for authenticated users to read categories
    - Add policy for authenticated users to create/update/delete categories
  
  3. Sample Data
    - Insert default categories
*/

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Policies for categories
CREATE POLICY "Authenticated users can read categories"
  ON categories
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create categories"
  ON categories
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update categories"
  ON categories
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete categories"
  ON categories
  FOR DELETE
  TO authenticated
  USING (true);

-- Insert default categories
INSERT INTO categories (name, description, display_order) VALUES
  ('Food', 'Food items and ingredients', 1),
  ('Beverages', 'Drinks and beverages', 2),
  ('Packaging', 'Packaging materials', 3),
  ('Equipment', 'Kitchen and restaurant equipment', 4),
  ('Supplies', 'General supplies', 5),
  ('Cleaning', 'Cleaning products', 6),
  ('Frozen', 'Frozen items', 7),
  ('Fresh', 'Fresh produce', 8),
  ('Dairy', 'Dairy products', 9),
  ('Bakery', 'Bakery items', 10)
ON CONFLICT (name) DO NOTHING;