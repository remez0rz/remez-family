'use client'
import { useEffect, useState } from 'react'
import { supabase, getCurrentProfile } from './lib/supabase'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import BottomNav from './components/BottomNav'
import { EnableNotificationsButton } from './components/PushRegister'
import SpeakButton from './components/SpeakButton'
import { flagFor, isWorldCupActive, WC_TEAMS, teamByCode } from './lib/worldcup'

const GroceryList      = dynamic(() => import('./components/GroceryList'),      { ssr: false })
const FamilyCalendar   = dynamic(() => import('./components/FamilyCalendar'),   { ssr: false })
const WishlistGallery  = dynamic(() => import('./components/WishlistGallery'),  { ssr: false })

const NAVY = '#2D2D2D'
const GOLD = '#FFB830'
const CREAM = 'linear-gradient(135deg, #FFF9F0 0%, #FFF0F9 100%)'
const GREEN = '#4ECDC4'
const PURPLE = '#9B7FD4'
const CORAL = '#FF6B6B'
const HEADER_BG = 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)'


function QuickDailyDoc({ mission, uploading, onSubmit, onSkip, onClose }) {
  const [text, setText]   = useState('')
  const [file, setFile]   = useState(null)
  const [preview, setPreview] = useState(null)
  const [isVideo, setIsVideo] = useState(false)

  const handleSelect = (e) => {
    const f = e.target.files[0]
    if (!f) return
    setFile(f); setIsVideo(f.type.startsWith('video/')); setPreview(URL.createObjectURL(f))
    e.target.value = ''
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(10,22,40,0.96)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-heebo), sans-serif', direction: 'rtl', padding: 16
    }}>
      <div style={{ background: '#2D2D2D', borderRadius: 28, padding: '24px 20px', maxWidth: 360, width: '100%', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 14, left: 14, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 28, height: 28, color: 'white', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 28, marginBottom: 6 }}>🌅</div>
          <div style={{ fontSize: 17, fontWeight: 900, color: 'white', marginBottom: 4 }}>איך הלך?</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{mission.title}</div>
          <div style={{ display: 'inline-block', marginTop: 6, background: `linear-gradient(135deg, #FFB830, #FFD166)`, borderRadius: 20, padding: '4px 12px', fontSize: 13, fontWeight: 800, color: '#2D2D2D' }}>+{mission.points} נקודות</div>
        </div>

        <input type="file" accept="image/*" capture="environment" onChange={handleSelect} style={{ display: 'none' }} id="qd-cam-photo" />
        <input type="file" accept="video/*" capture="environment" onChange={handleSelect} style={{ display: 'none' }} id="qd-cam-video" />
        <input type="file" accept="image/*,video/*" onChange={handleSelect} style={{ display: 'none' }} id="qd-gal" />

        {preview ? (
          <div style={{ position: 'relative', marginBottom: 10 }}>
            {isVideo
              ? <video src={preview} controls style={{ width: '100%', borderRadius: 12, maxHeight: 160, display: 'block' }} />
              : <img src={preview} alt="p" style={{ width: '100%', borderRadius: 12, maxHeight: 160, objectFit: 'cover', display: 'block' }} />
            }
            <button onClick={() => { setFile(null); setPreview(null); setIsVideo(false) }} style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: 26, height: 26, color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>✕</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
            <label htmlFor="qd-cam-photo" style={{ padding: '10px 4px', background: 'rgba(255,255,255,0.08)', borderRadius: 12, border: '1.5px dashed rgba(255,255,255,0.2)', textAlign: 'center', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>📷<br/>תמונה</label>
            <label htmlFor="qd-cam-video" style={{ padding: '10px 4px', background: 'rgba(255,255,255,0.08)', borderRadius: 12, border: '1.5px dashed rgba(255,255,255,0.2)', textAlign: 'center', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>🎬<br/>סרטון</label>
            <label htmlFor="qd-gal" style={{ padding: '10px 4px', background: 'rgba(255,255,255,0.08)', borderRadius: 12, border: '1.5px dashed rgba(255,255,255,0.2)', textAlign: 'center', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>🖼️<br/>גלריה</label>
          </div>
        )}

        <textarea value={text} onChange={e => setText(e.target.value)}
          placeholder="משהו קצר על מה שעשית... (לא חובה)"
          style={{ width: '100%', padding: '10px 12px', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, fontSize: 13, color: 'white', background: 'rgba(255,255,255,0.08)', fontFamily: 'var(--font-heebo), sans-serif', boxSizing: 'border-box', resize: 'none', minHeight: 56, lineHeight: 1.5, marginBottom: 12, outline: 'none' }}
        />

        <button onClick={() => onSubmit({ text, file })} disabled={uploading} style={{ width: '100%', padding: '13px', background: '#FF6B6B', border: 'none', borderRadius: 50, cursor: 'pointer', fontWeight: 800, fontSize: 15, color: 'white', fontFamily: 'var(--font-heebo), sans-serif', marginBottom: 8 }}>
          {uploading ? 'שולח...' : 'סיימתי! 🎉'}
        </button>
        <button onClick={onSkip} style={{ width: '100%', padding: '9px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 12, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-heebo), sans-serif' }}>דלג (בלי תמונה)</button>
      </div>
    </div>
  )
}

// ── Quick Mission Modal (parent home shortcut) ────────────────────────────────
const QUICK_CATEGORIES = [
  { id: 'Family',   emoji: '👨‍👩‍👧', label: 'משפחה' },
  { id: 'Helping',  emoji: '🤝',     label: 'עזרה' },
  { id: 'Learning', emoji: '🧠',     label: 'לימוד' },
  { id: 'Outdoor',  emoji: '🌿',     label: 'בחוץ' },
  { id: 'Creative', emoji: '🎨',     label: 'יצירה' },
  { id: 'Daily',    emoji: '🌅',     label: 'יומי' },
]

function QuickMissionModal({ profiles, onClose, onCreated }) {
  const children  = profiles.filter(p => p.role === 'child')
  const [title, setTitle]         = useState('')
  const [points, setPoints]       = useState(30)
  const [category, setCategory]   = useState('Family')
  const [assignTo, setAssignTo]   = useState([])
  const [repeatable, setRepeatable] = useState(false)
  const [saving, setSaving]       = useState(false)

  const toggleChild = (id) => setAssignTo(prev =>
    prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
  )

  const handleSave = async () => {
    if (!title.trim() || saving) return
    setSaving(true)

    // 1. Create the mission
    const { data: mission } = await supabase.from('missions').insert({
      title: title.trim(), points, category,
      repeatable, is_active: true,
      type: 'fun', difficulty: 'easy', estimated_minutes: 20,
    }).select().single()

    // 2. Assign immediately if kids selected
    if (mission && assignTo.length) {
      await supabase.from('assignments').insert(
        assignTo.map(id => ({ mission_id: mission.id, assigned_to: id, status: 'active' }))
      )
      // Push notify assigned kids
      const names = assignTo.map(id => profiles.find(p => p.id === id)?.name).filter(Boolean).join(' ו')
      fetch('/api/push/send', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberIds: assignTo, title: '⭐ אתגר חדש!', body: `${title.trim()} — בא לצבור נקודות!`, url: '/missions/active', tag: 'newmission' })
      }).catch(() => {})
    }

    setSaving(false)
    onCreated()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,22,40,0.88)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontFamily: 'var(--font-heebo), sans-serif', direction: 'rtl' }}>
      <div style={{ background: 'white', borderRadius: '24px 24px 0 0', padding: '24px 20px 40px', width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto' }}>

        {/* Handle */}
        <div style={{ width: 40, height: 4, background: '#e0d8c8', borderRadius: 4, margin: '0 auto 20px' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: NAVY }}>⚡ משימה מהירה</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#a09080' }}>✕</button>
        </div>

        {/* Title */}
        <input value={title} onChange={e => setTitle(e.target.value)}
          placeholder="שם המשימה — למשל: סדר את החדר"
          autoFocus
          style={{ width: '100%', padding: '13px 14px', border: '1.5px solid #ede8e0', borderRadius: 14, fontSize: 15, color: NAVY, background: '#faf8f4', fontFamily: 'var(--font-heebo), sans-serif', boxSizing: 'border-box', outline: 'none', marginBottom: 14, fontWeight: 600 }} />

        {/* Points */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#6b5e4e', marginBottom: 8 }}>נקודות</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[10, 20, 30, 50, 100].map(p => (
              <button key={p} onClick={() => setPoints(p)} style={{
                flex: 1, padding: '9px 4px', borderRadius: 12, border: 'none', cursor: 'pointer',
                background: points === p ? CORAL : '#f0ebe0',
                color: points === p ? 'white' : NAVY,
                fontWeight: 700, fontSize: 13, fontFamily: 'var(--font-heebo), sans-serif'
              }}>{p}</button>
            ))}
            <input type="number" value={points} onChange={e => setPoints(parseInt(e.target.value) || 0)}
              style={{ width: 52, padding: '9px 6px', borderRadius: 12, border: '1.5px solid #ede8e0', fontSize: 13, color: NAVY, background: '#faf8f4', fontFamily: 'var(--font-heebo), sans-serif', textAlign: 'center', outline: 'none' }} />
          </div>
        </div>

        {/* Category */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#6b5e4e', marginBottom: 8 }}>קטגוריה</div>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
            {QUICK_CATEGORIES.map(c => (
              <button key={c.id} onClick={() => setCategory(c.id)} style={{
                padding: '7px 12px', borderRadius: 20, border: 'none', cursor: 'pointer',
                background: category === c.id ? NAVY : '#f0ebe0',
                color: category === c.id ? 'white' : NAVY,
                fontWeight: 700, fontSize: 12, fontFamily: 'var(--font-heebo), sans-serif'
              }}>{c.emoji} {c.label}</button>
            ))}
          </div>
        </div>

        {/* Assign to */}
        {children.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#6b5e4e', marginBottom: 8 }}>שלח מיד ל... (לא חובה)</div>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              {children.map(child => (
                <div key={child.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div onClick={() => toggleChild(child.id)} style={{
                    width: 50, height: 50, borderRadius: '50%',
                    border: `2.5px solid ${assignTo.includes(child.id) ? CORAL : '#e0d8c8'}`,
                    overflow: 'hidden', cursor: 'pointer', background: '#f0ebe0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, fontWeight: 700, color: NAVY,
                    boxShadow: assignTo.includes(child.id) ? `0 0 0 3px ${CORAL}33` : 'none',
                    transition: 'all 0.15s'
                  }}>
                    {child.avatar_url
                      ? <img src={child.avatar_url} alt={child.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
                      : child.name?.charAt(0)}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: assignTo.includes(child.id) ? CORAL : '#a09080' }}>{child.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Repeatable toggle */}
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, cursor: 'pointer', padding: '10px 12px', background: '#faf8f4', borderRadius: 12 }}>
          <input type="checkbox" checked={repeatable} onChange={e => setRepeatable(e.target.checked)}
            style={{ width: 18, height: 18, accentColor: CORAL, cursor: 'pointer' }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: NAVY }}>משימה חוזרת</div>
            <div style={{ fontSize: 11, color: '#a09080' }}>הילד יוכל לבצע שוב ושוב</div>
          </div>
        </label>

        <button onClick={handleSave} disabled={!title.trim() || saving} style={{
          width: '100%', padding: '14px',
          background: title.trim() ? `linear-gradient(135deg, ${CORAL}, #FF8E53)` : '#e0d8c8',
          color: 'white', border: 'none', borderRadius: 50,
          cursor: title.trim() ? 'pointer' : 'default',
          fontWeight: 900, fontSize: 15, fontFamily: 'var(--font-heebo), sans-serif',
          boxShadow: title.trim() ? '0 4px 16px rgba(255,107,107,0.4)' : 'none'
        }}>
          {saving ? '⏳ שומר...' : assignTo.length ? `⚡ צור ושלח ל${assignTo.length > 1 ? assignTo.length + ' ילדים' : profiles.find(p => p.id === assignTo[0])?.name || 'ילד'}` : '➕ צור משימה'}
        </button>
      </div>
    </div>
  )
}

