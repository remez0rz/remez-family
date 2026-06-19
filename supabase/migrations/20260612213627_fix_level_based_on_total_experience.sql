-- Fix the trigger to use total_experience (never decreases) instead of total_points (spendable)
CREATE OR REPLACE FUNCTION update_member_level()
RETURNS trigger AS $$
begin
  new.level := greatest(1, floor(new.total_experience / 500) + 1);
  return new;
end;
$$ LANGUAGE plpgsql;

-- Backfill correct levels for all existing profiles
UPDATE profiles
SET level = greatest(1, floor(total_experience / 500) + 1);
