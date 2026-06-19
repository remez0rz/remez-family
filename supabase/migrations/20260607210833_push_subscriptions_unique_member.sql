-- De-dupe any existing rows first (keep newest per member), then add the unique constraint
DELETE FROM push_subscriptions a
USING push_subscriptions b
WHERE a.member_id = b.member_id AND a.created_at < b.created_at;

ALTER TABLE push_subscriptions
  ADD CONSTRAINT push_subscriptions_member_id_key UNIQUE (member_id);
