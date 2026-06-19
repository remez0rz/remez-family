CREATE TABLE IF NOT EXISTS wishlist_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  category text NOT NULL DEFAULT 'activity',
  description text,
  image_url text,
  website_url text,
  address text,
  price_estimate text,
  file_urls text[] DEFAULT '{}',
  added_by uuid REFERENCES profiles(id),
  is_done boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "family can manage wishlist" ON wishlist_items FOR ALL USING (true) WITH CHECK (true);
