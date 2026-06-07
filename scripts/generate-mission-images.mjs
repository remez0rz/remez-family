/**
 * Mission Image Generator
 *
 * Generates cartoon-style images for all missions using Fal.ai,
 * uploads to Supabase storage, and updates the missions table.
 *
 * Setup:
 *   npm install @fal-ai/client @supabase/supabase-js dotenv
 *
 * Run:
 *   FAL_KEY=xxx NEXT_PUBLIC_SUPABASE_URL=xxx NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx node scripts/generate-mission-images.mjs
 *
 * Or add to .env.local and run:
 *   node -r dotenv/config scripts/generate-mission-images.mjs dotenv_config_path=.env.local
 */

import { fal } from '@fal-ai/client'
import { createClient } from '@supabase/supabase-js'
import { writeFileSync, readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ── Config ─────────────────────────────────────────────────────────────────
const FAL_KEY    = process.env.FAL_KEY
const SUPA_URL   = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPA_KEY   = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const PROGRESS_FILE = join(__dirname, 'image-gen-progress.json')

if (!FAL_KEY || !SUPA_URL || !SUPA_KEY) {
  console.error('Missing env vars: FAL_KEY, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

fal.config({ credentials: FAL_KEY })
const supabase = createClient(SUPA_URL, SUPA_KEY)

// ── Style base appended to every prompt ────────────────────────────────────
const STYLE = 'colorful family cartoon illustration, Pixar and Disney inspired art style, warm golden tones, expressive big eyes, friendly characters, cozy home environment, vibrant cheerful colors, clean composition, mobile app card artwork, no text, no letters, no logos, no numbers'

// ── Mission-specific prompts keyed by mission title (Hebrew) ───────────────
// Each prompt describes only the SCENE — style is appended automatically.
const PROMPTS = {
  // ── HOUSE ──────────────────────────────────────────────────────────────
  'הכינו בגדים למחר בלי שביקשו':
    'A proud child carefully laying out school clothes and a backpack on a chair the night before, bedroom with soft lamp light',
  'נקו את השולחן לגמרי':
    'A happy child wiping a kitchen table completely clean with a cloth, spotless shiny table, satisfied expression',
  'סדר את המיטה כמו אלוף':
    'A child proudly making their bed perfectly with neat pillows and smooth blanket, tidy bedroom',
  'מצא 5 דברים שלא במקום':
    'A child on a fun scavenger hunt inside the home, picking up misplaced items and returning them to the right spots',
  'עוזר כביסה קטן':
    'A cheerful child helping fold laundry and sort colorful socks into pairs, warm laundry area',
  'תיק מוכן למחר':
    'A responsible child packing their school backpack carefully with books and a water bottle, feeling ready',
  'ארזו את התיק לבד 3 ימים ברצף':
    'A confident child packing their own school backpack independently, with a calendar showing three checkmarks on the wall',

  // ── HELPING ────────────────────────────────────────────────────────────
  'אלוף סידור השולחן':
    'A child carefully setting a dinner table with plates and glasses, looking proud, warm dining room',
  'מחזירים דברים למקום':
    'A child walking around the house carrying items to put back in their proper places, organized home',
  'עוזר מטבח':
    'A child helping a parent in the kitchen, stirring a bowl or bringing ingredients, fun cooking moment',
  'פינת צעצועים מסודרת':
    'Two siblings happily organizing a toy corner, sorting toys into colorful bins, playroom',
  'משמח את הבית':
    'A child surprising the family by doing a helpful chore without being asked, family looking delighted',

  // ── KINDNESS ───────────────────────────────────────────────────────────
  'תודה מיוחדת':
    'A child giving a warm thank-you hug to a parent, both smiling genuinely, cozy living room',
  'מחמאה למישהו':
    'A child whispering a sincere compliment to a sibling, both laughing and feeling good',
  'תנו מחמאה לכל בן משפחה':
    'A family sitting in a circle, each child giving genuine compliments to every family member, warm expressions',
  'פתק שמח':
    'A child writing a cheerful surprise note or drawing a happy card for a family member, colorful desk',
  'עוזרים לאח או אחות':
    'An older sibling kneeling down to lovingly help a younger sibling tie their shoes, gentle moment',
  'לוותר בכיף':
    'A child smiling and generously sharing their toy or treat with a sibling, warm-hearted gesture',
  'יום של דיבור יפה':
    'A family having a calm and kind conversation at the dinner table, everyone looking relaxed and happy',

  // ── FAMILY ─────────────────────────────────────────────────────────────
  'בחרו שיר לריקוד משפחתי':
    'A whole family dancing together joyfully in the living room, everyone laughing and moving to music',
  'התקשרו לסבתא ושאלו אותה שאלה מצחיקה':
    'A child on a funny video call with a smiling grandma, both laughing, cozy home background',
  'שאלת משפחה':
    'A curious child asking a parent an interesting question, parent listening with delight, living room',
  'רגע טוב מהיום':
    'A family sharing happy stories at the dinner table, everyone engaged and smiling warmly',
  'תמונה משפחתית שמחה':
    'A happy family taking a silly selfie together, all laughing, bright home setting',
  'הכינו ארוחת בוקר עם אחד ההורים':
    'A child and parent cooking a fun breakfast together, mixing batter and laughing, bright kitchen',
  'עזרו לתכנן את ארוחת השישי':
    'A child helping a parent look through a recipe book for Friday dinner, both excited and planning',
  'המציאו לחיצת יד סודית משפחתית':
    'A family inventing a funny secret handshake together, everyone practicing the steps and giggling',
  'משחק משפחתי קצר':
    'A family sitting on the floor playing a colorful board game together, laughing and having fun',
  'זמן אחד על אחד':
    'A mother and son enjoying a warm one-on-one moment together on the couch, engaged and connected',
  'להכין חידון משפחתי':
    'A child writing fun quiz questions in a notebook with a big smile, creative planning moment',
  'ארוחת בוקר משפחתית':
    'A whole family enjoying breakfast together at a bright sunny kitchen table, warm morning atmosphere',
  'אנחנו אוהבים אותך ❤️':
    'A family giving a big group hug, everyone smiling with hearts floating around them, warm golden light',
  'יום הולדת שמח! 🎂':
    'A child blowing out candles on a birthday cake surrounded by celebrating family, colorful decorations',

  // ── CREATIVE ───────────────────────────────────────────────────────────
  'ציירו חופשת חלומות':
    'A child drawing a colorful vacation dream map with crayons, imagining exotic places, creative desk',
  'בנייה מלגו או קוביות':
    'A focused child proudly building an impressive structure from colorful Lego bricks, bedroom floor',
  'להמציא דמות':
    'A child drawing a funny invented character in a sketchbook, laughing at their creative creation',
  'ציור של חוויה':
    'A child drawing a colorful picture of something they want to do with the family, crayons everywhere',
  'למדו תעלול קסם אחד':
    'A child practicing a magic trick with a coin or card, looking amazed at their own trick, living room',
  'צרו קומיקס על המשפחה':
    'A child drawing a comic strip with four funny panels about their family, colorful markers spread out',
  'מופע קטן למשפחה':
    'A child performing a little show — singing and playing ukulele for an applauding family audience',
  'קומיקס קצר':
    'A child cutting and gluing colorful paper shapes to create a comic strip story on the table',
  'שלט לחדר':
    'A child decorating and painting a creative sign for their bedroom door, colorful paints and markers',
  'לבנות משחק משפחתי':
    'A child proudly presenting a handmade board game to the family who are excited to play, living room',
  'מופע משפחתי גדול':
    'A child dressed in a superhero costume performing dramatically for the whole family who cheer and laugh',

  // ── ENGLISH ────────────────────────────────────────────────────────────
  'משפט באנגלית על היום שלך':
    'A child enthusiastically saying an English sentence with a speech bubble showing words, confident expression',
  'מצא 5 אותיות באנגלית':
    'A child on an exciting letter hunt around the house, pointing at English letters on packages and books',
  'אמור 10 צבעים באנגלית':
    'A child pointing excitedly at colorful objects around the room saying color names in English',
  'שיר באנגלית':
    'A child singing an English song joyfully with arms open, family smiling in the background',
  'מצא 5 מילים באנגלית בבית':
    'A child searching around the kitchen finding English words on cereal boxes and cans, excited discovery',
  'ללמד מילה באנגלית':
    'A child teaching a parent a new English word using flashcards, pointing and explaining with enthusiasm',

  // ── LEARNING ───────────────────────────────────────────────────────────
  'לימדו מישהו מילה חדשה באנגלית':
    'A child enthusiastically teaching a sibling a cool English word using a globe and pointing at countries',
  'ללמוד משהו חדש ב־5 דקות':
    'A curious child doing a simple colorful science experiment with glasses of liquid, amazed expression',
  'שאלת למה':
    'A child asking a curious "why" question to a parent who answers warmly, both looking interested',
  'ללמד מישהו משהו חדש':
    'A child proudly teaching a parent or sibling how to do something with step-by-step gestures',

  // ── HEBREW ─────────────────────────────────────────────────────────────
  'חרוזים מצחיקים':
    'A child laughing while writing funny rhyming words in a notebook, playful creative moment',
  'מילה חדשה של היום':
    'A child reading a dictionary or word book with wide excited eyes, discovering a new word',
  'ברכה למישהו מהמשפחה':
    'A child writing a heartfelt greeting card for a family member, colorful desk, warm moment',
  'סיפור עם התחלה, אמצע וסוף':
    'A child confidently storytelling to the family with expressive hand gestures, everyone listening happily',

  // ── MEMORY ─────────────────────────────────────────────────────────────
  'המציאו שאלת חידון על המשפחה':
    'A child writing interesting trivia questions about the family in a notebook, excited planning face',
  'זיכרון מצולם':
    'A child looking through family photos with a big warm smile, photos spread on a cozy table',
  'ראיינו הורה על הילדות שלו':
    'A child interviewing a parent with a notepad, parent smiling telling childhood stories',
  'תחקיר קטן':
    'A child with a small notebook asking a grandparent one question about the past, warm listening moment',
  'סיפור של סבא או סבתא':
    'A child sitting next to a smiling grandfather who tells a funny story from his childhood',
  'להקליט סיפור משפחתי':
    'A child recording a family member telling a short story with a phone, both engaged and warm',
  'אלבום משפחתי קטן':
    'A girl sitting on the floor opening a wooden memory box, looking at old family photos with a big smile',
  'ראיון עם סבא או סבתא':
    'A child interviewing a grandfather with five written questions, grandfather with glasses sharing stories warmly',

  // ── OUTDOOR ────────────────────────────────────────────────────────────
  'צלמו משהו יפה בחוץ':
    'A child taking a photo outside with a phone, framing something beautiful in nature, sunny park',
  'מצא משהו יפה בחוץ':
    'A curious child exploring outdoors, bending down to pick up something interesting from the ground',
  'טבע קטן':
    'A child in a sunny garden carefully picking up a beautiful leaf or flower, examining it with wonder',
  'הליכה קצרה':
    'A whole family walking together in a green park, holding hands and talking, golden afternoon light',
  'לצלם רגע יפה':
    'A child taking a photo of a beautiful outdoor scene, framing it carefully, forest or garden background',

  // ── READING ────────────────────────────────────────────────────────────
  'קראו 5 עמודים בקול רם':
    'A child reading a book out loud dramatically inside a cozy blanket fort with fairy lights, expressive face',
  '10 דקות קריאה':
    'A child curled up comfortably on a couch reading a book with a big smile, warm lamp light',
  'ספר על מה שקראת':
    'A child excitedly telling the family about a book they read, gesturing dramatically, family listening',
  'המצא סוף חדש לסיפור':
    'A child writing in a notebook inventing a new ending for a story, imaginative and excited, colorful desk',
  'הקרא סיפור למישהו':
    'A child reading a picture book aloud to a smiling parent or younger sibling, cozy reading moment',

  // ── HEALTH ─────────────────────────────────────────────────────────────
  'אתגר מים':
    'A child happily drinking a big glass of water with a thumbs up, bright kitchen background',
  'צחצוח כמו אלוף':
    'A child brushing teeth enthusiastically in front of a mirror with a big foam smile, bathroom',
  '20 קפיצות במקום':
    'A child doing energetic jumping jacks in the living room, big smile, dynamic movement',
  'מתיחות קצרות':
    'A child doing yoga stretches on a colorful mat in the living room, peaceful and focused expression',
  'מסלול מכשולים בטוח':
    'A child navigating a fun indoor obstacle course made of pillows and cushions, laughing and jumping',

  // ── FUNNY ──────────────────────────────────────────────────────────────
  'מצאו 5 דברים אדומים בבית':
    'A child on an exciting red-color scavenger hunt around the house, collecting red objects, playful',
  'פרצוף מצחיק':
    'A child making the funniest face possible, family laughing uncontrollably, living room',
  'גרמו לאבא לצחוק תוך 2 דקות':
    'A child telling a hilarious joke to dad who is cracking up laughing, two minutes on the clock',
  'בדיחה משפחתית':
    'A child telling a joke at the dinner table, the whole family laughing together, warm lighting',
  'בנו את מגדל הכריות הכי גבוה':
    'Children building an enormous wobbly pillow tower that is about to fall, laughing and catching it',
  'ריקוד של 30 שניות':
    'A child doing a wild silly dance in the living room for 30 seconds, big energy and fun moves',
  'חיקוי מצחיק':
    'A child doing a funny imitation of a cartoon character or animal, family laughing and clapping',

  // ── WEEKEND ────────────────────────────────────────────────────────────
  'בחר פעילות לסופ״ש':
    'A child excitedly presenting weekend activity ideas to the family on a colorful paper list',
  'רגע טוב של השבוע':
    'A family sharing their best moments of the week at the dinner table, warm Friday evening atmosphere',
  'עוזר שבת':
    'A child helping set up Shabbat table with candles and challah bread, family gathering warmly',
  'אתגר בלי מסך':
    'A child happily drawing and creating activities without any screens, peaceful and focused, afternoon light',

  // ── MONDIAL / WORLD CUP ──────────────────────────────────────────────────
  '⚽ צפינו במשחק מונדיאל כמשפחה':
    'A whole family snuggled on the couch watching a soccer match on TV together, cheering with raised arms, soccer ball and snacks nearby, cozy living room glowing from the screen',
  '🔮 ניחשתי נכון את תוצאת המשחק':
    'An excited child holding up a small chalkboard with a happy score guess, soccer ball beside them, celebrating a correct prediction with a big grin',
  '🎨 יצרתי יצירה בנושא נבחרת אהובה':
    'A child painting a colorful soccer-themed artwork with a generic team jersey and a soccer ball, crayons and paints spread across the table, proud creative moment',
  '🥨 הכנתי נשנושים לערב משחק':
    'A cheerful child arranging a tray of fun game-night snacks and popcorn for the family before a soccer match, bright kitchen, soccer ball on the counter',
  '🗺️ למדתי על מדינה משתתפת':
    'A curious child pointing at a colorful globe and an open atlas, discovering a faraway country, soccer ball nearby, warm study corner',
  '👕 הגעתי לערב מונדיאל בצבעי הנבחרת':
    'A proud child wearing a colorful generic sports jersey and face paint in team colors, holding a soccer ball, festive cheering pose',
  '📊 עדכנתי את טבלת הבתים':
    'A focused child updating a colorful standings chart on a whiteboard with stickers and stars, soccer ball at their feet, organized fun moment',
  '🎤 הייתי הפרשן/ית של המשחק':
    'An enthusiastic child holding a toy microphone commentating excitedly in front of a TV showing a soccer match, animated expression, living room',
  '🏆 ניחשתי מי תזכה במונדיאל':
    'A child joyfully lifting a shiny golden trophy cup with both hands, confetti falling around them, soccer ball nearby, triumphant celebration',
  '🙌 חגגתי גול עם כל המשפחה':
    'A whole family jumping up and celebrating a goal together in the living room, arms in the air, pure joy, soccer ball and TV glowing in background',
  '📺 צפיתי בתקציר המשחקים עם אבא':
    'A father and child sitting close together watching soccer match highlights on TV in the evening, both smiling and pointing at the screen, cozy warm light',

  // ── FAMILY QUICK MISSIONS ────────────────────────────────────────────────
  'להכניס את אור למקלחת':
    'A cheerful young child happily stepping into a bright bathroom shower with bubbles and a rubber duck, splashing water, joyful bath time',
  'התנגה יפה וקראה הרבה':
    'A happy child curled up reading a stack of books with a big proud smile, cozy reading nook with cushions and warm lamp light',
  'הכנתי שיעורי בית ':
    'A focused child proudly finishing homework at a tidy desk with pencils and notebooks, satisfied smile, bright study corner',
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function loadProgress() {
  if (existsSync(PROGRESS_FILE)) {
    return JSON.parse(readFileSync(PROGRESS_FILE, 'utf8'))
  }
  return {}
}

function saveProgress(progress) {
  writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2))
}

async function generateImage(prompt, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await fal.run('fal-ai/flux/schnell', {
        input: {
          prompt: `${prompt}, ${STYLE}`,
          image_size: 'landscape_4_3',
          num_inference_steps: 8,
          num_images: 1,
        }
      })
      const url = result.data?.images?.[0]?.url
      if (!url) throw new Error('No image URL in response')
      return url
    } catch (err) {
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 2000 * attempt))
      } else {
        throw err
      }
    }
  }
}

