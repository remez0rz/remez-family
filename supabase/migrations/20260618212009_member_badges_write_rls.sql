create policy "member_badges_insert"
  on public.member_badges
  for insert
  to authenticated
  with check (app_role() is distinct from 'grandparent');

create policy "member_badges_update"
  on public.member_badges
  for update
  to authenticated
  using (app_role() is distinct from 'grandparent')
  with check (app_role() is distinct from 'grandparent');

create policy "member_badges_delete"
  on public.member_badges
  for delete
  to authenticated
  using (app_role() is distinct from 'grandparent');