const REACTIONS = [
  { type: 'proud',  emoji: '❤️' },
  { type: 'fire',   emoji: '🔥' },
  { type: 'clap',   emoji: '👏' },
  { type: 'star',   emoji: '⭐' },
  { type: 'trophy', emoji: '🏆' },
  { type: 'wow',    emoji: '🤯' },
]

const MISSION_GRADIENTS = [
  ['#FF6B6B', '#FF8E53'], ['#4ECDC4', '#2EBFB8'],
  ['#9B7FD4', '#C084FC'], ['#FFB830', '#FFD166'],
  ['#3B9FE8', '#60B8FF'],
]

const CATEGORY_LABELS = {
  Family: 'משפחה', Learning: 'לומדים בכיף', Helping: 'עוזרים בבית',
  Creative: 'יצירה', Funny: 'מצחיקים', Outdoor: 'בחוץ',
  Reading: 'קריאה', English: 'אנגלית', Hebrew: 'עברית',
  Kindness: 'מעשים טובים', House: 'הבית שלנו', Memory: 'זיכרונות',
  Health: 'בריאות', Weekend: 'סופ״ש', Daily: 'משימות יומיות', Special: 'פרסים מיוחדים',
}

const CATEGORY_VISUAL = {
  Funny:    { emoji: '😂' }, Creative: { emoji: '🎨' },
  Weekend:  { emoji: '🌅' }, Learning: { emoji: '🧠' },
  Reading:  { emoji: '📖' }, English:  { emoji: '🌍' },
  Hebrew:   { emoji: '✡️' }, Helping:  { emoji: '🤝' },
  Kindness: { emoji: '❤️' }, House:    { emoji: '🏠' },
  Outdoor:  { emoji: '🌿' }, Health:   { emoji: '💪' },
  Family:   { emoji: '👨‍👩‍👧' }, Memory:  { emoji: '📸' },
  Daily:    { emoji: '🌅' },
  Special:  { emoji: '🎁' },
}

