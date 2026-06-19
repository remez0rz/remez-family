INSERT INTO missions (title, description, category, type, points, difficulty, estimated_minutes, min_age, max_age, proof_type, repeatable, is_active)
VALUES
  -- Creative
  ('צרו סרטון קצר על המשפחה', 'צלמו, ערכו וצרו סרטון של 1–2 דקות עם כותרת, מוזיקה ושלוש סצנות לפחות', 'Creative', 'fun', 250, 'hard', 60, 6, 18, 'parent_approval', false, true),
  ('עצבו חולצה משפחתית', 'צרו עיצוב לחולצה משפחתית — ציירו את הלוגו, הסלוגן והצבעים. אפשר גם ידנית', 'Creative', 'fun', 200, 'hard', 45, 6, 18, 'parent_approval', false, true),

  -- Family
  ('לילה לבן — ערב משפחתי מתוכנן', 'תכננו וארגנו ערב שלם לכל המשפחה — פעילות, אוכל, מוזיקה. בלי הורים שמובילים', 'Family', 'fun', 400, 'hard', 120, 8, 18, 'parent_approval', false, true),
  ('ראיינו כל אחד מבני המשפחה', 'ראיינו כל אחד מבני המשפחה עם לפחות 3 שאלות — אספו את התשובות וספרו לכולם', 'Family', 'fun', 200, 'medium', 40, 7, 18, 'parent_approval', true, true),

  -- Outdoor
  ('טיול עצמאי בשכונה', 'צאו לטיול בשכונה, צלמו 5 דברים מעניינים וספרו מה גיליתם', 'Outdoor', 'fun', 180, 'medium', 45, 8, 18, 'parent_approval', true, true),
  ('מסלול ספורט בחוץ', 'צרו מסלול ריצה, קפיצות ואיזון בחוץ ועשו אותו 3 פעמים', 'Outdoor', 'fun', 200, 'hard', 40, 6, 18, 'parent_approval', true, true),

  -- Health
  ('שבוע של שינה בזמן', 'לישון בזמן 5 ימים ברצף בלי ויכוחים', 'Health', 'responsibility', 300, 'hard', 0, 5, 18, 'parent_approval', true, true),
  ('אתגר ספורט שבועי', 'עשו פעילות ספורטיבית 4 פעמים בשבוע — לפחות 20 דקות כל פעם', 'Health', 'fun', 250, 'hard', 20, 6, 18, 'parent_approval', true, true),

  -- Learning
  ('מצגת על נושא שבחרתם', 'הכינו מצגת קצרה (5 שקפים לפחות) על נושא שמעניין אתכם והציגו לכל המשפחה', 'Learning', 'learning', 300, 'hard', 60, 8, 18, 'parent_approval', false, true),
  ('למדו מיומנות חדשה לגמרי', 'בחרו מיומנות שלא ידעתם — קשירת שרוכים, סריגה, ג׳אגלינג — ותכינו הדגמה', 'Learning', 'learning', 200, 'hard', 90, 6, 18, 'parent_approval', false, true),

  -- Kindness
  ('שבוע נחמד', 'עשו מעשה טוב לאח/אחות כל יום במשך שבוע — בלי שביקשו', 'Kindness', 'fun', 350, 'hard', 0, 5, 18, 'parent_approval', true, true),
  ('מתנה בעבודת יד', 'הכינו מתנה ידנית למישהו מהמשפחה — מכתב, ציור, יצירה — ותנו לו', 'Kindness', 'fun', 150, 'medium', 30, 4, 18, 'parent_approval', true, true),

  -- Hebrew
  ('כתבו שיר על המשפחה', 'כתבו שיר עם לפחות 3 בתים שמספר משהו על המשפחה שלנו', 'Hebrew', 'learning', 200, 'hard', 30, 7, 18, 'parent_approval', false, true),

  -- English
  ('שיחה באנגלית של 3 דקות', 'דברו עם אחד ההורים באנגלית בלבד במשך 3 דקות. ניתן לעצור לעזרה אבל ממשיכים', 'English', 'learning', 150, 'hard', 10, 7, 18, 'parent_approval', true, true),

  -- Weekend
  ('תכננו יום כיף משפחתי', 'תכננו יום שלם: לאן הולכים, מה אוכלים, מה עושים — הכינו תוכנית שלמה והציגו להורים', 'Weekend', 'fun', 250, 'medium', 30, 7, 18, 'parent_approval', false, true);