async function updateMission(id, imageUrl) {
  const { error } = await supabase
    .from('missions')
    .update({ image_url: imageUrl })
    .eq('id', id)
  if (error) throw error
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Loading missions from DB...')
  const { data: missions, error } = await supabase
    .from('missions')
    .select('id, title, category, image_url')
    .eq('is_active', true)
    .order('category')

  if (error) { console.error(error); process.exit(1) }

  const progress = loadProgress()
  const toProcess = missions.filter(m => !m.image_url && !progress[m.id])

  console.log(`${missions.length} total missions | ${toProcess.length} need images\n`)

  let done = 0
  for (const mission of toProcess) {
    const prompt = PROMPTS[mission.title]
    if (!prompt) {
      console.log(`⚠️  No prompt for: "${mission.title}" (${mission.category}) — skipping`)
      continue
    }

    process.stdout.write(`[${++done}/${toProcess.length}] ${mission.title}... `)
    try {
      const falUrl = await generateImage(prompt)
      await updateMission(mission.id, falUrl)
      progress[mission.id] = falUrl
      saveProgress(progress)
      console.log('✓')
    } catch (err) {
      console.log(`✗ ${err.message}`)
    }

    // Small delay to avoid rate limits
    await new Promise(r => setTimeout(r, 500))
  }

  console.log('\nDone! All mission images generated.')
}

main().catch(err => { console.error(err); process.exit(1) })
