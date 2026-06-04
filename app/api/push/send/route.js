import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

webpush.setVapidDetails(
  process.env.VAPID_EMAIL,
  process.env.NEXT_PUBLIC_VAPID_KEY,
  process.env.VAPID_PRIVATE_KEY
)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function POST(req) {
  try {
    const { memberIds, title, body, url = '/', tag = 'remez' } = await req.json()
    if (!memberIds?.length || !title) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

    // Load subscriptions for the given member IDs
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('subscription')
      .in('member_id', memberIds)

    if (!subs?.length) return NextResponse.json({ sent: 0 })

    const payload = JSON.stringify({ title, body, url, tag })
    const results = await Promise.allSettled(
      subs.map(s => webpush.sendNotification(s.subscription, payload))
    )
    const sent = results.filter(r => r.status === 'fulfilled').length
    return NextResponse.json({ sent })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
