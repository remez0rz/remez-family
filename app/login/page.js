'use client'
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

const NAVY  = '#2D2D2D'
const CORAL = '#FF6B6B'

function LoginForm() {
  const [loading, setLoading] = useState(false)
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const handleLogin = async () => {
    setLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    })
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #2d1b3d 100%)',
      fontFamily: 'var(--font-heebo), sans-serif',
      direction: 'rtl', padding: '24px', boxSizing: 'border-box'
    }}>

      {/* Background glow */}
      <div style={{
        position: 'absolute', top: '20%', left: '50%',
        transform: 'translateX(-50%)',
        width: 320, height: 320, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,107,107,0.15), transparent 70%)',
        pointerEvents: 'none'
      }} />

      <div style={{
        width: '100%', maxWidth: 360, textAlign: 'center',
        position: 'relative', zIndex: 1
      }}>

        {/* Logo */}
        <div style={{
          width: 88, height: 88, borderRadius: '50%',
          background: 'linear-gradient(135deg, #FF6B6B, #FF8E53)',
          margin: '0 auto 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 40, boxShadow: '0 8px 32px rgba(255,107,107,0.4)'
        }}>
          {error ? '🔒' : '🏡'}
        </div>

        {error === 'not_whitelisted' ? (
          <>
            <div style={{ fontSize: 24, fontWeight: 900, color: 'white', marginBottom: 8 }}>
              הגישה מוגבלת
            </div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', marginBottom: 32, lineHeight: 1.6 }}>
              האפליקציה הזו פרטית למשפחת רמז בלבד.
              אם אתה חלק מהמשפחה, פנה לרונן לקבלת גישה.
            </div>
            <button onClick={handleLogin} style={{
              width: '100%', padding: '14px',
              background: 'rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.7)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 50, cursor: 'pointer',
              fontWeight: 600, fontSize: 14,
              fontFamily: 'var(--font-heebo), sans-serif',
            }}>
              נסה חשבון אחר
            </button>
          </>
        ) : error === 'auth_callback_failed' ? (
          <>
            <div style={{ fontSize: 24, fontWeight: 900, color: 'white', marginBottom: 8 }}>
              משהו השתבש
            </div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', marginBottom: 32, lineHeight: 1.6 }}>
              הכניסה נכשלה. אפשר לנסות שוב.
            </div>
            <button onClick={handleLogin} disabled={loading} style={{
              width: '100%', padding: '16px',
              background: loading ? 'rgba(255,255,255,0.08)' : 'white',
              color: loading ? 'rgba(255,255,255,0.4)' : NAVY,
              border: 'none', borderRadius: 50, cursor: loading ? 'default' : 'pointer',
              fontWeight: 700, fontSize: 16,
              fontFamily: 'var(--font-heebo), sans-serif',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              boxShadow: loading ? 'none' : '0 4px 24px rgba(0,0,0,0.3)',
            }}>
              {loading ? 'מתחברים...' : 'נסה שוב'}
            </button>
          </>
        ) : (
          <>
            <div style={{ fontSize: 32, fontWeight: 900, color: 'white', marginBottom: 8, lineHeight: 1.1 }}>
              משפחת רמז
            </div>
            <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', marginBottom: 48, lineHeight: 1.5 }}>
              המרחב הפרטי שלנו
            </div>

            {/* Family avatars */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 40 }}>
              {['ר', 'ב', 'ג', 'ת', 'א'].map((letter, i) => (
                <div key={i} style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: ['#FF6B6B', '#4ECDC4', '#9B7FD4', '#FFB830', '#3B9FE8'][i],
                  border: '2.5px solid rgba(255,255,255,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, fontWeight: 700, color: 'white',
                  marginLeft: i > 0 ? -10 : 0, zIndex: 5 - i,
                  position: 'relative',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                }}>{letter}</div>
              ))}
            </div>

            <button onClick={handleLogin} disabled={loading} style={{
              width: '100%', padding: '16px',
              background: loading ? 'rgba(255,255,255,0.08)' : 'white',
              color: loading ? 'rgba(255,255,255,0.4)' : NAVY,
              border: 'none', borderRadius: 50, cursor: loading ? 'default' : 'pointer',
              fontWeight: 700, fontSize: 16,
              fontFamily: 'var(--font-heebo), sans-serif',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              boxShadow: loading ? 'none' : '0 4px 24px rgba(0,0,0,0.3)',
              transition: 'all 0.2s'
            }}>
              {loading ? (
                <span>מתחברים...</span>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  כניסה עם Google
                </>
              )}
            </button>

            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', marginTop: 20, lineHeight: 1.6 }}>
              גישה למשפחת רמז בלבד
            </div>

            <div style={{
              width: 40, height: 2, background: CORAL,
              borderRadius: 2, margin: '24px auto 0', opacity: 0.5
            }} />
          </>
        )}
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1a1a2e 0%, #2d1b3d 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 40 }}>🏡</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
