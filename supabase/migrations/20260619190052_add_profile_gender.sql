-- Gender for grammatically correct Hebrew (verbs/adjectives read aloud by the
-- speaker feature). 'male' | 'female'; null treated as male by the UI helper.
alter table public.profiles add column if not exists gender text;

update public.profiles set gender = 'female'
  where name in ('תמרה', 'בר', 'סבתא רונית', 'סבתא רות');
update public.profiles set gender = 'male'
  where name in ('אור', 'גיל', 'רונן', 'רון', 'סבא מוטי', 'סבא עשה');
