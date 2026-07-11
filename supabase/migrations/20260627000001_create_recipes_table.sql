CREATE TABLE IF NOT EXISTS recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  item_id uuid REFERENCES items(id),
  yield_quantity decimal(10,2) DEFAULT 1,
  yield_unit text,
  prep_time_minutes integer,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id uuid NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES items(id),
  quantity decimal(10,2) NOT NULL,
  unit text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_recipes" ON recipes FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_recipe_ingredients" ON recipe_ingredients FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "auth_recipes" ON recipes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_recipe_ingredients" ON recipe_ingredients FOR ALL TO authenticated USING (true) WITH CHECK (true);
