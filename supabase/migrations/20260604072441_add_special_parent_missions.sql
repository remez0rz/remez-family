INSERT INTO missions (title, description, category, type, points, difficulty, estimated_minutes, repeatable, is_active, image_url) VALUES
-- Daily free love points
('אבא ואמא אוהבים אותך ❤️',
 'כל יום אנחנו אוהבים אותך — זה מגיע לך!',
 'Daily', 'fun', 50, 'easy', 1, true, true,
 'https://v3b.fal.media/files/b/0a9cea69/9mC9i0PASWo6Va6N4iEJc.jpg'),

-- Daily Dina message
('שלח הודעה לסבתא דינה',
 'שלח הודעה קצרה לסבתא דינה ותגיד לה שאתה אוהב אותה',
 'Daily', 'kindness', 40, 'easy', 5, true, true,
 'https://v3b.fal.media/files/b/0a9cea6a/14cQ6_zN2l7thYhUOLjZM.jpg'),

-- Parent-only special missions
('פרס הילד הטוב על שם קפטן 🐕',
 'פרס מיוחד מהורים — על שם כלבנו האהוב קפטן',
 'Special', 'fun', 150, 'easy', 1, false, true,
 'https://v3b.fal.media/files/b/0a9cea6a/YE4TtjAS7e0YaBPQ08y3I.jpg'),

('היה לי כיף איתך על שם תשומי 🐱',
 'פרס מיוחד — בילינו זמן נהדר יחד! על שם חתולנו תשומי',
 'Special', 'fun', 100, 'easy', 1, false, true,
 'https://v3b.fal.media/files/b/0a9cea6a/orPashe38h4jtI1T60LaU.jpg');

-- Also update the birthday mission to Special category
UPDATE missions SET category = 'Special' WHERE id = 'b981f5ae-754c-4488-b125-00c504a2d746';
UPDATE missions SET category = 'Special' WHERE id = 'c4005842-b744-41e4-a460-552257bbcb07';
