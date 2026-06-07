/**
 * Reward Image Generator
 *
 * Characters (always the same family):
 *   - Boy age 10, yellow shirt (אור)
 *   - Girl age 7, purple shirt (תמרה)
 *   - Boy age 5, blue shirt (גיל)
 *
 * Run:
 *   node scripts/generate-reward-images.mjs
 */

import { fal } from '@fal-ai/client'
import { createClient } from '@supabase/supabase-js'
import { writeFileSync, readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const FAL_KEY    = process.env.FAL_KEY
const SUPA_URL   = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPA_KEY   = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const PROGRESS_FILE = join(__dirname, 'reward-image-progress.json')

if (!FAL_KEY || !SUPA_URL || !SUPA_KEY) {
  console.error('Missing env vars')
  process.exit(1)
}

fal.config({ credentials: FAL_KEY })
const supabase = createClient(SUPA_URL, SUPA_KEY)

// ── Character shorthands ──────────────────────────────────────────────────
const BOY10  = '10-year-old boy wearing a yellow shirt with brown hair and big expressive eyes'
const GIRL7  = '7-year-old girl wearing a purple shirt with brown hair and big expressive eyes'
const BOY5   = '5-year-old boy wearing a blue shirt with brown hair and big expressive eyes'
const FAMILY = `${BOY10}, ${GIRL7}, and ${BOY5} with their parents`
const KIDS   = `${BOY10}, ${GIRL7}, and ${BOY5}`

const STYLE = 'colorful family cartoon illustration, Pixar and Disney inspired art style, warm golden tones, expressive big eyes, friendly characters, cozy home environment, vibrant cheerful colors, clean composition, mobile app card artwork, no text, no letters, no logos, no numbers'

// ── Reward prompts (keyed by title) ────────────────────────────────────────
const PROMPTS = {
  // Small rewards
  'לבחור שיר באוטו':
    `${BOY10} happily choosing music in the family car, holding up a phone, family smiling, warm car interior`,
  'לבחור קינוח קטן בבית':
    `${GIRL7} excitedly choosing a small dessert treat from the kitchen, happy and proud`,
  'כרטיס חיבוק ענק':
    `${BOY5} receiving a big warm hug from a parent, both laughing, cozy living room`,
  'לבחור כוס מיוחדת':
    `${GIRL7} proudly holding her special colorful cup at the dinner table, smiling`,
  'עוד 10 דקות לפני שינה':
    `${BOY5} in pajamas happily getting 10 extra minutes to play, cozy bedroom with lamp`,
  'לבחור סיפור לפני השינה':
    `${GIRL7} in bed joyfully pointing at a book for bedtime story, parent sitting beside`,
  'לבחור משחק משפחתי קצר':
    `${BOY10} choosing a board game from a shelf, excited expression, living room background`,
  'לבחור ארוחת ערב':
    `${GIRL7} happily pointing at a dinner menu or recipe, kitchen background, parent listening`,
  'לבחור סרטון קצר יחד':
    `${KIDS} all snuggled together on a couch choosing a short video to watch together`,
  'פטור ממשימה אחת קטנה':
    `${BOY10} triumphantly waving a golden "free pass" ticket, huge smile, living room`,

  // Medium rewards
  'לבחור מוזיקה בבית':
    `${GIRL7} DJing on a phone, whole family dancing in the living room to her music selection`,
  'לבחור סרט לערב משפחתי':
    `${BOY10} excitedly pointing at a TV screen choosing a movie, family gathered on couch`,
  'ערב פופקורן משפחתי':
    `${KIDS} and parents on couch with popcorn and snacks watching a movie, cozy evening`,
  'להיות מלך הבית לשעה':
    `${BOY5} wearing a paper crown sitting on a throne made of pillows, siblings bowing playfully`,
  'זמן אישי עם אמא':
    `${GIRL7} and her mom having a special one-on-one activity together, warm bonding moment`,
  'זמן אישי עם אבא':
    `${BOY10} and his dad playing together outside, laughing and having fun`,
  'להכין קינוח ביחד':
    `${GIRL7} baking or making a dessert with a parent, flour on faces, laughing in kitchen`,
  'לבחור פעילות שבת בבוקר':
    `${BOY10} planning Saturday morning activity on a colorful paper, family gathered around`,
  'פיקניק קטן בגינה':
    `${KIDS} having a small picnic in the garden with snacks, sunny afternoon`,
  'ארוחת בוקר מיוחדת בסופ״ש':
    `${GIRL7} enjoying a special weekend breakfast with pancakes and fruit, bright morning kitchen`,

  // Large rewards
  'גלידה בחוץ':
    `${BOY5} and a parent at an ice cream shop, huge ice cream cone, pure joy on faces`,
  'ערב סרט מלא בבית':
    `${KIDS} in blanket fort with popcorn watching a full movie, fairy lights, cozy evening`,
  'קמפינג בסלון':
    `${FAMILY} camping in the living room with a blanket tent, flashlights, pillows everywhere`,
  'לקנות ספר או יצירה קטנה':
    `${GIRL7} excitedly choosing a book or craft kit at a store, holding it proudly`,
  'פיקניק משפחתי בפארק':
    `${FAMILY} having a big picnic in a sunny park, blanket spread out, lots of food and fun`,
  'לבחור מסעדה פשוטה':
    `${FAMILY} at a restaurant, all laughing and enjoying food together, warm atmosphere`,
  'יום אני מחליט':
    `${BOY10} standing confidently in front of a family who are all following his lead, superhero pose`,
  'להזמין חבר לפעילות בבית':
    `${GIRL7} playing with a friend at home while siblings join in, colorful living room`,

  // Dream rewards
  'יום כיף אישי עם הורה':
    `${BOY10} and a parent on an exciting personal adventure day out, both beaming with joy`,
  'לילה משפחתי מיוחד':
    `${FAMILY} having a special night — pizza boxes open, movie on TV, blankets everywhere, pure happiness`,
  'לקנות צעצוע או משחק':
    `${BOY5} holding a new toy with both arms, the biggest smile, colorful toy store background`,
  'לבחור מסעדה משפחתית':
    `${FAMILY} at a nice restaurant, celebrating together, kids dressed up, candles on table`,
  'אטרקציה משפחתית גדולה':
    `${FAMILY} at an amusement park, kids on a ride with arms up, huge smiles, colorful park`,
  'פרס משפחתי משותף':
    `${KIDS} holding a big trophy together, teamwork pose, confetti falling, huge celebration`,

  // Mondial / World Cup rewards
  'נשארים ערים למשחק מאוחר':
    `${KIDS} in pajamas excitedly staying up late on the couch to watch a soccer match on TV, night time, glowing screen, soccer ball nearby`,
  'ערב פיצה ומשחק מונדיאל':
    `${FAMILY} enjoying a pizza and soccer night, open pizza boxes, watching a match on TV, cheering together, cozy evening`,
  'בוחר/ת את המשחק שצופים בו':
    `${BOY10} proudly holding a TV remote choosing a soccer match for the family to watch, soccer ball under his arm, family gathered on the couch`,

  // Gaming reward
  'סקין ברובלוקס':
    `${BOY10} cheering with both arms raised in front of a computer screen, holding a game controller, colorful video game glow, excited celebration, sparkles around him`,
}

function loadProgress() {
  if (existsSync(PROGRESS_FILE)) return JSON.parse(readFileSync(PROGRESS_FILE, 'utf8'))
  return {}
}
function saveProgress(p) { writeFileSync(PROGRESS_FILE, JSON.stringify(p, null, 2)) }

async function generateImage(prompt, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await fal.run('fal-ai/flux/schnell', {
        input: { prompt: `${prompt}, ${STYLE}`, image_size: 'landscape_4_3', num_inference_steps: 8, num_images: 1 }
      })
      const url = result.data?.images?.[0]?.url
      if (!url) throw new Error('No URL')
      return url
    } catch (err) {
      if (attempt < retries) await new Promise(r => setTimeout(r, 2000 * attempt))
      else throw err
    }
  }
}

async function main() {
  console.log('Loading rewards from DB...')
  const { data: rewards } = await supabase.from('rewards').select('id, title, image_url').eq('is_active', true)
  const progress = loadProgress()
  const todo = rewards.filter(r => !r.image_url && !progress[r.id])

  console.log(`${rewards.length} rewards total | ${todo.length} need images\n`)

  let done = 0
  for (const reward of todo) {
    const prompt = PROMPTS[reward.title]
    if (!prompt) { console.log(`⚠️  No prompt for: "${reward.title}" — skipping`); continue }

    process.stdout.write(`[${++done}/${todo.length}] ${reward.title}... `)
    try {
      const url = await generateImage(prompt)
      await supabase.from('rewards').update({ image_url: url }).eq('id', reward.id)
      progress[reward.id] = url
      saveProgress(progress)
      console.log('✓')
    } catch (err) {
      console.log(`✗ ${err.message}`)
    }
    await new Promise(r => setTimeout(r, 500))
  }
  console.log('\nDone!')
}

main().catch(e => { console.error(e); process.exit(1) })
