import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { getAuthedProfile } from '../../../lib/serverAuth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function POST(req) {
  try {
    // Require a logged-in family member so a stranger can't attach their own
    // device to a member and receive that member's notifications.
    const caller = await getAuthedProfile()
    if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { subscription, memberId } = await req.json()
    if (!subscription || !memberId) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

    // Upsert — one subscription per browser/member combo (endpoint is unique per device)
    await supabase.from('push_subscriptions').upsert({
      member_id: memberId,
      subscription,
    }, { onConflict: 'member_id' })

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