function Avatar({ profile, size = 40 }) {
  const [imgError, setImgError] = useState(false)
  const flag = isWorldCupActive() ? flagFor(profile?.world_cup_team) : ''
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      border: `3px solid rgba(255,255,255,0.8)`, flexShrink: 0,
      background: '#FFD5E8', display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontSize: size * 0.38, fontWeight: 800, color: CORAL,
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)', position: 'relative'
    }}>
      <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {profile?.avatar_url && !imgError
          ? <img src={profile.avatar_url} alt={profile?.name}
              onError={() => setImgError(true)}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : profile?.name?.charAt(0)}
      </div>
      {flag && (
        <div style={{ position: 'absolute', bottom: -2, right: -2, fontSize: size * 0.4, lineHeight: 1, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.35))' }}>{flag}</div>
      )}
    </div>
  )
}

function ProgressBar({ value, max, color = GOLD }) {
  const pct = max > 0 ? Math.min(Math.round((value / max) * 100), 100) : 100
  return (
    <div style={{ background: 'rgba(255,255,255,0.3)', borderRadius: 8, height: 10 }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 8, transition: 'width 0.4s ease', boxShadow: `0 2px 6px ${color}66` }} />
    </div>
  )
}

function Card({ children, style = {} }) {
  return (
    <div style={{
      background: 'white', borderRadius: 24, padding: '18px 20px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.07)', marginBottom: 14, ...style
    }}>
      {children}
    </div>
  )
}

