'use client'
import { useEffect } from 'react'
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

export default function PushRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return

    async function register() {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js')
        const profile = await getCurrentProfile()
        if (!profile) return

        const perm = await Notification.requestPermission()
        if (perm !== 'granted') return

        const existing = await reg.pushManager.getSubscription()
        const sub = existing || await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: process.env.NEXT_PUBLIC_VAPID_KEY
        })

        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription: sub.toJSON(), memberId: profile.id })
        })
      } catch {}
    }

    register()
  }, [])

  return null
}
