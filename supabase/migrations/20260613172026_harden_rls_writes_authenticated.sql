-- For all client-written app tables: open reads (public), writes require a logged-in session (authenticated).
-- Leaves calendar_events & push_subscriptions untouched (written server-side via anon key in API routes).
DO $$
DECLARE t text; p record;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'profiles','missions','assignments','rewards','reward_claims',
    'point_events','feed_posts','tahkirim','grocery_items','wishlist_items','reactions'
  ] LOOP
    -- remove all existing policies on the table
    FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename=t LOOP
      EXECUTE format('DROP POLICY %I ON public.%I', p.policyname, t);
    END LOOP;
    -- recreate a clean, consistent set
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO public USING (true)', t||'_read', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (true)', t||'_insert', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (true) WITH CHECK (true)', t||'_update', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (true)', t||'_delete', t);
  END LOOP;
END$$;
