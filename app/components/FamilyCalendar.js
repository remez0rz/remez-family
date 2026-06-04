'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const NAVY = '#2D2D2D'

export default function FamilyCalendar() {
  const [events, setEvents] = useState([])

  useEffect(() => {
    try {
      const now   = new Date().toISOString()
      const later = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
      supabase.from('calendar_events').select('*')
        .gte('start_time', now).lte('start_time', later)
        .order('start_time').limit(10)
        .then(({ data }) => { if (data) setEvents(data) })
    } catch {}
  }, [])

  const formatDay = (iso) => {
    try {
      const d = new Date(iso)
      const today = new Date(); today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)
      const ev = new Date(d); ev.setHours(0, 0, 0, 0)
      if (ev.getTime() === today.getTime()) return 'היום'
      if (ev.getTime() === tomorrow.getTime()) return 'מחר'
      return d.toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric', month: 'numeric' })
    } catch { return '' }
  }

  const formatTime = (iso) => {
    try { return iso ? new Date(iso).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', hour12: false }) : '' }
    catch { return '' }
  }

  const DAY_COLORS = { 'היום': '#FF6B6B', 'מחר': '#FFB830' }

  if (!events.length) return null

  return (
    <div style={{ background: 'white', borderRadius: 20, padding: '16px', boxShadow: '0 4px 16px rgba(0,0,0,0.07)', marginBottom: 12 }}>
      <div style={{ fontSize: 15, fontWeight: 800, color: NAVY, marginBottom: 10 }}>📅 יומן המשפחה</div>
      {events.map(ev => {
        const day   = formatDay(ev.start_time)
        const color = DAY_COLORS[day] || '#9B7FD4'
        return (
          <div key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #f5f0e8' }}>
            <div style={{ background: color + '20', color, borderRadius: 10, padding: '4px 8px', fontSize: 11, fontWeight: 800, flexShrink: 0, minWidth: 44, textAlign: 'center' }}>
              {day}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.title}</div>
              {ev.location && <div style={{ fontSize: 10, color: '#a09080', marginTop: 1 }}>📍 {ev.location}</div>}
            </div>
            <div style={{ fontSize: 11, color: '#a09080', flexShrink: 0 }}>{formatTime(ev.start_time)}</div>
          </div>
        )
      })}
    </div>
  )
}
