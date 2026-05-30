'use client'
import { useEffect, useState } from 'react'
import { supabase, getCurrentProfile } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import BottomNav from '../components/BottomNav'

const NAVY = '#0a1628'
const GOLD = '#c9a84c'
const CREAM = '#f7f4ee'
const GREEN = '#1a6b3c'
const PURPLE = '#5c3d8f'

const MODES = [
  { id: 'all',    label: 'הכל',   emoji: '✨', categories: null },
  { id: 'fun',    label: 'כיף',   emoji: '🎉', categories: ['Funny', 'Creative', 'Weekend'] },
  { id: 'learn',  label: 'ללמוד', emoji: '📚', categories: ['Learning', 'Reading', 'English', 'Hebrew'] },
  { id: 'help',   label: 'לעזור', emoji: '🤝', categories: ['Helping', 'Kindness', 'House'] },
  { id: 'move',   label: 'לזוז',  emoji: '🏃', categories: ['Outdoor', 'Health'] },
  { id: 'family', label: 'משפחה', emoji: '👨‍👩‍👧', categories: ['Family', 'Memory'] },
]

const CATEGORY_LABELS = {
  Family: 'משפחה', Learning: 'לומדים בכיף', Helping: 'עוזרים בבית',
  Creative: 'יצירה', Funny: 'מצחיקים', Outdoor: 'בחוץ',
  Reading: 'קריאה', English: 'אנגלית', Hebrew: 'עברית',
  Kindness: 'מעשים טובים', House: 'הבית שלנו', Memory: 'זיכרונות',
  Health: 'בריאות', Weekend: 'סופ״ש',
}

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

const MISSION_GRADIENTS = [
  ['#1a6b3c', '#2d9e5f'], ['#0a1628', '#1e3a5f'],
  ['#7b2d8b', '#a855c8'], ['#c45000', '#e07030'],
  ['#1a6b8a', '#2892b8'], ['#9a6500', '#c9a84c'],
  ['#ad1457', '#d81b60'], ['#0a1628', '#2d4a9e'],
  ['#1a6b3c', '#43a870'], ['#5c3d8f', '#8b5cf6'],
]

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
          background: GOLD, borderRadius: '50%', width: 16, height: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 9, color: NAVY, fontWeight: 900, border: '1.5px solid white'
        }}>✓</div>
      )}
    </div>
  )
}

