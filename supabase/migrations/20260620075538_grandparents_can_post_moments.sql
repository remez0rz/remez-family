-- Let grandparents author feed moments (a way to communicate back beyond
-- comments) — but only as themselves. Parents keep full insert access.
alter policy feed_posts_insert on public.feed_posts
  with check (
    public.app_role() is distinct from 'grandparent'
    or created_by = (select id from public.profiles where email = (auth.jwt() ->> 'email') limit 1)
  );
