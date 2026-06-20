'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { categoriesFor, isOn } from '../lib/notifPrefs'

const NAVY  = '#2D2D2D'
const GREEN = '#4ECDC4'

// Lets a user choose which notification categories to receive. Saves to
// profiles.notif_prefs. Categories shown depend on role.
export default function NotificationSettings({ profileId, role }) {
  const [prefs, setPrefs] = useState(null)
  const cats = categoriesFor(role)

  useEffect(() => {
    if (!profileId) return
    let cancelled = false
    supabase.from('profiles').select('notif_prefs').eq('id', profileId).single()
      .then(({ data }) => { if (!cancelled) setPrefs(data?.notif_prefs || {}) })
    return () => { cancelled = true }
  }, [profileId])

  const toggle = async (id) => {
    const next = { ...(prefs || {}), [id]: !isOn(prefs, id) }
    setPrefs(next)
    await supabase.from('profiles').update({ notif_prefs: next }).eq('id', profileId)
  }

  if (prefs === null) return null

  return (
    <div style={{ direction: 'rtl', fontFamily: 'var(--font-heebo), sans-serif' }}>
      {cats.map(c => {
        const on = isOn(prefs, c.id)
        return (
          <div key={c.id} onClick={() => toggle(c.id)} role="switch" aria-checked={on} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
            borderRadius: 14, background: '#FAF8F4', marginBottom: 8, cursor: 'pointer',
          }}>
            <span style={{ fontSize: 22 }}>{c.emoji}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: NAVY }}>{c.label}</div>
              <div style={{ fontSize: 11, color: '#a09080', marginTop: 1, lineHeight: 1.4 }}>{c.desc}</div>
            </div>
            {/* Toggle switch */}
            <div style={{
              width: 44, height: 26, borderRadius: 20, flexShrink: 0,
              background: on ? GREEN : '#d8d0c4', position: 'relative',
              transition: 'background 0.15s'
            }}>
              <div style={{
                position: 'absolute', top: 3, left: on ? 3 : 21, width: 20, height: 20,
                borderRadius: '50%', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
                transition: 'left 0.15s'
              }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
