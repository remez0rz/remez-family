'use client'
import { useEffect, useState } from 'react'
import { supabase, getCurrentProfile } from '../lib/supabase'

// Helper called from anywhere after login to send a push notification to member(s)
export async function sendPush(memberIds, title, body, url = '/', tag = 'remez') {
  try {
    await fetch('/api/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberIds, title, body, url, tag })
    })
  } catch {}
}

// Core registration routine. Returns { ok, reason }.
export async function registerPush(profileId) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return { ok: false, reason: 'unsupported' }
  }
  try {
    const reg = await navigator.serviceWorker.register('/sw.js')
    await navigator.serviceWorker.ready

    const perm = await Notification.requestPermission()
    if (perm !== 'granted') return { ok: false, reason: 'denied' }

    const existing = await reg.pushManager.getSubscription()
    // .trim() — the env value can carry a stray newline, which makes the browser
    // reject the key as "not base64url without padding".
    const sub = existing || await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: (process.env.NEXT_PUBLIC_VAPID_KEY || '').trim()
    })

    const res = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription: sub.toJSON(), memberId: profileId })
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return { ok: false, reason: 'save_failed', detail: err.error }
    }
    return { ok: true }
  } catch (err) {
    return { ok: false, reason: 'error', detail: err?.message }
  }
}

// Silent auto-register on app load (best-effort, only if already permitted)
export default function PushRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return
    // Only auto-register if the user already granted permission before — never prompt on load.
    if (Notification.permission !== 'granted') return
    getCurrentProfile().then(p => { if (p) registerPush(p.id) })
  }, [])
  return null
}

// Visible button so users can deliberately turn notifications on (with feedback).
// forceShow: keep it visible even when permission is already granted — important
// because granting permission in the browser/OS settings does NOT create the push
// subscription; the app still has to run registerPush. Without this, the only
// enable button would vanish after permission was granted, leaving no in-app way
// to actually complete (or re-do) registration.
export function EnableNotificationsButton({ profileId, style = {}, forceShow = false }) {
  const [state, setState] = useState('idle') // idle | working | done | error
  const [msg, setMsg]     = useState('')
  const [supported, setSupported] = useState(true)
  const [already, setAlready]     = useState(false)

  useEffect(() => {
    const ok = typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window
    setSupported(ok)
    if (ok && Notification.permission === 'granted') setAlready(true)
  }, [])

  if (!supported) return null
  // Compact mode hides once it's working; the profile-menu (forceShow) copy stays put.
  if (!forceShow && (already || state === 'done')) return null

  const handleClick = async () => {
    if (!profileId || state === 'working') return
    setState('working'); setMsg('')
    const r = await registerPush(profileId)
    if (r.ok) {
      setState('done'); setMsg('')
    } else {
      setState('error')
      setMsg(
        r.reason === 'denied'      ? 'ההרשאה נדחתה. אפשרו התראות בהגדרות האתר/הדפדפן.' :
        r.reason === 'unsupported' ? 'הדפדפן לא תומך בהתראות. ב‑iPhone צריך להוסיף למסך הבית.' :
        r.reason === 'save_failed' ? ('שמירה נכשלה: ' + (r.detail || '')) :
        ('שגיאה: ' + (r.detail || 'נסה שוב'))
      )
    }
  }

  const title =
    state === 'working' ? 'מפעיל...' :
    state === 'done'    ? '✓ ההתראות פעילות' :
    'אשר התראות'
  const sub =
    msg ? msg :
    state === 'done' ? 'מעכשיו תקבלו עדכונים' :
    'משימות, פרסים ורגעים חדשים'

  return (
    <div onClick={handleClick} style={{
      background: state === 'done'
        ? 'linear-gradient(135deg, #4ECDC4 0%, #3BB5AC 100%)'
        : 'linear-gradient(135deg, #3B9FE8 0%, #2E7FD6 100%)',
      borderRadius: 18, padding: '13px 16px', marginBottom: 14, cursor: 'pointer',
      display: 'flex', alignItems: 'center', gap: 12,
      boxShadow: '0 4px 16px rgba(59,159,232,0.35)', ...style
    }}>
      <div style={{ fontSize: 26 }}>{state === 'error' ? '⚠️' : state === 'done' ? '✅' : '🔔'}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 900, color: 'white' }}>{title}</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.9)', fontWeight: 600, marginTop: 1 }}>{sub}</div>
      </div>
      {state !== 'done' && (
        <div style={{ background: 'rgba(255,255,255,0.22)', borderRadius: 20, padding: '6px 12px', fontSize: 12, fontWeight: 800, color: 'white', whiteSpace: 'nowrap' }}>
          {state === 'error' ? 'נסה שוב' : 'הפעל'}
        </div>
      )}
    </div>
  )
}
