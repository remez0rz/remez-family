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
  { id: 'all', label: 'הכל', emoji: '✨', categories: null },
  { id: 'fun', label: 'כיף', emoji: '🎉', categories: ['Funny', 'Creative', 'Weekend'] },
  { id: 'learn', label: 'ללמוד', emoji: '📚', categories: ['Learning', 'Reading', 'English', 'Hebrew'] },
  { id: 'help', label: 'לעזור', emoji: '🤝', categories: ['Helping', 'Kindness', 'House'] },
  { id: 'move', label: 'לזוז', emoji: '🏃', categories: ['Outdoor', 'Health'] },
  { id: 'family', label: 'משפחה', emoji: '👨‍👩‍👧', categories: ['Family', 'Memory'] },
]

const LEARNING_CATEGORIES = ['Learning', 'Reading', 'English', 'Hebrew']

const DIFFICULTY = {
  easy: { label: 'קל', color: GREEN },
  medium: { label: 'בינוני', color: GOLD },
  hard: { label: 'קשה', color: '#c45000' },
}

function Avatar({ profile, size = 40, selected = false, onClick }) {
  const [imgError, setImgError] = useState(false)
  const initials = profile?.name?.charAt(0) || '?'
  return (
    <div onClick={onClick} style={{
      width: size, height: size, borderRadius: '50%',
      border: `2.5px solid ${selected ? GOLD : 'rgba(255,255,255,0.25)'}`,
      overflow: 'hidden', flexShrink: 0, cursor: onClick ? 'pointer' : 'default',
      background: '#e8d5a3', display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontSize: size * 0.38, fontWeight: 700,
      color: NAVY, transition: 'border-color 0.15s',
      boxShadow: selected ? `0 0 0 2px ${GOLD}` : 'none'
    }}>
      {profile?.avatar_url && !imgError
        ? <img src={profile.avatar_url} alt={profile.name}
            onError={() => setImgError(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : initials}
    </div>
  )
}

function MissionCard({ mission, isParent, currentProfile, children, onAssign, onSelfAssign }) {
  const [expanded, setExpanded] = useState(false)
  const [selectedKids, setSelectedKids] = useState([])
  const [assigning, setAssigning] = useState(false)
  const [done, setDone] = useState(false)

  const isLearning = LEARNING_CATEGORIES.includes(mission.category)
  const accentColor = isLearning ? PURPLE : GREEN
  const diff = DIFFICULTY[mission.difficulty] || { label: mission.difficulty, color: GOLD }

  const toggleKid = (id) => {
    setSelectedKids(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const handleAssign = async () => {
    if (selectedKids.length === 0) return
    setAssigning(true)
    const assignments = selectedKids.map(kid_id => ({
      mission_id: mission.id,
      assigned_to: kid_id,
      status: 'active'
    }))
    await supabase.from('assignments').insert(assignments)
    setAssigning(false)
    setDone(true)
    setExpanded(false)
    setSelectedKids([])
    setTimeout(() => setDone(false), 2500)
  }

  const handleSelfAssign = async () => {
    setAssigning(true)
    await supabase.from('assignments').insert([{
      mission_id: mission.id,
      assigned_to: currentProfile.id,
      status: 'active'
    }])
    setAssigning(false)
    setDone(true)
    setTimeout(() => setDone(false), 2500)
  }

  return (
    <div style={{
      background: 'white', borderRadius: 18, overflow: 'hidden',
      border: '1px solid #e8e0d0', marginBottom: 10,
      borderTop: `3px solid ${isLearning ? PURPLE : accentColor}`
    }}>
      <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
          <div style={{ flex: 1, paddingLeft: 10 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: NAVY, lineHeight: 1.3 }}>{mission.title}</div>
            {mission.description && (
              <div style={{ fontSize: 12, color: '#6b5e4e', marginTop: 4, lineHeight: 1.5 }}>{mission.description}</div>
            )}
          </div>
          <div style={{
            fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap',
            color: isLearning ? PURPLE : GREEN,
            background: isLearning ? '#f0ebf8' : '#edf7f1',
            padding: '4px 12px', borderRadius: 20
          }}>+{mission.points} נק׳</div>
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: '#f7f4ee', color: '#6b5e4e', fontWeight: 600 }}>
            {mission.category}
          </span>
          <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: '#f7f4ee', color: diff.color, fontWeight: 600 }}>
            {diff.label}
          </span>
          <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: '#f7f4ee', color: '#6b5e4e' }}>
            ⏱ {mission.estimated_minutes} דקות
          </span>
          {mission.repeatable && (
            <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: '#edf7f1', color: GREEN, fontWeight: 600 }}>
              🔁 חוזרת
            </span>
          )}
        </div>

        {done ? (
          <div style={{
            textAlign: 'center', padding: '10px', background: '#edf7f1',
            borderRadius: 12, color: GREEN, fontWeight: 700, fontSize: 14
          }}>
            ✅ המשימה הוקצתה!
          </div>
        ) : isParent ? (
          <>
            <button onClick={() => setExpanded(!expanded)} style={{
              width: '100%', padding: '10px', background: expanded ? NAVY : '#f7f4ee',
              color: expanded ? 'white' : NAVY, border: 'none', borderRadius: 12,
              cursor: 'pointer', fontWeight: 700, fontSize: 14,
              fontFamily: 'var(--font-heebo), sans-serif', transition: 'all 0.15s'
            }}>
              {expanded ? 'סגור' : 'שלח משימה ←'}
            </button>

            {expanded && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 12, color: '#8a7a60', marginBottom: 8, fontWeight: 600 }}>מי מקבל את המשימה?</div>
                <div style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'center' }}>
                  {children.map(child => (
                    <div key={child.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <Avatar
                        profile={child}
                        size={44}
                        selected={selectedKids.includes(child.id)}
                        onClick={() => toggleKid(child.id)}
                      />
                      <span style={{ fontSize: 11, fontWeight: 600, color: selectedKids.includes(child.id) ? NAVY : '#a09080' }}>
                        {child.name}
                      </span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleAssign}
                  disabled={selectedKids.length === 0 || assigning}
                  style={{
                    width: '100%', padding: '10px',
                    background: selectedKids.length > 0 ? NAVY : '#e8e0d0',
                    color: selectedKids.length > 0 ? 'white' : '#a09080',
                    border: 'none', borderRadius: 12, cursor: selectedKids.length > 0 ? 'pointer' : 'default',
                    fontWeight: 700, fontSize: 14, fontFamily: 'var(--font-heebo), sans-serif'
                  }}>
                  {assigning ? 'שולח...' : `שלח ל-${selectedKids.length > 0 ? selectedKids.length : '?'} ילדים`}
                </button>
              </div>
            )}
          </>
        ) : (
          <button onClick={handleSelfAssign} disabled={assigning} style={{
            width: '100%', padding: '11px',
            background: isLearning ? PURPLE : NAVY,
            color: 'white', border: 'none', borderRadius: 12,
            cursor: 'pointer', fontWeight: 700, fontSize: 14,
            fontFamily: 'var(--font-heebo), sans-serif'
          }}>
            {assigning ? 'שולח...' : 'אני עושה את זה! 🙌'}
          </button>
        )}
      </div>
    </div>
  )
}

