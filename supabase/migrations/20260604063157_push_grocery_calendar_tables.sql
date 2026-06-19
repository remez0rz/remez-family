-- Push notification subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  subscription jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "member owns subscription" ON push_subscriptions
  FOR ALL USING (member_id IN (SELECT id FROM profiles WHERE active = true));

-- Grocery list
CREATE TABLE IF NOT EXISTS grocery_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  image_url text,
  added_by uuid REFERENCES profiles(id),
  is_done boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE grocery_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "family can manage grocery items" ON grocery_items FOR ALL USING (true) WITH CHECK (true);

-- Family calendar events (cached from Google Calendar)
CREATE TABLE IF NOT EXISTS calendar_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  external_id text UNIQUE,
  title text NOT NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz,
  location text,
  all_day boolean DEFAULT false,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "family can read calendar" ON calendar_events FOR SELECT USING (true);
CREATE POLICY "family can write calendar" ON calendar_events FOR ALL USING (true) WITH CHECK (true);
