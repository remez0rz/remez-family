import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function POST(req) {
  try {
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