export default function MissionsPage() {
  const [missions, setMissions] = useState([])
  const [profiles, setProfiles] = useState([])
  const [currentProfile, setCurrentProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeMode, setActiveMode] = useState('all')
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
  const children = profiles.filter(p => p.role === 'child')

  const currentMode = MODES.find(m => m.id === activeMode)
  const filtered = currentMode?.categories
    ? missions.filter(m => currentMode.categories.includes(m.category))
    : missions

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: CREAM, fontFamily: 'var(--font-heebo), sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🎯</div>
        <div style={{ color: '#8a7a60', fontSize: 14 }}>טוענים משימות...</div>
      </div>
    </div>
  )

  return (
    <div style={{
      maxWidth: 480, margin: '0 auto', fontFamily: 'var(--font-heebo), sans-serif',
      direction: 'rtl', background: CREAM, minHeight: '100vh', paddingBottom: '5.5rem'
    }}>

      {/* Header */}
      <div style={{ background: NAVY, padding: '20px 18px 28px', borderRadius: '0 0 28px 28px', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, color: 'white' }}>🎯 משימות</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
              {isParent ? 'שלח משימות לילדים' : 'איזו משימה בא לך?'}
            </div>
          </div>
          <a href="/" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontSize: 13 }}>← בית</a>
        </div>

        {/* Mode selector */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {MODES.map(mode => (
            <button key={mode.id} onClick={() => setActiveMode(mode.id)} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '7px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
              background: activeMode === mode.id ? GOLD : 'rgba(255,255,255,0.1)',
              color: activeMode === mode.id ? NAVY : 'rgba(255,255,255,0.8)',
              fontWeight: activeMode === mode.id ? 700 : 400,
              fontSize: 13, whiteSpace: 'nowrap',
              fontFamily: 'var(--font-heebo), sans-serif',
              transition: 'all 0.15s'
            }}>
              <span>{mode.emoji}</span>
              <span>{mode.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 14px' }}>

        {/* Mode description */}
        <div style={{ marginBottom: 14, fontSize: 13, color: '#8a7a60', fontWeight: 600 }}>
          {filtered.length} משימות {currentMode?.id !== 'all' ? `ב${currentMode?.label}` : ''}
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#a09080' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🤔</div>
            <div style={{ fontSize: 14 }}>אין משימות בקטגוריה הזו עדיין</div>
          </div>
        ) : (
          filtered.map(mission => (
            <MissionCard
              key={mission.id}
              mission={mission}
              isParent={isParent}
              currentProfile={currentProfile}
              children={children}
              onAssign={() => {}}
              onSelfAssign={() => {}}
            />
          ))
        )}
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
          { href: '/', label: 'בית', emoji: '🏠' },
          { href: '/missions', label: 'משימות', emoji: '🎯', active: true },
          { href: '/tazkir/new', label: 'תחקיר', emoji: '📝', center: true },
          { href: '/rewards', label: 'פרסים', emoji: '🏆' },
          { href: '/feed', label: 'פיד', emoji: '📖' },
        ].map(item => (
          <a key={item.href} href={item.href} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            textDecoration: 'none', gap: 2,
            color: item.active ? GOLD : item.center ? GOLD : 'rgba(255,255,255,0.45)',
            fontSize: 10, fontFamily: 'var(--font-heebo), sans-serif'
          }}>
            <span style={{
              fontSize: item.center ? 20 : 20,
              ...(item.center ? {
                background: GOLD, borderRadius: '50%', width: 44, height: 44,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginTop: -18
              } : {})
            }}>{item.emoji}</span>
            {item.label}
          </a>
        ))}
      </div>

    </div>
  )
}