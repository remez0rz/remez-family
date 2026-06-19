-- "Grandma noticed!" bonus: when a grandparent reacts or comments on a moment,
-- each child participant earns +2 — capped once per (grandparent, moment) so it
-- can't be farmed by un/re-reacting or by reacting AND commenting.
-- Implemented as a SECURITY DEFINER trigger because grandparents are RLS-blocked
-- from writing points; the trigger credits the kid server-side.

create table if not exists public.grandparent_engagements (
  feed_post_id   uuid not null references public.feed_posts(id) on delete cascade,
  grandparent_id uuid not null references public.profiles(id)   on delete cascade,
  created_at     timestamptz default now(),
  primary key (feed_post_id, grandparent_id)
);
-- Internal bookkeeping. RLS on + no policies = no client access; the definer
-- trigger below bypasses RLS.
alter table public.grandparent_engagements enable row level security;

create or replace function public.award_grandparent_engagement()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_post  uuid := NEW.feed_post_id;
  v_actor uuid;
  v_bonus int := 2;
  v_kid   record;
begin
  -- reactions store the actor in member_id; feed_comments in author_id
  if TG_TABLE_NAME = 'reactions' then
    v_actor := NEW.member_id;
  else
    v_actor := NEW.author_id;
  end if;
  if v_post is null or v_actor is null then
    return NEW;
  end if;

  -- only a grandparent's engagement pays out
  if (select role from profiles where id = v_actor) is distinct from 'grandparent' then
    return NEW;
  end if;

  -- once per (grandparent, moment); if this pair already exists, do nothing
  insert into grandparent_engagements (feed_post_id, grandparent_id)
    values (v_post, v_actor)
  on conflict do nothing;
  if not found then
    return NEW;
  end if;

  -- credit each child participant of the moment
  for v_kid in
    select p.id
    from profiles p
    join feed_posts fp on fp.id = v_post
    where p.role = 'child' and p.active = true
      and p.name = any (fp.participants)
  loop
    insert into point_events (member_id, points, reason)
      values (v_kid.id, v_bonus, 'סבא/סבתא התרגש/ה מהרגע שלך 💜');
    update profiles
      set total_points     = coalesce(total_points, 0)     + v_bonus,
          total_experience = coalesce(total_experience, 0) + v_bonus
      where id = v_kid.id;
  end loop;

  return NEW;
end;
$$;

create trigger trg_reactions_grandparent_engagement
  after insert on public.reactions
  for each row execute function public.award_grandparent_engagement();

create trigger trg_comments_grandparent_engagement
  after insert on public.feed_comments
  for each row execute function public.award_grandparent_engagement();
