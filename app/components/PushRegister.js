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

// App-load behaviour:
//  • permission already granted → register silently (keeps the subscription fresh).
//  • not granted, not blocked, never asked → show a friendly one-time prompt.
// The "asked once" flag is persisted, so we never nag again on later visits.
const PROMPT_FLAG = 'notifPromptSeen'

export default function PushRegister() {
  const [show, setShow]           = useState(false)
  const [profileId, setProfileId] = useState(null)
  const [busy, setBusy]           = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return

    if (Notification.permission === 'granted') {
      getCurrentProfile().then(p => { if (p) registerPush(p.id) })
      return
    }
    // Blocked at the OS/browser level, or we've already shown the prompt once.
    if (Notification.permission === 'denied') return
    let seen = false
    try { seen = !!localStorage.getItem(PROMPT_FLAG) } catch {}
    if (seen) return

    // Only prompt a logged-in user, and only once.
    getCurrentProfile().then(p => {
      if (!p) return
      setProfileId(p.id)
      setTimeout(() => setShow(true), 1200)
    })
  }, [])

  const dismiss = () => {
    try { localStorage.setItem(PROMPT_FLAG, '1') } catch {}
    setShow(false)
  }
  const approve = async () => {
    if (busy) return
    setBusy(true)
    await registerPush(profileId) // opens the OS permission prompt (user gesture)
    setBusy(false)
    dismiss()
  }

  if (!show) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(10,22,40,0.6)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      fontFamily: 'var(--font-heebo), sans-serif', direction: 'rtl'
    }}>
      <div style={{
        background: 'white', borderRadius: '24px 24px 0 0', padding: '26px 22px 32px',
        width: '100%', maxWidth: 480, textAlign: 'center'
      }}>
        <div style={{ fontSize: 46, marginBottom: 10 }}>🔔</div>
        <div style={{ fontSize: 20, fontWeight: 900, color: '#2D2D2D', marginBottom: 8 }}>
          רוצים לקבל עדכונים?
        </div>
        <div style={{ fontSize: 14, color: '#6b5e4e', lineHeight: 1.6, marginBottom: 22 }}>
          נשלח התראה על משימות חדשות, אישור פרסים ורגעים משפחתיים.
          אפשר לכבות בכל רגע.
        </div>
        <button onClick={approve} disabled={busy} style={{
          width: '100%', padding: '15px', background: '#FF6B6B', color: 'white',
          border: 'none', borderRadius: 50, cursor: 'pointer', fontWeight: 800, fontSize: 16,
          fontFamily: 'var(--font-heebo), sans-serif', marginBottom: 10
        }}>
          {busy ? 'מפעיל...' : 'אשר התראות'}
        </button>
        <button onClick={dismiss} disabled={busy} style={{
          width: '100%', padding: '10px', background: 'transparent', border: 'none',
          cursor: 'pointer', fontSize: 13, color: '#a09080', fontWeight: 600,
          fontFamily: 'var(--font-heebo), sans-serif'
        }}>
          לא עכשיו
        </button>
      </div>
    </div>
  )
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
    if (!ok) return
    if (Notification.permission === 'granted') setAlready(true)
    // Reflect the real saved state: if a push subscription already exists, show
    // "active" instead of asking to approve again on every visit.
    navigator.serviceWorker.getRegistration()
      .then(reg => reg?.pushManager.getSubscription())
      .then(sub => { if (sub) setState('done') })
      .catch(() => {})
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
