import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function POST(req) {
  // Initialize inside handler so env vars are available at runtime, not build time
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL || 'mailto:remezhouse@gmail.com',
    process.env.NEXT_PUBLIC_VAPID_KEY,
    process.env.VAPID_PRIVATE_KEY
  )
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