function MondialBanner({ profile }) {
  const router = useRouter()
  const [team, setTeam] = useState(profile?.world_cup_team || null)
  const [saving, setSaving] = useState(false)
  useEffect(() => { setTeam(profile?.world_cup_team || null) }, [profile?.world_cup_team])
  if (!isWorldCupActive()) return null

  const pick = async (code) => {
    if (saving || !profile?.id) return
    setSaving(true)
    const next = team === code ? null : code
    setTeam(next)
    await supabase.from('profiles').update({ world_cup_team: next }).eq('id', profile.id)
    setSaving(false)
  }

  const myTeam = teamByCode(team)

  return (
    <div style={{
      background: 'linear-gradient(135deg, #1a6b3c 0%, #0d4023 100%)',
      borderRadius: 20, padding: '14px 16px', marginBottom: 14,
      boxShadow: '0 4px 16px rgba(26,107,60,0.35)'
    }}>
      <div onClick={() => router.push('/mondial')} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 12 }}>
        <div style={{ fontSize: 30 }}>⚽</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 900, color: 'white' }}>מונדיאל 2026</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', fontWeight: 600, marginTop: 1 }}>
            {myTeam ? `הנבחרת שלך: ${myTeam.flag} ${myTeam.name}` : 'בחר/י נבחרת לעידוד 👇'}
          </div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: '6px 12px', fontSize: 12, fontWeight: 800, color: 'white', whiteSpace: 'nowrap' }}>הכל ←</div>
      </div>

      {/* Inline quick team picker */}
      <div style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 4, WebkitOverflowScrolling: 'touch' }}>
        {WC_TEAMS.map(t => {
          const sel = team === t.code
          return (
            <button key={t.code} onClick={() => pick(t.code)} disabled={saving} title={t.name} style={{
              flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              width: 56, padding: '7px 2px', borderRadius: 12, cursor: 'pointer',
              border: sel ? '2px solid #FFD166' : '1.5px solid rgba(255,255,255,0.25)',
              background: sel ? 'rgba(255,209,102,0.25)' : 'rgba(255,255,255,0.08)',
              fontFamily: 'var(--font-heebo), sans-serif'
            }}>
              <span style={{ fontSize: 22, lineHeight: 1 }}>{t.flag}</span>
              <span style={{ fontSize: 8.5, fontWeight: 700, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 52 }}>{t.name}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function SectionTitle({ title, href }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
      <div style={{ fontSize: 15, fontWeight: 800, color: NAVY }}>{title}</div>
      {href && <a href={href} style={{ fontSize: 12, color: CORAL, textDecoration: 'none', fontWeight: 700, background: '#FFE8E8', borderRadius: 20, padding: '3px 10px' }}>הכל ←</a>}
    </div>
  )
}

// Kid homepage
function KidHome({ currentProfile, missions, dailyMissions, completedTodayIds, rewards, activeAssignments, recentFeed, reactionData, handleReaction, handleStartMission, startingMission, onQuickDaily }) {
  const level = currentProfile.level || 1
  const getNextReward = (pts) => rewards.find(r => r.points_required > pts && (r.level_required || 1) <= level)
  const next = getNextReward(currentProfile.total_points)
  const todayMissions = missions.slice(0, 3)

  const timeAgo = (dateStr) => {
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 86400000)
    if (diff === 0) return 'היום'
    if (diff === 1) return 'אתמול'
    return `לפני ${diff} ימים`
  }

  return (
    <>
      {/* Header */}
      <div style={{
        background: HEADER_BG, padding: '24px 18px 32px',
        borderRadius: '0 0 32px 32px', marginBottom: 18,
        position: 'relative', overflow: 'hidden'
      }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: -40, left: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
        <div style={{ position: 'absolute', bottom: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, position: 'relative', zIndex: 1 }}>
          <div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.9)', fontWeight: 700, letterSpacing: '0.5px' }}>משפחת רמז</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: 'white', lineHeight: 1.2, marginTop: 2 }}>
              היי {currentProfile.name} 👋
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.92)', marginTop: 4, fontWeight: 700 }}>
              מה בא לך לצבור היום?
            </div>
          </div>
          <a href="/profiles" style={{ textDecoration: 'none' }}>
            <Avatar profile={currentProfile} size={48} />
          </a>
        </div>

        {/* Points hero */}
        <div style={{ background: 'rgba(255,255,255,0.18)', borderRadius: 24, padding: '20px 18px', backdropFilter: 'blur(4px)', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontSize: 48, fontWeight: 900, color: 'white', lineHeight: 1, textShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                {currentProfile.total_points}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', marginTop: 2, fontWeight: 600 }}>יתרה 💰</div>
            </div>
            <div style={{ width: 1, height: 40, background: 'rgba(255,255,255,0.3)', margin: '0 8px' }} />
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontSize: 26, fontWeight: 900, color: 'white', lineHeight: 1 }}>
                {currentProfile.level || 1}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', marginTop: 2, fontWeight: 600 }}>רמה 🏅</div>
            </div>
            <div style={{ width: 1, height: 40, background: 'rgba(255,255,255,0.3)', margin: '0 8px' }} />
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: 'white', lineHeight: 1 }}>
                {currentProfile.total_experience || currentProfile.total_points}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', marginTop: 2, fontWeight: 600 }}>XP כולל ⭐</div>
            </div>
          </div>

          {next ? (
            <>
              <ProgressBar value={currentProfile.total_points} max={next.points_required} color="white" />
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.95)', marginTop: 8, textAlign: 'center', fontWeight: 700 }}>
                עוד {next.points_required - currentProfile.total_points} נקודות ו{next.title} נפתח ✨
              </div>
            </>
          ) : null}

          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <a href="/missions" style={{
              flex: 1, background: 'white', color: CORAL, borderRadius: 50,
              padding: '12px', textAlign: 'center',
              textDecoration: 'none', fontWeight: 900, fontSize: 14,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}>⭐ צוברים</a>
            <a href="/rewards" style={{
              flex: 1, background: 'rgba(255,255,255,0.2)', color: 'white', borderRadius: 50,
              padding: '12px', textAlign: 'center',
              textDecoration: 'none', fontWeight: 700, fontSize: 14,
              border: '1.5px solid rgba(255,255,255,0.4)'
            }}>✨ פרסים</a>
          </div>
        </div>
      </div>

      <div className="app-body">

        <EnableNotificationsButton profileId={currentProfile?.id} />
        <MondialBanner profile={currentProfile} />

        {/* All done for today */}
        {todayMissions.length === 0 && visibleDailyMissions.length === 0 && activeAssignments.length === 0 && (
          <div style={{ background: 'white', borderRadius: 20, padding: '24px 20px', textAlign: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.07)', marginBottom: 14 }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🏆</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: NAVY, marginBottom: 6 }}>כל הכבוד!</div>
            <div style={{ fontSize: 13, color: '#8a7a60', marginBottom: 16 }}>סיימת את כל האתגרים להיום</div>
            <a href="/missions" style={{ display: 'inline-block', background: CORAL, color: 'white', borderRadius: 50, padding: '10px 24px', textDecoration: 'none', fontWeight: 700, fontSize: 13 }}>גלה עוד אתגרים →</a>
          </div>
        )}

        {/* Today's challenges */}
        {todayMissions.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <SectionTitle title="⭐ אתגרי היום" href="/missions" />
            <div className="cards-grid">
            {todayMissions.map((mission, i) => {
              const visual    = CATEGORY_VISUAL[mission.category] || { emoji: '⭐' }
              const gradient  = MISSION_GRADIENTS[i % MISSION_GRADIENTS.length]
              const starting  = startingMission === mission.id
              const hasImage  = !!mission.image_url

              return (
                <div key={mission.id} style={{ borderRadius: 24, overflow: 'hidden', boxShadow: '0 6px 24px rgba(0,0,0,0.1)' }}>
                  {/* Visual header */}
                  <div style={{
                    position: 'relative', height: 160,
                    background: hasImage
                      ? `url(${mission.image_url}) center/cover no-repeat`
                      : `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
                  }}>
                    {hasImage && (
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.05) 55%, transparent 100%)' }} />
                    )}
                    <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 1, background: 'rgba(0,0,0,0.42)', borderRadius: 20, padding: '4px 11px', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'baseline', gap: 4 }}>
                      <span style={{ fontSize: 15, fontWeight: 900, color: 'white', lineHeight: 1 }}>+{mission.points}</span>
                      <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.85)', fontWeight: 700 }}>נק׳</span>
                    </div>
                    <div style={{ position: 'absolute', bottom: 10, right: 12, zIndex: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontSize: 17 }}>{visual.emoji}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.95)', textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>
                        {CATEGORY_LABELS[mission.category] || mission.category}
                      </span>
                    </div>
                    <div style={{ position: 'absolute', bottom: 8, left: 8, zIndex: 2 }}>
                      <SpeakButton onBg size={40} text={[mission.title, mission.description]} />
                    </div>
                  </div>
                  <div style={{ background: 'white', padding: '14px 16px' }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: NAVY, lineHeight: 1.3, marginBottom: 10 }}>{mission.title}</div>
                    <button onClick={() => handleStartMission(mission)} disabled={starting} style={{
                      width: '100%', padding: '11px',
                      background: starting ? '#F0EBE0' : CORAL,
                      color: starting ? '#a09080' : 'white',
                      border: 'none', borderRadius: 50, cursor: starting ? 'default' : 'pointer',
                      fontWeight: 800, fontSize: 14, whiteSpace: 'nowrap',
                      fontFamily: 'var(--font-heebo), sans-serif',
                      boxShadow: starting ? 'none' : '0 4px 12px rgba(255,107,107,0.35)',
                    }}>
                      {starting ? 'שולח...' : 'יאללה! ⭐'}
                    </button>
                  </div>
                </div>
              )
            })}
            </div>
            <a href="/missions" style={{
              display: 'block', textAlign: 'center', fontSize: 13,
              color: CORAL, textDecoration: 'none', fontWeight: 700, marginBottom: 12, marginTop: 4
            }}>לכל אתגרי הנקודות ←</a>
          </div>
        )}

        {/* Next reward */}
        {next && (
          <Card style={{ marginBottom: 12 }}>
            <SectionTitle title="✨ החוויה הבאה שלך" href="/rewards" />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 36 }}>{next.emoji || '✨'}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: NAVY }}>{next.title}</div>
                <div style={{ fontSize: 12, color: '#8a7a60', marginTop: 2 }}>
                  עוד {next.points_required - currentProfile.total_points} נקודות והיא נפתחת
                </div>
                <div style={{ background: '#F0EBE0', borderRadius: 8, height: 8, marginTop: 8 }}>
                  <div style={{
                    width: `${Math.min(Math.round((currentProfile.total_points / next.points_required) * 100), 100)}%`,
                    height: '100%', background: GOLD, borderRadius: 8,
                    boxShadow: `0 2px 6px ${GOLD}88`
                  }} />
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Active missions */}
        {activeAssignments.length > 0 && (
          <Card style={{ marginBottom: 12 }}>
            <SectionTitle title="🏃 בתהליך" href="/missions/active" />
            {activeAssignments.slice(0, 3).map((a, i) => (
              <div key={a.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                paddingBottom: i < activeAssignments.length - 1 ? 10 : 0,
                borderBottom: i < activeAssignments.length - 1 ? '1px solid #f5f0e8' : 'none',
                marginBottom: i < activeAssignments.length - 1 ? 10 : 0
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: NAVY, flex: 1, paddingLeft: 8 }}>{a.mission.title}</div>
                <SpeakButton text={[a.mission.title, a.mission.description]} size={38} />
                <div style={{ fontWeight: 800, fontSize: 13, color: 'white', background: GREEN, padding: '4px 12px', borderRadius: 20, boxShadow: '0 2px 6px rgba(78,205,196,0.4)', marginRight: 8 }}>
                  +{a.mission.points}
                </div>
              </div>
            ))}
          </Card>
        )}

        {/* Daily missions — full cards like mission page */}
        {dailyMissions.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <SectionTitle title="🌅 משימות יומיות" href="/missions" />
            <div className="cards-grid">
            {dailyMissions.map((mission, i) => {
              const visual   = CATEGORY_VISUAL[mission.category] || { emoji: '🌅' }
              const gradient = MISSION_GRADIENTS[i % MISSION_GRADIENTS.length]
              const hasImage = !!mission.image_url
              return (
                <div key={mission.id} style={{ borderRadius: 24, marginBottom: 0, overflow: 'hidden', boxShadow: '0 6px 24px rgba(0,0,0,0.1)' }}>
                  {/* Visual header — identical to ChallengeCard */}
                  <div style={{
                    position: 'relative', height: 180,
                    background: hasImage
                      ? `url(${mission.image_url}) center/cover no-repeat`
                      : `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
                  }}>
                    {hasImage && <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.05) 55%, transparent 100%)' }} />}
                    <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 1, background: 'rgba(0,0,0,0.42)', borderRadius: 20, padding: '4px 11px', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'baseline', gap: 4 }}>
                      <span style={{ fontSize: 15, fontWeight: 900, color: 'white', lineHeight: 1 }}>{mission.points}</span>
                      <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.85)', fontWeight: 700 }}>נק׳</span>
                    </div>
                    <div style={{ position: 'absolute', bottom: 10, right: 12, zIndex: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontSize: 17, filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.4))' }}>{visual.emoji}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.95)', textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>
                        {CATEGORY_LABELS[mission.category] || mission.category}
                      </span>
                    </div>
                    <div style={{ position: 'absolute', bottom: 8, left: 8, zIndex: 2 }}>
                      <SpeakButton onBg size={40} text={[mission.title, mission.description]} />
                    </div>
                  </div>
                  {/* Card body */}
                  <div style={{ background: 'white', padding: '14px 16px' }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: NAVY, lineHeight: 1.3, marginBottom: 6 }}>{mission.title}</div>
                    <button onClick={() => onQuickDaily(mission)} style={{
                      width: '100%', padding: '12px', background: CORAL, color: 'white',
                      border: 'none', borderRadius: 50, cursor: 'pointer', whiteSpace: 'nowrap',
                      fontWeight: 700, fontSize: 14, fontFamily: 'var(--font-heebo), sans-serif',
                      boxShadow: '0 4px 12px rgba(255,107,107,0.35)'
                    }}>עשיתי! ⭐</button>
                  </div>
                </div>
              )
            })}
            </div>
          </div>
        )}

        {/* Grocery + Calendar for kids too */}
        <div className="app-two-col">
          <GroceryList isParent={false} />
          <FamilyCalendar />
        </div>

        {/* Recent feed */}
        {recentFeed.length > 0 && (
          <Card>
            <SectionTitle title="🎉 רגעים שמחים" href="/feed" />
            {recentFeed.map((post, i) => {
              const coverPhoto  = post.media_urls?.[0]
              const isVideo     = url => /\.(mp4|mov|webm|avi)(\?|$)/i.test(url)
              const postReactions = reactionData[post.id] || {}
              return (
                <div key={post.id} style={{
                  paddingBottom: i < recentFeed.length - 1 ? 14 : 0,
                  borderBottom: i < recentFeed.length - 1 ? '1px solid #f5f0e8' : 'none',
                  marginBottom: i < recentFeed.length - 1 ? 14 : 0
                }}>
                  {coverPhoto && !isVideo(coverPhoto) && (
                    <img src={coverPhoto} alt="cover" style={{
                      width: '100%', height: 140, objectFit: 'cover',
                      borderRadius: 12, marginBottom: 8, display: 'block'
                    }} />
                  )}
                  <div style={{ fontSize: 14, fontWeight: 700, color: NAVY }}>{post.title}</div>
                  {post.content && <div style={{ fontSize: 12, color: '#a09080', marginTop: 2 }}>{post.content}</div>}
                  <div style={{ fontSize: 11, color: '#b0a090', marginTop: 3 }}>{timeAgo(post.created_at)}</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                    {REACTIONS.map(r => (
                      <button key={r.type} onClick={() => handleReaction(post.id, r.type)} style={{
                        background: postReactions[r.type] ? '#FFF0D5' : '#F7F4EE',
                        border: `1.5px solid ${postReactions[r.type] ? GOLD : '#EDE8E0'}`,
                        borderRadius: 20, padding: '5px 12px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 4,
                        fontFamily: 'var(--font-heebo), sans-serif',
                        transition: 'all 0.15s ease'
                      }}>
                        <span style={{ fontSize: 14 }}>{r.emoji}</span>
                        {postReactions[r.type] > 0 && (
                          <span style={{ fontSize: 11, fontWeight: 700, color: NAVY }}>{postReactions[r.type]}</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </Card>
        )}

      </div>
    </>
  )
}

// Parent homepage
function ParentHome({ currentProfile, profiles, activeAssignments, recentFeed, rewards, reactionData, handleReaction, handleSignOut, handleViewAs, pendingClaims, dailyReport }) {
  const [showQuickMission, setShowQuickMission] = useState(false)
  const [quickMissionDone, setQuickMissionDone] = useState(false)
  const children    = profiles.filter(p => p.role === 'child').sort((a, b) => b.total_points - a.total_points)
  const childColors = [GOLD, PURPLE, GREEN]
  const getNextReward = (points) => rewards.find(r => r.points_required > points)
  const pending     = activeAssignments.filter(a => a.status === 'submitted')

  const timeAgo = (dateStr) => {
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 86400000)
    if (diff === 0) return 'היום'
    if (diff === 1) return 'אתמול'
    return `לפני ${diff} ימים`
  }

  return (
    <>
      {showQuickMission && (
        <QuickMissionModal
          profiles={profiles}
          onClose={() => setShowQuickMission(false)}
          onCreated={() => {
            setShowQuickMission(false)
            setQuickMissionDone(true)
            setTimeout(() => setQuickMissionDone(false), 2500)
          }}
        />
      )}

      {quickMissionDone && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 900, background: 'rgba(10,22,40,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, fontFamily: 'var(--font-heebo), sans-serif', direction: 'rtl' }}>
          <div style={{ fontSize: 52 }}>⚡</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: 'white' }}>המשימה נוצרה!</div>
        </div>
      )}

      {/* Header */}
      <div style={{
        background: HEADER_BG, padding: '24px 18px 28px',
        borderRadius: '0 0 32px 32px', marginBottom: 18,
        position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: -40, left: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 900, color: 'white' }}>משפחת רמז 🏡</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 3, fontWeight: 600 }}>מה עושים היום?</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => setShowQuickMission(true)} style={{
              background: 'white', color: CORAL, border: 'none',
              borderRadius: 50, padding: '8px 14px', cursor: 'pointer',
              fontWeight: 900, fontSize: 13,
              fontFamily: 'var(--font-heebo), sans-serif',
              boxShadow: '0 3px 10px rgba(255,107,107,0.35)',
              display: 'flex', alignItems: 'center', gap: 5,
              whiteSpace: 'nowrap'
            }}>⚡ משימה מהירה</button>
            <a href="/profiles" style={{ textDecoration: 'none' }}>
              <Avatar profile={currentProfile} size={40} />
            </a>
          </div>
        </div>

        {/* View-as child switcher */}
        {children.length > 0 && (
          <div style={{ marginTop: 14, position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 600, marginBottom: 8 }}>👁 הצג את האפליקציה כ:</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {children.map(child => (
                <button key={child.id} onClick={() => handleViewAs(child.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'rgba(255,255,255,0.2)', border: '1.5px solid rgba(255,255,255,0.4)',
                  borderRadius: 20, padding: '6px 12px', cursor: 'pointer',
                  color: 'white', fontSize: 13, fontWeight: 700,
                  fontFamily: 'var(--font-heebo), sans-serif',
                  transition: 'all 0.15s ease'
                }}>
                  <Avatar profile={child} size={22} />
                  {child.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="app-body">

        <EnableNotificationsButton profileId={currentProfile?.id} />
        <MondialBanner profile={currentProfile} />

        {/* Pending approvals banner */}
        {pending.length > 0 && (
          <a href="/missions?tab=active" style={{ textDecoration: 'none' }}>
            <div style={{
              background: 'linear-gradient(135deg, #FFB830, #FFD166)', borderRadius: 20, padding: '16px 18px',
              display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14,
              boxShadow: '0 4px 16px rgba(255,184,48,0.35)'
            }}>
              <div style={{ fontSize: 24 }}>⏳</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: NAVY }}>
                  {pending.length} אתגרים ממתינים לאישורך
                </div>
                <div style={{ fontSize: 12, color: 'rgba(10,22,40,0.6)', marginTop: 2 }}>לחץ לאישור מהיר</div>
              </div>
              <div style={{ color: NAVY, fontSize: 18 }}>←</div>
            </div>
          </a>
        )}

        {/* Leaderboard */}
        {children.length > 0 && (
          <Card>
            <SectionTitle title="⭐ טבלת נקודות" href="/profiles" />
            {children.map((child, i) => {
              const next  = getNextReward(child.total_points)
              const color = childColors[i] || GOLD
              return (
                <div key={child.id} onClick={() => window.location.href = `/profiles/${child.id}`}
                  style={{ marginBottom: i < children.length - 1 ? 14 : 0, cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <Avatar profile={child} size={34} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 700, fontSize: 14, color: NAVY }}>{child.name}</span>
                        <span style={{ fontWeight: 700, color, fontSize: 14 }}>{child.total_points} נק׳</span>
                      </div>
                      <div style={{ background: '#F0EBE0', borderRadius: 8, height: 8, marginTop: 5 }}>
                        <div style={{
                          width: `${next ? Math.min(Math.round((child.total_points / next.points_required) * 100), 100) : 100}%`,
                          height: '100%', background: color, borderRadius: 8,
                          boxShadow: `0 2px 6px ${color}88`
                        }} />
                      </div>
                      {next && <div style={{ color: '#a09080', fontSize: 11, marginTop: 2 }}>
                        עוד {next.points_required - child.total_points} נק׳ ל{next.title}
                      </div>}
                    </div>
                  </div>
                </div>
              )
            })}
          </Card>
        )}

        {/* Reward claims pending */}
        {pendingClaims?.length > 0 && (
          <a href="/rewards" style={{ textDecoration: 'none' }}>
            <div style={{
              background: 'linear-gradient(135deg, #9B7FD4, #C084FC)', borderRadius: 20, padding: '16px 18px',
              display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14,
              boxShadow: '0 4px 16px rgba(155,127,212,0.35)'
            }}>
              <div style={{ fontSize: 24 }}>✨</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'white' }}>
                  {pendingClaims.length} פרסים ממתינים לאישורך
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>
                  {pendingClaims.map(c => `${c.member?.name} רוצה: ${c.reward?.emoji} ${c.reward?.title}`).slice(0,2).join(' · ')}
                </div>
              </div>
              <div style={{ color: 'white', fontSize: 18 }}>←</div>
            </div>
          </a>
        )}

        {/* Daily missions report */}
        {(() => {
          const children = profiles.filter(p => p.role === 'child')
          const today = new Date().toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })
          return (
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: NAVY }}>🌅 דוח יומי — {today}</div>
                <div style={{ fontSize: 11, color: '#8a7a60' }}>מתאפס כל בוקר</div>
              </div>
              {children.map(child => {
                const childReport = dailyReport.filter(a => a.assigned_to === child.id)
                return (
                  <div key={child.id} style={{
                    background: 'white', borderRadius: 16, padding: '12px 14px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.06)', marginBottom: 8
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: childReport.length > 0 ? 10 : 0 }}>
                      <Avatar profile={child} size={30} />
                      <div style={{ flex: 1 }}>
                        <span style={{ fontWeight: 700, fontSize: 14, color: NAVY }}>{child.name}</span>
                        <span style={{ fontSize: 11, color: childReport.length > 0 ? '#4ECDC4' : '#a09080', marginRight: 8, fontWeight: 600 }}>
                          {childReport.length > 0 ? ` ✓ ${childReport.length} משימות` : ' — עדיין לא עשה היום'}
                        </span>
                      </div>
                    </div>
                    {childReport.map(a => (
                      <div key={a.id} style={{
                        display: 'flex', alignItems: 'flex-start', gap: 8,
                        padding: '8px 10px', background: '#f8fffe', borderRadius: 10, marginBottom: 6,
                        border: '1px solid #e0f8f4'
                      }}>
                        <span style={{ fontSize: 16, flexShrink: 0 }}>✅</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: NAVY }}>{a.mission?.title}</div>
                          {a.proof_text && <div style={{ fontSize: 11, color: '#6b5e4e', marginTop: 2 }}>{a.proof_text}</div>}
                          {a.proof_image_url && (
                            /\.(mp4|mov|webm|avi)(\?|$)/i.test(a.proof_image_url)
                              ? <video src={a.proof_image_url} controls style={{ width: '100%', maxHeight: 120, borderRadius: 8, marginTop: 6, display: 'block' }} />
                              : <img src={a.proof_image_url} alt="proof" style={{ width: '100%', maxHeight: 100, objectFit: 'cover', borderRadius: 8, marginTop: 6, display: 'block' }} />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          )
        })()}

        {/* 2026 Wishlist — full width swipeable gallery */}
        <WishlistGallery />

        {/* Grocery list + Calendar */}
        <div className="app-two-col">
          <GroceryList isParent={true} />
          <FamilyCalendar />
        </div>

        {/* Recent feed — consistent with moments page */}
        {recentFeed.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <SectionTitle title="🎉 רגעים שמחים" href="/feed" />
            {recentFeed.map((post, i) => {
              const coverPhoto    = post.media_urls?.[0]
              const isVid         = url => /\.(mp4|mov|webm|avi)(\?|$)/i.test(url)
              const isTazkir      = post.type === 'tahkir'
              const postReactions = reactionData[post.id] || {}
              const participants  = (post.participants || [])
                .map(name => profiles.find(p => p.name === name))
                .filter(Boolean)
              return (
                <div key={post.id} style={{
                  background: 'white', borderRadius: 20, overflow: 'hidden',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.07)',
                  marginBottom: i < recentFeed.length - 1 ? 12 : 0
                }}>
                  {/* Header row */}
                  <div style={{ padding: '12px 14px 8px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ display: 'flex' }}>
                      {participants.length > 0
                        ? participants.slice(0, 3).map((p, pi) => (
                            <div key={p.id} style={{ marginLeft: pi > 0 ? -8 : 0, zIndex: 3 - pi }}>
                              <Avatar profile={p} size={34} />
                            </div>
                          ))
                        : <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#f0ebe0', border: `2px solid ${CORAL}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                            {isTazkir ? '📝' : '⭐'}
                          </div>
                      }
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, lineHeight: 1.3 }}>{post.title}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                        <span style={{
                          fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 20,
                          background: isTazkir ? '#EDE7F6' : '#D5F5F0',
                          color: isTazkir ? '#9B7FD4' : '#4ECDC4'
                        }}>{isTazkir ? '📝 תחקיר' : '⭐ אתגר'}</span>
                        <span style={{ fontSize: 10, color: '#a09080' }}>{timeAgo(post.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  {coverPhoto && !isVid(coverPhoto) && (
                    <img src={coverPhoto} alt="cover" style={{ width: '100%', height: 130, objectFit: 'cover', display: 'block' }} />
                  )}
                  {post.content && (
                    <div style={{ padding: '6px 14px 0', fontSize: 12, color: '#6b5e4e', lineHeight: 1.5 }}>{post.content}</div>
                  )}
                  <div style={{ padding: '8px 14px 12px', display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {REACTIONS.map(r => (
                      <button key={r.type} onClick={() => handleReaction(post.id, r.type)} style={{
                        background: postReactions[r.type] ? '#FFF0D5' : '#F7F4EE',
                        border: `1.5px solid ${postReactions[r.type] ? GOLD : '#EDE8E0'}`,
                        borderRadius: 20, padding: '4px 10px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 3,
                        fontFamily: 'var(--font-heebo), sans-serif'
                      }}>
                        <span style={{ fontSize: 13 }}>{r.emoji}</span>
                        {postReactions[r.type] > 0 && (
                          <span style={{ fontSize: 11, fontWeight: 700, color: NAVY }}>{postReactions[r.type]}</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

      </div>
    </>
  )
}

export default function HomePage() {
  const [currentProfile, setCurrentProfile] = useState(null)
  const [profiles, setProfiles]             = useState([])
  const [missions, setMissions]             = useState([])
  const [dailyMissions, setDailyMissions]   = useState([])
  const [completedTodayIds, setCompletedTodayIds] = useState(new Set())
  const [allCompletedIds, setAllCompletedIds]     = useState(new Set())
  const [activeAssignments, setActiveAssignments] = useState([])
  const [recentFeed, setRecentFeed]         = useState([])
  const [rewards, setRewards]               = useState([])
  const [pendingClaims, setPendingClaims]   = useState([])
  const [dailyReport, setDailyReport]       = useState([])
  const [reactions, setReactions]           = useState({})
  const [loading, setLoading]               = useState(true)
  const [startingMission, setStartingMission] = useState(null)
  const [quickDocMission, setQuickDocMission] = useState(null)
  const [quickDocUploading, setQuickDocUploading] = useState(false)
  const [quickSuccess, setQuickSuccess]       = useState(null)
  const [myReactions, setMyReactions]       = useState(new Set())
  const [viewAsId, setViewAsId]             = useState(null)
  const router = useRouter()

  useEffect(() => {
    const saved = sessionStorage.getItem('viewAsProfileId')
    if (saved) setViewAsId(saved)
  }, [])

  const handleViewAs = (profileId) => {
    if (profileId) {
      sessionStorage.setItem('viewAsProfileId', profileId)
    } else {
      sessionStorage.removeItem('viewAsProfileId')
    }
    setViewAsId(profileId)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push('/login')
      else loadData()
    })
  }, [])

  const loadData = async () => {
    const profile = await getCurrentProfile()
    if (!profile) { router.push('/login'); return }
    setCurrentProfile(profile)

    // Use the viewed kid's ID when parent is in view-as mode
    const effectiveId = sessionStorage.getItem('viewAsProfileId') || profile.id

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const [
      { data: allProfiles },
      { data: missionData },
      { data: dailyMissionData },
      { data: assignments },
      { data: feed },
      { data: rewardList },
      { data: todayCompleted },
      { data: claimData },
      { data: dailyReportData }
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('active', true).order('created_at'),
      supabase.from('missions').select('*').eq('is_active', true).neq('category', 'Daily').neq('category', 'Special').order('points', { ascending: true }).limit(10),
      supabase.from('missions').select('*').eq('is_active', true).eq('category', 'Daily').order('points', { ascending: true }),
      supabase.from('assignments')
        .select('*, mission:missions(*), member:profiles!assignments_assigned_to_fkey(*)')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(5),
      supabase.from('feed_posts').select('*').order('created_at', { ascending: false }).limit(4),
      supabase.from('rewards').select('*').eq('is_active', true).order('points_required'),
      supabase.from('assignments').select('mission_id, completed_at')
        .eq('assigned_to', effectiveId).eq('status', 'completed'),
      supabase.from('reward_claims').select('*, reward:rewards(title,emoji,points_required), member:profiles!reward_claims_member_id_fkey(name,avatar_url)').eq('status', 'claimed'),
      supabase.from('assignments')
        .select('*, mission:missions(title,category), member:profiles!assignments_assigned_to_fkey(name,avatar_url)')
        .eq('status', 'completed')
        .eq('mission.category', 'Daily')
        .gte('completed_at', todayStart.toISOString())
        .not('mission', 'is', null)
    ])

    if (allProfiles) setProfiles(allProfiles)
    if (missionData) setMissions(missionData)
    if (dailyMissionData) setDailyMissions(dailyMissionData)
    if (assignments) setActiveAssignments(assignments)
    if (feed) setRecentFeed(feed)
    if (rewardList) setRewards(rewardList)
    if (todayCompleted) {
      setAllCompletedIds(new Set(todayCompleted.map(a => a.mission_id)))
      setCompletedTodayIds(new Set(
        todayCompleted.filter(a => a.completed_at && new Date(a.completed_at) >= todayStart).map(a => a.mission_id)
      ))
    }
    if (claimData) setPendingClaims(claimData)
    if (dailyReportData) setDailyReport(dailyReportData.filter(a => a.mission?.category === 'Daily'))

    if (feed?.length) {
      const postIds = feed.map(p => p.id)
      const { data: reactionData } = await supabase
        .from('reactions').select('*').in('feed_post_id', postIds)
      if (reactionData) {
        const grouped = {}
        reactionData.forEach(r => {
          if (!grouped[r.feed_post_id]) grouped[r.feed_post_id] = {}
          if (!grouped[r.feed_post_id][r.type]) grouped[r.feed_post_id][r.type] = 0
          grouped[r.feed_post_id][r.type]++
        })
        setReactions(grouped)
      }
    }

    // Weekly + birthday bonus
    if (profile.role === 'child') {
      const { checkAndAwardWeeklyBonus } = await import('./lib/weeklyBonus')
      await checkAndAwardWeeklyBonus(profile.id)
      const { checkAndAwardBirthdayBonus } = await import('./lib/birthdayBonus')
      await checkAndAwardBirthdayBonus(profile)
    }

    setLoading(false)
  }

  const handleReaction = async (postId, type) => {
    if (!currentProfile) return
    const key = `${postId}:${type}`
    if (myReactions.has(key)) return
    setMyReactions(prev => new Set([...prev, key]))
    await supabase.from('reactions').upsert({
      feed_post_id: postId, member_id: currentProfile.id, type
    }, { onConflict: 'feed_post_id,member_id,type' })
    setReactions(prev => ({
      ...prev,
      [postId]: { ...prev[postId], [type]: ((prev[postId]?.[type]) || 0) + 1 }
    }))
  }

  const handleStartMission = async (mission) => {
    if (!currentProfile || startingMission) return
    setStartingMission(mission.id)
    const targetId = viewAsId || currentProfile.id
    await supabase.from('assignments').insert([{
      mission_id: mission.id, assigned_to: targetId, status: 'active'
    }])
    setStartingMission(null)
    router.push('/missions/active')
  }

  const handleQuickDailySubmit = async (doc) => {
    if (!quickDocMission || !currentProfile) return
    setQuickDocUploading(true)
    const mission  = quickDocMission
    const memberId = viewAsId || currentProfile.id

    let photoUrl = null
    if (doc?.file) {
      const ext = doc.file.name.split('.').pop()
      const filename = `missions/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from('family-media').upload(filename, doc.file, { contentType: doc.file.type })
      if (!error) {
        const { data } = supabase.storage.from('family-media').getPublicUrl(filename)
        photoUrl = data.publicUrl
      }
    }

    const { data: assignment } = await supabase.from('assignments').insert({
      mission_id: mission.id, assigned_to: memberId,
      status: 'completed', completed_at: new Date().toISOString(),
      proof_text: doc?.text || null,
      proof_image_url: photoUrl
    }).select().single()

    if (assignment) {
      await supabase.from('point_events').insert({
        member_id: memberId, points: mission.points,
        reason: `צבר: ${mission.title}`, assignment_id: assignment.id
      })

      const { data: profile } = await supabase.from('profiles')
        .select('total_points, total_experience, level').eq('id', memberId).single()

      const newTotal = (profile?.total_points || 0) + mission.points
      const newXP    = (profile?.total_experience || 0) + mission.points
      const newLevel = Math.floor(newXP / 500) + 1

      await supabase.from('profiles').update({ total_points: newTotal, total_experience: newXP, level: newLevel }).eq('id', memberId)
    }

    setCompletedTodayIds(prev => new Set([...prev, mission.id]))
    setAllCompletedIds(prev => new Set([...prev, mission.id]))
    setQuickDocMission(null)
    setQuickDocUploading(false)
    setQuickSuccess(`+${mission.points} נקודות! 🎉`)
    setTimeout(() => { setQuickSuccess(null); loadData() }, 2200)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isParent = currentProfile?.role === 'parent'
  const viewAsProfile = viewAsId ? profiles.find(p => p.id === viewAsId) : null
  const isViewingAsKid = isParent && !!viewAsProfile
  const effectiveProfile = viewAsProfile || currentProfile

  const myAssignments = (isParent && !isViewingAsKid)
    ? activeAssignments
    : activeAssignments.filter(a => a.member?.id === effectiveProfile?.id)

  // Filter today's missions — exclude already active ones
  const activeMissionIds = new Set(myAssignments.map(a => a.mission_id))
  // Regular missions: hidden all day once completed (parent must re-assign)
  const todayMissions = missions.filter(m => !activeMissionIds.has(m.id) && !allCompletedIds.has(m.id)).slice(0, 3)
  // Daily missions: hidden today if completed, reset tomorrow
  const visibleDailyMissions = dailyMissions.filter(m => !activeMissionIds.has(m.id) && !completedTodayIds.has(m.id))

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #FFF9F0 0%, #FFF0F9 100%)', fontFamily: 'var(--font-heebo), sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🏡</div>
        <div style={{ color: CORAL, fontSize: 16, fontWeight: 700 }}>טוענים את הבית...</div>
      </div>
    </div>
  )

  return (
    <div className="app-page" style={{
      fontFamily: 'var(--font-heebo), sans-serif',
      direction: 'rtl', background: 'linear-gradient(135deg, #FFF9F0 0%, #FFF0F9 100%)',
      minHeight: '100vh', paddingBottom: '5.5rem',
      boxSizing: 'border-box'
    }}>
      {/* View-as banner */}
      {isViewingAsKid && (
        <div style={{
          position: 'sticky', top: 0, zIndex: 200,
          background: 'linear-gradient(90deg, #9B7FD4, #C084FC)',
          padding: '10px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          boxShadow: '0 2px 8px rgba(155,127,212,0.4)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>👁</span>
            <span style={{ color: 'white', fontWeight: 700, fontSize: 13 }}>
              מציג כ: {viewAsProfile.name}
            </span>
          </div>
          <button onClick={() => handleViewAs(null)} style={{
            background: 'rgba(255,255,255,0.25)', border: 'none',
            borderRadius: 20, color: 'white', fontSize: 12, fontWeight: 700,
            padding: '5px 14px', cursor: 'pointer',
            fontFamily: 'var(--font-heebo), sans-serif'
          }}>
            חזרה לתצוגת הורה
          </button>
        </div>
      )}

      {isParent && !isViewingAsKid ? (
        <ParentHome
          currentProfile={currentProfile}
          profiles={profiles}
          activeAssignments={activeAssignments}
          recentFeed={recentFeed}
          rewards={rewards}
          pendingClaims={pendingClaims}
          dailyReport={dailyReport}
          reactionData={reactions}
          handleReaction={handleReaction}
          handleSignOut={handleSignOut}
          handleViewAs={handleViewAs}
        />
      ) : (
        <>
        {/* Quick daily doc overlay */}
        {quickDocMission && (
          <QuickDailyDoc
            mission={quickDocMission}
            uploading={quickDocUploading}
            onSubmit={handleQuickDailySubmit}
            onSkip={() => handleQuickDailySubmit({})}
            onClose={() => setQuickDocMission(null)}
          />
        )}

        {/* Quick success flash */}
        {quickSuccess && (
          <div style={{
            position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)',
            background: '#2D2D2D', color: 'white', borderRadius: 24,
            padding: '12px 24px', fontSize: 16, fontWeight: 800, zIndex: 500,
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            fontFamily: 'var(--font-heebo), sans-serif', direction: 'rtl'
          }}>{quickSuccess}</div>
        )}

        <KidHome
          currentProfile={effectiveProfile}
          missions={todayMissions}
          dailyMissions={visibleDailyMissions}
          completedTodayIds={completedTodayIds}
          rewards={rewards}
          activeAssignments={myAssignments}
          recentFeed={recentFeed}
          reactionData={reactions}
          handleReaction={handleReaction}
          handleStartMission={handleStartMission}
          startingMission={startingMission}
          onQuickDaily={setQuickDocMission}
        />
        </>
      )}
      <BottomNav />
    </div>
  )
}