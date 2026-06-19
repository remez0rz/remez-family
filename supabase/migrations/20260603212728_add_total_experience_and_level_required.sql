-- Add lifetime XP tracking to profiles (never decremented)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_experience integer NOT NULL DEFAULT 0;
UPDATE profiles SET total_experience = total_points WHERE total_experience = 0;

-- Recalculate level from total_experience (same 500pts/level formula)
UPDATE profiles SET level = FLOOR(total_experience / 500) + 1;

-- Add level_required to rewards for unlock gating
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS level_required integer NOT NULL DEFAULT 1;

-- Set level_required based on cost tiers
UPDATE rewards SET level_required =
  CASE
    WHEN points_required <= 50  THEN 1
    WHEN points_required <= 120 THEN 2
    WHEN points_required <= 200 THEN 3
    WHEN points_required <= 350 THEN 4
    WHEN points_required <= 550 THEN 5
    WHEN points_required <= 750 THEN 6
    ELSE 7
  END;
