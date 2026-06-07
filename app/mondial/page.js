'use client'
import { useState, useEffect } from 'react'
import { supabase, getCurrentProfile } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import BottomNav from '../components/BottomNav'
import { WC_TEAMS, teamByCode } from '../lib/worldcup'

const NAVY      = '#2D2D2D'
const CORAL     = '#FF6B6B'
const GREEN     = '#1a6b3c'
const HEADER_BG = 'linear-gradient(135deg, #1a6b3c 0%, #0d4023 100%)'
const PAGE_BG   = 'linear-gradient(135deg, #FFF9F0 0%, #F0FFF4 100%)'

export default function MondialPage() {
  const [me, setMe]             = useState(null)
  const [profiles, setProfiles] = useState([])
  const [targetId, setTargetId] = useState(null)   // whose pick we're editing
  const [query, setQuery]       = useState('')
  const [saving, setSaving]     = useState(false)
  const [flash, setFlash]       = useState('')
  const [loading, setLoading]   = useState(true)
  const router = useRouter()

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const p = await getCurrentProfile()
    if (!p) { router.push('/login'); return }
    setMe(p)
    setTargetId(p.id)
    const { data } = await supabase.from('profiles').select('*').eq('active', true).order('created_at')
    setProfiles(data || [])
    setLoading(false)
  }

  const isParent = me?.role === 'parent'
  const target   = profiles.find(p => p.id === targetId) || me
  // A parent may pick for anyone; a kid only for themselves.
  const editable = isParent ? profiles : profiles.filter(p => p.id === me?.id)

  const pickTeam = async (code) => {
    if (saving || !target) return
    setSaving(true)
    const newCode = target.world_cup_team === code ? null : code
    const { error } = await supabase.from('profiles').update({ world_cup_team: newCode }).eq('id', target.id)
    if (!error) {
      setProfiles(prev => prev.map(p => p.id === target.id ? { ...p, world_cup_team: newCode } : p))
      const t = teamByCode(code)
      setFlash(newCode ? `${t.flag} ${target.name} אוהד/ת ${t.name}!` : 'הבחירה בוטלה')
      setTimeout(() => setFlash(''), 1800)
    }
    setSaving(false)
  }

  const filtered = query.trim()
    ? WC_TEAMS.filter(t => t.name.includes(query.trim()) || t.code.toLowerCase().includes(query.trim().toLowerCase()))
    : WC_TEAMS

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: PAGE_BG }}>
      <div style={{ fontSize: 40 }}>⚽</div>
    </div>
  )

  return (
    <div className="app-page" style={{ fontFamily: 'var(--font-heebo), sans-serif', direction: 'rtl', background: PAGE_BG, minHeight: '100vh', paddingBottom: '6rem', boxSizing: 'border-box' }}>

      {/* Header */}
      <div style={{ background: HEADER_BG, padding: '20px 16px 22px', borderRadius: '0 0 22px 22px', marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, color: 'white' }}>⚽ מונדיאל 2026</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 3, fontWeight: 600 }}>בחרו נבחרת לעידוד — והדגל יופיע על האווטאר!</div>
          </div>
          <button onClick={() => router.push('/')} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 20, color: 'white', fontSize: 12, padding: '6px 13px', cursor: 'pointer', fontFamily: 'var(--font-heebo), sans-serif', fontWeight: 700 }}>← בית</button>
        </div>
      </div>

      <div className="app-body" style={{ boxSizing: 'border-box' }}>

        {/* Family picks summary */}
        <div style={{ background: 'white', borderRadius: 18, padding: '14px 15px', marginBottom: 12, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: NAVY, marginBottom: 10 }}>🏟️ הנבחרות של המשפחה</div>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            {profiles.map(p => {
              const t = teamByCode(p.world_cup_team)
              const isTarget = p.id === targetId
              const canEdit  = isParent || p.id === me?.id
              return (
                <div key={p.id}
                  onClick={() => canEdit && setTargetId(p.id)}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: canEdit ? 'pointer' : 'default', opacity: canEdit ? 1 : 0.6 }}>
                  <div style={{ position: 'relative', width: 52, height: 52 }}>
                    <div style={{
                      width: 52, height: 52, borderRadius: '50%', overflow: 'hidden',
                      border: `2.5px solid ${isTarget ? GREEN : '#e0d8c8'}`,
                      background: '#f0ebe0', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 20, fontWeight: 700, color: NAVY,
                      boxShadow: isTarget ? `0 0 0 3px ${GREEN}33` : 'none'
                    }}>
                      {p.avatar_url
                        ? <img src={p.avatar_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
                        : p.name?.charAt(0)}
                    </div>
                    {t && (
                      <div style={{ position: 'absolute', bottom: -2, right: -2, fontSize: 20, lineHeight: 1, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}>{t.flag}</div>
                    )}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: isTarget ? GREEN : '#6b5e4e' }}>{p.name}</span>
                  <span style={{ fontSize: 9, color: '#a09080' }}>{t ? t.name : 'לא נבחר'}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Picker */}
        <div style={{ background: 'white', borderRadius: 18, padding: '14px 15px', marginBottom: 12, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: NAVY, marginBottom: 4 }}>
            {isParent && targetId !== me?.id ? `בחירת נבחרת ל${target?.name}` : 'בחר/י את הנבחרת שלך'}
          </div>
          <div style={{ fontSize: 11, color: '#a09080', marginBottom: 10 }}>לחיצה שנייה על אותה נבחרת מבטלת את הבחירה</div>

          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="🔍 חיפוש נבחרת..."
            style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #ede8e0', borderRadius: 12, fontSize: 14, color: NAVY, background: '#faf8f4', fontFamily: 'var(--font-heebo), sans-serif', boxSizing: 'border-box', outline: 'none', marginBottom: 12 }} />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))', gap: 8 }}>
            {filtered.map(t => {
              const selected = target?.world_cup_team === t.code
              return (
                <button key={t.code} onClick={() => pickTeam(t.code)} disabled={saving}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                    padding: '10px 4px', borderRadius: 12, cursor: 'pointer',
                    border: selected ? `2.5px solid ${GREEN}` : '1.5px solid #ede8e0',
                    background: selected ? '#eafaef' : '#faf8f4',
                    fontFamily: 'var(--font-heebo), sans-serif',
                    boxShadow: selected ? `0 0 0 3px ${GREEN}22` : 'none',
                    transition: 'all 0.12s'
                  }}>
                  <span style={{ fontSize: 28, lineHeight: 1 }}>{t.flag}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: selected ? GREEN : NAVY }}>{t.name}</span>
                </button>
              )
            })}
          </div>
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', color: '#a09080', fontSize: 13, padding: '16px 0' }}>לא נמצאה נבחרת בשם הזה</div>
          )}
        </div>

        {/* Link to missions */}
        <button onClick={() => router.push('/missions')} style={{
          width: '100%', padding: '13px', background: `linear-gradient(135deg, ${CORAL}, #FF8E53)`,
          color: 'white', border: 'none', borderRadius: 50, cursor: 'pointer',
          fontWeight: 900, fontSize: 14, fontFamily: 'var(--font-heebo), sans-serif',
          boxShadow: '0 4px 16px rgba(255,107,107,0.4)'
        }}>⚽ למשימות המונדיאל</button>

      </div>

      {flash && (
        <div style={{ position: 'fixed', bottom: 80, left: 16, right: 16, zIndex: 60, background: GREEN, color: 'white', padding: '12px 16px', borderRadius: 14, textAlign: 'center', fontWeight: 800, fontSize: 14, boxShadow: '0 6px 20px rgba(0,0,0,0.25)' }}>{flash}</div>
      )}

      <BottomNav />
    </div>
  )
}