function MissionFormModal({ mission, onClose, onSaved }) {
  const isNew = !mission?.id
  const CATEGORIES = ['Family','Learning','Helping','Creative','Funny','Outdoor','Reading','English','Hebrew','Kindness','House','Memory','Health','Weekend']
  const [form, setForm] = useState({
    title:             mission?.title             || '',
    description:       mission?.description       || '',
    category:          mission?.category          || 'Family',
    type:              mission?.type              || 'fun',
    points:            mission?.points            || 30,
    difficulty:        mission?.difficulty        || 'easy',
    estimated_minutes: mission?.estimated_minutes || 20,
    repeatable:        mission?.repeatable        ?? true,
    is_active:         mission?.is_active         ?? true,
    proof_type:        'none',
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!form.title.trim()) return
    setSaving(true)
    if (isNew) {
      await supabase.from('missions').insert(form)
    } else {
      await supabase.from('missions').update(form).eq('id', mission.id)
    }
    setSaving(false)
    onSaved()
  }

  const inputStyle = {
    width: '100%', padding: '10px 12px', border: '1px solid #e0d8c8', borderRadius: 10,
    fontSize: 14, color: NAVY, background: '#faf8f4',
    fontFamily: 'var(--font-heebo), sans-serif', boxSizing: 'border-box', marginBottom: 10, outline: 'none'
  }
  const labelStyle = { fontSize: 12, fontWeight: 700, color: '#6b5e4e', display: 'block', marginBottom: 4 }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(10,22,40,0.88)',
      zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      fontFamily: 'var(--font-heebo), sans-serif', direction: 'rtl'
    }}>
      <div style={{
        background: CREAM, borderRadius: '24px 24px 0 0',
        padding: '24px 20px 40px', width: '100%', maxWidth: 480,
        maxHeight: '92vh', overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: NAVY }}>
            {isNew ? '+ אתגר חדש' : '✏️ עריכת אתגר'}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#a09080' }}>✕</button>
        </div>

        <label style={labelStyle}>שם האתגר *</label>
        <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          placeholder="למשל: קראו ספר 20 דקות" style={inputStyle} />

        <label style={labelStyle}>תיאור</label>
        <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          placeholder="פרטים נוספים..." style={inputStyle} />

        <label style={labelStyle}>קטגוריה</label>
        <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={inputStyle}>
          {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_VISUAL[c]?.emoji} {CATEGORY_LABELS[c] || c}</option>)}
        </select>

        <label style={labelStyle}>סוג</label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          {[{ id: 'fun', label: '🎉 כיף' }, { id: 'learning', label: '📚 לימוד' }, { id: 'responsibility', label: '🤝 עזרה' }].map(t => (
            <button key={t.id} onClick={() => setForm(f => ({ ...f, type: t.id }))} style={{
              flex: 1, padding: '8px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: form.type === t.id ? NAVY : '#f0ebe0',
              color: form.type === t.id ? 'white' : '#6b5e4e',
              fontWeight: 700, fontSize: 12, fontFamily: 'var(--font-heebo), sans-serif'
            }}>{t.label}</button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>נקודות</label>
            <input type="number" value={form.points}
              onChange={e => setForm(f => ({ ...f, points: parseInt(e.target.value) || 0 }))} style={inputStyle} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>דקות</label>
            <input type="number" value={form.estimated_minutes}
              onChange={e => setForm(f => ({ ...f, estimated_minutes: parseInt(e.target.value) || 0 }))} style={inputStyle} />
          </div>
        </div>

        <label style={labelStyle}>רמת קושי</label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {[{ id: 'easy', label: 'קל' }, { id: 'medium', label: 'בינוני' }, { id: 'hard', label: 'קשה' }].map(d => (
            <button key={d.id} onClick={() => setForm(f => ({ ...f, difficulty: d.id }))} style={{
              flex: 1, padding: '8px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: form.difficulty === d.id ? NAVY : '#f0ebe0',
              color: form.difficulty === d.id ? 'white' : '#6b5e4e',
              fontWeight: 700, fontSize: 13, fontFamily: 'var(--font-heebo), sans-serif'
            }}>{d.label}</button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: NAVY, fontWeight: 600, cursor: 'pointer' }}>
            <input type="checkbox" checked={form.repeatable} onChange={e => setForm(f => ({ ...f, repeatable: e.target.checked }))} />
            אתגר חוזר
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: NAVY, fontWeight: 600, cursor: 'pointer' }}>
            <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
            אתגר פעיל
          </label>
        </div>

        <button onClick={handleSave} disabled={saving || !form.title.trim()} style={{
          width: '100%', padding: '14px',
          background: form.title.trim() ? GOLD : '#e0d8c8',
          color: form.title.trim() ? NAVY : '#a09080',
          border: 'none', borderRadius: 14,
          cursor: form.title.trim() ? 'pointer' : 'default',
          fontWeight: 700, fontSize: 16, fontFamily: 'var(--font-heebo), sans-serif'
        }}>
          {saving ? 'שומר...' : isNew ? '+ הוסף אתגר' : 'שמור אתגר'}
        </button>
      </div>
    </div>
  )
}

