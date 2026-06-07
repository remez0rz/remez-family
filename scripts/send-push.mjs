/**
 * Send a push notification to a single family member by email.
 *
 * Run:
 *   node -r dotenv/config scripts/send-push.mjs dotenv_config_path=.env.local "<email>" "<title>" "<body>" "<url>"
 */
import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

const [, , email, title = 'משפחת רמז', body = 'התראת בדיקה 🎉', url = '/'] = process.argv

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPA_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!email) { console.error('Usage: send-push.mjs <email> [title] [body] [url]'); process.exit(1) }
if (!process.env.VAPID_PRIVATE_KEY) { console.error('Missing VAPID env vars'); process.exit(1) }

webpush.setVapidDetails(
  process.env.VAPID_EMAIL || 'mailto:remezhouse@gmail.com',
  process.env.NEXT_PUBLIC_VAPID_KEY,
  process.env.VAPID_PRIVATE_KEY
)
const supabase = createClient(SUPA_URL, SUPA_KEY)

const { data: profile } = await supabase.from('profiles').select('id, name').eq('email', email).single()
if (!profile) { console.error(`No profile for ${email}`); process.exit(1) }

const { data: subs } = await supabase.from('push_subscriptions').select('subscription').eq('member_id', profile.id)
console.log(`${profile.name} (${email}) — ${subs?.length || 0} device(s) subscribed`)

if (!subs?.length) {
  console.log('⚠️  No subscriptions yet. The user must open the app and tap "הפעל התראות" first.')
  process.exit(0)
}

const payload = JSON.stringify({ title, body, url, tag: 'remez-test' })
let sent = 0
for (const s of subs) {
  try { await webpush.sendNotification(s.subscription, payload); sent++ }
  catch (e) { console.log('  ✗ failed:', e.statusCode, e.body || e.message) }
}
console.log(`✅ Sent ${sent}/${subs.length}`)
