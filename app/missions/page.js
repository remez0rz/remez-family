'use client'
import { useEffect, useState } from 'react'
import { supabase, getCurrentProfile } from '../lib/supabase'
import { useRouter } from 'next/navigation'

const NAVY = '#0a1628'
const GOLD = '#c9a84c'
const CREAM = '#f7f4ee'
const GREEN = '#1a6b3c'
const PURPLE = '#5c3d8f'

const MODES = [
  { id: 'all',    label: 'הכל',     emoji: '✨', categories: null },
  { id: 'fun',    label: 'כיף',     emoji: '🎉', categories: ['Funny', 'Creative', 'Weekend'] },
  { id: 'learn',  label: 'ללמוד',   emoji: '📚', categories: ['Learning', 'Reading', 'English', 'Hebrew'] },
  { id: 'help',   label: 'לעזור',   emoji: '🤝', categories: ['Helping', 'Kindness', 'House'] },
  { id: 'move',   label: 'לזוז',    emoji: '🏃', categories: ['Outdoor', 'Health'] },
  { id: 'family', label: 'משפחה',   emoji: '👨‍👩‍👧', categories: ['Family', 'Memory'] },
]

const CATEGORY_VISUAL = {
  Funny:    { emoji: '😂', bg: '#fff3e0', accent: '#e07000' },
  Creative: { emoji: '🎨', bg: '#fce4ec', accent: '#c2185b' },
  Weekend:  { emoji: '🌅', bg: '#e8f5e9', accent: '#2e7d32' },
  Learning: { emoji: '🧠', bg: '#ede7f6', accent: PURPLE },
  Reading:  { emoji: '📖', bg: '#e8eaf6', accent: '#303f9f' },
  English:  { emoji: '🌍', bg: '#e3f2fd', accent: '#1565c0' },
  Hebrew:   { emoji: '✡️', bg: '#e8eaf6', accent: '#283593' },
  Helping:  { emoji: '🤝', bg: '#e8f5e9', accent: GREEN },
  Kindness: { emoji: '❤️', bg: '#fce4ec', accent: '#ad1457' },
  House:    { emoji: '🏠', bg: '#efebe9', accent: '#4e342e' },
  Outdoor:  { emoji: '🌿', bg: '#e0f2f1', accent: '#00695c' },
  Health:   { emoji: '💪', bg: '#e0f7fa', accent: '#00838f' },
  Family:   { emoji: '👨‍👩‍👧', bg: '#fff8e1', accent: '#f57f17' },
  Memory:   { emoji: '📸', bg: '#f3e5f5', accent: '#6a1b9a' },
}

const DIFFICULTY = {
  easy:   { label: 'קל',     color: GREEN },
  medium: { label: 'בינוני', color: '#9a6500' },
  hard:   { label: 'קשה',   color: '#c45000' },
}

