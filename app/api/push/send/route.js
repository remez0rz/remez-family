import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { getAuthedProfile } from '../../../lib/serverAuth'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function POST(req) {
  // Only a logged-in family member may trigger notifications — otherwise this is
  // an open endpoint anyone could use to spam the family with arbitrary pushes.
  const caller = await getAuthedProfile()
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Initialize inside handler so env vars are available at runtime, not build time.
  // Trim everything (env values can pick up stray whitespace/newlines) and force a
  // valid VAPID subject — web-push rejects a subject without a mailto:/http(s) scheme.
  let subject = (process.env.VAPID_EMAIL || '').trim() || 'remezhouse@gmail.com'
  if (!/^(mailto:|https?:)/i.test(subject)) subject = `mailto:${subject}`
  webpush.setVapidDetails(
    subject,
    (process.env.NEXT_PUBLIC_VAPID_KEY || '').trim(),
    (process.env.VAPID_PRIVATE_KEY || '').trim()
  )
  try {
    const { memberIds, title, body, url = '/', tag = 'remez', image, icon, category } = await req.json()
    if (!memberIds?.length || !title) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

    // Never notify the person who triggered the action (e.g. a parent acting as a
    // kid, or claiming/approving). One central rule means no self-pings anywhere.
    let recipients = [...new Set(memberIds.filter(id => id && id !== caller.id))]
    if (!recipients.length) return NextResponse.json({ sent: 0 })

    // Respect each recipient's category preferences (default on; off only when
    // notif_prefs[category] === false).
    if (category) {
      const { data: profs } = await supabase.from('profiles').select('id, notif_prefs').in('id', recipients)
      const optedOut = new Set((profs || []).filter(p => p.notif_prefs?.[category] === false).map(p => p.id))
      recipients = recipients.filter(id => !optedOut.has(id))
      if (!recipients.length) return NextResponse.json({ sent: 0 })
    }

    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('id, subscription')
      .in('member_id', recipients)

    if (!subs?.length) return NextResponse.json({ sent: 0 })

    const payload = JSON.stringify({ title, body, url, tag, image, icon })
    const results = await Promise.allSettled(
      subs.map(s => webpush.sendNotification(s.subscription, payload))
    )

    // Prune subscriptions the push service has expired, so we don't keep retrying
    // dead endpoints (404 Not Found / 410 Gone).
    const dead = results
      .map((r, i) => (r.status === 'rejected' && [404, 410].includes(r.reason?.statusCode)) ? subs[i].id : null)
      .filter(Boolean)
    if (dead.length) await supabase.from('push_subscriptions').delete().in('id', dead)

    const sent = results.filter(r => r.status === 'fulfilled').length
    return NextResponse.json({ sent })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
