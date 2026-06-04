// Refresh calendar events from Google Calendar API
// Requires GOOGLE_CALENDAR_API_KEY env var and calendar to be publicly visible,
// OR set GOOGLE_CALENDAR_ICS_URL to the private ICS URL from Google Calendar settings.
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function POST() {
  try {
    const calId = encodeURIComponent(process.env.GOOGLE_CALENDAR_ID || '')
    const apiKey = process.env.GOOGLE_CALENDAR_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'GOOGLE_CALENDAR_API_KEY not set' }, { status: 500 })

    const now   = new Date().toISOString()
    const later = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString() // +60 days

    const url = `https://www.googleapis.com/calendar/v3/calendars/${calId}/events?key=${apiKey}&timeMin=${now}&timeMax=${later}&singleEvents=true&orderBy=startTime&maxResults=50`
    const res  = await fetch(url)
    const data = await res.json()

    if (!res.ok) return NextResponse.json({ error: data.error?.message }, { status: 400 })

    const events = (data.items || []).map(ev => ({
      external_id: ev.id,
      title: ev.summary || '(אין כותרת)',
      start_time: ev.start?.dateTime || ev.start?.date,
      end_time:   ev.end?.dateTime   || ev.end?.date,
      location:   ev.location || null,
      all_day:    !ev.start?.dateTime,
      updated_at: new Date().toISOString(),
    }))

    if (events.length) {
      await supabase.from('calendar_events').upsert(events, { onConflict: 'external_id' })
    }

    return NextResponse.json({ refreshed: events.length })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