function Avatar({ profile, size = 44, selected = false, onClick }) {
  const [imgError, setImgError] = useState(false)
  if (!profile) return null
  return (
    <div onClick={onClick} style={{
      width: size, height: size, borderRadius: '50%',
      border: `2.5px solid ${selected ? GOLD : '#e0d8c8'}`,
      overflow: 'hidden', flexShrink: 0,
      cursor: onClick ? 'pointer' : 'default',
      background: selected ? '#e8d5a3' : '#f0ebe0',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 700, color: NAVY,
      boxShadow: selected ? `0 0 0 3px ${GOLD}55` : 'none',
      transition: 'all 0.15s', position: 'relative'
    }}>
      {profile.avatar_url && !imgError
        ? <img src={profile.avatar_url} alt={profile.name}
            onError={() => setImgError(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : profile.name?.charAt(0)}
      {selected && (
        <div style={{
          position: 'absolute', bottom: -1, right: -1,
          background: GOLD, borderRadius: '50%',
          width: 16, height: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 9, color: NAVY, fontWeight: 900,
          border: '1.5px solid white'
        }}>✓</div>
      )}
    </div>
  )
}

function MissionCard({ mission, isParent, currentProfile, assignableProfiles }) {
  const [assignedTo, setAssignedTo] = useState([])
  const [dueDate, setDueDate]       = useState('')
  const [assigning, setAssigning]   = useState(false)
  const [done, setDone]             = useState(false)

  const isLearning = ['Learning','Reading','English','Hebrew'].includes(mission.category)
  const visual  = CATEGORY_VISUAL[mission.category] || { emoji: '⭐', bg: '#f7f4ee', accent: GOLD }
  const diff    = DIFFICULTY[mission.difficulty]     || { label: mission.difficulty, color: GOLD }
  const ptColor = isLearning ? PURPLE : GREEN

  const handleTapAvatar = async (profileId) => {
    if (!isParent) {
      setAssigning(true)
      await supabase.from('assignments').insert([{
        mission_id: mission.id, assigned_to: profileId, status: 'active'
      }])
      setAssigning(false)
      setDone(true)
      setTimeout(() => setDone(false), 3000)
      return
    }
    setAssignedTo(prev =>
      prev.includes(profileId) ? prev.filter(x => x !== profileId) : [...prev, profileId]
    )
  }

  const handleParentAssign = async () => {
    if (!assignedTo.length) return
    setAssigning(true)
    await supabase.from('assignments').insert(
      assignedTo.map(id => ({
        mission_id: mission.id, assigned_to: id, status: 'active',
        ...(dueDate ? { due_date: dueDate } : {})
      }))
    )
    setAssigning(false)
    setDone(true)
    setAssignedTo([])
    setDueDate('')
    setTimeout(() => setDone(false), 3000)
  }

  return (
    <div style={{
      background: 'white', borderRadius: 16,
      border: `1px solid ${visual.accent}30`,
      marginBottom: 12, overflow: 'hidden'
    }}>

      {/* Visual header */}
      <div style={{
        background: visual.bg, padding: '12px 14px',
        display: 'flex', alignItems: 'center', gap: 12,
        borderBottom: `1px solid ${visual.accent}20`
      }}>
        <div style={{
          width: 46, height: 46, borderRadius: 12, flexShrink: 0,
          background: 'white', border: `1.5px solid ${visual.accent}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24
        }}>{visual.emoji}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: visual.accent, letterSpacing: '0.06em' }}>
            {mission.category}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 3, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: '#8a7a60' }}>⏱ {mission.estimated_minutes} דק׳</span>
            <span style={{ fontSize: 11, color: diff.color, fontWeight: 600 }}>{diff.label}</span>
            {mission.repeatable && <span style={{ fontSize: 11, color: GREEN }}>🔁 חוזרת</span>}
          </div>
        </div>
        <div style={{ textAlign: 'center', flexShrink: 0 }}>
          <div style={{ fontSize: 30, fontWeight: 900, color: ptColor, lineHeight: 1 }}>
            {mission.points}
          </div>
          <div style={{ fontSize: 10, fontWeight: 700, color: ptColor, opacity: 0.7 }}>נקודות</div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '12px 14px' }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: NAVY, marginBottom: 4, lineHeight: 1.3 }}>
          {mission.title}
        </div>
        {mission.description && (
          <div style={{ fontSize: 12, color: '#6b5e4e', lineHeight: 1.6, marginBottom: 12 }}>
            {mission.description}
          </div>
        )}

        {done ? (
          <div style={{
            textAlign: 'center', padding: 12,
            background: '#edf7f1', borderRadius: 12,
            color: GREEN, fontWeight: 700, fontSize: 15
          }}>🎉 המשימה נשלחה!</div>
        ) : (
          <>
            {/* Avatar row */}
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: isParent ? 10 : 0 }}>
              {assignableProfiles.map(p => (
                <div key={p.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <Avatar
                    profile={p} size={46}
                    selected={assignedTo.includes(p.id)}
                    onClick={() => handleTapAvatar(p.id)}
                  />
                  <span style={{ fontSize: 11, fontWeight: 600, color: assignedTo.includes(p.id) ? NAVY : '#a09080' }}>
                    {p.name}
                  </span>
                </div>
              ))}
            </div>

            {/* Parent: due date + confirm */}
            {isParent && (
              <>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 12, color: '#8a7a60', fontWeight: 600, marginBottom: 6 }}>
                    עד תאריך (לא חובה)
                  </div>
                  <input type="date" value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    style={{
                      width: '100%', padding: '8px 12px', borderRadius: 10,
                      border: '1px solid #e0d8c8', fontSize: 14, color: NAVY,
                      fontFamily: 'var(--font-heebo), sans-serif',
                      background: '#faf8f4', boxSizing: 'border-box'
                    }} />
                </div>
                <button onClick={handleParentAssign}
                  disabled={!assignedTo.length || assigning}
                  style={{
                    width: '100%', padding: 12,
                    background: assignedTo.length ? NAVY : '#e8e0d0',
                    color: assignedTo.length ? 'white' : '#a09080',
                    border: 'none', borderRadius: 12,
                    cursor: assignedTo.length ? 'pointer' : 'default',
                    fontWeight: 700, fontSize: 15,
                    fontFamily: 'var(--font-heebo), sans-serif',
                    boxSizing: 'border-box'
                  }}>
                  {assigning ? 'שולח...' : assignedTo.length ? `📤 שלח משימה` : 'בחר מישהו'}
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function MissionsPage() {
  const [missions, setMissions]           = useState([])
  const [profiles, setProfiles]           = useState([])
  const [currentProfile, setCurrentProfile] = useState(null)
  const [loading, setLoading]             = useState(true)
  const [activeMode, setActiveMode]       = useState('all')
  const router = useRouter()

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
    const [{ data: missionData }, { data: profileData }] = await Promise.all([
      supabase.from('missions').select('*').eq('is_active', true).order('points', { ascending: false }),
      supabase.from('profiles').select('*').eq('active', true)
    ])
    if (missionData) setMissions(missionData)
    if (profileData) setProfiles(profileData)
    setLoading(false)
  }

  const isParent = currentProfile?.role === 'parent'
  const currentMode = MODES.find(m => m.id === activeMode)
  const assignableProfiles = isParent
    ? profiles
    : profiles.filter(p => p.id === currentProfile?.id)

  const filtered = currentMode?.categories
    ? missions.filter(m => currentMode.categories.includes(m.category))
    : missions

  if (loading) return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: CREAM,
      fontFamily: 'var(--font-heebo), sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🎯</div>
        <div style={{ color: '#8a7a60', fontSize: 14 }}>טוענים משימות...</div>
      </div>
    </div>
  )

  return (
    <div style={{
      width: '100%', maxWidth: 480, margin: '0 auto',
      fontFamily: 'var(--font-heebo), sans-serif',
      direction: 'rtl', background: CREAM,
      minHeight: '100vh', paddingBottom: '5.5rem',
      boxSizing: 'border-box', overflowX: 'hidden'
    }}>

      {/* Header */}
      <div style={{
        background: NAVY,
        padding: '20px 16px 0',
        borderRadius: '0 0 24px 24px',
        marginBottom: 16
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, color: 'white' }}>🎯 משימות</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
              {isParent ? 'שלח משימות לבני המשפחה' : 'איזו משימה בא לך?'}
            </div>
          </div>
          <a href="/" style={{ color: 'rgba(255,255,255,0.45)', textDecoration: 'none', fontSize: 13 }}>← בית</a>
        </div>

        {/* Mode pills */}
        <div style={{
          display: 'flex', gap: 8, overflowX: 'auto',
          paddingBottom: 16, paddingRight: 2,
          scrollbarWidth: 'none'
        }}>
          {MODES.map(mode => (
            <button key={mode.id} onClick={() => setActiveMode(mode.id)} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '8px 14px', borderRadius: 20, border: 'none',
              cursor: 'pointer', flexShrink: 0,
              background: activeMode === mode.id ? GOLD : 'rgba(255,255,255,0.1)',
              color: activeMode === mode.id ? NAVY : 'rgba(255,255,255,0.8)',
              fontWeight: activeMode === mode.id ? 700 : 500,
              fontSize: 14, fontFamily: 'var(--font-heebo), sans-serif',
            }}>
              {mode.emoji} {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div style={{ padding: '0 12px', boxSizing: 'border-box' }}>
        <div style={{ fontSize: 12, color: '#8a7a60', fontWeight: 600, marginBottom: 10 }}>
          {filtered.length} משימות{currentMode?.id !== 'all' ? ` · ${currentMode.label}` : ''}
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#a09080' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🤔</div>
            <div style={{ fontSize: 14 }}>אין משימות בקטגוריה הזו</div>
          </div>
        ) : filtered.map(mission => (
          <MissionCard
            key={mission.id}
            mission={mission}
            isParent={isParent}
            currentProfile={currentProfile}
            assignableProfiles={assignableProfiles}
          />
        ))}
      </div>

      {/* Bottom nav */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: NAVY, borderTop: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', justifyContent: 'space-around',
        padding: '10px 0 16px', zIndex: 100,
        fontFamily: 'var(--font-heebo), sans-serif'
      }}>
        {[
          { href: '/',           label: 'בית',     emoji: '🏠' },
          { href: '/missions',   label: 'משימות',  emoji: '🎯', active: true },
          { href: '/tazkir/new', label: 'תחקיר',   emoji: '📝', center: true },
          { href: '/rewards',    label: 'פרסים',   emoji: '🏆' },
          { href: '/feed',       label: 'פיד',     emoji: '📖' },
        ].map(item => (
          <a key={item.href} href={item.href} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            textDecoration: 'none', gap: 2,
            color: item.active ? GOLD : 'rgba(255,255,255,0.45)',
            fontSize: 10, fontFamily: 'var(--font-heebo), sans-serif'
          }}>
            <span style={{
              ...(item.center ? {
                background: GOLD, borderRadius: '50%',
                width: 44, height: 44, fontSize: 20,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginTop: -18
              } : { fontSize: 20 })
            }}>{item.emoji}</span>
            {item.label}
          </a>
        ))}
      </div>
    </div>
  )
}