function EarnCard({ mission, index, isParent, currentProfile, assignableProfiles, onEdit }) {
  const [expanded, setExpanded]     = useState(false)
  const [assignedTo, setAssignedTo] = useState([])
  const [dueDate, setDueDate]       = useState('')
  const [assigning, setAssigning]   = useState(false)
  const [done, setDone]             = useState(false)

  const isLearning = ['Learning','Reading','English','Hebrew'].includes(mission.category)
  const visual     = CATEGORY_VISUAL[mission.category] || { emoji: '⭐', bg: '#f7f4ee', accent: GOLD }
  const diff       = DIFFICULTY[mission.difficulty]    || { label: mission.difficulty, color: GOLD }
  const ptColor    = isLearning ? PURPLE : GREEN
  const gradient   = MISSION_GRADIENTS[index % MISSION_GRADIENTS.length]

  const handleSelfStart = async () => {
    if (!currentProfile) return
    setAssigning(true)
    await supabase.from('assignments').insert([{
      mission_id: mission.id, assigned_to: currentProfile.id, status: 'active'
    }])
    setAssigning(false)
    setDone(true)
    setTimeout(() => setDone(false), 3000)
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
    setExpanded(false)
    setTimeout(() => setDone(false), 3000)
  }

  return (
    <div style={{
      borderRadius: 20, marginBottom: 14, overflow: 'hidden',
      border: `1px solid ${visual.accent}30`
    }}>
      {/* Visual header — חוויות style */}
      <div style={{
        background: mission.image_url
          ? `url(${mission.image_url}) center/cover`
          : `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
        padding: '20px 18px 18px',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
        minHeight: 100, position: 'relative'
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.2)' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 32, marginBottom: 4, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>
            {visual.emoji}
          </div>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.06em' }}>
            {CATEGORY_LABELS[mission.category] || mission.category}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 3 }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>⏱ {mission.estimated_minutes} דק׳</span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{diff.label}</span>
            {mission.repeatable && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>🔁</span>}
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div style={{
            background: 'rgba(255,255,255,0.15)', borderRadius: 14,
            padding: '8px 14px', backdropFilter: 'blur(4px)'
          }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: 'white', lineHeight: 1 }}>{mission.points}</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>נק׳</div>
          </div>
        </div>
      </div>

      {/* Card body */}
      <div style={{ background: 'white', padding: '14px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <div style={{ flex: 1, paddingLeft: 10 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: NAVY, lineHeight: 1.2 }}>{mission.title}</div>
            {mission.description && (
              <div style={{ fontSize: 12, color: '#6b5e4e', marginTop: 4, lineHeight: 1.5 }}>{mission.description}</div>
            )}
          </div>
          {isParent && (
            <button onClick={() => onEdit(mission)} style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              fontSize: 11, color: '#a09080', padding: '2px 6px',
              fontFamily: 'var(--font-heebo), sans-serif', flexShrink: 0
            }}>✏️</button>
          )}
        </div>

        {done ? (
          <div style={{
            textAlign: 'center', padding: 12, background: '#edf7f1',
            borderRadius: 12, color: GREEN, fontWeight: 700, fontSize: 15
          }}>🎉 יאללה! מתחילים!</div>
        ) : isParent ? (
          <>
            <button onClick={() => setExpanded(!expanded)} style={{
              width: '100%', padding: '11px',
              background: expanded ? '#f0ebe0' : NAVY,
              color: expanded ? NAVY : 'white',
              border: 'none', borderRadius: 12, cursor: 'pointer',
              fontWeight: 700, fontSize: 14, marginBottom: expanded ? 10 : 0,
              fontFamily: 'var(--font-heebo), sans-serif', transition: 'all 0.15s'
            }}>
              {expanded ? '✕ סגור' : '⭐ שלח אתגר'}
            </button>

            {expanded && (
              <>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
                  {assignableProfiles.map(p => (
                    <div key={p.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <Avatar profile={p} size={46} selected={assignedTo.includes(p.id)}
                        onClick={() => setAssignedTo(prev => prev.includes(p.id) ? prev.filter(x => x !== p.id) : [...prev, p.id])} />
                      <span style={{ fontSize: 11, fontWeight: 600, color: assignedTo.includes(p.id) ? NAVY : '#a09080' }}>{p.name}</span>
                    </div>
                  ))}
                </div>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 12, color: '#8a7a60', fontWeight: 600, marginBottom: 6 }}>עד תאריך (לא חובה)</div>
                  <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={{
                    width: '100%', padding: '8px 12px', borderRadius: 10,
                    border: '1px solid #e0d8c8', fontSize: 14, color: NAVY,
                    fontFamily: 'var(--font-heebo), sans-serif', background: '#faf8f4', boxSizing: 'border-box'
                  }} />
                </div>
                <button onClick={handleParentAssign} disabled={!assignedTo.length || assigning} style={{
                  width: '100%', padding: 12,
                  background: assignedTo.length ? GOLD : '#e8e0d0',
                  color: assignedTo.length ? NAVY : '#a09080',
                  border: 'none', borderRadius: 12,
                  cursor: assignedTo.length ? 'pointer' : 'default',
                  fontWeight: 700, fontSize: 15, fontFamily: 'var(--font-heebo), sans-serif', boxSizing: 'border-box'
                }}>
                  {assigning ? 'שולח...' : assignedTo.length ? '📤 שלח אתגר' : 'בחר מישהו'}
                </button>
              </>
            )}
          </>
        ) : (
          <button onClick={handleSelfStart} disabled={assigning} style={{
            width: '100%', padding: '12px',
            background: NAVY, color: 'white',
            border: 'none', borderRadius: 12, cursor: 'pointer',
            fontWeight: 700, fontSize: 15, fontFamily: 'var(--font-heebo), sans-serif'
          }}>
            {assigning ? 'שולח...' : 'התחל ⭐'}
          </button>
        )}
      </div>
    </div>
  )
}

function ActiveEarningTab({ profiles, currentProfile, isParent }) {
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading]         = useState(true)
  const router = useRouter()

  useEffect(() => { loadAssignments() }, [])

  const loadAssignments = async () => {
    let query = supabase
      .from('assignments')
      .select('*, mission:missions(*), member:profiles!assignments_assigned_to_fkey(*)')
      .in('status', ['active', 'submitted'])
      .order('created_at', { ascending: false })
    if (!isParent) query = query.eq('assigned_to', currentProfile.id)
    const { data } = await query
    if (data) setAssignments(data)
    setLoading(false)
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 40, color: '#8a7a60', fontSize: 14 }}>טוען...</div>

  if (assignments.length === 0) return (
    <div style={{ textAlign: 'center', padding: '48px 20px' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>⭐</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: NAVY, marginBottom: 8 }}>אין אתגרים בתהליך</div>
      <div style={{ fontSize: 13, color: '#8a7a60' }}>בחרו אתגר ותתחילו לצבור נקודות</div>
    </div>
  )

  return (
    <div>
      {assignments.map(a => {
        const isLearning  = ['Learning','Reading','English','Hebrew'].includes(a.mission?.category)
        const ptColor     = isLearning ? PURPLE : GREEN
        const isSubmitted = a.status === 'submitted'
        const memberProfile = profiles.find(p => p.id === a.assigned_to)

        return (
          <div key={a.id} style={{
            background: 'white', borderRadius: 16, marginBottom: 12,
            border: `1px solid ${isSubmitted ? GOLD + '60' : '#e8e0d0'}`, overflow: 'hidden'
          }}>
            <div style={{
              background: isSubmitted ? '#fff8e8' : '#f7f4ee', padding: '8px 14px',
              borderBottom: `1px solid ${isSubmitted ? GOLD + '30' : '#f0ebe0'}`,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {memberProfile && (
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    border: `2px solid ${GOLD}`, overflow: 'hidden',
                    background: '#e8d5a3', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 11, fontWeight: 700, color: NAVY, flexShrink: 0
                  }}>
                    {memberProfile.avatar_url
                      ? <img src={memberProfile.avatar_url} alt={memberProfile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : memberProfile.name?.charAt(0)}
                  </div>
                )}
                <span style={{ fontSize: 13, fontWeight: 700, color: NAVY }}>{a.member?.name}</span>
              </div>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                background: isSubmitted ? GOLD : '#e8e0d0',
                color: isSubmitted ? NAVY : '#8a7a60'
              }}>{isSubmitted ? 'ממתין לאישור' : 'בתהליך'}</span>
            </div>
            <div style={{ padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ flex: 1, paddingLeft: 10 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: NAVY, lineHeight: 1.3 }}>{a.mission?.title}</div>
                  {a.due_date && (
                    <div style={{ fontSize: 11, color: '#c45000', marginTop: 3, fontWeight: 600 }}>
                      ⏰ עד {new Date(a.due_date).toLocaleDateString('he-IL')}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'center', flexShrink: 0 }}>
                  <div style={{ fontSize: 26, fontWeight: 900, color: ptColor, lineHeight: 1 }}>{a.mission?.points}</div>
                  <div style={{ fontSize: 10, color: ptColor, opacity: 0.7, fontWeight: 700 }}>נק׳</div>
                </div>
              </div>
              <button onClick={() => router.push('/missions/active')} style={{
                width: '100%', padding: '11px',
                background: isSubmitted ? GOLD : NAVY,
                color: isSubmitted ? NAVY : 'white',
                border: 'none', borderRadius: 12, cursor: 'pointer',
                fontWeight: 700, fontSize: 14, fontFamily: 'var(--font-heebo), sans-serif'
              }}>
                {isSubmitted ? '👑 אשר ותן נקודות' : 'סיימתי! קבל נקודות ⭐'}
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function EarnPointsPage() {
  const [missions, setMissions]             = useState([])
  const [profiles, setProfiles]             = useState([])
  const [currentProfile, setCurrentProfile] = useState(null)
  const [loading, setLoading]               = useState(true)
  const [activeMode, setActiveMode]         = useState('all')
  const [activeTab, setActiveTab]           = useState('library')
  const [activeCount, setActiveCount]       = useState(0)
  const [showForm, setShowForm]             = useState(false)
  const [editTarget, setEditTarget]         = useState(null)
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

    const [{ data: missionData }, { data: profileData }, { data: activeData }] = await Promise.all([
      supabase.from('missions').select('*').eq('is_active', true).order('points', { ascending: false }),
      supabase.from('profiles').select('*').eq('active', true),
      supabase.from('assignments').select('id').in('status', ['active', 'submitted'])
    ])

    if (missionData) setMissions(missionData)
    if (profileData) setProfiles(profileData)
    if (activeData) setActiveCount(activeData.length)

    const params = new URLSearchParams(window.location.search)
    if (params.get('tab') === 'active') setActiveTab('active')

    setLoading(false)
  }

  const handleSaved = () => {
    setShowForm(false)
    setEditTarget(null)
    loadData()
  }

  const isParent = currentProfile?.role === 'parent'
  const currentMode = MODES.find(m => m.id === activeMode)
  const assignableProfiles = isParent ? profiles : profiles.filter(p => p.id === currentProfile?.id)

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
        <div style={{ fontSize: 32, marginBottom: 8 }}>⭐</div>
        <div style={{ color: '#8a7a60', fontSize: 14 }}>טוענים אתגרים...</div>
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

      {(showForm || editTarget) && (
        <MissionFormModal
          mission={editTarget || null}
          onClose={() => { setShowForm(false); setEditTarget(null) }}
          onSaved={handleSaved}
        />
      )}

      <div style={{
        background: NAVY, padding: '20px 16px 0',
        borderRadius: '0 0 24px 24px', marginBottom: 16
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, color: 'white' }}>⭐ צוברים נקודות</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
              {isParent ? 'שלח אתגרים לבני המשפחה' : 'בחר איך להרוויח נקודות'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {isParent && (
              <button onClick={() => setShowForm(true)} style={{
                background: GOLD, color: NAVY, border: 'none',
                borderRadius: 20, padding: '7px 14px',
                fontWeight: 700, fontSize: 13, cursor: 'pointer',
                fontFamily: 'var(--font-heebo), sans-serif'
              }}>+ אתגר</button>
            )}
            <a href="/" style={{ color: 'rgba(255,255,255,0.45)', textDecoration: 'none', fontSize: 13 }}>← בית</a>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 0 }}>
          {[
            { id: 'library', label: '⭐ אתגרים' },
            { id: 'active',  label: `🏃 בתהליך${activeCount > 0 ? ` (${activeCount})` : ''}` },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              flex: 1, padding: '10px 8px', border: 'none', cursor: 'pointer',
              background: activeTab === tab.id ? CREAM : 'transparent',
              color: activeTab === tab.id ? NAVY : 'rgba(255,255,255,0.6)',
              fontWeight: activeTab === tab.id ? 700 : 500,
              fontSize: 13, borderRadius: activeTab === tab.id ? '12px 12px 0 0' : 0,
              fontFamily: 'var(--font-heebo), sans-serif', transition: 'all 0.15s'
            }}>{tab.label}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 12px', boxSizing: 'border-box' }}>

        {activeTab === 'library' && (
          <>
            <div style={{
              display: 'flex', gap: 8, overflowX: 'auto',
              paddingBottom: 12, scrollbarWidth: 'none', marginBottom: 4
            }}>
              {MODES.map(mode => (
                <button key={mode.id} onClick={() => setActiveMode(mode.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '7px 14px', borderRadius: 20, border: 'none',
                  cursor: 'pointer', flexShrink: 0,
                  background: activeMode === mode.id ? NAVY : 'white',
                  color: activeMode === mode.id ? 'white' : '#6b5e4e',
                  fontWeight: activeMode === mode.id ? 700 : 500,
                  fontSize: 13, fontFamily: 'var(--font-heebo), sans-serif',
                  border: `1px solid ${activeMode === mode.id ? NAVY : '#e8e0d0'}`
                }}>
                  {mode.emoji} {mode.label}
                </button>
              ))}
            </div>

            <div style={{ fontSize: 12, color: '#8a7a60', fontWeight: 600, marginBottom: 10 }}>
              {filtered.length} אתגרים{currentMode?.id !== 'all' ? ` · ${currentMode.label}` : ''}
            </div>

            {filtered.map((mission, i) => (
              <EarnCard
                key={mission.id}
                mission={mission}
                index={i}
                isParent={isParent}
                currentProfile={currentProfile}
                assignableProfiles={assignableProfiles}
                onEdit={m => setEditTarget(m)}
              />
            ))}
          </>
        )}

        {activeTab === 'active' && (
          <ActiveEarningTab
            profiles={profiles}
            currentProfile={currentProfile}
            isParent={isParent}
          />
        )}
      </div>

      <BottomNav />
    </div>
  )
}