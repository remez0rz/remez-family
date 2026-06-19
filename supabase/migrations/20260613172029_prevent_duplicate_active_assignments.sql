-- Stop the same mission being assigned to the same kid more than once while active
CREATE UNIQUE INDEX IF NOT EXISTS assignments_active_unique
  ON public.assignments (assigned_to, mission_id)
  WHERE status = 'active';
