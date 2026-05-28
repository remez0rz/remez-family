'use client'
import { supabase } from '../lib/supabase'

export default function LoginPage() {
  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fafafa', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Remez Family</h1>
      <p style={{ color: '#666', marginBottom: '2rem' }}>Private family space</p>
      <button onClick={handleLogin} style={{ padding: '12px 32px', fontSize: '1rem', background: '#4285f4', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
        Sign in with Google
      </button>
    </div>
  )
}